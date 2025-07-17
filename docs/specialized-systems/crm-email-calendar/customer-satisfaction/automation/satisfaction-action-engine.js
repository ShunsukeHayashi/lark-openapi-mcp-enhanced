/**
 * 顧客満足度アクションエンジン
 * 満足度データに基づく自動アクションの実行と管理
 */

const moment = require('moment');
const EventEmitter = require('events');

class SatisfactionActionEngine extends EventEmitter {
  constructor(satisfactionMeasurement, churnPrediction, larkAPI) {
    super();
    this.satisfactionMeasurement = satisfactionMeasurement;
    this.churnPrediction = churnPrediction;
    this.larkAPI = larkAPI;
    
    this.config = {
      // アクションルール
      actionRules: {
        satisfaction: {
          critical: { threshold: 30, actions: ['immediate_call', 'escalate_to_manager', 'retention_offer'] },
          low: { threshold: 50, actions: ['follow_up_email', 'survey_deep_dive', 'improvement_plan'] },
          declining: { threshold: -10, actions: ['proactive_check_in', 'satisfaction_recovery'] },
          improving: { threshold: 10, actions: ['positive_reinforcement', 'upsell_opportunity'] }
        },
        
        nps: {
          detractor: { range: [0, 6], actions: ['detractor_recovery', 'feedback_collection'] },
          passive: { range: [7, 8], actions: ['engagement_boost', 'value_communication'] },
          promoter: { range: [9, 10], actions: ['referral_request', 'case_study_invite'] }
        },
        
        churn: {
          critical: { threshold: 0.8, actions: ['retention_specialist', 'emergency_offer'] },
          high: { threshold: 0.6, actions: ['proactive_engagement', 'value_demonstration'] },
          medium: { threshold: 0.4, actions: ['regular_check_in', 'feature_education'] }
        }
      },
      
      // 自動化タイミング
      automationTiming: {
        immediate: { delay: 0, priority: 'urgent' },
        within24h: { delay: 86400000, priority: 'high' },
        within72h: { delay: 259200000, priority: 'medium' },
        scheduled: { delay: 604800000, priority: 'low' }
      },
      
      // エスカレーションルール
      escalationRules: {
        levels: ['support', 'manager', 'director', 'executive'],
        thresholds: {
          support: { satisfactionScore: 50, churnRisk: 0.4 },
          manager: { satisfactionScore: 30, churnRisk: 0.6 },
          director: { satisfactionScore: 20, churnRisk: 0.8 },
          executive: { satisfactionScore: 10, churnRisk: 0.9 }
        }
      },
      
      // アクションテンプレート
      actionTemplates: {
        email: {
          detractor_recovery: {
            subject: 'お客様の声をお聞かせください',
            template: 'detractor_recovery_email'
          },
          satisfaction_recovery: {
            subject: '改善のご提案',
            template: 'satisfaction_recovery_email'
          },
          positive_reinforcement: {
            subject: 'いつもありがとうございます',
            template: 'appreciation_email'
          }
        },
        
        task: {
          immediate_call: {
            title: '緊急: 顧客フォローアップコール',
            priority: 'urgent',
            sla: '2時間以内'
          },
          proactive_check_in: {
            title: '定期チェックイン',
            priority: 'medium',
            sla: '3営業日以内'
          }
        }
      }
    };
    
    this.activeActions = new Map();
    this.actionQueue = [];
  }

