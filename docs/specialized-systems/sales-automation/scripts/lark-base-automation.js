/**
 * Lark Base 営業自動化スクリプト
 * YouTube CRM システム用の自動化ルール実装
 */

const { Base, Field, Record, Automation } = require('@larksuite/base-sdk');

class SalesAutomation {
  constructor(baseId, appId, appSecret) {
    this.baseId = baseId;
    this.appId = appId;
    this.appSecret = appSecret;
    this.base = null;
  }

  /**
   * 初期化
   */
  async initialize() {
    try {
      this.base = await Base.init({
        baseId: this.baseId,
        appId: this.appId,
        appSecret: this.appSecret
      });
      console.log('Lark Base 接続成功');
    } catch (error) {
      console.error('初期化エラー:', error);
      throw error;
    }
  }

  /**
   * 商談フォローアップルールの設定
   */
  async setupDealFollowUpRules() {
    const automation = new Automation(this.base);
    
    // 新規商談初回連絡ルール
    await automation.createRule({
      name: '新規商談初回連絡',
      trigger: {
        type: 'record_created',
        table: '商談管理',
        conditions: [
          {
            field: 'ステージ',
            operator: 'equals',
            value: '新規'
          }
        ]
      },
      actions: [
        {
          type: 'create_task',
          config: {
            title: '【初回連絡】{{商談名}}への連絡',
            assignee: '{{担当者}}',
            dueDate: 'today + 3 days',
            priority: '高'
          }
        },
        {
          type: 'send_notification',
          config: {
            recipient: '{{担当者}}',
            message: '新規商談が作成されました。3日以内に初回連絡をお願いします。'
          }
        }
      ]
    });

    // 提案後フォローアップルール
    await automation.createRule({
      name: '提案後フォローアップ',
      trigger: {
        type: 'scheduled',
        schedule: 'daily at 09:00',
        conditions: [
          {
            field: 'ステージ',
            operator: 'equals',
            value: '提案'
          },
          {
            field: '最終活動日',
            operator: 'days_ago',
            value: 7
          }
        ]
      },
      actions: [
        {
          type: 'create_task',
          config: {
            title: '【要フォロー】{{商談名}}の検討状況確認',
            description: '提案から7日経過しました。検討状況を確認してください。',
            assignee: '{{担当者}}',
            dueDate: 'today + 1 day',
            priority: '高'
          }
        }
      ]
    });

    console.log('商談フォローアップルール設定完了');
  }

  /**
   * 顧客接触管理ルールの設定
   */
  async setupCustomerTouchpointRules() {
    const automation = new Automation(this.base);

    // 定期フォロー通知
    await automation.createRule({
      name: '定期フォロー通知',
      trigger: {
        type: 'scheduled',
        schedule: 'daily at 10:00',
        conditions: [
          {
            field: '最終接触日',
            operator: 'days_ago',
            value: 30
          },
          {
            field: '顧客ステータス',
            operator: 'equals',
            value: 'アクティブ'
          }
        ]
      },
      actions: [
        {
          type: 'create_task',
          config: {
            title: '【定期接触】{{顧客名}}へのフォローアップ',
            description: '30日間接触がありません。フォローアップをお願いします。',
            assignee: '{{担当者}}',
            dueDate: 'today + 3 days'
          }
        }
      ]
    });

    // VIP顧客管理
    await automation.createRule({
      name: 'VIP顧客接触確認',
      trigger: {
        type: 'scheduled',
        schedule: 'weekly on Monday at 09:00',
        conditions: [
          {
            field: '顧客ランク',
            operator: 'equals',
            value: 'VIP'
          },
          {
            field: '最終接触日',
            operator: 'days_ago',
            value: 14
          }
        ]
      },
      actions: [
        {
          type: 'create_task',
          config: {
            title: '【VIP】{{顧客名}}への定期接触',
            priority: '高',
            assignee: '{{担当者}}'
          }
        }
      ]
    });

    console.log('顧客接触管理ルール設定完了');
  }

  /**
   * YouTube動画フォローアップの設定
   */
  async setupYouTubeFollowUp() {
    const automation = new Automation(this.base);

    await automation.createRule({
      name: 'YouTube動画送付後フォロー',
      trigger: {
        type: 'activity_logged',
        activityType: 'YouTube動画送付'
      },
      actions: [
        {
          type: 'schedule_task',
          config: {
            delay: '3 days',
            task: {
              title: '【視聴確認】{{顧客名}}へのYouTube動画フォロー',
              description: `送付した動画について確認してください：
- 動画タイトル: {{動画タイトル}}
- 視聴状況の確認
- 内容についての感想ヒアリング`,
              assignee: '{{担当者}}'
            }
          }
        },
        {
          type: 'track_metric',
          config: {
            metric: 'youtube_engagement',
            videoId: '{{動画ID}}'
          }
        }
      ]
    });

    console.log('YouTube動画フォローアップ設定完了');
  }

