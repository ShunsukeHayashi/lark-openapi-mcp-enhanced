/**
 * YouTube CRM向けコンテンツ在庫管理
 * 動画コンテンツの"在庫"概念を管理し、需要予測を行う
 */

const moment = require('moment');
const stats = require('simple-statistics');

class ContentInventoryManager {
  constructor() {
    this.config = {
      // コンテンツの鮮度指標
      freshnessThresholds: {
        fresh: 7,        // 7日以内
        normal: 30,      // 30日以内
        stale: 90,       // 90日以内
        expired: 180     // 180日以上
      },
      
      // パフォーマンス閾値
      performanceMetrics: {
        viewsThreshold: {
          high: 10000,
          medium: 1000,
          low: 100
        },
        engagementRate: {
          excellent: 0.1,   // 10%以上
          good: 0.05,       // 5%以上
          poor: 0.02        // 2%未満
        },
        watchTime: {
          excellent: 0.7,   // 70%以上
          good: 0.5,        // 50%以上
          poor: 0.3         // 30%未満
        }
      },
      
      // ROI計算パラメータ
      roiFactors: {
        productionCost: {
          basic: 10000,
          standard: 50000,
          premium: 100000
        },
        revenuePerView: {
          ad: 0.003,        // 広告収益/視聴
          affiliate: 0.01,   // アフィリエイト
          product: 0.05      // 商品販売
        }
      }
    };
  }

