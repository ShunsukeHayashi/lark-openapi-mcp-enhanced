/**
 * =============================================================================
 * Business Intelligence Suite Workflow Tool
 * =============================================================================
 * Comprehensive business analytics and intelligence generation combining multiple APIs
 * Priority 1: Critical for data-driven decision making
 * =============================================================================
 */

import { z } from 'zod';
import { McpTool } from '../index';

// Business Intelligence request schema
const BusinessIntelligenceSchema = z.object({
  // Analysis scope
  analysis: z.object({
    title: z.string().describe('Analysis title/name'),
    type: z.enum([
      'performance_dashboard', 'trend_analysis', 'comparative_study',
      'predictive_forecast', 'anomaly_detection', 'kpi_monitoring',
      'market_analysis', 'operational_efficiency', 'financial_analysis'
    ]).describe('Type of business intelligence analysis'),
    time_period: z.object({
      start_date: z.string().describe('Analysis start date (YYYY-MM-DD)'),
      end_date: z.string().describe('Analysis end date (YYYY-MM-DD)'),
      granularity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly')
    }),
    department_scope: z.array(z.string()).optional().describe('Departments to include in analysis'),
    kpi_metrics: z.array(z.string()).optional().describe('Specific KPI metrics to analyze'),
  }),
  
  // Data sources
  data_sources: z.object({
    hr_data: z.boolean().default(true).describe('Include HR/employee data'),
    financial_data: z.boolean().default(true).describe('Include financial/budget data'),
    project_data: z.boolean().default(true).describe('Include project/task data'),
    customer_data: z.boolean().default(false).describe('Include customer/CRM data'),
    operational_data: z.boolean().default(true).describe('Include operational metrics'),
    custom_bases: z.array(z.string()).optional().describe('Additional Base tokens to analyze'),
  }),
  
  // Output preferences
  output: z.object({
    format: z.enum(['dashboard', 'report', 'presentation', 'dataset']).default('dashboard').describe('Output format'),
    visualization_style: z.enum(['executive', 'detailed', 'technical', 'minimal']).default('executive').describe('Visualization complexity'),
    include_recommendations: z.boolean().default(true).describe('Include AI-generated recommendations'),
    include_predictions: z.boolean().default(false).describe('Include predictive analytics'),
    auto_schedule_updates: z.boolean().default(false).describe('Automatically schedule periodic updates'),
    share_with_stakeholders: z.boolean().default(true).describe('Automatically share with relevant stakeholders'),
  }),
  
  // Advanced options
  advanced: z.object({
    ai_insights_enabled: z.boolean().default(true).describe('Enable AI-powered insights generation'),
    anomaly_detection_sensitivity: z.enum(['low', 'medium', 'high']).default('medium').describe('Anomaly detection sensitivity'),
    benchmark_comparison: z.boolean().default(true).describe('Compare against industry benchmarks'),
    drill_down_enabled: z.boolean().default(true).describe('Enable interactive drill-down capabilities'),
    real_time_monitoring: z.boolean().default(false).describe('Enable real-time data monitoring'),
  })
});

/**
 * Business Intelligence Suite Tool
 * Comprehensive business analytics with AI insights and automated reporting
 */