  /**
   * カスタムフィールドの作成
   */
  async createCustomFields() {
    const table = await this.base.getTable('商談管理');

    // リスクフラグフィールド
    await table.addField({
      name: 'リスクフラグ',
      type: 'SingleSelect',
      options: [
        { name: '低', color: 'green' },
        { name: '中', color: 'yellow' },
        { name: '高', color: 'red' }
      ]
    });

    // YouTube効果スコア
    await table.addField({
      name: 'YouTube効果スコア',
      type: 'Number',
      format: {
        precision: 2
      }
    });

    // 関係性スコア
    await table.addField({
      name: '関係性スコア',
      type: 'Formula',
      formula: `
        (DAYS(TODAY(), {最終接触日}) * -0.5) +
        ({活動回数} * 2) +
        ({YouTube視聴回数} * 3) +
        ({成約金額} / 1000000)
      `
    });

    console.log('カスタムフィールド作成完了');
  }

  /**
   * ビューの作成
   */
  async createViews() {
    const table = await this.base.getTable('商談管理');

    // 要注意商談ビュー
    await table.createView({
      name: '要注意商談',
      type: 'Grid',
      filter: {
        conjunction: 'OR',
        conditions: [
          {
            field: 'リスクフラグ',
            operator: 'equals',
            value: '高'
          },
          {
            field: '最終活動日',
            operator: 'days_ago',
            value: 14
          }
        ]
      },
      sort: [
        {
          field: '予想金額',
          order: 'desc'
        }
      ]
    });

    // 今週のフォローアップビュー
    await table.createView({
      name: '今週のフォローアップ',
      type: 'Kanban',
      groupBy: 'ステージ',
      filter: {
        field: 'フォローアップ予定日',
        operator: 'this_week'
      }
    });

    console.log('ビュー作成完了');
  }

  /**
   * ダッシュボードの設定
   */
  async setupDashboard() {
    const dashboard = await this.base.createDashboard({
      name: '営業ダッシュボード'
    });

    // 売上推移チャート
    await dashboard.addChart({
      type: 'line',
      title: '月次売上推移',
      dataSource: '商談管理',
      xAxis: '成約日',
      yAxis: '成約金額',
      aggregation: 'sum',
      groupBy: 'month'
    });

    // パイプラインファネル
    await dashboard.addChart({
      type: 'funnel',
      title: 'パイプライン状況',
      dataSource: '商談管理',
      stages: ['リード', '商談化', '提案', '交渉', '成約'],
      valueField: '予想金額'
    });

    // YouTube効果分析
    await dashboard.addChart({
      type: 'scatter',
      title: 'YouTube動画効果',
      dataSource: '活動履歴',
      xAxis: 'YouTube視聴回数',
      yAxis: '成約確率',
      sizeField: '商談金額'
    });

    console.log('ダッシュボード設定完了');
  }

  /**
   * 通知テンプレートの設定
   */
  async setupNotificationTemplates() {
    const templates = [
      {
        id: 'new_deal_notification',
        name: '新規商談通知',
        channels: ['lark', 'email'],
        template: {
          title: '新規商談: {{商談名}}',
          body: `新規商談が作成されました。
顧客: {{顧客名}}
予想金額: {{予想金額}}
担当者: {{担当者}}

3日以内に初回連絡をお願いします。`,
          priority: 'normal'
        }
      },
      {
        id: 'escalation_notification',
        name: 'エスカレーション通知',
        channels: ['lark', 'slack'],
        template: {
          title: '【緊急】商談の対応が必要です',
          body: `以下の商談で緊急対応が必要です：
商談名: {{商談名}}
問題: {{問題内容}}
推奨対応: {{推奨対応}}`,
          priority: 'urgent',
          mentions: ['{{マネージャー}}']
        }
      }
    ];

    for (const template of templates) {
      await this.base.createNotificationTemplate(template);
    }

    console.log('通知テンプレート設定完了');
  }

  /**
   * 実行
   */
  async run() {
    try {
      await this.initialize();
      await this.createCustomFields();
      await this.setupDealFollowUpRules();
      await this.setupCustomerTouchpointRules();
      await this.setupYouTubeFollowUp();
      await this.createViews();
      await this.setupDashboard();
      await this.setupNotificationTemplates();
      
      console.log('すべての自動化設定が完了しました！');
    } catch (error) {
      console.error('実行エラー:', error);
    }
  }
}

// 実行
if (require.main === module) {
  const automation = new SalesAutomation(
    process.env.LARK_BASE_ID || 'BI4RbpcKxaR7C2sLq9GjXJUjp2b',
    process.env.LARK_APP_ID,
    process.env.LARK_APP_SECRET
  );
  
  automation.run();
}

module.exports = SalesAutomation;