  /**
   * コンテンツ在庫分析
   * @param {Array} videos - 動画データの配列
   * @param {Object} analytics - YouTube Analytics データ
   * @returns {Object} 在庫分析結果
   */
  async analyzeContentInventory(videos, analytics) {
    try {
      // コンテンツの分類
      const categorizedContent = this.categorizeContent(videos, analytics);
      
      // 需要予測
      const demandForecast = await this.forecastContentDemand(categorizedContent, analytics);
      
      // ROI分析
      const roiAnalysis = this.analyzeContentROI(videos, analytics);
      
      // 推奨アクション
      const recommendations = this.generateContentRecommendations(
        categorizedContent,
        demandForecast,
        roiAnalysis
      );
      
      return {
        inventory: categorizedContent,
        forecast: demandForecast,
        roi: roiAnalysis,
        recommendations,
        summary: this.generateInventorySummary(categorizedContent),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Content inventory analysis error:', error);
      throw new Error(`コンテンツ在庫分析エラー: ${error.message}`);
    }
  }

  /**
   * コンテンツの分類
   */
  categorizeContent(videos, analytics) {
    const categories = {
      fresh: [],
      performing: [],
      declining: [],
      evergreen: [],
      expired: [],
      needsRefresh: []
    };
    
    videos.forEach(video => {
      const age = moment().diff(moment(video.publishedAt), 'days');
      const performance = this.calculatePerformanceScore(video, analytics[video.id]);
      const trend = this.analyzeTrend(analytics[video.id]?.dailyViews || []);
      
      // 鮮度による分類
      if (age <= this.config.freshnessThresholds.fresh) {
        categories.fresh.push({
          ...video,
          age,
          performance,
          trend,
          category: 'fresh'
        });
      }
      
      // パフォーマンスによる分類
      if (performance.score > 0.7) {
        categories.performing.push({
          ...video,
          age,
          performance,
          trend,
          category: 'performing'
        });
      } else if (performance.score < 0.3 && trend === 'declining') {
        categories.declining.push({
          ...video,
          age,
          performance,
          trend,
          category: 'declining'
        });
      }
      
      // エバーグリーンコンテンツ
      if (age > 90 && performance.score > 0.5 && trend !== 'declining') {
        categories.evergreen.push({
          ...video,
          age,
          performance,
          trend,
          category: 'evergreen'
        });
      }
      
      // 期限切れコンテンツ
      if (age > this.config.freshnessThresholds.expired && performance.score < 0.2) {
        categories.expired.push({
          ...video,
          age,
          performance,
          trend,
          category: 'expired'
        });
      }
      
      // リフレッシュが必要なコンテンツ
      if (age > 60 && age < 180 && performance.score > 0.4 && trend === 'declining') {
        categories.needsRefresh.push({
          ...video,
          age,
          performance,
          trend,
          category: 'needsRefresh'
        });
      }
    });
    
    return categories;
  }

  /**
   * コンテンツ需要予測
   */
  async forecastContentDemand(categorizedContent, analytics) {
    const forecast = {
      newContentNeeded: {},
      refreshNeeded: {},
      retirementCandidates: [],
      trendingTopics: []
    };
    
    // カテゴリー別の需要分析
    const categoryDemand = this.analyzeCategoryDemand(categorizedContent, analytics);
    
    // 新規コンテンツの必要性
    forecast.newContentNeeded = {
      immediate: categoryDemand.gaps.urgent,
      shortTerm: categoryDemand.gaps.shortTerm,
      longTerm: categoryDemand.gaps.longTerm,
      suggestedTopics: await this.suggestNewTopics(categoryDemand, analytics)
    };
    
    // リフレッシュ必要性
    forecast.refreshNeeded = categorizedContent.needsRefresh.map(video => ({
      videoId: video.id,
      title: video.title,
      reason: this.getRefreshReason(video),
      priority: this.calculateRefreshPriority(video),
      suggestedChanges: this.suggestRefreshChanges(video, analytics[video.id])
    }));
    
    // 廃止候補
    forecast.retirementCandidates = categorizedContent.expired.map(video => ({
      videoId: video.id,
      title: video.title,
      reason: this.getRetirementReason(video),
      impact: this.calculateRetirementImpact(video, analytics[video.id]),
      alternativeContent: this.suggestAlternatives(video, categorizedContent)
    }));
    
    // トレンドトピック
    forecast.trendingTopics = await this.identifyTrendingTopics(analytics);
    
    return forecast;
  }

  /**
   * コンテンツROI分析
   */
  analyzeContentROI(videos, analytics) {
    const roiAnalysis = {
      byVideo: [],
      byCategory: {},
      overall: {},
      topPerformers: [],
      underperformers: []
    };
    
    // 各動画のROI計算
    videos.forEach(video => {
      const videoAnalytics = analytics[video.id] || {};
      const roi = this.calculateVideoROI(video, videoAnalytics);
      
      roiAnalysis.byVideo.push({
        videoId: video.id,
        title: video.title,
        roi: roi.value,
        revenue: roi.revenue,
        cost: roi.cost,
        profitMargin: roi.profitMargin,
        paybackPeriod: roi.paybackPeriod
      });
      
      // カテゴリー別集計
      const category = video.category || 'uncategorized';
      if (!roiAnalysis.byCategory[category]) {
        roiAnalysis.byCategory[category] = {
          totalRevenue: 0,
          totalCost: 0,
          averageROI: 0,
          count: 0
        };
      }
      
      roiAnalysis.byCategory[category].totalRevenue += roi.revenue;
      roiAnalysis.byCategory[category].totalCost += roi.cost;
      roiAnalysis.byCategory[category].count++;
    });
    
    // カテゴリー別平均ROI計算
    Object.keys(roiAnalysis.byCategory).forEach(category => {
      const cat = roiAnalysis.byCategory[category];
      cat.averageROI = ((cat.totalRevenue - cat.totalCost) / cat.totalCost) * 100;
    });
    
    // 全体ROI
    const totalRevenue = roiAnalysis.byVideo.reduce((sum, v) => sum + v.revenue, 0);
    const totalCost = roiAnalysis.byVideo.reduce((sum, v) => sum + v.cost, 0);
    roiAnalysis.overall = {
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      overallROI: ((totalRevenue - totalCost) / totalCost) * 100,
      averageVideoROI: stats.mean(roiAnalysis.byVideo.map(v => v.roi))
    };
    
    // トップパフォーマー
    roiAnalysis.topPerformers = roiAnalysis.byVideo
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);
    
    // アンダーパフォーマー
    roiAnalysis.underperformers = roiAnalysis.byVideo
      .filter(v => v.roi < 0)
      .sort((a, b) => a.roi - b.roi)
      .slice(0, 10);
    
    return roiAnalysis;
  }