  /**
   * 満足度ベースの自動アクション実行
   * @param {Object} customer - 顧客データ
   * @param {Object} satisfactionData - 満足度データ
   * @returns {Object} 実行結果
   */
  async executeAutomatedActions(customer, satisfactionData) {
    try {
      console.log(`Executing automated actions for customer ${customer.id}`);
      
      // アクションの特定
      const requiredActions = await this.identifyRequiredActions(customer, satisfactionData);
      
      if (requiredActions.length === 0) {
        console.log('No actions required');
        return { actionsExecuted: 0, message: 'アクションは必要ありません' };
      }
      
      // アクションの優先順位付け
      const prioritizedActions = this.prioritizeActions(requiredActions);
      
      // 各アクションの実行
      const results = [];
      for (const action of prioritizedActions) {
        const result = await this.executeAction(action);
        results.push(result);
      }
      
      // 結果の集約
      const summary = this.aggregateActionResults(results);
      
      // 実行履歴の保存
      await this.saveActionHistory(customer.id, summary);
      
      // 通知
      await this.notifyActionExecution(summary);
      
      return summary;
      
    } catch (error) {
      console.error('Automated action execution error:', error);
      this.emit('error', { type: 'action_execution', error });
      throw error;
    }
  }

  /**
   * 必要なアクションの特定
   */
  async identifyRequiredActions(customer, satisfactionData) {
    const actions = [];
    
    // 満足度スコアベースのアクション
    const satisfactionActions = this.evaluateSatisfactionActions(satisfactionData);
    actions.push(...satisfactionActions);
    
    // NPSベースのアクション
    const npsActions = this.evaluateNPSActions(satisfactionData);
    actions.push(...npsActions);
    
    // チャーンリスクベースのアクション
    const churnPredictionData = await this.churnPrediction.predictChurn(customer, {
      includeExplanation: false,
      includePreventionActions: true
    });
    const churnActions = this.evaluateChurnActions(churnPredictionData);
    actions.push(...churnActions);
    
    // トレンドベースのアクション
    const trendActions = this.evaluateTrendActions(satisfactionData);
    actions.push(...trendActions);
    
    // 重複の除去
    return this.deduplicateActions(actions);
  }

