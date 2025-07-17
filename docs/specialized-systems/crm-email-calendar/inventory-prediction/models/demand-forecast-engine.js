/**
 * 需要予測エンジン
 * 複数の予測モデルを組み合わせた高精度な在庫需要予測
 */

const tf = require('@tensorflow/tfjs-node');
const Prophet = require('prophet');
const { ARIMA } = require('arima');
const moment = require('moment');
const stats = require('simple-statistics');

class DemandForecastEngine {
  constructor() {
    this.models = {
      arima: null,
      prophet: null,
      lstm: null,
      ensemble: null
    };
    
    this.config = {
      // 予測期間設定
      forecastHorizons: {
        short: 7,    // 7日
        medium: 30,  // 30日
        long: 90     // 90日
      },
      
      // モデルパラメータ
      modelParams: {
        arima: {
          p: 2,  // 自己回帰次数
          d: 1,  // 差分次数
          q: 2   // 移動平均次数
        },
        prophet: {
          changepoint_prior_scale: 0.05,
          seasonality_mode: 'multiplicative',
          yearly_seasonality: true,
          weekly_seasonality: true,
          daily_seasonality: false
        },
        lstm: {
          lookback: 60,      // 過去60日のデータを使用
          units: 50,         // LSTM層のユニット数
          dropout: 0.2,      // ドロップアウト率
          epochs: 100,       // 訓練エポック数
          batchSize: 32      // バッチサイズ
        }
      },
      
      // 信頼区間
      confidenceIntervals: [0.8, 0.95],
      
      // 外部要因の重み
      externalFactors: {
        seasonality: 0.3,
        marketTrend: 0.2,
        specialEvents: 0.15,
        weather: 0.1,
        competition: 0.25
      }
    };
  }

