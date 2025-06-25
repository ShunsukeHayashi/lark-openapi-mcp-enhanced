/**
 * 顧客満足度測定システム
 * 多次元的な満足度評価と統合スコアリング
 */

const moment = require('moment');
const stats = require('simple-statistics');
const natural = require('natural');
const sentiment = new natural.SentimentAnalyzer('Japanese', natural.PorterStemmer, 'afinn');

class SatisfactionMeasurement {
  constructor() {
    this.config = {
      // スコアリング重み
      scoreWeights: {
        nps: 0.35,
        csat: 0.30,
        ces: 0.20,
        sentiment: 0.15
      },
      
      // NPS閾値
      npsThresholds: {
        promoter: 9,    // 9-10
        passive: 7,     // 7-8
        detractor: 6    // 0-6
      },
      
      // CSAT閾値
      csatThresholds: {
        excellent: 4.5,
        good: 3.5,
        fair: 2.5,
        poor: 1.5
      },
      
      // CES閾値
      cesThresholds: {
        veryEasy: 2,
        easy: 3,
        neutral: 4,
        difficult: 5,
        veryDifficult: 6
      },
      
      // 感情分析閾値
      sentimentThresholds: {
        veryPositive: 0.6,
        positive: 0.2,
        neutral: -0.2,
        negative: -0.6
      },
      
      // アンケート設定
      surveyConfig: {
        npsQuestion: 'この製品/サービスを友人や同僚に勧める可能性はどのくらいですか？',
        csatQuestion: '製品/サービスにどの程度満足していますか？',
        cesQuestion: '目的を達成するのにどの程度の努力が必要でしたか？',
        followUpQuestions: {
          positive: ['最も満足した点は何ですか？', '他に改善してほしい点はありますか？'],
          negative: ['どの点が不満でしたか？', 'どのような改善を望みますか？']
        }
      },
      
      // データ収集チャネル
      channels: {
        email: { enabled: true, frequency: 'monthly' },
        inApp: { enabled: true, trigger: 'transaction' },
        sms: { enabled: false },
        youtube: { enabled: true, trigger: 'view' }
      }
    };
  }

