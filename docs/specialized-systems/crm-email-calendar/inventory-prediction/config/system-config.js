/**
 * 在庫予測システム設定
 * System configuration for inventory prediction
 */

module.exports = {
  // システム基本設定
  system: {
    name: 'Inventory Prediction System',
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
        inventory: 'tbl_inventory',
        transactions: 'tbl_transactions',
        suppliers: 'tbl_suppliers',
        forecasts: 'tbl_forecasts',
        orders: 'tbl_purchase_orders'
      }
    },
    
    // YouTube CRM System
    youtubeCRMBase: {
      appToken: process.env.YOUTUBE_CRM_APP_TOKEN || 'BI4RbpcKxaR7C2sLq9GjXJUjp2b',
      tables: {
        videos: 'tbl_videos',
        analytics: 'tbl_video_analytics',
        contentInventory: 'tbl_content_inventory',
        performance: 'tbl_content_performance'
      }
    }
  },

  // 予測モデル設定
  forecastModels: {
    // 時系列予測
    timeSeries: {
      arima: {
        enabled: true,
        parameters: {
          p: 2,  // 自己回帰次数
          d: 1,  // 差分次数
          q: 2,  // 移動平均次数
          seasonalPeriod: 7  // 週次の季節性
        }
      },
      prophet: {
        enabled: true,
        parameters: {
          changepoint_prior_scale: 0.05,
          seasonality_mode: 'multiplicative',
          yearly_seasonality: true,
          weekly_seasonality: true,
          daily_seasonality: false,
          holidays: 'JP'  // 日本の祝日
        }
      },
      lstm: {
        enabled: true,
        parameters: {
          lookbackDays: 60,
          hiddenLayers: [128, 64, 32],
          dropout: 0.2,
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001
        }
      }
    },
    
    // アンサンブル設定
    ensemble: {
      enabled: true,
      weights: {
        arima: 0.3,
        prophet: 0.4,
        lstm: 0.3
      },
      votingMethod: 'weighted_average'
    }
  },

  // 在庫管理ルール
  inventoryRules: {
    // 安全在庫
    safetyStock: {
      method: 'statistical',  // statistical, fixed, dynamic
      parameters: {
        serviceLevelTarget: 0.95,  // 95%サービスレベル
        leadTimeVariability: 0.2,  // リードタイムの変動係数
        demandVariability: 0.3     // 需要の変動係数
      }
    },
    
    // 発注点
    reorderPoint: {
      method: 'dynamic',
      parameters: {
        leadTimeDays: 7,
        reviewPeriod: 'daily',
        minimumOrderQuantity: 100,
        maximumOrderQuantity: 10000
      }
    },
    
    // アラート閾値
    alertThresholds: {
      stockout: {
        daysAhead: 7,
        probabilityThreshold: 0.8
      },
      overstock: {
        monthsOfSupply: 6,
        valueThreshold: 1000000  // 100万円
      },
      slowMoving: {
        daysSinceLastMovement: 90,
        turnoverRatioThreshold: 0.5
      }
    }
  },

  // 自動発注設定
  autoOrdering: {
    enabled: true,
    
    // 承認ルール
    approvalRules: {
      automatic: {
        maxAmount: 50000,  // 5万円以下
        trustedSuppliers: true,
        historicalPerformance: 0.95
      },
      managerApproval: {
        maxAmount: 200000,  // 20万円以下
        escalationTime: 24  // 24時間
      },
      directorApproval: {
        maxAmount: 1000000,  // 100万円以下
        escalationTime: 48   // 48時間
      }
    },
    
    // サプライヤー選定
    supplierSelection: {
      criteria: {
        price: 0.4,
        quality: 0.3,
        deliveryTime: 0.2,
        reliability: 0.1
      },
      minimumScore: 0.7,
      preferredSupplierBonus: 0.1
    },
    
    // コスト最適化
    costOptimization: {
      consolidateOrders: true,
      volumeDiscountThreshold: 500,
      multiSupplierStrategy: 'balanced'  // balanced, lowest-cost, fastest-delivery
    }
  },

  // YouTube コンテンツ在庫設定
  contentInventory: {
    // コンテンツ鮮度
    freshnessThresholds: {
      fresh: 7,        // 7日以内
      normal: 30,      // 30日以内
      stale: 90,       // 90日以内
      expired: 180     // 180日以上
    },
    
    // パフォーマンス指標
    performanceMetrics: {
      viewsPerDay: {
        excellent: 1000,
        good: 100,
        poor: 10
      },
      engagementRate: {
        excellent: 0.1,   // 10%以上
        good: 0.05,       // 5%以上
        poor: 0.02        // 2%未満
      },
      watchTimeRetention: {
        excellent: 0.7,   // 70%以上
        good: 0.5,        // 50%以上
        poor: 0.3         // 30%未満
      }
    },
    
    // ROI計算
    roiCalculation: {
      productionCosts: {
        basic: 10000,
        standard: 50000,
        premium: 100000
      },
      revenuePerView: {
        ad: 0.003,
        affiliate: 0.01,
        product: 0.05
      },
      maintenanceCostPerMonth: 1000
    },
    
    // 自動アクション
    automatedActions: {
      refreshThreshold: {
        ageInDays: 60,
        performanceDecline: 0.3
      },
      retirementThreshold: {
        ageInDays: 180,
        monthlyViews: 100,
        roi: -0.5
      }
    }
  },

  // データパイプライン設定
  dataPipeline: {
    // データ収集
    collection: {
      pipeCuttingInterval: '*/15 * * * *',  // 15分ごと
      youtubeInterval: '0 */6 * * *',       // 6時間ごと
      externalDataInterval: '0 0 * * *',    // 毎日0時
      retentionDays: 730  // 2年間保持
    },
    
    // データ処理
    processing: {
      cleansingRules: {
        removeOutliers: true,
        outlierThreshold: 3,  // 3σ
        fillMissingValues: 'interpolate',  // interpolate, forward, average
        smoothingWindow: 7
      },
      aggregation: {
        levels: ['hourly', 'daily', 'weekly', 'monthly'],
        metrics: ['sum', 'average', 'min', 'max', 'stddev']
      }
    },
    
    // データ品質
    qualityChecks: {
      completeness: {
        threshold: 0.95,
        action: 'alert'
      },
      accuracy: {
        validationRules: true,
        crossValidation: true
      },
      timeliness: {
        maxDelay: 3600,  // 1時間
        action: 'retry'
      }
    }
  },

  // 通知設定
  notifications: {
    channels: {
      lark: {
        enabled: true,
        webhooks: {
          alerts: process.env.LARK_WEBHOOK_ALERTS,
          reports: process.env.LARK_WEBHOOK_REPORTS
        }
      },
      email: {
        enabled: true,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      }
    },
    
    // アラートルール
    alertRules: {
      stockout: {
        priority: 'high',
        channels: ['lark', 'email'],
        recipients: ['inventory-manager', 'operations-team']
      },
      systemError: {
        priority: 'critical',
        channels: ['lark', 'email'],
        recipients: ['system-admin', 'dev-team']
      },
      forecastAnomaly: {
        priority: 'medium',
        channels: ['lark'],
        recipients: ['data-analyst']
      }
    }
  },

  // セキュリティ設定
  security: {
    authentication: {
      method: 'oauth2',
      tokenExpiry: 3600,
      refreshTokenExpiry: 2592000  // 30日
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotation: true,
      keyRotationInterval: 90  // 90日
    },
    audit: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 365
    }
  },

  // パフォーマンス設定
  performance: {
    cache: {
      enabled: true,
      ttl: {
        forecast: 3600,      // 1時間
        inventory: 300,      // 5分
        analytics: 1800      // 30分
      },
      maxSize: '1GB'
    },
    
    rateLimit: {
      enabled: true,
      window: 60000,  // 1分
      max: 100        // 100リクエスト/分
    },
    
    optimization: {
      parallelProcessing: true,
      maxWorkers: 4,
      batchSize: 1000
    }
  },

  // データベース設定
  database: {
    primary: {
      type: 'postgresql',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      }
    },
    
    cache: {
      type: 'redis',
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0
    }
  },

  // 外部API設定
  externalAPIs: {
    weather: {
      provider: 'openweathermap',
      apiKey: process.env.WEATHER_API_KEY,
      endpoints: {
        forecast: 'https://api.openweathermap.org/data/2.5/forecast'
      }
    },
    
    marketData: {
      provider: 'custom',
      apiKey: process.env.MARKET_DATA_API_KEY,
      endpoints: {
        trends: process.env.MARKET_TRENDS_API_URL
      }
    },
    
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
      endpoints: {
        analytics: 'https://youtubeanalytics.googleapis.com/v2',
        data: 'https://www.googleapis.com/youtube/v3'
      }
    }
  },

  // レポート設定
  reporting: {
    scheduled: {
      daily: {
        enabled: true,
        time: '09:00',
        recipients: ['management-team'],
        format: 'pdf'
      },
      weekly: {
        enabled: true,
        day: 'monday',
        time: '08:00',
        recipients: ['management-team', 'operations-team'],
        format: 'excel'
      },
      monthly: {
        enabled: true,
        day: 1,
        time: '10:00',
        recipients: ['executives'],
        format: 'powerpoint'
      }
    },
    
    templates: {
      inventoryStatus: 'inventory-status-template.hbs',
      forecastAccuracy: 'forecast-accuracy-template.hbs',
      supplierPerformance: 'supplier-performance-template.hbs',
      contentPerformance: 'content-performance-template.hbs'
    }
  }
};