  /**
   * コンテンツ推奨事項の生成
   */
  generateContentRecommendations(categorizedContent, forecast, roiAnalysis) {
    const recommendations = [];
    
    // 1. 新規コンテンツ制作推奨
    if (forecast.newContentNeeded.immediate.length > 0) {
      recommendations.push({
        type: 'new_content',
        priority: 'high',
        title: '緊急: 新規コンテンツ制作が必要',
        description: `${forecast.newContentNeeded.immediate.length}個のカテゴリーで緊急にコンテンツが不足しています`,
        actions: forecast.newContentNeeded.immediate.map(topic => ({
          topic,
          estimatedROI: this.estimateTopicROI(topic, roiAnalysis),
          productionTime: this.estimateProductionTime(topic),
          suggestedFormat: this.suggestContentFormat(topic)
        }))
      });
    }
    
    // 2. コンテンツリフレッシュ推奨
    const highPriorityRefresh = forecast.refreshNeeded
      .filter(r => r.priority === 'high')
      .slice(0, 5);
    
    if (highPriorityRefresh.length > 0) {
      recommendations.push({
        type: 'content_refresh',
        priority: 'medium',
        title: 'コンテンツの更新推奨',
        description: `${highPriorityRefresh.length}本の動画が更新により再活性化可能です`,
        actions: highPriorityRefresh.map(video => ({
          videoId: video.videoId,
          title: video.title,
          changes: video.suggestedChanges,
          expectedImpact: '視聴回数30-50%増加見込み'
        }))
      });
    }
    
    // 3. 廃止推奨
    const retirementUrgent = forecast.retirementCandidates
      .filter(r => r.impact.severity === 'low')
      .slice(0, 10);
    
    if (retirementUrgent.length > 0) {
      recommendations.push({
        type: 'content_retirement',
        priority: 'low',
        title: '低パフォーマンスコンテンツの廃止検討',
        description: `${retirementUrgent.length}本の動画が廃止候補です`,
        actions: retirementUrgent.map(video => ({
          videoId: video.videoId,
          title: video.title,
          reason: video.reason,
          alternative: video.alternativeContent
        })),
        costSaving: this.calculateRetirementSavings(retirementUrgent)
      });
    }
    
    // 4. トレンド対応推奨
    if (forecast.trendingTopics.length > 0) {
      recommendations.push({
        type: 'trending_opportunity',
        priority: 'medium',
        title: 'トレンドコンテンツの機会',
        description: '現在のトレンドに基づいた新規コンテンツ制作の機会',
        actions: forecast.trendingTopics.slice(0, 5).map(trend => ({
          topic: trend.topic,
          trendStrength: trend.strength,
          competitionLevel: trend.competition,
          suggestedApproach: trend.approach,
          timeWindow: trend.timeWindow
        }))
      });
    }
    
    // 5. ROI最適化推奨
    const categoryOptimization = this.analyzeCategoryOptimization(roiAnalysis);
    if (categoryOptimization.length > 0) {
      recommendations.push({
        type: 'roi_optimization',
        priority: 'medium',
        title: 'カテゴリー投資の最適化',
        description: 'ROI分析に基づくコンテンツ投資の再配分提案',
        actions: categoryOptimization
      });
    }
    
    return recommendations;
  }