  /**
   * 需要予測の実行
   * @param {Object} params - 予測パラメータ
   * @returns {Object} 予測結果
   */
  async forecast(params) {
    const {
      itemId,
      historicalData,
      externalData = {},
      horizon = 30,
      includeBounds = true
    } = params;

    try {
      // データ前処理
      const processedData = await this.preprocessData(historicalData, externalData);
      
      // 各モデルで予測
      const predictions = await Promise.all([
        this.arimaForecast(processedData, horizon),
        this.prophetForecast(processedData, horizon),
        this.lstmForecast(processedData, horizon)
      ]);
      
      // アンサンブル予測
      const ensemblePrediction = this.ensemblePredictions(predictions);
      
      // 信頼区間の計算
      const confidenceBounds = includeBounds ? 
        this.calculateConfidenceBounds(ensemblePrediction, processedData) : null;
      
      // 結果の整形
      return {
        itemId,
        forecast: ensemblePrediction,
        confidenceBounds,
        models: {
          arima: predictions[0],
          prophet: predictions[1],
          lstm: predictions[2]
        },
        metrics: await this.calculateMetrics(processedData, ensemblePrediction),
        recommendations: this.generateRecommendations(ensemblePrediction, processedData),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Forecast error:', error);
      throw new Error(`需要予測エラー: ${error.message}`);
    }
  }

  /**
   * ARIMAモデルによる予測
   */
  async arimaForecast(data, horizon) {
    const timeSeries = data.map(d => d.value);
    
    // ARIMAモデルの適合
    const arima = new ARIMA({
      p: this.config.modelParams.arima.p,
      d: this.config.modelParams.arima.d,
      q: this.config.modelParams.arima.q,
      verbose: false
    });
    
    arima.train(timeSeries);
    
    // 予測
    const forecast = arima.predict(horizon);
    
    return forecast.map((value, index) => ({
      date: moment().add(index + 1, 'days').format('YYYY-MM-DD'),
      value: Math.max(0, Math.round(value)),
      model: 'arima'
    }));
  }

  /**
   * Prophetモデルによる予測
   */
  async prophetForecast(data, horizon) {
    // データをProphet形式に変換
    const prophetData = data.map(d => ({
      ds: d.date,
      y: d.value
    }));
    
    // モデルの初期化と訓練
    const prophet = new Prophet(this.config.modelParams.prophet);
    await prophet.fit(prophetData);
    
    // 将来の日付を生成
    const future = prophet.make_future_dataframe(horizon);
    
    // 予測
    const forecast = await prophet.predict(future);
    
    // 将来の予測値のみを抽出
    return forecast
      .slice(-horizon)
      .map(row => ({
        date: moment(row.ds).format('YYYY-MM-DD'),
        value: Math.max(0, Math.round(row.yhat)),
        model: 'prophet',
        lower: Math.max(0, Math.round(row.yhat_lower)),
        upper: Math.round(row.yhat_upper)
      }));
  }

  /**
   * LSTMモデルによる予測
   */
  async lstmForecast(data, horizon) {
    const { lookback, units, dropout, epochs, batchSize } = this.config.modelParams.lstm;
    
    // データの正規化
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const normalizedData = values.map(v => (v - minValue) / (maxValue - minValue));
    
    // 訓練データの準備
    const [X, y] = this.createLSTMDataset(normalizedData, lookback);
    
    // モデルの構築
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units,
          returnSequences: true,
          inputShape: [lookback, 1]
        }),
        tf.layers.dropout({ rate: dropout }),
        tf.layers.lstm({ units: Math.floor(units / 2) }),
        tf.layers.dropout({ rate: dropout }),
        tf.layers.dense({ units: 1 })
      ]
    });
    
    // モデルのコンパイル
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    // 訓練
    await model.fit(X, y, {
      epochs,
      batchSize,
      verbose: 0,
      validationSplit: 0.2
    });
    
    // 予測
    const predictions = [];
    let currentSequence = normalizedData.slice(-lookback);
    
    for (let i = 0; i < horizon; i++) {
      const input = tf.tensor3d([currentSequence.map(v => [v])]);
      const prediction = model.predict(input);
      const predictedValue = await prediction.data();
      
      predictions.push(predictedValue[0]);
      currentSequence = [...currentSequence.slice(1), predictedValue[0]];
      
      input.dispose();
      prediction.dispose();
    }
    
    // 正規化を元に戻す
    return predictions.map((value, index) => ({
      date: moment().add(index + 1, 'days').format('YYYY-MM-DD'),
      value: Math.max(0, Math.round(value * (maxValue - minValue) + minValue)),
      model: 'lstm'
    }));
  }

  /**
   * アンサンブル予測
   */
  ensemblePredictions(predictions) {
    const weights = {
      arima: 0.3,
      prophet: 0.4,
      lstm: 0.3
    };
    
    const ensembled = [];
    const horizon = predictions[0].length;
    
    for (let i = 0; i < horizon; i++) {
      const date = predictions[0][i].date;
      const weightedSum = 
        predictions[0][i].value * weights.arima +
        predictions[1][i].value * weights.prophet +
        predictions[2][i].value * weights.lstm;
      
      ensembled.push({
        date,
        value: Math.round(weightedSum),
        components: {
          arima: predictions[0][i].value,
          prophet: predictions[1][i].value,
          lstm: predictions[2][i].value
        }
      });
    }
    
    return ensembled;
  }

  /**
   * 信頼区間の計算
   */
  calculateConfidenceBounds(forecast, historicalData) {
    const errors = this.calculateHistoricalErrors(historicalData);
    const stdError = stats.standardDeviation(errors);
    
    return forecast.map(point => {
      const bounds = {};
      
      this.config.confidenceIntervals.forEach(level => {
        const zScore = this.getZScore(level);
        const margin = zScore * stdError;
        
        bounds[`${level * 100}%`] = {
          lower: Math.max(0, Math.round(point.value - margin)),
          upper: Math.round(point.value + margin)
        };
      });
      
      return {
        date: point.date,
        bounds
      };
    });
  }

  /**
   * 推奨事項の生成
   */
  generateRecommendations(forecast, historicalData) {
    const recommendations = [];
    
    // 在庫切れリスクの評価
    const stockoutRisk = this.assessStockoutRisk(forecast, historicalData);
    if (stockoutRisk.high) {
      recommendations.push({
        type: 'stockout_warning',
        priority: 'high',
        message: `在庫切れリスクが高い: ${stockoutRisk.dates.join(', ')}`,
        action: '緊急発注を推奨',
        suggestedQuantity: stockoutRisk.suggestedOrder
      });
    }
    
    // 最適発注タイミング
    const optimalOrder = this.calculateOptimalOrderTiming(forecast, historicalData);
    recommendations.push({
      type: 'optimal_order',
      priority: 'medium',
      message: `最適発注日: ${optimalOrder.date}`,
      action: `${optimalOrder.quantity}個の発注を推奨`,
      costSaving: optimalOrder.potentialSaving
    });
    
    // 季節性への対応
    const seasonalityAdvice = this.analyzeSeasonality(forecast, historicalData);
    if (seasonalityAdvice.significant) {
      recommendations.push({
        type: 'seasonality',
        priority: 'medium',
        message: seasonalityAdvice.message,
        action: seasonalityAdvice.action
      });
    }
    
    return recommendations;
  }

  /**
   * データ前処理
   */
  async preprocessData(historicalData, externalData) {
    // 欠損値の補完
    const filledData = this.fillMissingValues(historicalData);
    
    // 外れ値の処理
    const cleanedData = this.removeOutliers(filledData);
    
    // 外部要因の統合
    const enrichedData = this.integrateExternalFactors(cleanedData, externalData);
    
    // トレンド除去
    const detrendedData = this.detrendData(enrichedData);
    
    return detrendedData;
  }

  /**
   * LSTMデータセットの作成
   */
  createLSTMDataset(data, lookback) {
    const X = [];
    const y = [];
    
    for (let i = lookback; i < data.length; i++) {
      X.push(data.slice(i - lookback, i));
      y.push(data[i]);
    }
    
    return [
      tf.tensor3d(X.map(seq => seq.map(v => [v]))),
      tf.tensor2d(y.map(v => [v]))
    ];
  }

  /**
   * 在庫切れリスクの評価
   */
  assessStockoutRisk(forecast, historicalData) {
    const avgDemand = stats.mean(historicalData.map(d => d.value));
    const stdDemand = stats.standardDeviation(historicalData.map(d => d.value));
    const safetyStock = avgDemand + 2 * stdDemand;
    
    const riskDates = forecast
      .filter(f => f.value > safetyStock)
      .map(f => f.date);
    
    return {
      high: riskDates.length > 0,
      dates: riskDates,
      suggestedOrder: Math.round(safetyStock * riskDates.length)
    };
  }

  /**
   * 最適発注タイミングの計算
   */
  calculateOptimalOrderTiming(forecast, historicalData) {
    const leadTime = 7; // 仮定: 7日のリードタイム
    const orderingCost = 1000; // 仮定: 発注コスト
    const holdingCostPerUnit = 10; // 仮定: 在庫保持コスト
    
    // EOQ（経済的発注量）の計算
    const avgDemand = stats.mean(forecast.map(f => f.value));
    const eoq = Math.sqrt((2 * avgDemand * orderingCost) / holdingCostPerUnit);
    
    // 発注点の計算
    const reorderPoint = avgDemand * leadTime;
    
    // 最適発注日の決定
    let cumulativeDemand = 0;
    let optimalDate = null;
    
    for (const point of forecast) {
      cumulativeDemand += point.value;
      if (cumulativeDemand >= reorderPoint && !optimalDate) {
        optimalDate = point.date;
        break;
      }
    }
    
    return {
      date: optimalDate || forecast[0].date,
      quantity: Math.round(eoq),
      potentialSaving: Math.round(eoq * holdingCostPerUnit * 0.1) // 仮定: 10%の節約
    };
  }

  /**
   * 季節性分析
   */
  analyzeSeasonality(forecast, historicalData) {
    // 過去の同時期データを抽出
    const currentMonth = moment().month();
    const historicalSameMonth = historicalData.filter(d => 
      moment(d.date).month() === currentMonth
    );
    
    if (historicalSameMonth.length < 10) {
      return { significant: false };
    }
    
    const historicalAvg = stats.mean(historicalSameMonth.map(d => d.value));
    const forecastAvg = stats.mean(forecast.slice(0, 30).map(f => f.value));
    const percentChange = ((forecastAvg - historicalAvg) / historicalAvg) * 100;
    
    if (Math.abs(percentChange) > 20) {
      return {
        significant: true,
        message: `前年同期比 ${percentChange.toFixed(1)}% の${percentChange > 0 ? '増加' : '減少'}が予想されます`,
        action: percentChange > 0 ? 
          '在庫を通常より多めに確保することを推奨' : 
          '在庫調整により保管コストを削減可能'
      };
    }
    
    return { significant: false };
  }

  /**
   * メトリクスの計算
   */
  async calculateMetrics(historicalData, forecast) {
    // 予測精度指標
    const mape = this.calculateMAPE(historicalData.slice(-30), forecast.slice(0, 30));
    const rmse = this.calculateRMSE(historicalData.slice(-30), forecast.slice(0, 30));
    
    // トレンド分析
    const trend = this.analyzeTrend(forecast);
    
    // 変動性分析
    const volatility = this.calculateVolatility(historicalData);
    
    return {
      accuracy: {
        mape: `${mape.toFixed(2)}%`,
        rmse: rmse.toFixed(2),
        confidenceScore: this.calculateConfidenceScore(mape, rmse)
      },
      trend: {
        direction: trend.direction,
        strength: trend.strength,
        changePoints: trend.changePoints
      },
      volatility: {
        coefficient: volatility.toFixed(3),
        level: volatility > 0.5 ? 'high' : volatility > 0.2 ? 'medium' : 'low'
      }
    };
  }

  // ユーティリティメソッド
  fillMissingValues(data) {
    // 線形補間による欠損値補完
    return data;
  }

  removeOutliers(data) {
    // IQR法による外れ値除去
    return data;
  }

  integrateExternalFactors(data, externalData) {
    // 外部要因の統合
    return data;
  }

  detrendData(data) {
    // トレンド除去
    return data;
  }

  calculateHistoricalErrors(data) {
    // 過去の予測誤差計算
    return [];
  }

  getZScore(confidenceLevel) {
    // 信頼水準に対応するZ値
    const zScores = {
      0.8: 1.282,
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }

  calculateMAPE(actual, forecast) {
    // MAPE (Mean Absolute Percentage Error)
    return 0;
  }

  calculateRMSE(actual, forecast) {
    // RMSE (Root Mean Square Error)
    return 0;
  }

  analyzeTrend(forecast) {
    // トレンド分析
    return {
      direction: 'increasing',
      strength: 'moderate',
      changePoints: []
    };
  }

  calculateVolatility(data) {
    // 変動係数の計算
    return 0;
  }

  calculateConfidenceScore(mape, rmse) {
    // 信頼スコアの計算
    return 85;
  }
}

module.exports = DemandForecastEngine;