  /**
   * 満足度スコアベースのアクション評価
   */
  evaluateSatisfactionActions(satisfactionData) {
    const actions = [];
    const overallScore = satisfactionData.scores.integrated;
    const rules = this.config.actionRules.satisfaction;
    
    // クリティカルレベル
    if (overallScore <= rules.critical.threshold) {
      rules.critical.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'critical_satisfaction',
          priority: 'urgent',
          data: {
            currentScore: overallScore,
            threshold: rules.critical.threshold
          }
        });
      });
    }
    // 低満足度
    else if (overallScore <= rules.low.threshold) {
      rules.low.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'low_satisfaction',
          priority: 'high',
          data: {
            currentScore: overallScore,
            threshold: rules.low.threshold
          }
        });
      });
    }
    
    // トレンドベース
    const trend = satisfactionData.trend;
    if (trend.changeRate <= rules.declining.threshold) {
      rules.declining.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'declining_satisfaction',
          priority: 'medium',
          data: {
            changeRate: trend.changeRate,
            previousScore: trend.periodComparison.previous,
            currentScore: trend.periodComparison.current
          }
        });
      });
    } else if (trend.changeRate >= rules.improving.threshold) {
      rules.improving.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'improving_satisfaction',
          priority: 'low',
          data: {
            changeRate: trend.changeRate,
            improvement: trend.periodComparison.change
          }
        });
      });
    }
    
    return actions;
  }

  /**
   * NPSベースのアクション評価
   */
  evaluateNPSActions(satisfactionData) {
    const actions = [];
    const npsData = satisfactionData.details.nps;
    
    if (!npsData || npsData.score === null) {
      return actions;
    }
    
    const rules = this.config.actionRules.nps;
    
    // NPSカテゴリに基づくアクション
    if (npsData.category === 'detractor') {
      rules.detractor.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'nps_detractor',
          priority: 'high',
          data: {
            npsScore: npsData.score,
            category: 'detractor'
          }
        });
      });
    } else if (npsData.category === 'passive') {
      rules.passive.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'nps_passive',
          priority: 'medium',
          data: {
            npsScore: npsData.score,
            category: 'passive'
          }
        });
      });
    } else if (npsData.category === 'promoter') {
      rules.promoter.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'nps_promoter',
          priority: 'low',
          data: {
            npsScore: npsData.score,
            category: 'promoter'
          }
        });
      });
    }
    
    return actions;
  }

  /**
   * チャーンリスクベースのアクション評価
   */
  evaluateChurnActions(churnPredictionData) {
    const actions = [];
    const churnRisk = churnPredictionData.prediction.probability;
    const riskLevel = churnPredictionData.prediction.riskLevel;
    const rules = this.config.actionRules.churn;
    
    if (riskLevel === 'critical' || churnRisk >= rules.critical.threshold) {
      rules.critical.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'critical_churn_risk',
          priority: 'urgent',
          data: {
            churnProbability: churnRisk,
            riskLevel: riskLevel,
            topFactors: churnPredictionData.factors.slice(0, 3)
          }
        });
      });
    } else if (riskLevel === 'high' || churnRisk >= rules.high.threshold) {
      rules.high.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'high_churn_risk',
          priority: 'high',
          data: {
            churnProbability: churnRisk,
            riskLevel: riskLevel
          }
        });
      });
    } else if (riskLevel === 'medium' || churnRisk >= rules.medium.threshold) {
      rules.medium.actions.forEach(actionType => {
        actions.push({
          type: actionType,
          reason: 'medium_churn_risk',
          priority: 'medium',
          data: {
            churnProbability: churnRisk,
            riskLevel: riskLevel
          }
        });
      });
    }
    
    // 予防アクションの追加
    if (churnPredictionData.preventionActions) {
      churnPredictionData.preventionActions
        .filter(pa => pa.priority === 'urgent' || pa.priority === 'high')
        .forEach(pa => {
          actions.push({
            type: 'custom_prevention',
            reason: 'churn_prevention',
            priority: pa.priority,
            data: {
              action: pa.action,
              description: pa.description,
              expectedImpact: pa.expectedImpact
            }
          });
        });
    }
    
    return actions;
  }

  /**
   * トレンドベースのアクション評価
   */
  evaluateTrendActions(satisfactionData) {
    const actions = [];
    
    // 感情トレンドの分析
    const sentimentTrend = satisfactionData.details.sentiment?.trend;
    if (sentimentTrend === 'declining') {
      actions.push({
        type: 'sentiment_improvement',
        reason: 'declining_sentiment',
        priority: 'medium',
        data: {
          sentimentTrend: sentimentTrend,
          recentFeedback: satisfactionData.details.sentiment.recentFeedback
        }
      });
    }
    
    // CESトレンドの分析
    const cesTrend = satisfactionData.details.ces?.trend;
    if (cesTrend === 'worsening') {
      actions.push({
        type: 'process_optimization',
        reason: 'increasing_effort',
        priority: 'medium',
        data: {
          cesTrend: cesTrend,
          frictionPoints: satisfactionData.details.ces.frictionPoints
        }
      });
    }
    
    return actions;
  }

  /**
   * アクションの優先順位付け
   */
  prioritizeActions(actions) {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return actions.sort((a, b) => {
      // 優先度でソート
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 同じ優先度の場合は、理由の重要度でソート
      const reasonOrder = {
        critical_satisfaction: 10,
        critical_churn_risk: 9,
        low_satisfaction: 8,
        high_churn_risk: 7,
        nps_detractor: 6,
        declining_satisfaction: 5
      };
      
      return (reasonOrder[b.reason] || 0) - (reasonOrder[a.reason] || 0);
    });
  }

  /**
   * アクションの実行
   */
  async executeAction(action) {
    try {
      console.log(`Executing action: ${action.type}`);
      
      const actionId = this.generateActionId();
      const executionData = {
        id: actionId,
        type: action.type,
        reason: action.reason,
        priority: action.priority,
        startedAt: new Date().toISOString(),
        status: 'executing'
      };
      
      // アクティブアクションに追加
      this.activeActions.set(actionId, executionData);
      
      // アクションタイプ別の実行
      let result;
      switch (action.type) {
        case 'immediate_call':
          result = await this.executeImmediateCall(action);
          break;
        case 'follow_up_email':
          result = await this.executeFollowUpEmail(action);
          break;
        case 'escalate_to_manager':
          result = await this.executeEscalation(action, 'manager');
          break;
        case 'retention_offer':
          result = await this.executeRetentionOffer(action);
          break;
        case 'detractor_recovery':
          result = await this.executeDetractorRecovery(action);
          break;
        case 'proactive_engagement':
          result = await this.executeProactiveEngagement(action);
          break;
        case 'value_demonstration':
          result = await this.executeValueDemonstration(action);
          break;
        case 'referral_request':
          result = await this.executeReferralRequest(action);
          break;
        case 'custom_prevention':
          result = await this.executeCustomPrevention(action);
          break;
        default:
          result = await this.executeGenericAction(action);
      }
      
      // 実行結果の更新
      executionData.status = result.success ? 'completed' : 'failed';
      executionData.completedAt = new Date().toISOString();
      executionData.result = result;
      
      // アクティブアクションから削除
      this.activeActions.delete(actionId);
      
      return executionData;
      
    } catch (error) {
      console.error(`Action execution error for ${action.type}:`, error);
      return {
        id: this.generateActionId(),
        type: action.type,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 即座のフォローアップコール
   */
  async executeImmediateCall(action) {
    const task = {
      title: this.config.actionTemplates.task.immediate_call.title,
      description: `顧客満足度が危機的レベル（${action.data.currentScore}）です。即座のフォローアップが必要です。`,
      priority: this.config.actionTemplates.task.immediate_call.priority,
      assignedTo: await this.getAvailableAgent('senior'),
      dueDate: moment().add(2, 'hours').toISOString(),
      customer: action.data.customerId,
      type: 'call',
      sla: this.config.actionTemplates.task.immediate_call.sla
    };
    
    const created = await this.larkAPI.createTask(task);
    
    return {
      success: true,
      taskId: created.id,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate
    };
  }

  /**
   * フォローアップメール
   */
  async executeFollowUpEmail(action) {
    const template = this.config.actionTemplates.email.satisfaction_recovery;
    
    const emailData = {
      to: action.data.customerEmail,
      subject: template.subject,
      template: template.template,
      variables: {
        customerName: action.data.customerName,
        currentScore: action.data.currentScore,
        previousScore: action.data.previousScore || 'N/A',
        concernAreas: this.identifyConcernAreas(action.data)
      },
      scheduledAt: moment().add(1, 'hour').toISOString()
    };
    
    const scheduled = await this.larkAPI.scheduleEmail(emailData);
    
    return {
      success: true,
      emailId: scheduled.id,
      scheduledAt: emailData.scheduledAt
    };
  }

  /**
   * エスカレーション
   */
  async executeEscalation(action, level) {
    const escalation = {
      customerId: action.data.customerId,
      level: level,
      reason: action.reason,
      data: action.data,
      escalatedAt: new Date().toISOString(),
      priority: action.priority
    };
    
    // エスカレーション先の決定
    const escalateTo = await this.determineEscalationTarget(level, action.priority);
    
    // エスカレーション通知
    const notification = await this.larkAPI.sendEscalationNotification({
      to: escalateTo,
      escalation: escalation,
      requiredAction: this.generateEscalationAction(action)
    });
    
    return {
      success: true,
      escalatedTo: escalateTo,
      notificationId: notification.id
    };
  }

  /**
   * リテンションオファー
   */
  async executeRetentionOffer(action) {
    // 顧客データに基づくオファーの生成
    const offer = await this.generatePersonalizedOffer(action.data);
    
    // オファーの承認
    const approved = await this.getOfferApproval(offer);
    
    if (!approved) {
      return { success: false, reason: 'offer_not_approved' };
    }
    
    // オファーの送信
    const communication = {
      type: 'retention_offer',
      channel: await this.getPreferredChannel(action.data.customerId),
      offer: offer,
      validUntil: moment().add(30, 'days').toISOString(),
      trackingEnabled: true
    };
    
    const sent = await this.larkAPI.sendCommunication(communication);
    
    return {
      success: true,
      offerId: offer.id,
      communicationId: sent.id,
      offerDetails: offer
    };
  }

  /**
   * デトラクター回復プログラム
   */
  async executeDetractorRecovery(action) {
    // 回復プログラムの作成
    const recoveryProgram = {
      customerId: action.data.customerId,
      type: 'detractor_recovery',
      steps: [
        {
          step: 1,
          action: 'personal_apology',
          timeline: 'immediate',
          owner: 'customer_success_manager'
        },
        {
          step: 2,
          action: 'root_cause_analysis',
          timeline: 'within_48h',
          owner: 'support_team'
        },
        {
          step: 3,
          action: 'improvement_plan',
          timeline: 'within_1week',
          owner: 'product_team'
        },
        {
          step: 4,
          action: 'follow_up_check',
          timeline: 'after_2weeks',
          owner: 'customer_success_manager'
        }
      ],
      startedAt: new Date().toISOString()
    };
    
    // プログラムの開始
    const program = await this.larkAPI.createRecoveryProgram(recoveryProgram);
    
    // 最初のステップの実行
    await this.executeRecoveryStep(program.id, recoveryProgram.steps[0]);
    
    return {
      success: true,
      programId: program.id,
      totalSteps: recoveryProgram.steps.length,
      currentStep: 1
    };
  }

  /**
   * プロアクティブエンゲージメント
   */
  async executeProactiveEngagement(action) {
    // エンゲージメントキャンペーンの設計
    const campaign = {
      type: 'proactive_engagement',
      target: action.data.customerId,
      duration: '30_days',
      touchpoints: [
        {
          day: 1,
          action: 'welcome_message',
          channel: 'email'
        },
        {
          day: 7,
          action: 'feature_highlight',
          channel: 'in_app'
        },
        {
          day: 14,
          action: 'success_check_in',
          channel: 'call'
        },
        {
          day: 21,
          action: 'value_report',
          channel: 'email'
        },
        {
          day: 30,
          action: 'satisfaction_survey',
          channel: 'email'
        }
      ]
    };
    
    // キャンペーンの作成とスケジューリング
    const created = await this.larkAPI.createEngagementCampaign(campaign);
    
    return {
      success: true,
      campaignId: created.id,
      scheduledTouchpoints: campaign.touchpoints.length,
      duration: campaign.duration
    };
  }

  /**
   * 価値実証
   */
  async executeValueDemonstration(action) {
    // 顧客の使用状況分析
    const usageAnalysis = await this.analyzeCustomerUsage(action.data.customerId);
    
    // 価値レポートの生成
    const valueReport = {
      customerId: action.data.customerId,
      period: 'last_90_days',
      metrics: {
        timeSaved: usageAnalysis.efficiencyGains.timeSaved,
        costReduction: usageAnalysis.efficiencyGains.costReduction,
        productivityIncrease: usageAnalysis.efficiencyGains.productivityIncrease,
        roi: usageAnalysis.roi
      },
      comparisons: {
        vsIndustryAverage: usageAnalysis.benchmarks.industry,
        vsPreviousPeriod: usageAnalysis.benchmarks.historical
      },
      recommendations: usageAnalysis.recommendations
    };
    
    // レポートの送信
    const communication = {
      type: 'value_demonstration',
      format: 'interactive_report',
      data: valueReport,
      presentationOption: true
    };
    
    const sent = await this.larkAPI.sendValueReport(communication);
    
    return {
      success: true,
      reportId: sent.id,
      keyMetrics: valueReport.metrics,
      presentationScheduled: sent.presentationScheduled
    };
  }

  /**
   * リファラルリクエスト
   */
  async executeReferralRequest(action) {
    // リファラルプログラムの詳細
    const referralProgram = {
      customerId: action.data.customerId,
      npsScore: action.data.npsScore,
      incentive: {
        referrer: '3ヶ月間20%割引',
        referee: '初月50%割引'
      },
      materials: {
        emailTemplate: 'referral_promoter',
        landingPage: `${process.env.APP_URL}/referral/${action.data.customerId}`,
        socialAssets: true
      }
    };
    
    // リファラルリクエストの送信
    const request = await this.larkAPI.sendReferralRequest(referralProgram);
    
    return {
      success: true,
      requestId: request.id,
      trackingUrl: referralProgram.materials.landingPage,
      incentiveDetails: referralProgram.incentive
    };
  }

  /**
   * カスタム予防アクション
   */
  async executeCustomPrevention(action) {
    const preventionData = action.data;
    
    // カスタムアクションの実行
    const customAction = {
      type: 'custom',
      action: preventionData.action,
      description: preventionData.description,
      expectedImpact: preventionData.expectedImpact,
      timeline: 'as_specified'
    };
    
    // アクションに応じた実行
    let result;
    if (preventionData.action.includes('オファー')) {
      result = await this.executeRetentionOffer(action);
    } else if (preventionData.action.includes('キャンペーン')) {
      result = await this.executeProactiveEngagement(action);
    } else {
      result = await this.executeGenericAction(action);
    }
    
    return result;
  }

  /**
   * 汎用アクション実行
   */
  async executeGenericAction(action) {
    // 汎用タスクの作成
    const task = {
      title: `アクション実行: ${action.type}`,
      description: `理由: ${action.reason}`,
      priority: action.priority,
      data: action.data,
      createdAt: new Date().toISOString()
    };
    
    const created = await this.larkAPI.createGenericTask(task);
    
    return {
      success: true,
      taskId: created.id,
      type: 'generic_task'
    };
  }

  /**
   * 改善タスクの自動生成
   * @param {Object} analysisData - 分析データ
   * @returns {Array} 生成されたタスク
   */
  async generateImprovementTasks(analysisData) {
    const tasks = [];
    
    // 不満要因に基づくタスク生成
    if (analysisData.topIssues && analysisData.topIssues.length > 0) {
      analysisData.topIssues.forEach(issue => {
        tasks.push({
          title: `改善タスク: ${issue.category}`,
          description: `顧客から${issue.count}件の報告。例: ${issue.examples[0]}`,
          priority: this.calculateTaskPriority(issue),
          assignedTeam: this.determineResponsibleTeam(issue.category),
          dueDate: this.calculateDueDate(issue.severity),
          metrics: {
            targetSatisfactionIncrease: 10,
            affectedCustomers: issue.count
          }
        });
      });
    }
    
    // プロセス改善タスク
    if (analysisData.frictionPoints && analysisData.frictionPoints.length > 0) {
      analysisData.frictionPoints.forEach(friction => {
        tasks.push({
          title: `プロセス改善: ${friction.process}`,
          description: friction.suggestedImprovement,
          priority: 'medium',
          assignedTeam: 'process_improvement',
          dueDate: moment().add(2, 'weeks').toISOString(),
          metrics: {
            targetEffortReduction: 30,
            currentEffortScore: friction.effortScore
          }
        });
      });
    }
    
    return tasks;
  }

  /**
   * 効果測定とレポート
   * @param {string} actionId - アクションID
   * @returns {Object} 効果測定結果
   */
  async measureActionEffectiveness(actionId) {
    // アクション実行前後のデータ取得
    const actionData = await this.getActionData(actionId);
    const beforeMetrics = actionData.baselineMetrics;
    const afterMetrics = await this.getCurrentMetrics(actionData.customerId);
    
    // 効果の計算
    const effectiveness = {
      satisfactionChange: afterMetrics.satisfaction - beforeMetrics.satisfaction,
      npsChange: afterMetrics.nps - beforeMetrics.nps,
      churnRiskChange: afterMetrics.churnRisk - beforeMetrics.churnRisk,
      engagementChange: afterMetrics.engagement - beforeMetrics.engagement
    };
    
    // ROIの計算
    const roi = this.calculateActionROI(actionData, effectiveness);
    
    // レポートの生成
    const report = {
      actionId,
      actionType: actionData.type,
      executedAt: actionData.executedAt,
      effectiveness,
      roi,
      recommendation: this.generateEffectivenessRecommendation(effectiveness, roi)
    };
    
    // レポートの保存
    await this.saveEffectivenessReport(report);
    
    return report;
  }

  // ユーティリティメソッド
  deduplicateActions(actions) {
    const seen = new Set();
    return actions.filter(action => {
      const key = `${action.type}-${action.reason}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  generateActionId() {
    return `ACT-${moment().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  async getAvailableAgent(level) {
    // 利用可能なエージェントの取得
    const agents = await this.larkAPI.getAvailableAgents(level);
    return agents[0]?.id || 'default_agent';
  }

  identifyConcernAreas(data) {
    const concerns = [];
    
    if (data.currentScore < 50) {
      concerns.push('全体的な満足度');
    }
    if (data.npsScore && data.npsScore < 7) {
      concerns.push('推奨意向');
    }
    if (data.churnProbability && data.churnProbability > 0.5) {
      concerns.push('継続利用意向');
    }
    
    return concerns;
  }

  async determineEscalationTarget(level, priority) {
    // エスカレーション先の決定
    const targets = {
      manager: 'team_manager@company.com',
      director: 'service_director@company.com',
      executive: 'ceo@company.com'
    };
    
    return targets[level] || targets.manager;
  }

  generateEscalationAction(action) {
    return {
      required: '即座の対応',
      description: `${action.reason}により緊急対応が必要`,
      suggestedActions: this.getSuggestedActionsForEscalation(action)
    };
  }

  async generatePersonalizedOffer(customerData) {
    // パーソナライズされたオファーの生成
    const ltv = customerData.ltv || 0;
    const churnRisk = customerData.churnProbability || 0.5;
    
    let offer = {
      id: `OFF-${Date.now()}`,
      type: 'retention',
      customerId: customerData.customerId
    };
    
    if (ltv > 100000 && churnRisk > 0.7) {
      offer.discount = 30;
      offer.duration = '6_months';
      offer.additionalBenefits = ['priority_support', 'dedicated_account_manager'];
    } else if (churnRisk > 0.5) {
      offer.discount = 20;
      offer.duration = '3_months';
      offer.additionalBenefits = ['extended_trial_features'];
    } else {
      offer.discount = 15;
      offer.duration = '1_month';
      offer.additionalBenefits = ['bonus_credits'];
    }
    
    return offer;
  }

  async getOfferApproval(offer) {
    // オファーの承認（自動承認ロジック）
    if (offer.discount <= 20) {
      return true;
    }
    
    // 高額割引の場合は承認プロセス
    const approval = await this.larkAPI.requestOfferApproval(offer);
    return approval.approved;
  }

  async getPreferredChannel(customerId) {
    // 顧客の優先チャネル取得
    const preferences = await this.larkAPI.getCustomerPreferences(customerId);
    return preferences.communicationChannel || 'email';
  }

  async executeRecoveryStep(programId, step) {
    // 回復プログラムステップの実行
    const execution = {
      programId,
      step: step.step,
      action: step.action,
      executedAt: new Date().toISOString()
    };
    
    await this.larkAPI.executeRecoveryStep(execution);
  }

  async analyzeCustomerUsage(customerId) {
    // 顧客使用状況の分析（モック）
    return {
      efficiencyGains: {
        timeSaved: '150時間/月',
        costReduction: '¥500,000/月',
        productivityIncrease: '35%'
      },
      roi: 320,
      benchmarks: {
        industry: '+45%',
        historical: '+28%'
      },
      recommendations: [
        '未使用の高度機能の活用',
        'チーム全体への展開'
      ]
    };
  }

  aggregateActionResults(results) {
    const summary = {
      totalActions: results.length,
      successful: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      errors: results.filter(r => r.status === 'error').length,
      byType: {},
      byPriority: {}
    };
    
    // タイプ別集計
    results.forEach(result => {
      if (!summary.byType[result.type]) {
        summary.byType[result.type] = 0;
      }
      summary.byType[result.type]++;
      
      if (!summary.byPriority[result.priority]) {
        summary.byPriority[result.priority] = 0;
      }
      summary.byPriority[result.priority]++;
    });
    
    summary.actions = results;
    
    return summary;
  }

  async saveActionHistory(customerId, summary) {
    // アクション履歴の保存
    const history = {
      customerId,
      executedAt: new Date().toISOString(),
      summary: {
        total: summary.totalActions,
        successful: summary.successful,
        failed: summary.failed
      },
      details: summary.actions
    };
    
    await this.larkAPI.saveActionHistory(history);
  }

  async notifyActionExecution(summary) {
    // アクション実行の通知
    if (summary.failed > 0 || summary.errors > 0) {
      await this.larkAPI.sendAlert({
        type: 'action_execution_issues',
        summary: summary,
        severity: 'medium'
      });
    }
  }

  calculateTaskPriority(issue) {
    if (issue.severity === 'high' || issue.count > 10) return 'high';
    if (issue.severity === 'medium' || issue.count > 5) return 'medium';
    return 'low';
  }

  determineResponsibleTeam(category) {
    const teamMapping = {
      'product': 'product_team',
      'support': 'support_team',
      'billing': 'finance_team',
      'technical': 'engineering_team'
    };
    
    return teamMapping[category] || 'customer_success_team';
  }

  calculateDueDate(severity) {
    const dueDays = {
      'high': 7,
      'medium': 14,
      'low': 30
    };
    
    return moment().add(dueDays[severity] || 14, 'days').toISOString();
  }

  async getActionData(actionId) {
    // アクションデータの取得
    return await this.larkAPI.getActionData(actionId);
  }

  async getCurrentMetrics(customerId) {
    // 現在のメトリクス取得
    const satisfaction = await this.satisfactionMeasurement.calculateSatisfactionScore(
      { id: customerId },
      await this.larkAPI.getCustomerInteractions(customerId)
    );
    
    return {
      satisfaction: satisfaction.scores.integrated,
      nps: satisfaction.scores.nps,
      churnRisk: 0.3, // 仮の値
      engagement: 0.7  // 仮の値
    };
  }

  calculateActionROI(actionData, effectiveness) {
    // アクションのROI計算
    const cost = this.estimateActionCost(actionData);
    const benefit = this.estimateActionBenefit(effectiveness);
    
    return ((benefit - cost) / cost) * 100;
  }

  estimateActionCost(actionData) {
    // アクションコストの見積もり
    const costMap = {
      'immediate_call': 5000,
      'follow_up_email': 500,
      'retention_offer': 10000,
      'proactive_engagement': 3000
    };
    
    return costMap[actionData.type] || 1000;
  }

  estimateActionBenefit(effectiveness) {
    // アクション効果の金銭的価値換算
    let benefit = 0;
    
    // 満足度向上による価値
    if (effectiveness.satisfactionChange > 0) {
      benefit += effectiveness.satisfactionChange * 1000;
    }
    
    // チャーンリスク低減による価値
    if (effectiveness.churnRiskChange < 0) {
      benefit += Math.abs(effectiveness.churnRiskChange) * 50000;
    }
    
    return benefit;
  }

  generateEffectivenessRecommendation(effectiveness, roi) {
    if (roi > 200 && effectiveness.satisfactionChange > 10) {
      return '非常に効果的。同様のケースに適用推奨';
    } else if (roi > 100) {
      return '効果的。継続実施を推奨';
    } else if (roi > 0) {
      return '一定の効果あり。改善の余地あり';
    } else {
      return '効果限定的。アプローチの見直しが必要';
    }
  }

  async saveEffectivenessReport(report) {
    // 効果測定レポートの保存
    await this.larkAPI.saveEffectivenessReport(report);
  }

  getSuggestedActionsForEscalation(action) {
    return [
      '顧客への直接連絡',
      '問題の根本原因分析',
      '改善計画の策定と共有',
      'フォローアップスケジュールの設定'
    ];
  }
}

module.exports = SatisfactionActionEngine;