  /**
   * パフォーマンススコア計算
   */
  calculatePerformanceScore(video, analytics) {
    if (!analytics) {
      return { score: 0, metrics: {} };
    }
    
    const weights = {
      views: 0.3,
      engagement: 0.3,
      watchTime: 0.2,
      shares: 0.1,
      revenue: 0.1
    };
    
    const metrics = {
      views: this.normalizeMetric(analytics.views, this.config.performanceMetrics.viewsThreshold),
      engagement: analytics.engagementRate || 0,
      watchTime: analytics.averageWatchTime / video.duration || 0,
      shares: this.normalizeMetric(analytics.shares, 100),
      revenue: this.normalizeMetric(analytics.estimatedRevenue, 1000)
    };
    
    const score = Object.keys(weights).reduce((sum, key) => {
      return sum + (metrics[key] * weights[key]);
    }, 0);
    
    return { score, metrics };
  }

  /**
   * 動画ROI計算
   */
  calculateVideoROI(video, analytics) {
    // コスト推定
    const productionCost = this.estimateProductionCost(video);
    const maintenanceCost = this.calculateMaintenanceCost(video, analytics);
    const totalCost = productionCost + maintenanceCost;
    
    // 収益計算
    const adRevenue = (analytics.views || 0) * this.config.roiFactors.revenuePerView.ad;
    const affiliateRevenue = (analytics.clicks || 0) * this.config.roiFactors.revenuePerView.affiliate;
    const productRevenue = (analytics.conversions || 0) * this.config.roiFactors.revenuePerView.product;
    const totalRevenue = adRevenue + affiliateRevenue + productRevenue;
    
    // ROI計算
    const roi = ((totalRevenue - totalCost) / totalCost) * 100;
    const profitMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;
    const paybackPeriod = totalCost / (totalRevenue / moment().diff(moment(video.publishedAt), 'days'));
    
    return {
      value: roi,
      revenue: totalRevenue,
      cost: totalCost,
      profitMargin,
      paybackPeriod,
      breakdown: {
        revenue: { adRevenue, affiliateRevenue, productRevenue },
        cost: { productionCost, maintenanceCost }
      }
    };
  }

  /**
   * トレンド分析
   */
  analyzeTrend(dailyViews) {
    if (!dailyViews || dailyViews.length < 7) {
      return 'insufficient_data';
    }
    
    const recentViews = dailyViews.slice(-7);
    const previousViews = dailyViews.slice(-14, -7);
    
    const recentAvg = stats.mean(recentViews);
    const previousAvg = stats.mean(previousViews);
    
    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (changePercent > 20) return 'rising';
    if (changePercent > 5) return 'stable_growth';
    if (changePercent > -5) return 'stable';
    if (changePercent > -20) return 'slight_decline';
    return 'declining';
  }

  /**
   * 新規トピック提案
   */
  async suggestNewTopics(categoryDemand, analytics) {
    const suggestions = [];
    
    // ギャップ分析に基づく提案
    categoryDemand.gaps.urgent.forEach(gap => {
      suggestions.push({
        topic: gap.category,
        reason: 'content_gap',
        urgency: 'high',
        expectedViews: gap.expectedDemand,
        competitorAnalysis: gap.competitorContent
      });
    });
    
    // パフォーマンストレンドに基づく提案
    const highPerformingCategories = this.identifyHighPerformingCategories(analytics);
    highPerformingCategories.forEach(category => {
      suggestions.push({
        topic: `${category.name} - 深掘りコンテンツ`,
        reason: 'high_performance',
        urgency: 'medium',
        expectedViews: category.averageViews * 0.8,
        suggestedAngle: category.suggestedAngle
      });
    });
    
    return suggestions;
  }

  /**
   * リフレッシュ理由の取得
   */
  getRefreshReason(video) {
    const reasons = [];
    
    if (video.age > 60) {
      reasons.push('情報の古さ');
    }
    
    if (video.performance.score < 0.5) {
      reasons.push('パフォーマンス低下');
    }
    
    if (video.trend === 'declining') {
      reasons.push('視聴数の減少傾向');
    }
    
    return reasons.join(', ');
  }

