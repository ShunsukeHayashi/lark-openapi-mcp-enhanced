/**
 * チャーン（離脱）予測エンジン
 * 機械学習を使用した顧客離脱リスクの予測と予防
 */

const tf = require('@tensorflow/tfjs-node');
const moment = require('moment');
const stats = require('simple-statistics');

class ChurnPredictionEngine {
  constructor() {
    this.config = {
      // モデル設定
      modelConfig: {
        inputFeatures: 50,
        hiddenLayers: [128, 64, 32],
        dropout: 0.3,
        learningRate: 0.001,
        epochs: 100,
        batchSize: 32
      },
      
      // 特徴量設定
      features: {
        behavioral: [
          'days_since_last_login',
          'login_frequency',
          'usage_duration',
          'feature_adoption_rate',
          'support_tickets_count',
          'error_encounter_rate'
        ],
        transactional: [
          'purchase_frequency',
          'average_order_value',
          'total_lifetime_value',
          'days_since_last_purchase',
          'discount_usage_rate',
          'payment_failure_rate'
        ],
        engagement: [
          'email_open_rate',
          'email_click_rate',
          'content_view_rate',
          'social_interaction_rate',
          'referral_count',
          'review_submission_rate'
        ],
        satisfaction: [
          'nps_score',
          'csat_score',
          'ces_score',
          'sentiment_score',
          'complaint_ratio',
          'resolution_satisfaction'
        ],
        youtube: [
          'video_watch_time',
          'video_completion_rate',
          'like_ratio',
          'comment_frequency',
          'subscription_status',
          'notification_engagement'
        ]
      },
      
      // リスクレベル閾値
      riskThresholds: {
        critical: 0.8,    // 80%以上の離脱確率
        high: 0.6,        // 60%以上
        medium: 0.4,      // 40%以上
        low: 0.2          // 20%以上
      },
      
      // 予測期間
      predictionHorizons: {
        immediate: 7,     // 7日以内
        shortTerm: 30,    // 30日以内
        mediumTerm: 90,   // 90日以内
        longTerm: 180     // 180日以内
      }
    };
    
    this.model = null;
    this.featureScaler = null;
  }