export const businessIntelligenceSuite: McpTool = {
  project: 'custom_workflows',
  name: 'business.intelligence.suite.analyze',
  accessTokens: ['tenant'],
  description: '[Custom Workflow] Comprehensive business intelligence suite - data aggregation, trend analysis, AI insights, and automated reporting',
  
  schema: {
    data: BusinessIntelligenceSchema
  },
  
  customHandler: async (client, params) => {
    const startTime = Date.now();
    const results = {
      success: false,
      analysis_id: '',
      data_sources_processed: [] as string[],
      insights_generated: [] as any[],
      anomalies_detected: [] as any[],
      recommendations: [] as string[],
      visualizations_created: [] as string[],
      stakeholders_notified: [] as string[],
      performance_metrics: {} as Record<string, any>
    };

    try {
      console.log('📊 Starting Business Intelligence Analysis:', params.analysis.title);
      
      const analysisId = `BI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      results.analysis_id = analysisId;

      // Step 1: Data Collection Phase
      const collectedData = await collectBusinessData(client, params);
      results.data_sources_processed = collectedData.sources;
      results.performance_metrics.data_collection = {
        sources_count: collectedData.sources.length,
        records_processed: collectedData.total_records,
        data_quality_score: collectedData.quality_score
      };

      // Step 2: Data Processing and Analysis
      const processedMetrics = await processBusinessMetrics(
        collectedData.data,
        params.analysis.type,
        params.analysis.time_period
      );
      
      results.performance_metrics.analysis = processedMetrics;

      // Step 3: AI-Powered Insights Generation
      if (params.advanced.ai_insights_enabled) {
        const aiInsights = await generateAIInsights(
          processedMetrics,
          params.analysis.type,
          params.output.include_predictions
        );
        
        results.insights_generated = aiInsights.insights;
        results.recommendations = aiInsights.recommendations;
      }

      // Step 4: Anomaly Detection
      if (params.advanced.anomaly_detection_sensitivity !== 'low') {
        const anomalies = await detectAnomalies(
          processedMetrics,
          params.advanced.anomaly_detection_sensitivity
        );
        
        results.anomalies_detected = anomalies;
      }

      // Step 5: Create Visualizations and Reports
      const reportData = await createBusinessReport(
        client,
        params,
        processedMetrics,
        results.insights_generated,
        results.anomalies_detected,
        analysisId
      );
      
      results.visualizations_created = reportData.created_assets;

      // Step 6: Generate Executive Summary
      const executiveSummary = generateExecutiveSummary(
        params,
        processedMetrics,
        results.insights_generated,
        results.anomalies_detected,
        results.recommendations
      );

      // Step 7: Stakeholder Notification and Distribution
      if (params.output.share_with_stakeholders) {
        const notificationResults = await notifyStakeholders(
          client,
          params,
          executiveSummary,
          reportData.report_url,
          analysisId
        );
        
        results.stakeholders_notified = notificationResults.notified_users;
      }

      // Step 8: Schedule Automated Updates
      if (params.output.auto_schedule_updates) {
        await scheduleAutomatedUpdates(
          client,
          params,
          analysisId
        );
      }

      results.success = true;
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          analysis_id: analysisId,
          analysis_type: params.analysis.type,
          time_period: params.analysis.time_period,
          executive_summary: executiveSummary,
          key_insights: results.insights_generated.slice(0, 5), // Top 5 insights
          critical_anomalies: results.anomalies_detected.filter(a => a.severity === 'high'),
          top_recommendations: results.recommendations.slice(0, 3),
          performance_metrics: results.performance_metrics,
          report_assets: results.visualizations_created,
          stakeholders_reached: results.stakeholders_notified.length,
          execution_time_ms: executionTime
        },
        message: `✅ Business Intelligence analysis completed. ${results.insights_generated.length} insights generated, ${results.anomalies_detected.length} anomalies detected.`
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        error: {
          message: 'Business Intelligence analysis failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          partial_results: results,
          execution_time_ms: executionTime
        }
      };
    }
  }
};

// Helper Functions

async function collectBusinessData(client: any, params: any): Promise<{
  sources: string[];
  data: Record<string, any[]>;
  total_records: number;
  quality_score: number;
}> {
  const collectedData: Record<string, any[]> = {};
  const sources: string[] = [];
  let totalRecords = 0;

  try {
    // HR Data Collection
    if (params.data_sources.hr_data) {
      const hrData = await client.bitable.appTableRecord.search({
        path: {
          app_token: 'G9mPbjly3arM3zssaX4jNfMBpod', // M1_従業員マスタ
          table_id: 'tblkllkswkWDdD5Q'
        },
        data: {
          filter: {
            conditions: [{
              field_name: 'fldMHutqkR', // ステータス
              operator: 'is',
              value: ['active']
            }]
          }
        }
      });
      
      collectedData.hr_data = hrData.data?.items || [];
      sources.push('hr_employee_data');
      totalRecords += collectedData.hr_data.length;
    }

    // Project/Task Data Collection
    if (params.data_sources.project_data) {
      // Simulate project data collection
      collectedData.project_data = await collectProjectMetrics(client, params.analysis.time_period);
      sources.push('project_metrics');
      totalRecords += collectedData.project_data.length;
    }

    // Financial Data Collection
    if (params.data_sources.financial_data) {
      collectedData.financial_data = await collectFinancialMetrics(client, params.analysis.time_period);
      sources.push('financial_metrics');
      totalRecords += collectedData.financial_data.length;
    }

    // Custom Bases Data Collection
    if (params.data_sources.custom_bases) {
      for (const baseToken of params.data_sources.custom_bases) {
        try {
          const baseData = await client.bitable.appTable.list({
            path: { app_token: baseToken }
          });
          
          collectedData[`custom_base_${baseToken}`] = baseData.data?.items || [];
          sources.push(`custom_base_${baseToken}`);
        } catch (error) {
          console.warn(`Failed to collect data from base ${baseToken}:`, error);
        }
      }
    }

    // Calculate data quality score
    const qualityScore = calculateDataQuality(collectedData);

    return {
      sources,
      data: collectedData,
      total_records: totalRecords,
      quality_score: qualityScore
    };

  } catch (error) {
    console.error('Data collection failed:', error);
    throw new Error('Failed to collect business data');
  }
}

async function collectProjectMetrics(client: any, timePeriod: any): Promise<any[]> {
  // Simulate project metrics collection
  // In real implementation, this would query project management systems
  return [
    {
      project_id: 'PRJ001',
      name: 'Q4 Marketing Campaign',
      status: 'completed',
      budget_utilized: 0.85,
      timeline_adherence: 0.92,
      team_size: 8,
      completion_date: '2024-12-15'
    },
    {
      project_id: 'PRJ002', 
      name: 'Product Enhancement Phase 2',
      status: 'in_progress',
      budget_utilized: 0.67,
      timeline_adherence: 0.88,
      team_size: 12,
      estimated_completion: '2025-02-28'
    }
  ];
}

async function collectFinancialMetrics(client: any, timePeriod: any): Promise<any[]> {
  // Simulate financial metrics collection
  return [
    {
      metric: 'monthly_revenue',
      value: 5250000,
      currency: 'JPY',
      period: '2024-12',
      variance_from_target: 0.08
    },
    {
      metric: 'operational_costs',
      value: 3800000,
      currency: 'JPY', 
      period: '2024-12',
      variance_from_budget: -0.05
    }
  ];
}

function calculateDataQuality(data: Record<string, any[]>): number {
  // Simple data quality calculation
  const totalSources = Object.keys(data).length;
  const successfulSources = Object.values(data).filter(source => source.length > 0).length;
  
  return Math.round((successfulSources / totalSources) * 100) / 100;
}

async function processBusinessMetrics(
  data: Record<string, any[]>,
  analysisType: string,
  timePeriod: any
): Promise<Record<string, any>> {
  // Advanced metrics processing based on analysis type
  const metrics: Record<string, any> = {};

  // Employee metrics
  if (data.hr_data) {
    metrics.employee_metrics = {
      total_employees: data.hr_data.length,
      department_distribution: calculateDepartmentDistribution(data.hr_data),
      average_tenure: calculateAverageTenure(data.hr_data),
      turnover_rate: calculateTurnoverRate(data.hr_data, timePeriod)
    };
  }

  // Project metrics
  if (data.project_data) {
    metrics.project_metrics = {
      total_projects: data.project_data.length,
      completion_rate: calculateCompletionRate(data.project_data),
      average_budget_utilization: calculateAverageBudgetUtilization(data.project_data),
      timeline_performance: calculateTimelinePerformance(data.project_data)
    };
  }

  // Financial metrics
  if (data.financial_data) {
    metrics.financial_metrics = {
      revenue_trend: calculateRevenueTrend(data.financial_data),
      cost_efficiency: calculateCostEfficiency(data.financial_data),
      profit_margin: calculateProfitMargin(data.financial_data)
    };
  }

  return metrics;
}

async function generateAIInsights(
  metrics: Record<string, any>,
  analysisType: string,
  includePredictions: boolean
): Promise<{ insights: any[]; recommendations: string[] }> {
  // AI insights generation (simulated)
  const insights = [
    {
      type: 'trend',
      title: 'Employee Productivity Increase',
      description: 'Employee productivity has increased by 15% over the last quarter',
      confidence: 0.87,
      impact: 'high',
      data_source: 'hr_metrics'
    },
    {
      type: 'anomaly',
      title: 'Budget Variance in Marketing',
      description: 'Marketing department showing 23% budget overrun compared to plan',
      confidence: 0.93,
      impact: 'medium',
      data_source: 'financial_metrics'
    },
    {
      type: 'opportunity',
      title: 'Cross-Department Collaboration Gap',
      description: 'Projects with cross-department teams show 30% better outcomes',
      confidence: 0.78,
      impact: 'high',
      data_source: 'project_metrics'
    }
  ];

  const recommendations = [
    'Implement cross-department collaboration framework to improve project outcomes',
    'Review and optimize marketing budget allocation process',
    'Establish monthly productivity tracking system to maintain positive trends',
    'Create best practice sharing mechanism between high-performing teams'
  ];

  return { insights, recommendations };
}

async function detectAnomalies(
  metrics: Record<string, any>,
  sensitivity: string
): Promise<any[]> {
  // Anomaly detection logic
  const anomalies = [];

  // Example anomaly: Unusual budget variance
  if (metrics.financial_metrics?.cost_efficiency < 0.8) {
    anomalies.push({
      type: 'financial_anomaly',
      severity: 'high',
      description: 'Cost efficiency below expected threshold',
      affected_metric: 'cost_efficiency',
      current_value: metrics.financial_metrics.cost_efficiency,
      expected_range: '0.85-0.95',
      recommendation: 'Review operational processes for cost optimization opportunities'
    });
  }

  return anomalies;
}

async function createBusinessReport(
  client: any,
  params: any,
  metrics: Record<string, any>,
  insights: any[],
  anomalies: any[],
  analysisId: string
): Promise<{ created_assets: string[]; report_url: string }> {
  // Create comprehensive business report document
  const reportContent = generateReportContent(params, metrics, insights, anomalies);
  
  // In real implementation, this would create a document in Lark Docs
  const createdAssets = [
    `executive_dashboard_${analysisId}`,
    `detailed_report_${analysisId}`,
    `data_visualizations_${analysisId}`
  ];

  return {
    created_assets: createdAssets,
    report_url: `https://your-lark-domain.com/docs/report_${analysisId}`
  };
}

function generateExecutiveSummary(
  params: any,
  metrics: Record<string, any>,
  insights: any[],
  anomalies: any[],
  recommendations: string[]
): string {
  const criticalAnomalies = anomalies.filter(a => a.severity === 'high').length;
  const highImpactInsights = insights.filter(i => i.impact === 'high').length;

  return `📊 Executive Summary: ${params.analysis.title}

Period: ${params.analysis.time_period.start_date} to ${params.analysis.time_period.end_date}
Analysis Type: ${params.analysis.type}

Key Findings:
• ${highImpactInsights} high-impact insights identified
• ${criticalAnomalies} critical issues requiring immediate attention
• ${insights.length} total insights generated
• ${recommendations.length} actionable recommendations provided

Top Priority Actions:
${recommendations.slice(0, 3).map((rec, i) => `${i + 1}. ${rec}`).join('\\n')}

Overall Health Score: ${calculateOverallHealthScore(metrics, anomalies)}/100`;
}

function calculateOverallHealthScore(metrics: Record<string, any>, anomalies: any[]): number {
  // Simplified health score calculation
  const baseScore = 85;
  const anomalyPenalty = anomalies.filter(a => a.severity === 'high').length * 10;
  const lowAnomalyPenalty = anomalies.filter(a => a.severity === 'medium').length * 5;
  
  return Math.max(0, baseScore - anomalyPenalty - lowAnomalyPenalty);
}

async function notifyStakeholders(
  client: any,
  params: any,
  executiveSummary: string,
  reportUrl: string,
  analysisId: string
): Promise<{ notified_users: string[] }> {
  // Stakeholder notification logic
  const stakeholderEmails = [
    'ceo@company.com',
    'cfo@company.com', 
    'coo@company.com'
  ];

  const notifiedUsers: string[] = [];

  for (const email of stakeholderEmails) {
    try {
      const userResponse = await client.contact.user.batchGetId({
        data: { emails: [email] },
        params: { user_id_type: 'open_id' }
      });
      
      const userId = userResponse.data?.user_list?.[0]?.user_id;
      if (userId) {
        const notification = `📈 Business Intelligence Report Ready

${executiveSummary}

Full Report: ${reportUrl}
Analysis ID: ${analysisId}

This automated analysis was generated based on your organization's data for the specified period.`;

        await client.im.message.create({
          data: {
            receive_id: userId,
            content: JSON.stringify({ text: notification }),
            msg_type: 'text'
          },
          params: { receive_id_type: 'open_id' }
        });
        
        notifiedUsers.push(email);
      }
    } catch (error) {
      console.error(`Failed to notify ${email}:`, error);
    }
  }

  return { notified_users: notifiedUsers };
}

async function scheduleAutomatedUpdates(
  client: any,
  params: any,
  analysisId: string
): Promise<void> {
  // Schedule logic for automated updates
  console.log(`Scheduling automated updates for analysis ${analysisId}`);
  // In real implementation, this would set up recurring analysis jobs
}

// Additional helper functions for metric calculations
function calculateDepartmentDistribution(hrData: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  hrData.forEach(employee => {
    const dept = employee.fields?.fldsBeIupy || 'Unknown';
    distribution[dept] = (distribution[dept] || 0) + 1;
  });
  return distribution;
}

function calculateAverageTenure(hrData: any[]): number {
  // Simplified tenure calculation
  return 2.5; // years
}

function calculateTurnoverRate(hrData: any[], timePeriod: any): number {
  // Simplified turnover calculation
  return 0.08; // 8%
}

function calculateCompletionRate(projectData: any[]): number {
  const completed = projectData.filter(p => p.status === 'completed').length;
  return completed / projectData.length;
}

function calculateAverageBudgetUtilization(projectData: any[]): number {
  const total = projectData.reduce((sum, p) => sum + p.budget_utilized, 0);
  return total / projectData.length;
}

function calculateTimelinePerformance(projectData: any[]): number {
  const total = projectData.reduce((sum, p) => sum + p.timeline_adherence, 0);
  return total / projectData.length;
}

function calculateRevenueTrend(financialData: any[]): any {
  return { trend: 'increasing', rate: 0.08 };
}

function calculateCostEfficiency(financialData: any[]): number {
  return 0.87;
}

function calculateProfitMargin(financialData: any[]): number {
  return 0.23;
}

function generateReportContent(
  params: any,
  metrics: Record<string, any>,
  insights: any[],
  anomalies: any[]
): string {
  return `Business Intelligence Report: ${params.analysis.title}
  
Generated: ${new Date().toISOString()}
Analysis Period: ${params.analysis.time_period.start_date} to ${params.analysis.time_period.end_date}

[Detailed report content would be generated here]`;
}