/**
 * 顧客満足度管理システム設定
 * System configuration for customer satisfaction management
 */

module.exports = {
  // システム基本設定
  system: {
    name: 'Customer Satisfaction Management System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP'
  },

  // Lark API設定
  larkAPI: {
    baseURL: process.env.LARK_API_BASE_URL || 'https://open.larksuite.com',
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET,
    
    // Special Pipe Cutting Management System
    pipeCuttingBase: {
      appToken: process.env.PIPE_CUTTING_APP_TOKEN || 'ZHQebgFrga5TSmsbYM1j2EbWpxg',
      tables: {
        customers: 'tbl_customers',
        interactions: 'tbl_customer_interactions',
        feedback: 'tbl_feedback',
        satisfaction: 'tbl_satisfaction_scores',
        actions: 'tbl_satisfaction_actions'
      }
    },
    
    // YouTube CRM System
    youtubeCRMBase: {
      appToken: process.env.YOUTUBE_CRM_APP_TOKEN || 'BI4RbpcKxaR7C2sLq9GjXJUjp2b',
      tables: {
        viewers: 'tbl_viewers',
        engagement: 'tbl_viewer_engagement',
        comments: 'tbl_comments',
        reactions: 'tbl_video_reactions',
        channelMetrics: 'tbl_channel_metrics'
      }
    }
  },

  // 満足度測定設定
  satisfactionMeasurement: {
    // 評価指標
    metrics: {
      nps: {
        enabled: true,
        scale: [0, 10],
        categories: {
          promoter: [9, 10],
          passive: [7, 8],
          detractor: [0, 6]
        },
        weight: 0.35
      },
      
      csat: {
        enabled: true,
        scale: [1, 5],
        categories: {
          excellent: [4.5, 5],
          good: [3.5, 4.49],
          fair: [2.5, 3.49],
          poor: [1, 2.49]
        },
        weight: 0.30
      },
      
      ces: {
        enabled: true,
        scale: [1, 7],
        categories: {
          veryEasy: [1, 2],
          easy: [2.01, 3],
          neutral: [3.01, 4],
          difficult: [4.01, 5],
          veryDifficult: [5.01, 7]
        },
        weight: 0.20,
        inverted: true  // 低いほど良い
      },
      
      sentiment: {
        enabled: true,
        scale: [-1, 1],
        categories: {
          veryPositive: [0.6, 1],
          positive: [0.2, 0.59],
          neutral: [-0.19, 0.19],
          negative: [-0.59, -0.2],
          veryNegative: [-1, -0.6]
        },
        weight: 0.15
      }
    },
    
    // データ収集チャネル
    channels: {
      email: {
        enabled: true,
        frequency: 'monthly',
        responseRate: 0.25,
        followUpEnabled: true
      },
      inApp: {
        enabled: true,
        triggers: ['transaction', 'support_close', 'milestone'],
        cooldownPeriod: 7  // 7日間
      },
      sms: {
        enabled: false,
        frequency: 'quarterly'
      },
      youtube: {
        enabled: true,
        triggers: ['video_watch', 'channel_subscribe', 'comment'],
        minWatchTime: 60  // 60秒以上視聴
      }
    },
    
    // サンプリング設定
    sampling: {
      method: 'stratified',  // random, stratified, systematic
      rate: 0.3,  // 30%
      minimumResponses: {
        daily: 10,
        weekly: 50,
        monthly: 200
      }
    }
  },

  // チャーン予測設定
  churnPrediction: {
    // モデル設定
    models: {
      primary: 'gradient_boosting',
      ensemble: ['gradient_boosting', 'random_forest', 'neural_network'],
      
      parameters: {
        gradient_boosting: {
          n_estimators: 100,
          max_depth: 5,
          learning_rate: 0.1,
          subsample: 0.8
        },
        random_forest: {
          n_estimators: 200,
          max_depth: 10,
          min_samples_split: 5
        },
        neural_network: {
          layers: [128, 64, 32],
          activation: 'relu',
          dropout: 0.3,
          epochs: 100
        }
      }
    },
    
    // 特徴量設定
    features: {
      behavioral: {
        enabled: true,
        features: [
          'days_since_last_login',
          'login_frequency',
          'usage_duration',
          'feature_adoption_rate',
          'support_tickets_count'
        ],
        weight: 0.3
      },
      
      transactional: {
        enabled: true,
        features: [
          'purchase_frequency',
          'average_order_value',
          'total_lifetime_value',
          'days_since_last_purchase',
          'payment_failure_rate'
        ],
        weight: 0.25
      },
      
      engagement: {
        enabled: true,
        features: [
          'email_open_rate',
          'email_click_rate',
          'content_view_rate',
          'referral_count'
        ],
        weight: 0.25
      },
      
      satisfaction: {
        enabled: true,
        features: [
          'nps_score',
          'csat_score',
          'ces_score',
          'sentiment_score'
        ],
        weight: 0.2
      }
    },
    
    // 予測設定
    prediction: {
      horizons: {
        immediate: 7,
        short: 30,
        medium: 90,
        long: 180
      },
      
      riskLevels: {
        critical: 0.8,
        high: 0.6,
        medium: 0.4,
        low: 0.2
      },
      
      confidenceThreshold: 0.7,
      updateFrequency: 'daily'
    }
  },

  // アクション自動化設定
  actionAutomation: {
    // アクションルール
    rules: {
      satisfaction: {
        triggers: {
          critical: { score: 30, actions: ['immediate_call', 'escalate'] },
          low: { score: 50, actions: ['follow_up', 'survey'] },
          declining: { change: -10, actions: ['check_in', 'recovery'] },
          improving: { change: 10, actions: ['reinforce', 'upsell'] }
        }
      },
      
      nps: {
        triggers: {
          detractor: { score: [0, 6], actions: ['recovery', 'feedback'] },
          passive: { score: [7, 8], actions: ['engage', 'educate'] },
          promoter: { score: [9, 10], actions: ['referral', 'advocate'] }
        }
      },
      
      churn: {
        triggers: {
          critical: { probability: 0.8, actions: ['retention_call', 'offer'] },
          high: { probability: 0.6, actions: ['proactive', 'value_demo'] },
          medium: { probability: 0.4, actions: ['check_in', 'educate'] }
        }
      }
    },
    
    // アクションテンプレート
    templates: {
      immediate_call: {
        type: 'task',
        priority: 'urgent',
        sla: '2 hours',
        assignTo: 'senior_csm'
      },
      
      follow_up: {
        type: 'email',
        delay: '24 hours',
        template: 'satisfaction_followup'
      },
      
      retention_offer: {
        type: 'campaign',
        approval: 'required',
        maxDiscount: 0.3
      }
    },
    
    // エスカレーション
    escalation: {
      levels: ['support', 'manager', 'director', 'executive'],
      
      thresholds: {
        support: { satisfaction: 50, churn: 0.4, value: 10000 },
        manager: { satisfaction: 30, churn: 0.6, value: 50000 },
        director: { satisfaction: 20, churn: 0.8, value: 100000 },
        executive: { satisfaction: 10, churn: 0.9, value: 500000 }
      },
      
      timeouts: {
        support: '4 hours',
        manager: '24 hours',
        director: '48 hours',
        executive: '72 hours'
      }
    }
  },

  // 感情分析設定
  sentimentAnalysis: {
    // NLPプロバイダー
    provider: {
      primary: 'google_nlp',
      fallback: 'local_model',
      
      google_nlp: {
        apiKey: process.env.GOOGLE_NLP_API_KEY,
        endpoint: 'https://language.googleapis.com/v1',
        features: ['sentiment', 'entities', 'syntax']
      },
      
      local_model: {
        model: 'japanese_sentiment_bert',
        threshold: 0.5
      }
    },
    
    // 分析対象
    sources: {
      feedback: {
        enabled: true,
        fields: ['comment', 'suggestion', 'complaint']
      },
      
      support: {
        enabled: true,
        fields: ['ticket_description', 'chat_transcript']
      },
      
      youtube: {
        enabled: true,
        fields: ['comment_text', 'video_description']
      },
      
      social: {
        enabled: false,
        platforms: ['twitter', 'facebook']
      }
    },
    
    // 感情カテゴリー
    categories: {
      emotions: ['happy', 'sad', 'angry', 'surprised', 'neutral'],
      
      topics: {
        product: ['品質', '機能', 'パフォーマンス'],
        service: ['サポート', '対応', 'スピード'],
        price: ['価格', 'コスト', '価値'],
        general: ['全体', 'その他']
      }
    }
  },

  // レポート・ダッシュボード設定
  reporting: {
    // ダッシュボード
    dashboards: {
      executive: {
        widgets: ['overall_satisfaction', 'nps_trend', 'churn_risk', 'roi'],
        refreshInterval: 300000  // 5分
      },
      
      operational: {
        widgets: ['real_time_alerts', 'action_queue', 'segment_analysis'],
        refreshInterval: 60000   // 1分
      },
      
      analytical: {
        widgets: ['cohort_analysis', 'prediction_accuracy', 'impact_factors'],
        refreshInterval: 3600000  // 1時間
      }
    },
    
    // 定期レポート
    scheduled: {
      daily: {
        enabled: true,
        time: '09:00',
        recipients: ['cs_team'],
        content: ['alerts', 'actions', 'metrics']
      },
      
      weekly: {
        enabled: true,
        day: 'monday',
        time: '08:00',
        recipients: ['management'],
        content: ['summary', 'trends', 'recommendations']
      },
      
      monthly: {
        enabled: true,
        day: 1,
        time: '10:00',
        recipients: ['executives'],
        content: ['overview', 'analysis', 'roi', 'forecast']
      }
    }
  },

  // 統合設定
  integrations: {
    // 在庫システム連携
    inventory: {
      enabled: true,
      correlations: {
        stockout_satisfaction: true,
        delivery_time_nps: true,
        product_quality_sentiment: true
      },
      
      triggers: {
        low_stock_notification: {
          threshold: 0.2,
          impact: 'satisfaction'
        }
      }
    },
    
    // YouTubeアナリティクス連携
    youtube: {
      enabled: true,
      metrics: {
        watch_time: 'engagement',
        like_ratio: 'satisfaction',
        subscriber_growth: 'loyalty'
      },
      
      contentMapping: {
        tutorial: 'support_reduction',
        product_demo: 'sales_enablement',
        testimonial: 'social_proof'
      }
    },
    
    // CRM連携
    crm: {
      enabled: true,
      sync: {
        frequency: 'real_time',
        fields: ['contact', 'activity', 'opportunity']
      },
      
      enrichment: {
        demographic: true,
        firmographic: true,
        behavioral: true
      }
    }
  },

  // パフォーマンス最適化
  performance: {
    // キャッシュ設定
    cache: {
      enabled: true,
      
      ttl: {
        satisfaction_scores: 300,    // 5分
        predictions: 3600,           // 1時間
        analytics: 1800,             // 30分
        dashboards: 60               // 1分
      },
      
      strategy: 'lru',  // least recently used
      maxSize: '2GB'
    },
    
    // バッチ処理
    batch: {
      prediction: {
        size: 1000,
        parallel: 4,
        schedule: '0 2 * * *'  // 毎日2時
      },
      
      scoring: {
        size: 500,
        parallel: 2,
        schedule: '*/30 * * * *'  // 30分ごと
      }
    },
    
    // リアルタイム処理
    realtime: {
      enabled: true,
      
      streams: {
        feedback: {
          buffer: 100,
          window: '1 minute'
        },
        
        alerts: {
          buffer: 50,
          window: '30 seconds'
        }
      }
    }
  },

  // データプライバシー
  privacy: {
    // 個人情報保護
    pii: {
      encryption: true,
      fields: ['name', 'email', 'phone', 'address'],
      
      anonymization: {
        method: 'hash',
        salt: process.env.ANONYMIZATION_SALT
      },
      
      retention: {
        active: 730,    // 2年
        inactive: 365,  // 1年
        deleted: 30     // 30日
      }
    },
    
    // 同意管理
    consent: {
      required: ['data_collection', 'analytics', 'marketing'],
      
      defaults: {
        data_collection: true,
        analytics: true,
        marketing: false
      },
      
      audit: true
    }
  },

  // 通知設定
  notifications: {
    // チャネル設定
    channels: {
      lark: {
        enabled: true,
        
        webhooks: {
          alerts: process.env.LARK_WEBHOOK_ALERTS,
          actions: process.env.LARK_WEBHOOK_ACTIONS,
          reports: process.env.LARK_WEBHOOK_REPORTS
        },
        
        formatting: 'rich'  // plain, rich, card
      },
      
      email: {
        enabled: true,
        
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        
        templates: {
          path: './templates/email',
          engine: 'handlebars'
        }
      },
      
      sms: {
        enabled: false,
        provider: 'twilio'
      }
    },
    
    // 通知ルール
    rules: {
      critical_alert: {
        channels: ['lark', 'email', 'sms'],
        recipients: ['on_call', 'manager'],
        cooldown: 0
      },
      
      action_required: {
        channels: ['lark', 'email'],
        recipients: ['assigned_user'],
        cooldown: 3600  // 1時間
      },
      
      report: {
        channels: ['email'],
        recipients: ['subscriber_list'],
        cooldown: 86400  // 24時間
      }
    }
  },

  // 監視・ロギング
  monitoring: {
    // メトリクス
    metrics: {
      enabled: true,
      
      collectors: {
        system: ['cpu', 'memory', 'disk', 'network'],
        application: ['requests', 'errors', 'latency', 'throughput'],
        business: ['satisfaction', 'actions', 'predictions']
      },
      
      export: {
        provider: 'prometheus',
        endpoint: '/metrics',
        interval: 60000  // 1分
      }
    },
    
    // ロギング
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      
      outputs: {
        console: true,
        file: {
          enabled: true,
          path: './logs',
          rotation: 'daily',
          maxFiles: 30
        },
        
        remote: {
          enabled: false,
          provider: 'elasticsearch'
        }
      },
      
      format: 'json'
    },
    
    // アラート
    alerting: {
      enabled: true,
      
      rules: {
        error_rate: {
          threshold: 0.05,  // 5%
          window: '5 minutes',
          severity: 'warning'
        },
        
        response_time: {
          threshold: 1000,  // 1秒
          window: '1 minute',
          severity: 'critical'
        },
        
        satisfaction_drop: {
          threshold: -5,    // 5%低下
          window: '1 hour',
          severity: 'warning'
        }
      }
    }
  }
};