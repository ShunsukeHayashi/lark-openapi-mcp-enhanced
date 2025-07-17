/**
 * レポート自動生成スクリプト
 * 日次・週次・月次レポートの自動生成と配信
 */

const { Base, Report, Chart } = require('@larksuite/base-sdk');
const schedule = require('node-schedule');
const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
  constructor(baseId, appId, appSecret) {
    this.baseId = baseId;
    this.appId = appId;
    this.appSecret = appSecret;
    this.base = null;
  }

  async initialize() {
    this.base = await Base.init({
      baseId: this.baseId,
      appId: this.appId,
      appSecret: this.appSecret
    });
  }

  /**
   * 日次レポート生成
   */
  async generateDailyReport(date = new Date()) {
    console.log(`日次レポート生成開始: ${date.toLocaleDateString('ja-JP')}`);

    const reportData = {
      date: date.toLocaleDateString('ja-JP'),
      activities: await this.getDailyActivities(date),
      tasks: await this.getDailyTasks(date),
      opportunities: await this.getDailyOpportunities(date),
      youtubeMetrics: await this.getDailyYouTubeMetrics(date),
      alerts: await this.getDailyAlerts(date)
    };

    // レポート生成
    const report = new Report({
      title: `営業活動日次レポート - ${reportData.date}`,
      template: 'daily_activity_report'
    });

    // セクション追加
    report.addSection({
      title: '本日の活動サマリー',
      type: 'metrics',
      data: {
        '総活動数': reportData.activities.total,
        '完了タスク': reportData.tasks.completed,
        '新規商談': reportData.opportunities.new,
        'YouTube動画送付': reportData.youtubeMetrics.shared
      }
    });

    report.addSection({
      title: '活動内訳',
      type: 'table',
      data: reportData.activities.breakdown
    });

    report.addSection({
      title: '未完了タスク',
      type: 'list',
      data: reportData.tasks.pending,
      highlight: task => task.overdue
    });

    report.addSection({
      title: '明日の予定',
      type: 'timeline',
      data: await this.getTomorrowSchedule(date)
    });

    report.addSection({
      title: '要注意案件',
      type: 'alerts',
      data: reportData.alerts
    });

    // レポート保存と配信
    const reportUrl = await report.save();
    await this.distributeReport(reportUrl, 'daily');

    console.log('日次レポート生成完了');
    return reportUrl;
  }

  /**
   * 週次レポート生成
   */
  async generateWeeklyReport(weekEndDate = new Date()) {
    console.log(`週次レポート生成開始: ${weekEndDate.toLocaleDateString('ja-JP')}`);

    const weekStartDate = new Date(weekEndDate);
    weekStartDate.setDate(weekStartDate.getDate() - 6);

    const reportData = {
      period: `${weekStartDate.toLocaleDateString('ja-JP')} - ${weekEndDate.toLocaleDateString('ja-JP')}`,
      revenue: await this.getWeeklyRevenue(weekStartDate, weekEndDate),
      pipeline: await this.getWeeklyPipeline(),
      teamPerformance: await this.getWeeklyTeamPerformance(weekStartDate, weekEndDate),
      youtubeROI: await this.getWeeklyYouTubeROI(weekStartDate, weekEndDate),
      forecast: await this.getWeeklyForecast()
    };

    const report = new Report({
      title: `営業パフォーマンス週次レポート - ${reportData.period}`,
      template: 'weekly_performance_report'
    });

    // エグゼクティブサマリー
    report.addSection({
      title: 'エグゼクティブサマリー',
      type: 'summary',
      data: {
        '週間売上': this.formatCurrency(reportData.revenue.total),
        '目標達成率': `${reportData.revenue.achievementRate}%`,
        '新規商談数': reportData.pipeline.newOpportunities,
        '成約件数': reportData.revenue.closedDeals
      }
    });

    // 売上実績
    report.addSection({
      title: '売上実績',
      type: 'kpi_dashboard',
      data: [
        {
          name: '週間売上',
          value: this.formatCurrency(reportData.revenue.total),
          target: this.formatCurrency(reportData.revenue.target),
          achievement: reportData.revenue.achievementRate,
          trend: reportData.revenue.trend
        },
        {
          name: '新規受注',
          value: reportData.revenue.newOrders,
          change: reportData.revenue.newOrdersChange
        },
        {
          name: '平均商談規模',
          value: this.formatCurrency(reportData.revenue.avgDealSize),
          change: reportData.revenue.dealSizeChange
        },
        {
          name: '成約率',
          value: `${reportData.revenue.winRate}%`,
          target: `${reportData.revenue.winRateTarget}%`
        }
      ]
    });

    // パイプライン分析
    report.addChart({
      title: 'パイプライン分析',
      type: 'funnel',
      data: reportData.pipeline.stages
    });

    // チーム別実績
    report.addSection({
      title: 'チーム別実績',
      type: 'comparison_table',
      data: reportData.teamPerformance,
      sortBy: 'revenue',
      highlight: 'top3'
    });

    // YouTube ROI分析
    report.addChart({
      title: 'YouTube動画ROI分析',
      type: 'mixed',
      data: reportData.youtubeROI
    });

    // 次週の見込み
    report.addSection({
      title: '次週の見込み',
      type: 'forecast',
      data: reportData.forecast
    });

    const reportUrl = await report.save();
    await this.distributeReport(reportUrl, 'weekly');

    console.log('週次レポート生成完了');
    return reportUrl;
  }

  /**
   * 月次レポート生成
   */
  async generateMonthlyReport(month = new Date().getMonth(), year = new Date().getFullYear()) {
    console.log(`月次レポート生成開始: ${year}年${month + 1}月`);

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const reportData = {
      period: `${year}年${month + 1}月`,
      kpis: await this.getMonthlyKPIs(monthStart, monthEnd),
      revenueAnalysis: await this.getMonthlyRevenueAnalysis(monthStart, monthEnd),
      pipelineHealth: await this.getMonthlyPipelineHealth(),
      youtubeImpact: await this.getMonthlyYouTubeImpact(monthStart, monthEnd),
      teamProductivity: await this.getMonthlyTeamProductivity(monthStart, monthEnd),
      customerInsights: await this.getMonthlyCustomerInsights(monthStart, monthEnd),
      competitiveAnalysis: await this.getMonthlyCompetitiveAnalysis(monthStart, monthEnd),
      predictions: await this.getMonthlyPredictions(),
      recommendations: await this.generateStrategicRecommendations()
    };

    const report = new Report({
      title: `月次営業分析レポート - ${reportData.period}`,
      template: 'monthly_analysis_report'
    });

    // エグゼクティブダッシュボード
    report.addSection({
      title: 'エグゼクティブダッシュボード',
      type: 'kpi_overview',
      layout: 'grid',
      data: reportData.kpis
    });

    // 売上詳細分析
    report.addSection({
      title: '売上詳細分析',
      type: 'multi_dimension_analysis',
      data: reportData.revenueAnalysis
    });

    // パイプライン健全性
    report.addSection({
      title: 'パイプライン健全性評価',
      type: 'pipeline_analytics',
      data: reportData.pipelineHealth
    });

    // YouTube インパクト分析
    report.addSection({
      title: 'YouTube動画インパクト分析',
      type: 'content_roi_analysis',
      data: reportData.youtubeImpact
    });

    // チーム生産性
    report.addSection({
      title: 'チーム生産性分析',
      type: 'productivity_dashboard',
      data: reportData.teamProductivity
    });

    // 顧客インサイト
    report.addSection({
      title: '顧客インサイト',
      type: 'customer_analytics',
      data: reportData.customerInsights
    });

    // 競合分析
    report.addSection({
      title: '競合分析',
      type: 'competitive_intelligence',
      data: reportData.competitiveAnalysis
    });

    // 予測分析
    report.addSection({
      title: '予測分析',
      type: 'ml_predictions',
      data: reportData.predictions
    });

    // 戦略的提言
    report.addSection({
      title: '戦略的提言',
      type: 'ai_insights',
      data: reportData.recommendations
    });

    const reportUrl = await report.save();
    await this.distributeReport(reportUrl, 'monthly');

    console.log('月次レポート生成完了');
    return reportUrl;
  }

  /**
   * データ取得メソッド（例）
   */
  async getDailyActivities(date) {
    const activities = await this.base.query('活動履歴', {
      filter: { date: date.toISOString().split('T')[0] }
    });

    const breakdown = {};
    activities.forEach(activity => {
      breakdown[activity.type] = (breakdown[activity.type] || 0) + 1;
    });

    return {
      total: activities.length,
      breakdown: Object.entries(breakdown).map(([type, count]) => ({
        活動タイプ: type,
        件数: count,
        割合: `${Math.round(count / activities.length * 100)}%`
      }))
    };
  }

  async getDailyTasks(date) {
    const tasks = await this.base.query('タスク', {
      filter: { 
        or: [
          { completedDate: date.toISOString().split('T')[0] },
          { dueDate: date.toISOString().split('T')[0] }
        ]
      }
    });

    return {
      completed: tasks.filter(t => t.status === '完了').length,
      pending: tasks.filter(t => t.status !== '完了').map(t => ({
        ...t,
        overdue: new Date(t.dueDate) < date
      }))
    };
  }

  /**
   * レポート配信
   */
  async distributeReport(reportUrl, reportType) {
    const config = await this.getReportConfig(reportType);
    
    // メール送信
    if (config.email) {
      await this.sendEmail({
        to: config.recipients.to,
        cc: config.recipients.cc,
        subject: `${config.subject} - ${new Date().toLocaleDateString('ja-JP')}`,
        body: `レポートが生成されました。\n\n${reportUrl}\n\nこのレポートは自動生成されています。`,
        attachments: [reportUrl]
      });
    }

    // Lark 通知
    if (config.lark) {
      await this.sendLarkNotification({
        recipients: config.recipients.to,
        message: `📊 ${config.subject}が生成されました`,
        link: reportUrl
      });
    }

    // Slack 通知
    if (config.slack) {
      await this.sendSlackNotification({
        channel: config.slackChannel,
        message: `:chart_with_upwards_trend: ${config.subject}が生成されました`,
        link: reportUrl
      });
    }
  }

  /**
   * スケジューラー設定
   */
  setupScheduler() {
    // 日次レポート（毎日18:00）
    schedule.scheduleJob('0 18 * * *', async () => {
      await this.generateDailyReport();
    });

    // 週次レポート（毎週月曜日9:00）
    schedule.scheduleJob('0 9 * * 1', async () => {
      await this.generateWeeklyReport();
    });

    // 月次レポート（毎月1日10:00）
    schedule.scheduleJob('0 10 1 * *', async () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      await this.generateMonthlyReport(lastMonth.getMonth(), lastMonth.getFullYear());
    });

    console.log('レポートスケジューラー設定完了');
  }

  /**
   * ユーティリティメソッド
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  }

  async getReportConfig(reportType) {
    const configs = {
      daily: {
        subject: '営業活動日次レポート',
        recipients: {
          to: ['sales-team@company.com'],
          cc: ['sales-manager@company.com']
        },
        email: true,
        lark: true,
        slack: false
      },
      weekly: {
        subject: '営業パフォーマンス週次レポート',
        recipients: {
          to: ['sales-team@company.com', 'management@company.com'],
          cc: ['executives@company.com']
        },
        email: true,
        lark: true,
        slack: true,
        slackChannel: '#sales-reports'
      },
      monthly: {
        subject: '月次営業分析レポート',
        recipients: {
          to: ['executives@company.com', 'sales-leadership@company.com'],
          cc: ['finance@company.com', 'marketing@company.com']
        },
        email: true,
        lark: true,
        slack: true,
        slackChannel: '#executive-reports'
      }
    };

    return configs[reportType];
  }

  /**
   * 実行
   */
  async run() {
    try {
      await this.initialize();
      
      // 引数に応じてレポート生成
      const args = process.argv.slice(2);
      const reportType = args[0] || 'daily';
      
      switch (reportType) {
        case 'daily':
          await this.generateDailyReport();
          break;
        case 'weekly':
          await this.generateWeeklyReport();
          break;
        case 'monthly':
          await this.generateMonthlyReport();
          break;
        case 'scheduler':
          this.setupScheduler();
          console.log('スケジューラーが開始されました。Ctrl+Cで終了します。');
          break;
        default:
          console.log('使用方法: node report-generator.js [daily|weekly|monthly|scheduler]');
      }
    } catch (error) {
      console.error('レポート生成エラー:', error);
    }
  }
}

// 実行
if (require.main === module) {
  const generator = new ReportGenerator(
    process.env.LARK_BASE_ID || 'BI4RbpcKxaR7C2sLq9GjXJUjp2b',
    process.env.LARK_APP_ID,
    process.env.LARK_APP_SECRET
  );
  
  generator.run();
}

module.exports = ReportGenerator;