  /**
   * 統合満足度スコアの計算
   * @param {Object} customer - 顧客データ
   * @param {Object} interactions - インタラクションデータ
   * @returns {Object} 満足度スコアと分析結果
   */
  async calculateSatisfactionScore(customer, interactions) {
    try {
      // 各指標の収集
      const npsData = await this.collectNPSData(customer, interactions);
      const csatData = await this.collectCSATData(customer, interactions);
      const cesData = await this.collectCESData(customer, interactions);
      const sentimentData = await this.analyzeSentiment(customer, interactions);
      
      // 統合スコアの計算
      const integratedScore = this.calculateIntegratedScore({
        nps: npsData,
        csat: csatData,
        ces: cesData,
        sentiment: sentimentData
      });
      
      // トレンド分析
      const trend = this.analyzeSatisfactionTrend(customer.id, integratedScore);
      
      // セグメント分析
      const segmentAnalysis = this.performSegmentAnalysis(customer, integratedScore);
      
      // 推奨アクション
      const recommendations = this.generateRecommendations(integratedScore, trend);
      
      return {
        customerId: customer.id,
        scores: {
          integrated: integratedScore.overall,
          nps: npsData.score,
          csat: csatData.score,
          ces: cesData.score,
          sentiment: sentimentData.score
        },
        details: {
          nps: npsData,
          csat: csatData,
          ces: cesData,
          sentiment: sentimentData
        },
        trend,
        segment: segmentAnalysis,
        recommendations,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Satisfaction calculation error:', error);
      throw new Error(`満足度計算エラー: ${error.message}`);
    }
  }

  /**
   * NPSデータの収集と計算
   */
  async collectNPSData(customer, interactions) {
    const npsResponses = interactions.surveys
      ?.filter(s => s.type === 'nps' && s.completed)
      .map(s => s.responses.npsScore) || [];
    
    if (npsResponses.length === 0) {
      return { score: null, category: 'no_data', trend: 'unknown' };
    }
    
    // 最新のNPSスコア
    const latestScore = npsResponses[npsResponses.length - 1];
    
    // NPSカテゴリの判定
    let category;
    if (latestScore >= this.config.npsThresholds.promoter) {
      category = 'promoter';
    } else if (latestScore >= this.config.npsThresholds.passive) {
      category = 'passive';
    } else {
      category = 'detractor';
    }
    
    // トレンド分析
    const trend = this.calculateTrend(npsResponses);
    
    // 詳細分析
    const analysis = {
      score: latestScore,
      category,
      trend,
      history: npsResponses,
      averageScore: stats.mean(npsResponses),
      volatility: stats.standardDeviation(npsResponses),
      lastUpdated: moment().toISOString()
    };
    
    return analysis;
  }

  /**
   * CSATデータの収集と計算
   */
  async collectCSATData(customer, interactions) {
    const csatResponses = interactions.surveys
      ?.filter(s => s.type === 'csat' && s.completed)
      .map(s => s.responses.satisfaction) || [];
    
    if (csatResponses.length === 0) {
      return { score: null, level: 'no_data', trend: 'unknown' };
    }
    
    // 最新のCSATスコア
    const latestScore = csatResponses[csatResponses.length - 1];
    
    // 満足度レベルの判定
    let level;
    if (latestScore >= this.config.csatThresholds.excellent) {
      level = 'excellent';
    } else if (latestScore >= this.config.csatThresholds.good) {
      level = 'good';
    } else if (latestScore >= this.config.csatThresholds.fair) {
      level = 'fair';
    } else {
      level = 'poor';
    }
    
    // カテゴリ別満足度
    const categoryScores = this.calculateCategoryCSAT(interactions);
    
    return {
      score: latestScore,
      level,
      trend: this.calculateTrend(csatResponses),
      history: csatResponses,
      averageScore: stats.mean(csatResponses),
      categoryBreakdown: categoryScores,
      topIssues: this.identifyTopIssues(interactions),
      lastUpdated: moment().toISOString()
    };
  }

  /**
   * CESデータの収集と計算
   */
  async collectCESData(customer, interactions) {
    const cesResponses = interactions.surveys
      ?.filter(s => s.type === 'ces' && s.completed)
      .map(s => s.responses.effortScore) || [];
    
    if (cesResponses.length === 0) {
      return { score: null, level: 'no_data', trend: 'unknown' };
    }
    
    // 最新のCESスコア（低いほど良い）
    const latestScore = cesResponses[cesResponses.length - 1];
    
    // 努力レベルの判定
    let level;
    if (latestScore <= this.config.cesThresholds.veryEasy) {
      level = 'very_easy';
    } else if (latestScore <= this.config.cesThresholds.easy) {
      level = 'easy';
    } else if (latestScore <= this.config.cesThresholds.neutral) {
      level = 'neutral';
    } else if (latestScore <= this.config.cesThresholds.difficult) {
      level = 'difficult';
    } else {
      level = 'very_difficult';
    }
    
    // プロセス別努力スコア
    const processScores = this.calculateProcessCES(interactions);
    
    return {
      score: latestScore,
      level,
      trend: this.calculateTrend(cesResponses, true), // 逆順（低いほど良い）
      history: cesResponses,
      averageScore: stats.mean(cesResponses),
      processBreakdown: processScores,
      frictionPoints: this.identifyFrictionPoints(interactions),
      lastUpdated: moment().toISOString()
    };
  }

  /**
   * 感情分析
   */
  async analyzeSentiment(customer, interactions) {
    const textData = this.collectTextData(interactions);
    
    if (textData.length === 0) {
      return { score: null, sentiment: 'no_data', keywords: [] };
    }
    
    // 各テキストの感情スコア計算
    const sentimentScores = textData.map(text => ({
      text: text.content,
      score: this.calculateSentimentScore(text.content),
      source: text.source,
      date: text.date
    }));
    
    // 平均感情スコア
    const averageScore = stats.mean(sentimentScores.map(s => s.score));
    
    // 感情カテゴリの判定
    let sentiment;
    if (averageScore >= this.config.sentimentThresholds.veryPositive) {
      sentiment = 'very_positive';
    } else if (averageScore >= this.config.sentimentThresholds.positive) {
      sentiment = 'positive';
    } else if (averageScore >= this.config.sentimentThresholds.neutral) {
      sentiment = 'neutral';
    } else if (averageScore >= this.config.sentimentThresholds.negative) {
      sentiment = 'negative';
    } else {
      sentiment = 'very_negative';
    }
    
    // キーワード抽出
    const keywords = this.extractKeywords(textData);
    
    // トピック分析
    const topics = this.analyzeTopics(textData);
    
    return {
      score: averageScore,
      sentiment,
      trend: this.calculateSentimentTrend(sentimentScores),
      keywords,
      topics,
      recentFeedback: sentimentScores.slice(-5),
      emotionalJourney: this.mapEmotionalJourney(sentimentScores),
      lastUpdated: moment().toISOString()
    };
  }

  /**
   * 統合スコアの計算
   */
  calculateIntegratedScore(scores) {
    // 各スコアの正規化
    const normalizedScores = {
      nps: scores.nps.score ? (scores.nps.score / 10) : null,
      csat: scores.csat.score ? (scores.csat.score / 5) : null,
      ces: scores.ces.score ? (1 - (scores.ces.score - 1) / 6) : null, // 逆転（低いほど良い）
      sentiment: scores.sentiment.score ? ((scores.sentiment.score + 1) / 2) : null // -1〜1を0〜1に変換
    };
    
    // 利用可能なスコアのみで重み付け平均
    let totalWeight = 0;
    let weightedSum = 0;
    
    Object.entries(normalizedScores).forEach(([key, value]) => {
      if (value !== null) {
        weightedSum += value * this.config.scoreWeights[key];
        totalWeight += this.config.scoreWeights[key];
      }
    });
    
    const overallScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : null;
    
    // 満足度レベルの判定
    let satisfactionLevel;
    if (overallScore >= 80) {
      satisfactionLevel = 'delighted';
    } else if (overallScore >= 60) {
      satisfactionLevel = 'satisfied';
    } else if (overallScore >= 40) {
      satisfactionLevel = 'neutral';
    } else if (overallScore >= 20) {
      satisfactionLevel = 'dissatisfied';
    } else {
      satisfactionLevel = 'very_dissatisfied';
    }
    
    return {
      overall: overallScore,
      level: satisfactionLevel,
      components: normalizedScores,
      confidence: this.calculateConfidence(scores),
      reliability: this.assessDataReliability(scores)
    };
  }

  /**
   * フィードバック自動収集
   * @param {Object} trigger - トリガーイベント
   * @returns {Object} 収集結果
   */
  async collectFeedback(trigger) {
    const { customerId, channel, eventType, context } = trigger;
    
    try {
      // チャネル別の収集戦略
      let feedbackMethod;
      switch (channel) {
        case 'email':
          feedbackMethod = this.collectEmailFeedback;
          break;
        case 'inApp':
          feedbackMethod = this.collectInAppFeedback;
          break;
        case 'youtube':
          feedbackMethod = this.collectYouTubeFeedback;
          break;
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
      
      // フィードバック収集
      const feedback = await feedbackMethod.call(this, customerId, eventType, context);
      
      // 即座に感情分析
      if (feedback.type === 'text' || feedback.type === 'voice') {
        feedback.sentiment = await this.analyzeFeedbackSentiment(feedback);
      }
      
      // データベースに保存
      await this.saveFeedback(feedback);
      
      // リアルタイムアラート判定
      if (this.requiresImmediateAction(feedback)) {
        await this.triggerAlert(feedback);
      }
      
      return {
        success: true,
        feedbackId: feedback.id,
        type: feedback.type,
        sentiment: feedback.sentiment,
        requiresAction: feedback.requiresAction
      };
      
    } catch (error) {
      console.error('Feedback collection error:', error);
      throw new Error(`フィードバック収集エラー: ${error.message}`);
    }
  }

  /**
   * YouTube動画反応分析
   */
  async analyzeYouTubeReactions(videoId, customerId) {
    try {
      // YouTube Analytics APIからデータ取得
      const reactions = await this.fetchYouTubeReactions(videoId, customerId);
      
      // 反応スコアの計算
      const reactionScore = this.calculateReactionScore(reactions);
      
      // エンゲージメント分析
      const engagement = {
        likes: reactions.likes,
        dislikes: reactions.dislikes,
        likeRatio: reactions.likes / (reactions.likes + reactions.dislikes),
        comments: reactions.comments.length,
        shares: reactions.shares,
        watchTime: reactions.averageWatchTime,
        retention: reactions.audienceRetention
      };
      
      // コメント感情分析
      const commentSentiment = await this.analyzeComments(reactions.comments);
      
      // 視聴パターン分析
      const viewingPattern = this.analyzeViewingPattern(reactions.watchData);
      
      return {
        videoId,
        customerId,
        overall: reactionScore,
        engagement,
        sentiment: commentSentiment,
        viewingPattern,
        insights: this.generateVideoInsights(engagement, commentSentiment, viewingPattern)
      };
      
    } catch (error) {
      console.error('YouTube reaction analysis error:', error);
      throw new Error(`YouTube反応分析エラー: ${error.message}`);
    }
  }

  /**
   * アンケート自動配信
   */
  async sendAutomatedSurvey(customerId, surveyType, trigger) {
    try {
      // 顧客の優先チャネル取得
      const preferredChannel = await this.getPreferredChannel(customerId);
      
      // アンケート内容の生成
      const survey = this.generateSurvey(surveyType, trigger);
      
      // パーソナライズ
      const personalizedSurvey = await this.personalizeSurvey(survey, customerId);
      
      // 配信タイミングの最適化
      const optimalTime = await this.calculateOptimalDeliveryTime(customerId, preferredChannel);
      
      // 配信スケジュール
      const scheduled = await this.scheduleSurveyDelivery({
        customerId,
        survey: personalizedSurvey,
        channel: preferredChannel,
        deliveryTime: optimalTime,
        followUpRules: this.getFollowUpRules(surveyType)
      });
      
      return {
        surveyId: scheduled.id,
        scheduledTime: optimalTime,
        channel: preferredChannel,
        estimatedResponseRate: this.estimateResponseRate(customerId, surveyType)
      };
      
    } catch (error) {
      console.error('Survey automation error:', error);
      throw new Error(`アンケート自動配信エラー: ${error.message}`);
    }
  }

  // ユーティリティメソッド
  calculateTrend(values, reverse = false) {
    if (values.length < 2) return 'insufficient_data';
    
    const recent = values.slice(-3);
    const previous = values.slice(-6, -3);
    
    if (previous.length === 0) return 'insufficient_data';
    
    const recentAvg = stats.mean(recent);
    const previousAvg = stats.mean(previous);
    
    let change = ((recentAvg - previousAvg) / previousAvg) * 100;
    if (reverse) change = -change; // CESなど低いほど良い指標
    
    if (change > 10) return 'improving';
    if (change > 0) return 'stable_positive';
    if (change > -10) return 'stable';
    return 'declining';
  }

  calculateCategoryCSAT(interactions) {
    // カテゴリ別満足度の計算
    const categories = {};
    
    interactions.surveys
      ?.filter(s => s.type === 'csat' && s.categoryScores)
      .forEach(survey => {
        Object.entries(survey.categoryScores).forEach(([category, score]) => {
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(score);
        });
      });
    
    return Object.entries(categories).reduce((acc, [category, scores]) => {
      acc[category] = {
        average: stats.mean(scores),
        trend: this.calculateTrend(scores)
      };
      return acc;
    }, {});
  }

  identifyTopIssues(interactions) {
    // 主要な問題点の特定
    const issues = [];
    
    interactions.feedback
      ?.filter(f => f.type === 'complaint' || f.sentiment === 'negative')
      .forEach(feedback => {
        const existingIssue = issues.find(i => i.category === feedback.category);
        if (existingIssue) {
          existingIssue.count++;
          existingIssue.examples.push(feedback.content);
        } else {
          issues.push({
            category: feedback.category,
            count: 1,
            examples: [feedback.content],
            severity: feedback.severity || 'medium'
          });
        }
      });
    
    return issues.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  calculateProcessCES(interactions) {
    // プロセス別努力スコア
    const processes = {};
    
    interactions.processMetrics?.forEach(metric => {
      if (!processes[metric.process]) {
        processes[metric.process] = [];
      }
      processes[metric.process].push(metric.effortScore);
    });
    
    return Object.entries(processes).reduce((acc, [process, scores]) => {
      acc[process] = {
        average: stats.mean(scores),
        difficulty: this.categorizeDifficulty(stats.mean(scores))
      };
      return acc;
    }, {});
  }

  identifyFrictionPoints(interactions) {
    // フリクションポイントの特定
    return interactions.processMetrics
      ?.filter(m => m.effortScore > this.config.cesThresholds.difficult)
      .map(m => ({
        process: m.process,
        step: m.step,
        effortScore: m.effortScore,
        issues: m.issues,
        suggestedImprovement: this.suggestProcessImprovement(m)
      }))
      .sort((a, b) => b.effortScore - a.effortScore) || [];
  }

  collectTextData(interactions) {
    const textData = [];
    
    // フィードバックテキスト
    interactions.feedback?.forEach(f => {
      if (f.content) {
        textData.push({
          content: f.content,
          source: 'feedback',
          date: f.date
        });
      }
    });
    
    // サポートチケット
    interactions.supportTickets?.forEach(t => {
      textData.push({
        content: t.description,
        source: 'support',
        date: t.createdAt
      });
    });
    
    // チャットログ
    interactions.chatLogs?.forEach(c => {
      textData.push({
        content: c.message,
        source: 'chat',
        date: c.timestamp
      });
    });
    
    return textData;
  }

  calculateSentimentScore(text) {
    // 日本語対応の感情スコア計算
    // 実際の実装では、より高度なNLPライブラリを使用
    const score = sentiment.getSentiment(text);
    return Math.max(-1, Math.min(1, score / 5)); // -1から1に正規化
  }

  extractKeywords(textData) {
    // キーワード抽出（頻出語）
    const words = {};
    
    textData.forEach(data => {
      const tokens = natural.WordTokenizer.tokenize(data.content.toLowerCase());
      tokens.forEach(token => {
        if (token.length > 3) { // 3文字以上の単語
          words[token] = (words[token] || 0) + 1;
        }
      });
    });
    
    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  analyzeTopics(textData) {
    // トピック分析（簡易版）
    const topics = {
      product: 0,
      service: 0,
      price: 0,
      quality: 0,
      delivery: 0,
      support: 0
    };
    
    const topicKeywords = {
      product: ['製品', '商品', 'product', 'item'],
      service: ['サービス', '対応', 'service', 'support'],
      price: ['価格', '料金', 'price', 'cost'],
      quality: ['品質', '質', 'quality', 'performance'],
      delivery: ['配送', '納期', 'delivery', 'shipping'],
      support: ['サポート', 'ヘルプ', 'support', 'help']
    };
    
    textData.forEach(data => {
      const content = data.content.toLowerCase();
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            topics[topic]++;
          }
        });
      });
    });
    