  /**
   * リフレッシュ優先度計算
   */
  calculateRefreshPriority(video) {
    let priority = 0;
    
    // パフォーマンススコアによる重み付け
    if (video.performance.score > 0.3 && video.performance.score < 0.6) {
      priority += 3; // 中程度のパフォーマンスは改善余地大
    }
    
    // 年齢による重み付け
    if (video.age > 60 && video.age < 120) {
      priority += 2; // 適度に古いコンテンツ
    }
    
    // トレンドによる重み付け
    if (video.trend === 'slight_decline') {
      priority += 2; // 緩やかな減少は回復可能
    }
    
    if (priority >= 5) return 'high';
    if (priority >= 3) return 'medium';
    return 'low';
  }

  /**
   * リフレッシュ提案
   */
  suggestRefreshChanges(video, analytics) {
    const suggestions = [];
    
    // タイトル・サムネイル更新
    if (analytics.ctr < 0.02) {
      suggestions.push({
        type: 'thumbnail_title',
        description: 'サムネイルとタイトルの更新でCTR改善',
        expectedImpact: 'CTR 50%向上'
      });
    }
    
    // コンテンツ更新
    if (video.age > 90) {
      suggestions.push({
        type: 'content_update',
        description: '最新情報を追加した更新版の作成',
        expectedImpact: '視聴維持率20%向上'
      });
    }
    
    // 説明文・タグ最適化
    suggestions.push({
      type: 'metadata_optimization',
      description: 'SEO最適化による検索順位向上',
      expectedImpact: '検索流入30%増加'
    });
    
    return suggestions;
  }

  // ユーティリティメソッド
  normalizeMetric(value, threshold) {
    return Math.min(value / threshold.high, 1);
  }

  estimateProductionCost(video) {
    // 動画の長さと品質に基づくコスト推定
    const baseCost = this.config.roiFactors.productionCost.standard;
    const durationMultiplier = video.duration / 600; // 10分基準
    return baseCost * durationMultiplier;
  }

  calculateMaintenanceCost(video, analytics) {
    // ストレージ、帯域幅などの維持コスト
    const monthlyStorage = 10; // 仮定: 月10円/動画
    const age = moment().diff(moment(video.publishedAt), 'months');
    return monthlyStorage * age;
  }

  analyzeCategoryDemand(categorizedContent, analytics) {
    // カテゴリー別の需要分析
    return {
      gaps: {
        urgent: [],
        shortTerm: [],
        longTerm: []
      }
    };
  }

  identifyHighPerformingCategories(analytics) {
    // 高パフォーマンスカテゴリーの特定
    return [];
  }

  getRetirementReason(video) {
    return `低パフォーマンス（スコア: ${video.performance.score.toFixed(2)}）`;
  }

  calculateRetirementImpact(video, analytics) {
    return {
      severity: 'low',
      monthlyViews: analytics?.monthlyViews || 0,
      revenue: analytics?.monthlyRevenue || 0
    };
  }

  suggestAlternatives(video, categorizedContent) {
    // 代替コンテンツの提案
    return [];
  }

  identifyTrendingTopics(analytics) {
    // トレンドトピックの特定
    return [];
  }

  estimateTopicROI(topic, roiAnalysis) {
    // トピックのROI推定
    return '150%';
  }

  estimateProductionTime(topic) {
    // 制作時間の推定
    return '2週間';
  }

  suggestContentFormat(topic) {
    // コンテンツフォーマットの提案
    return '10-15分の解説動画';
  }

  calculateRetirementSavings(videos) {
    // 廃止による節約額計算
    return '月額5,000円';
  }

  analyzeCategoryOptimization(roiAnalysis) {
    // カテゴリー最適化分析
    return [];
  }

  generateInventorySummary(categorizedContent) {
    const total = Object.values(categorizedContent)
      .reduce((sum, category) => sum + category.length, 0);
    
    return {
      totalVideos: total,
      breakdown: Object.entries(categorizedContent).map(([key, videos]) => ({
        category: key,
        count: videos.length,
        percentage: (videos.length / total * 100).toFixed(1)
      }))
    };
  }
}

module.exports = ContentInventoryManager;