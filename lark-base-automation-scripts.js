// Lark Base Automation Scripts for YouTube CRM Analytics
// These scripts can be used to automate dashboard updates and alerts

// ===== 1. AUTOMATED DATA REFRESH =====

/**
 * Daily Data Refresh Script
 * Runs every day at 6:00 AM to update calculated fields and metrics
 */
function dailyDataRefresh() {
  const tables = ['顧客マスタ', '案件管理', '活動履歴', '動画分析'];
  
  tables.forEach(tableName => {
    const table = base.getTable(tableName);
    
    // Update calculated fields
    table.selectRecords().then(records => {
      records.forEach(record => {
        // Update days since last activity
        if (record.getCellValue('最終活動日')) {
          const daysSince = Math.floor(
            (new Date() - new Date(record.getCellValue('最終活動日'))) / (1000 * 60 * 60 * 24)
          );
          record.setCellValue('活動経過日数', daysSince);
        }
        
        // Update customer health score
        if (tableName === '顧客マスタ') {
          const healthScore = calculateHealthScore(record);
          record.setCellValue('健全性スコア', healthScore);
        }
        
        // Update video effectiveness
        if (tableName === '動画分析') {
          const effectScore = calculateVideoEffectiveness(record);
          record.setCellValue('効果スコア', effectScore);
        }
      });
    });
  });
}

// ===== 2. ALERT MONITORING =====

/**
 * Real-time Alert Monitor
 * Checks for alert conditions every 15 minutes
 */
function monitorAlerts() {
  const alerts = [];
  
  // Check sales target achievement
  checkSalesTargetAlert().then(alert => {
    if (alert) alerts.push(alert);
  });
  
  // Check stalled deals
  checkStalledDealsAlert().then(stalledAlerts => {
    alerts.push(...stalledAlerts);
  });
  
  // Check video performance
  checkVideoPerformanceAlert().then(videoAlerts => {
    alerts.push(...videoAlerts);
  });
  
  // Send notifications
  if (alerts.length > 0) {
    sendAlertNotifications(alerts);
  }
}

function checkSalesTargetAlert() {
  const salesTable = base.getTable('売上実績');
  
  return salesTable.selectRecords({
    filterByFormula: `MONTH({成約日}) = MONTH(TODAY())`
  }).then(records => {
    const monthlyTotal = records.reduce((sum, record) => 
      sum + (record.getCellValue('契約金額') || 0), 0
    );
    
    const target = getMonthlyTarget();
    const achievementRate = (monthlyTotal / target) * 100;
    
    if (achievementRate < 60) {
      return {
        type: 'critical',
        title: '🔴 売上目標達成率警告',
        message: `今月の達成率が${achievementRate.toFixed(1)}%です。緊急対応が必要です。`,
        data: { monthlyTotal, target, achievementRate }
      };
    } else if (achievementRate < 80) {
      return {
        type: 'warning',
        title: '🟡 売上目標注意',
        message: `今月の達成率が${achievementRate.toFixed(1)}%です。追加施策を検討してください。`,
        data: { monthlyTotal, target, achievementRate }
      };
    }
    return null;
  });
}

function checkStalledDealsAlert() {
  const dealsTable = base.getTable('案件管理');
  
  return dealsTable.selectRecords({
    filterByFormula: `AND(
      {ステータス} != "成約",
      {ステータス} != "失注",
      DAYS(TODAY(), {最終活動日}) > 14
    )`
  }).then(records => {
    return records.map(record => ({
      type: 'info',
      title: '⚠️ 案件停滞アラート',
      message: `${record.getCellValue('案件名')}が${record.getCellValue('活動経過日数')}日間更新されていません`,
      data: {
        dealId: record.id,
        dealName: record.getCellValue('案件名'),
        owner: record.getCellValue('営業担当者'),
        daysSinceActivity: record.getCellValue('活動経過日数')
      }
    }));
  });
}

function checkVideoPerformanceAlert() {
  const videoTable = base.getTable('動画分析');
  
  return videoTable.selectRecords({
    filterByFormula: `{効果スコア} < 3.0`
  }).then(records => {
    return records.map(record => ({
      type: 'warning',
      title: '📺 動画効果改善アラート',
      message: `${record.getCellValue('動画タイトル')}の効果スコアが${record.getCellValue('効果スコア')}です`,
      data: {
        videoId: record.id,
        videoTitle: record.getCellValue('動画タイトル'),
        effectScore: record.getCellValue('効果スコア'),
        viewCount: record.getCellValue('視聴回数')
      }
    }));
  });
}

// ===== 3. REPORT GENERATION =====

/**
 * Weekly KPI Summary Report Generator
 */
async function generateWeeklySummary() {
  const report = {
    title: '週次KPIサマリー',
    period: getWeekPeriod(),
    generated: new Date().toISOString(),
    sections: []
  };
  
  // Section 1: Highlights
  const highlights = await getWeeklyHighlights();
  report.sections.push({
    title: '今週のハイライト',
    type: 'metrics',
    data: highlights
  });
  
  // Section 2: KPI Progress
  const kpiProgress = await getKPIProgress();
  report.sections.push({
    title: 'KPI進捗状況',
    type: 'progress',
    data: kpiProgress
  });
  
  // Section 3: Action Items
  const actionItems = await getActionItems();
  report.sections.push({
    title: '要対応案件',
    type: 'list',
    data: actionItems
  });
  
  return report;
}