    return Object.entries(topics)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, mentions: count }));
  }

  calculateSentimentTrend(sentimentScores) {
    if (sentimentScores.length < 2) return 'insufficient_data';
    
    const recent = sentimentScores.slice(-5).map(s => s.score);
    const previous = sentimentScores.slice(-10, -5).map(s => s.score);
    
    if (previous.length === 0) return 'insufficient_data';
    
    const recentAvg = stats.mean(recent);
    const previousAvg = stats.mean(previous);
    const change = recentAvg - previousAvg;
    
    if (change > 0.2) return 'improving';
    if (change > 0) return 'stable_positive';
    if (change > -0.2) return 'stable';
    return 'declining';
  }

  mapEmotionalJourney(sentimentScores) {
    // 感情の推移マップ
    return sentimentScores.map(score => ({
      date: score.date,
      score: score.score,
      sentiment: this.categorizeSentiment(score.score),
      source: score.source
    }));
  }

  calculateConfidence(scores) {
    // データの信頼性スコア
    let dataPoints = 0;
    let totalPossible = 4;
    
    if (scores.nps.score !== null) dataPoints++;
    if (scores.csat.score !== null) dataPoints++;
    if (scores.ces.score !== null) dataPoints++;
    if (scores.sentiment.score !== null) dataPoints++;
    
    return (dataPoints / totalPossible) * 100;
  }

  assessDataReliability(scores) {
    // データの信頼性評価
    const factors = {
      recency: this.checkDataRecency(scores),
      completeness: this.checkDataCompleteness(scores),
      consistency: this.checkDataConsistency(scores),
      volume: this.checkDataVolume(scores)
    };
    
    const reliabilityScore = Object.values(factors).reduce((sum, val) => sum + val, 0) / 4;
    
    if (reliabilityScore > 0.8) return 'high';
    if (reliabilityScore > 0.6) return 'medium';
    return 'low';
  }

  analyzeSatisfactionTrend(customerId, currentScore) {
    // 満足度トレンド分析（履歴データから）
    // 実装省略：実際には履歴データベースから取得
    return {
      direction: 'improving',
      changeRate: 5.2,
      periodComparison: {
        current: currentScore.overall,
        previous: 72,
        change: '+3.5%'
      }
    };
  }

  performSegmentAnalysis(customer, score) {
    // セグメント分析
    return {
      valueSegment: this.determineValueSegment(customer),
      satisfactionSegment: this.determineSatisfactionSegment(score),
      behaviorSegment: this.determineBehaviorSegment(customer),
      riskSegment: this.determineRiskSegment(score)
    };
  }

  generateRecommendations(score, trend) {
    const recommendations = [];
    
    // スコアベースの推奨
    if (score.overall < 40) {
      recommendations.push({
        type: 'immediate_action',
        priority: 'high',
        action: '緊急フォローアップ',
        reason: '満足度が著しく低い'
      });
    }
    
    // トレンドベースの推奨
    if (trend.direction === 'declining') {
      recommendations.push({
        type: 'preventive_action',
        priority: 'medium',
        action: '満足度低下の原因調査',
        reason: '満足度が低下傾向'
      });
    }
    
    // コンポーネント別推奨
    if (score.components.ces < 0.5) {
      recommendations.push({
        type: 'process_improvement',
        priority: 'medium',
        action: 'プロセス簡素化',
        reason: '顧客努力度が高い'
      });
    }
    
    return recommendations;
  }

  // その他のユーティリティメソッド
  categorizeDifficulty(score) {
    if (score <= 2) return 'very_easy';
    if (score <= 3) return 'easy';
    if (score <= 4) return 'moderate';
    if (score <= 5) return 'difficult';
    return 'very_difficult';
  }

  suggestProcessImprovement(metric) {
    // プロセス改善提案
    return `${metric.process}の${metric.step}を簡素化`;
  }

  categorizeSentiment(score) {
    if (score >= 0.6) return 'very_positive';
    if (score >= 0.2) return 'positive';
    if (score >= -0.2) return 'neutral';
    if (score >= -0.6) return 'negative';
    return 'very_negative';
  }

  checkDataRecency(scores) {
    // データの新しさチェック
    return 0.9; // 仮の値
  }

  checkDataCompleteness(scores) {
    // データの完全性チェック
    return 0.8; // 仮の値
  }

  checkDataConsistency(scores) {
    // データの一貫性チェック
    return 0.85; // 仮の値
  }

  checkDataVolume(scores) {
    // データ量チェック
    return 0.7; // 仮の値
  }

  determineValueSegment(customer) {
    // 価値セグメントの判定
    return 'high_value';
  }

  determineSatisfactionSegment(score) {
    // 満足度セグメントの判定
    if (score.overall >= 80) return 'champion';
    if (score.overall >= 60) return 'satisfied';
    if (score.overall >= 40) return 'neutral';
    return 'at_risk';
  }

  determineBehaviorSegment(customer) {
    // 行動セグメントの判定
    return 'active';
  }

  determineRiskSegment(score) {
    // リスクセグメントの判定
    if (score.overall < 40) return 'high_risk';
    if (score.overall < 60 && score.trend?.direction === 'declining') return 'medium_risk';
    return 'low_risk';
  }
}

module.exports = SatisfactionMeasurement;