  /**
   * チャーン予測の実行
   * @param {Object} customer - 顧客データ
   * @param {Object} options - 予測オプション
   * @returns {Object} 予測結果
   */
  async predictChurn(customer, options = {}) {
    try {
      const {
        horizon = 'shortTerm',
        includeExplanation = true,
        includePreventionActions = true
      } = options;
      
      // 特徴量の抽出
      const features = await this.extractFeatures(customer);
      
      // モデルによる予測
      const prediction = await this.runPrediction(features, horizon);
      
      // リスクレベルの判定
      const riskLevel = this.determineRiskLevel(prediction.probability);
      
      // 予測の説明
      const explanation = includeExplanation ? 
        await this.explainPrediction(features, prediction) : null;
      
      // 離脱要因の分析
      const churnFactors = this.analyzeChurnFactors(features, prediction);
      
      // 予防アクション
      const preventionActions = includePreventionActions ? 
        this.generatePreventionActions(customer, prediction, churnFactors) : null;
      
      // LTV影響分析
      const ltvImpact = this.calculateLTVImpact(customer, prediction);
      
      return {
        customerId: customer.id,
        prediction: {
          probability: prediction.probability,
          confidence: prediction.confidence,
          horizon: horizon,
          riskLevel: riskLevel
        },
        factors: churnFactors,
        explanation: explanation,
        preventionActions: preventionActions,
        impact: ltvImpact,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Churn prediction error:', error);
      throw new Error(`チャーン予測エラー: ${error.message}`);
    }
  }

  /**
   * 特徴量の抽出
   */
  async extractFeatures(customer) {
    const features = {};
    
    // 行動特徴量
    features.behavioral = await this.extractBehavioralFeatures(customer);
    
    // 取引特徴量
    features.transactional = await this.extractTransactionalFeatures(customer);
    
    // エンゲージメント特徴量
    features.engagement = await this.extractEngagementFeatures(customer);
    
    // 満足度特徴量
    features.satisfaction = await this.extractSatisfactionFeatures(customer);
    
    // YouTube特徴量
    features.youtube = await this.extractYouTubeFeatures(customer);
    
    // 時系列特徴量
    features.timeSeries = await this.extractTimeSeriesFeatures(customer);
    
    // 特徴量の正規化
    const normalizedFeatures = this.normalizeFeatures(features);
    
    return normalizedFeatures;
  }

  /**
   * 行動特徴量の抽出
   */
  async extractBehavioralFeatures(customer) {
    const now = moment();
    const activities = customer.activities || [];
    
    // 最終ログインからの日数
    const lastLogin = activities
      .filter(a => a.type === 'login')
      .sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)))[0];
    const daysSinceLastLogin = lastLogin ? 
      now.diff(moment(lastLogin.timestamp), 'days') : 999;
    
    // ログイン頻度（過去30日）
    const recentLogins = activities
      .filter(a => a.type === 'login' && 
        moment(a.timestamp).isAfter(now.subtract(30, 'days')));
    const loginFrequency = recentLogins.length / 30;
    
    // 使用時間
    const usageSessions = activities
      .filter(a => a.type === 'session')
      .map(a => a.duration || 0);
    const avgUsageDuration = usageSessions.length > 0 ? 
      stats.mean(usageSessions) : 0;
    
    // 機能採用率
    const uniqueFeatures = new Set(activities
      .filter(a => a.type === 'feature_use')
      .map(a => a.feature));
    const featureAdoptionRate = uniqueFeatures.size / 20; // 仮定: 20個の主要機能
    
    // サポートチケット数
    const supportTickets = customer.supportTickets?.length || 0;
    
    // エラー遭遇率
    const errorCount = activities
      .filter(a => a.type === 'error').length;
    const totalActions = activities.length;
    const errorEncounterRate = totalActions > 0 ? 
      errorCount / totalActions : 0;
    
    return {
      daysSinceLastLogin,
      loginFrequency,
      avgUsageDuration,
      featureAdoptionRate,
      supportTickets,
      errorEncounterRate,
      sessionCount: usageSessions.length,
      activeHours: this.calculateActiveHours(activities),
      platformDiversity: this.calculatePlatformDiversity(activities)
    };
  }

  /**
   * 取引特徴量の抽出
   */
  async extractTransactionalFeatures(customer) {
    const now = moment();
    const transactions = customer.transactions || [];
    
    // 購入頻度
    const recentTransactions = transactions
      .filter(t => moment(t.date).isAfter(now.subtract(90, 'days')));
    const purchaseFrequency = recentTransactions.length / 90;
    
    // 平均注文金額
    const orderValues = transactions.map(t => t.amount);
    const avgOrderValue = orderValues.length > 0 ? 
      stats.mean(orderValues) : 0;
    
    // 生涯価値
    const totalLifetimeValue = orderValues.reduce((sum, val) => sum + val, 0);
    
    // 最終購入からの日数
    const lastPurchase = transactions
      .sort((a, b) => moment(b.date).diff(moment(a.date)))[0];
    const daysSinceLastPurchase = lastPurchase ? 
      now.diff(moment(lastPurchase.date), 'days') : 999;
    
    // 割引使用率
    const discountTransactions = transactions
      .filter(t => t.discount > 0);
    const discountUsageRate = transactions.length > 0 ? 
      discountTransactions.length / transactions.length : 0;
    
    // 支払い失敗率
    const failedPayments = customer.paymentFailures || 0;
    const totalPayments = transactions.length + failedPayments;
    const paymentFailureRate = totalPayments > 0 ? 
      failedPayments / totalPayments : 0;
    
    return {
      purchaseFrequency,
      avgOrderValue,
      totalLifetimeValue,
      daysSinceLastPurchase,
      discountUsageRate,
      paymentFailureRate,
      transactionCount: transactions.length,
      purchaseTrend: this.calculatePurchaseTrend(transactions),
      seasonalityScore: this.calculateSeasonalityScore(transactions),
      productDiversity: this.calculateProductDiversity(transactions)
    };
  }

  /**
   * エンゲージメント特徴量の抽出
   */
  async extractEngagementFeatures(customer) {
    const emailStats = customer.emailStats || {};
    const contentStats = customer.contentStats || {};
    const socialStats = customer.socialStats || {};
    
    return {
      emailOpenRate: emailStats.openRate || 0,
      emailClickRate: emailStats.clickRate || 0,
      contentViewRate: contentStats.viewRate || 0,
      socialInteractionRate: socialStats.interactionRate || 0,
      referralCount: customer.referrals?.length || 0,
      reviewSubmissionRate: customer.reviews?.length || 0,
      unsubscribeAttempts: emailStats.unsubscribeAttempts || 0,
      engagementTrend: this.calculateEngagementTrend(customer),
      responseTime: this.calculateAvgResponseTime(customer),
      multiChannelEngagement: this.calculateMultiChannelScore(customer)
    };
  }

  /**
   * 満足度特徴量の抽出
   */
  async extractSatisfactionFeatures(customer) {
    const satisfactionData = customer.satisfaction || {};
    const feedbackData = customer.feedback || [];
    
    // 最新のスコア
    const npsScore = satisfactionData.nps?.score || 5;
    const csatScore = satisfactionData.csat?.score || 3;
    const cesScore = satisfactionData.ces?.score || 3;
    const sentimentScore = satisfactionData.sentiment?.score || 0;
    
    // 苦情率
    const complaints = feedbackData.filter(f => f.type === 'complaint');
    const complaintRatio = feedbackData.length > 0 ? 
      complaints.length / feedbackData.length : 0;
    
    // 解決満足度
    const resolvedTickets = customer.supportTickets
      ?.filter(t => t.status === 'resolved') || [];
    const resolutionSatisfaction = resolvedTickets.length > 0 ?
      stats.mean(resolvedTickets.map(t => t.satisfactionScore || 3)) : 3;
    
    return {
      npsScore: npsScore / 10,  // 0-1に正規化
      csatScore: csatScore / 5,  // 0-1に正規化
      cesScore: (7 - cesScore) / 6,  // 逆転して0-1に正規化
      sentimentScore: (sentimentScore + 1) / 2,  // -1〜1を0〜1に正規化
      complaintRatio,
      resolutionSatisfaction: resolutionSatisfaction / 5,
      satisfactionTrend: this.calculateSatisfactionTrend(satisfactionData),
      feedbackFrequency: this.calculateFeedbackFrequency(feedbackData),
      positivityRatio: this.calculatePositivityRatio(feedbackData)
    };
  }

  /**
   * YouTube特徴量の抽出
   */
  async extractYouTubeFeatures(customer) {
    const youtubeData = customer.youtube || {};
    
    return {
      videoWatchTime: youtubeData.totalWatchTime || 0,
      videoCompletionRate: youtubeData.avgCompletionRate || 0,
      likeRatio: youtubeData.likeRatio || 0,
      commentFrequency: youtubeData.commentCount || 0,
      subscriptionStatus: youtubeData.isSubscribed ? 1 : 0,
      notificationEngagement: youtubeData.notificationClickRate || 0,
      channelLoyalty: this.calculateChannelLoyalty(youtubeData),
      contentPreference: this.calculateContentPreference(youtubeData),
      engagementConsistency: this.calculateEngagementConsistency(youtubeData)
    };
  }

  /**
   * 時系列特徴量の抽出
   */
  async extractTimeSeriesFeatures(customer) {
    // 活動パターンの時系列分析
    const activityPattern = this.analyzeActivityPattern(customer.activities);
    
    // 購買パターンの時系列分析
    const purchasePattern = this.analyzePurchasePattern(customer.transactions);
    
    // エンゲージメントパターンの時系列分析
    const engagementPattern = this.analyzeEngagementPattern(customer);
    
    return {
      activityVolatility: activityPattern.volatility,
      activityTrend: activityPattern.trend,
      purchaseVolatility: purchasePattern.volatility,
      purchaseTrend: purchasePattern.trend,
      engagementVolatility: engagementPattern.volatility,
      engagementTrend: engagementPattern.trend,
      seasonalityIndex: this.calculateSeasonalityIndex(customer),
      lifecycleStage: this.determineLifecycleStage(customer)
    };
  }

  /**
   * 予測の実行
   */
  async runPrediction(features, horizon) {
    // モデルがロードされていない場合はロード
    if (!this.model) {
      await this.loadModel();
    }
    
    // 特徴量ベクトルの作成
    const featureVector = this.createFeatureVector(features);
    
    // 予測期間による調整
    const horizonMultiplier = this.getHorizonMultiplier(horizon);
    
    // 予測実行
    const input = tf.tensor2d([featureVector]);
    const prediction = this.model.predict(input);
    const probability = await prediction.data();
    
    // 信頼度の計算
    const confidence = this.calculatePredictionConfidence(features, probability[0]);
    
    input.dispose();
    prediction.dispose();
    
    return {
      probability: probability[0] * horizonMultiplier,
      confidence: confidence,
      rawScore: probability[0]
    };
  }

  /**
   * リスクレベルの判定
   */
  determineRiskLevel(probability) {
    if (probability >= this.config.riskThresholds.critical) return 'critical';
    if (probability >= this.config.riskThresholds.high) return 'high';
    if (probability >= this.config.riskThresholds.medium) return 'medium';
    if (probability >= this.config.riskThresholds.low) return 'low';
    return 'minimal';
  }

  /**
   * 予測の説明
   */
  async explainPrediction(features, prediction) {
    // SHAP値の計算（簡易版）
    const featureImportance = await this.calculateFeatureImportance(features);
    
    // 主要な要因の特定
    const topFactors = Object.entries(featureImportance)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5)
      .map(([feature, importance]) => ({
        feature: this.getFeatureDisplayName(feature),
        impact: importance,
        direction: importance > 0 ? 'increases' : 'decreases',
        value: features[feature]
      }));
    
    // 自然言語での説明生成
    const explanation = this.generateNaturalLanguageExplanation(topFactors, prediction);
    
    return {
      topFactors,
      explanation,
      featureContributions: featureImportance
    };
  }

  /**
   * チャーン要因の分析
   */
  analyzeChurnFactors(features, prediction) {
    const factors = [];
    
    // 行動要因
    if (features.behavioral.daysSinceLastLogin > 30) {
      factors.push({
        category: 'behavioral',
        factor: 'inactivity',
        severity: 'high',
        description: '長期間ログインなし',
        metric: `${features.behavioral.daysSinceLastLogin}日間未ログイン`
      });
    }
    
    // 取引要因
    if (features.transactional.purchaseFrequency < 0.1) {
      factors.push({
        category: 'transactional',
        factor: 'low_purchase_frequency',
        severity: 'medium',
        description: '購入頻度の低下',
        metric: '過去90日で購入なし'
      });
    }
    
    // 満足度要因
    if (features.satisfaction.npsScore < 0.6) {
      factors.push({
        category: 'satisfaction',
        factor: 'low_nps',
        severity: 'high',
        description: '低いNPSスコア',
        metric: `NPS: ${features.satisfaction.npsScore * 10}/10`
      });
    }
    
    // エンゲージメント要因
    if (features.engagement.emailOpenRate < 0.1) {
      factors.push({
        category: 'engagement',
        factor: 'low_email_engagement',
        severity: 'medium',
        description: 'メールエンゲージメントの低下',
        metric: `開封率: ${(features.engagement.emailOpenRate * 100).toFixed(1)}%`
      });
    }
    
    return factors.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * 予防アクションの生成
   */
  generatePreventionActions(customer, prediction, churnFactors) {
    const actions = [];
    
    // リスクレベルに応じた基本アクション
    if (prediction.riskLevel === 'critical') {
      actions.push({
        type: 'immediate_intervention',
        priority: 'urgent',
        action: 'パーソナルアウトリーチ',
        description: 'カスタマーサクセスマネージャーによる直接連絡',
        timeline: '24時間以内',
        expectedImpact: 'チャーン確率30%削減'
      });
    }
    
    // 要因別のアクション
    churnFactors.forEach(factor => {
      const specificAction = this.getFactorSpecificAction(factor, customer);
      if (specificAction) {
        actions.push(specificAction);
      }
    });
    
    // インセンティブベースのアクション
    if (prediction.probability > 0.5) {
      actions.push({
        type: 'incentive',
        priority: 'high',
        action: 'リテンションオファー',
        description: this.generateRetentionOffer(customer, prediction),
        timeline: '3日以内',
        expectedImpact: 'チャーン確率20%削減'
      });
    }
    
    // エンゲージメント向上アクション
    actions.push({
      type: 'engagement',
      priority: 'medium',
      action: 'エンゲージメントキャンペーン',
      description: this.generateEngagementCampaign(customer, churnFactors),
      timeline: '1週間以内',
      expectedImpact: 'エンゲージメント率25%向上'
    });
    
    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * LTV影響分析
   */
  calculateLTVImpact(customer, prediction) {
    const currentLTV = customer.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const projectedLTV = this.projectFutureLTV(customer);
    const churnProbability = prediction.probability;
    
    // チャーンした場合の損失
    const potentialLoss = projectedLTV * churnProbability;
    
    // セーブした場合の価値
    const retentionValue = projectedLTV * (1 - churnProbability);
    
    // ROI計算
    const preventionCost = this.estimatePreventionCost(prediction.riskLevel);
    const roi = ((retentionValue - preventionCost) / preventionCost) * 100;
    
    return {
      currentLTV,
      projectedLTV,
      potentialLoss,
      retentionValue,
      preventionCost,
      roi,
      recommendation: roi > 100 ? 'invest_in_retention' : 'monitor_only'
    };
  }

  /**
   * バッチ予測
   * @param {Array} customers - 顧客リスト
   * @returns {Array} 予測結果リスト
   */
  async batchPredict(customers) {
    const predictions = [];
    
    // バッチ処理
    for (let i = 0; i < customers.length; i += 100) {
      const batch = customers.slice(i, i + 100);
      const batchPredictions = await Promise.all(
        batch.map(customer => this.predictChurn(customer, { 
          includeExplanation: false,
          includePreventionActions: false 
        }))
      );
      predictions.push(...batchPredictions);
    }
    
    // リスク別の集計
    const summary = {
      total: predictions.length,
      byRiskLevel: {
        critical: predictions.filter(p => p.prediction.riskLevel === 'critical').length,
        high: predictions.filter(p => p.prediction.riskLevel === 'high').length,
        medium: predictions.filter(p => p.prediction.riskLevel === 'medium').length,
        low: predictions.filter(p => p.prediction.riskLevel === 'low').length,
        minimal: predictions.filter(p => p.prediction.riskLevel === 'minimal').length
      },
      averageChurnProbability: stats.mean(predictions.map(p => p.prediction.probability)),
      totalPotentialLoss: predictions.reduce((sum, p) => sum + p.impact.potentialLoss, 0)
    };
    
    return {
      predictions,
      summary,
      timestamp: new Date().toISOString()
    };
  }

  // ユーティリティメソッド
  normalizeFeatures(features) {
    // 特徴量の正規化（0-1スケール）
    const normalized = {};
    
    Object.entries(features).forEach(([category, categoryFeatures]) => {
      normalized[category] = {};
      Object.entries(categoryFeatures).forEach(([feature, value]) => {
        // 各特徴量に応じた正規化を実施
        normalized[category][feature] = this.normalizeValue(feature, value);
      });
    });
    
    return normalized;
  }

  normalizeValue(feature, value) {
    // 特徴量固有の正規化ロジック
    // 実際の実装では、訓練データから得られた統計量を使用
    return Math.max(0, Math.min(1, value));
  }

  createFeatureVector(features) {
    // 全特徴量を1次元配列に変換
    const vector = [];
    
    Object.values(features).forEach(categoryFeatures => {
      Object.values(categoryFeatures).forEach(value => {
        vector.push(value);
      });
    });
    
    return vector;
  }

  getHorizonMultiplier(horizon) {
    // 予測期間による確率調整
    const multipliers = {
      immediate: 0.5,
      shortTerm: 1.0,
      mediumTerm: 1.5,
      longTerm: 2.0
    };
    return multipliers[horizon] || 1.0;
  }

  calculatePredictionConfidence(features, probability) {
    // 予測の信頼度計算
    // データの完全性、一貫性、最新性を考慮
    return 0.85; // 仮の値
  }

  async loadModel() {
    // モデルのロード（実際の実装では保存済みモデルを読み込む）
    this.model = await this.createModel();
  }

  async createModel() {
    // ニューラルネットワークモデルの構築
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.config.modelConfig.inputFeatures],
          units: this.config.modelConfig.hiddenLayers[0],
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: this.config.modelConfig.dropout }),
        tf.layers.dense({
          units: this.config.modelConfig.hiddenLayers[1],
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: this.config.modelConfig.dropout }),
        tf.layers.dense({
          units: this.config.modelConfig.hiddenLayers[2],
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid'
        })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(this.config.modelConfig.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    return model;
  }

  calculateFeatureImportance(features) {
    // 特徴量の重要度計算（簡易版）
    // 実際の実装ではSHAP値やPermutation Importanceを使用
    const importance = {};
    
    Object.entries(features).forEach(([category, categoryFeatures]) => {
      Object.entries(categoryFeatures).forEach(([feature, value]) => {
        importance[`${category}.${feature}`] = Math.random() * 0.2 - 0.1;
      });
    });
    
    return importance;
  }

  getFeatureDisplayName(feature) {
    // 特徴量の表示名マッピング
    const displayNames = {
      'behavioral.daysSinceLastLogin': '最終ログインからの日数',
      'transactional.purchaseFrequency': '購入頻度',
      'satisfaction.npsScore': 'NPSスコア',
      'engagement.emailOpenRate': 'メール開封率'
    };
    return displayNames[feature] || feature;
  }

  generateNaturalLanguageExplanation(topFactors, prediction) {
    const probability = (prediction.probability * 100).toFixed(1);
    let explanation = `この顧客の離脱確率は${probability}%と予測されます。`;
    
    explanation += '主な要因は以下の通りです：';
    topFactors.forEach((factor, index) => {
      explanation += `\n${index + 1}. ${factor.feature}が${factor.direction === 'increases' ? '高い' : '低い'}`;
    });
    
    return explanation;
  }

  getFactorSpecificAction(factor, customer) {
    const actionMap = {
      'inactivity': {
        type: 'reactivation',
        priority: 'high',
        action: '再活性化キャンペーン',
        description: 'パーソナライズされた「お帰りなさい」メール',
        timeline: '48時間以内'
      },
      'low_purchase_frequency': {
        type: 'incentive',
        priority: 'medium',
        action: '購入促進オファー',
        description: '期間限定の特別割引クーポン',
        timeline: '1週間以内'
      },
      'low_nps': {
        type: 'satisfaction',
        priority: 'high',
        action: '満足度改善アウトリーチ',
        description: 'フィードバック収集と改善提案',
        timeline: '3日以内'
      }
    };
    
    return actionMap[factor.factor] || null;
  }

  generateRetentionOffer(customer, prediction) {
    // 顧客セグメントとリスクレベルに基づくオファー生成
    const ltv = customer.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    
    if (ltv > 100000) {
      return 'VIP限定: 3ヶ月間30%割引 + 優先サポート';
    } else if (prediction.probability > 0.7) {
      return '特別オファー: 次回購入時25%割引';
    } else {
      return '期間限定: 2ヶ月間15%割引';
    }
  }

  generateEngagementCampaign(customer, factors) {
    // エンゲージメント向上キャンペーンの生成
    const lowEngagementFactors = factors.filter(f => f.category === 'engagement');
    
    if (lowEngagementFactors.length > 0) {
      return '再エンゲージメントシリーズ: 価値提案の再確認';
    } else {
      return '新機能紹介キャンペーン: 使用していない機能の活用促進';
    }
  }

  projectFutureLTV(customer) {
    // 将来のLTV予測（簡易版）
    const currentLTV = customer.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const accountAge = moment().diff(moment(customer.createdAt), 'months');
    const monthlyAverage = accountAge > 0 ? currentLTV / accountAge : 0;
    
    return monthlyAverage * 24; // 2年間の予測
  }

  estimatePreventionCost(riskLevel) {
    // リスクレベルに基づく予防コストの見積もり
    const costs = {
      critical: 10000,
      high: 5000,
      medium: 2000,
      low: 500,
      minimal: 100
    };
    return costs[riskLevel] || 1000;
  }

  // その他のユーティリティメソッド
  calculateActiveHours(activities) {
    // アクティブ時間帯の計算
    return 8; // 仮の値
  }

  calculatePlatformDiversity(activities) {
    // プラットフォーム多様性の計算
    return 0.7; // 仮の値
  }

  calculatePurchaseTrend(transactions) {
    // 購買トレンドの計算
    return 0.5; // 仮の値
  }

  calculateSeasonalityScore(transactions) {
    // 季節性スコアの計算
    return 0.3; // 仮の値
  }

  calculateProductDiversity(transactions) {
    // 商品多様性の計算
    return 0.6; // 仮の値
  }

  calculateEngagementTrend(customer) {
    // エンゲージメントトレンドの計算
    return 0.4; // 仮の値
  }

  calculateAvgResponseTime(customer) {
    // 平均応答時間の計算
    return 0.8; // 仮の値
  }

  calculateMultiChannelScore(customer) {
    // マルチチャネルスコアの計算
    return 0.5; // 仮の値
  }

  calculateSatisfactionTrend(satisfactionData) {
    // 満足度トレンドの計算
    return 0.6; // 仮の値
  }

  calculateFeedbackFrequency(feedbackData) {
    // フィードバック頻度の計算
    return 0.4; // 仮の値
  }

  calculatePositivityRatio(feedbackData) {
    // ポジティブ率の計算
    return 0.7; // 仮の値
  }

  calculateChannelLoyalty(youtubeData) {
    // チャンネルロイヤルティの計算
    return 0.6; // 仮の値
  }

  calculateContentPreference(youtubeData) {
    // コンテンツ選好度の計算
    return 0.5; // 仮の値
  }

  calculateEngagementConsistency(youtubeData) {
    // エンゲージメント一貫性の計算
    return 0.7; // 仮の値
  }

  analyzeActivityPattern(activities) {
    // 活動パターンの分析
    return { volatility: 0.3, trend: 0.5 };
  }

  analyzePurchasePattern(transactions) {
    // 購買パターンの分析
    return { volatility: 0.4, trend: 0.6 };
  }

  analyzeEngagementPattern(customer) {
    // エンゲージメントパターンの分析
    return { volatility: 0.2, trend: 0.7 };
  }

  calculateSeasonalityIndex(customer) {
    // 季節性指数の計算
    return 0.4; // 仮の値
  }

  determineLifecycleStage(customer) {
    // ライフサイクルステージの判定
    const accountAge = moment().diff(moment(customer.createdAt), 'days');
    
    if (accountAge < 30) return 0.1; // 新規
    if (accountAge < 90) return 0.3; // 成長期
    if (accountAge < 365) return 0.5; // 成熟期
    return 0.8; // 長期顧客
  }
}

module.exports = ChurnPredictionEngine;