async function getWeeklyHighlights() {
  const startOfWeek = getStartOfWeek();
  
  const metrics = await Promise.all([
    // New leads count
    base.getTable('顧客マスタ').selectRecords({
      filterByFormula: `{作成日} >= '${startOfWeek}'`
    }).then(records => ({ 
      label: '新規リード', 
      value: records.length,
      change: calculateWeekOverWeekChange('leads', records.length)
    })),
    
    // Conversion rate
    calculateWeeklyConversionRate().then(rate => ({
      label: '商談化率',
      value: `${rate.toFixed(1)}%`,
      change: calculateWeekOverWeekChange('conversion', rate)
    })),
    
    // Closed deals
    base.getTable('案件管理').selectRecords({
      filterByFormula: `AND({成約日} >= '${startOfWeek}', {ステータス} = "成約")`
    }).then(records => ({
      label: '成約件数',
      value: records.length,
      amount: records.reduce((sum, r) => sum + (r.getCellValue('契約金額') || 0), 0)
    }))
  ]);
  
  return metrics;
}

// ===== 4. DASHBOARD UPDATE FUNCTIONS =====

/**
 * Update Dashboard Widgets
 */
function updateDashboardWidgets() {
  // Update KPI cards
  updateKPICards();
  
  // Update charts
  updateCharts();
  
  // Update rankings
  updateRankings();
}

function updateKPICards() {
  const kpiData = {
    salesAchievement: calculateSalesAchievement(),
    avgDealCycle: calculateAverageDealCycle(),
    activityEfficiency: calculateActivityEfficiency(),
    videoROI: calculateVideoROI()
  };
  
  // Update each KPI card
  Object.entries(kpiData).forEach(([kpiName, value]) => {
    const widget = dashboard.getWidget(`kpi_${kpiName}`);
    if (widget) {
      widget.setValue(value.current);
      widget.setComparison(value.previous, value.change);
      widget.setStatus(getKPIStatus(kpiName, value.current));
    }
  });
}

function updateCharts() {
  // Update monthly sales trend
  const salesTrend = getMonthlySalesTrend();
  const trendChart = dashboard.getChart('monthly_sales_trend');
  if (trendChart) {
    trendChart.updateData(salesTrend);
  }
  
  // Update sales funnel
  const funnelData = getSalesFunnelData();
  const funnelChart = dashboard.getChart('sales_funnel');
  if (funnelChart) {
    funnelChart.updateData(funnelData);
  }
}

// ===== 5. HELPER FUNCTIONS =====

function calculateHealthScore(record) {
  const usageFreq = record.getCellValue('利用頻度スコア') || 0;
  const satisfaction = record.getCellValue('満足度スコア') || 0;
  const expansion = record.getCellValue('拡張可能性スコア') || 0;
  
  return (usageFreq * 0.3 + satisfaction * 0.4 + expansion * 0.3) * 100;
}

function calculateVideoEffectiveness(record) {
  const views = record.getCellValue('視聴回数') || 1;
  const conversions = record.getCellValue('成約貢献数') || 0;
  const completionRate = record.getCellValue('平均視聴完了率') || 0;
  const rating = record.getCellValue('顧客評価') || 0;
  
  if (views === 0) return 0;
  
  return ((conversions / views) * 0.4 + 
          (completionRate / 100) * 0.3 + 
          (rating / 5) * 0.3) * 5;
}

function sendAlertNotifications(alerts) {
  // Group alerts by type
  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.type]) acc[alert.type] = [];
    acc[alert.type].push(alert);
    return acc;
  }, {});
  
  // Send to appropriate channels
  if (groupedAlerts.critical) {
    sendEmail('management@company.com', 'Critical Alerts', groupedAlerts.critical);
    sendSlackMessage('#sales-alerts', formatCriticalAlerts(groupedAlerts.critical));
  }
  
  if (groupedAlerts.warning) {
    sendSlackMessage('#sales-team', formatWarningAlerts(groupedAlerts.warning));
  }
  
  if (groupedAlerts.info) {
    createTasks(groupedAlerts.info);
  }
}

function getStartOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString().split('T')[0];
}

function getMonthlyTarget() {
  // Get from settings or configuration table
  const settingsTable = base.getTable('設定');
  return settingsTable.selectRecords({
    filterByFormula: `{設定名} = "月次売上目標"`
  }).then(records => {
    if (records.length > 0) {
      return records[0].getCellValue('値') || 10000000; // Default 10M JPY
    }
    return 10000000;
  });
}

// ===== 6. SCHEDULING SETUP =====

/**
 * Setup automated schedules
 */
function setupAutomation() {
  // Daily refresh at 6 AM
  schedule.daily('06:00', dailyDataRefresh);
  
  // Alert monitoring every 15 minutes
  schedule.interval('15m', monitorAlerts);
  
  // Weekly summary every Monday at 9 AM
  schedule.weekly('monday', '09:00', async () => {
    const report = await generateWeeklySummary();
    distributeReport(report, ['sales-team', 'management']);
  });
  
  // Monthly report on first business day
  schedule.monthly('first-business-day', '10:00', async () => {
    const report = await generateMonthlyReport();
    distributeReport(report, ['executives', 'sales-management']);
  });
  
  // Dashboard update every hour
  schedule.interval('1h', updateDashboardWidgets);
}

// Initialize automation
setupAutomation();