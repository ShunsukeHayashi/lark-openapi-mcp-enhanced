#!/usr/bin/env node

/**
 * Lark Workspace Bot Deployment Script
 * ワークスペース f82jyx0mblu.jp.larksuite.com 専用デプロイメント
 */

const express = require('express');
const crypto = require('crypto');
const { createLarkClient, handleWorkspaceMessage, MESSAGE_TEMPLATES, testWorkspaceIntegration } = require('./lark-workspace-integration');

// Express アプリケーション初期化
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Larkクライアント初期化
let larkClient;

try {
  larkClient = createLarkClient();
  console.log('✅ Lark client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Lark client:', error);
  process.exit(1);
}

// 環境変数確認
const requiredEnvVars = ['APP_ID', 'APP_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('💡 Please set the following environment variables:');
  console.error('   export APP_ID="cli_xxxxxxxxxxxxxxxxx"');
  console.error('   export APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"');
  process.exit(1);
}

// Webhook 署名検証関数
function verifyLarkSignature(req) {
  const signature = req.headers['x-lark-signature'];
  const timestamp = req.headers['x-lark-request-timestamp'];
  const nonce = req.headers['x-lark-request-nonce'];
  
  if (!signature || !timestamp || !nonce) {
    console.warn('⚠️ Missing signature headers');
    return false;
  }
  
  // 開発環境では署名検証をスキップ
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔓 Development mode: skipping signature verification');
    return true;
  }
  
  const encryptKey = process.env.ENCRYPT_KEY || '';
  const body = JSON.stringify(req.body);
  const stringToSign = `${timestamp}${nonce}${encryptKey}${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', encryptKey)
    .update(stringToSign)
    .digest('base64');
  
  return signature === expectedSignature;
}

// メインのWebhookハンドラー
app.post('/webhook', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('\n📥 Webhook received:', {
      timestamp: new Date().toISOString(),
      headers: {
        'x-lark-signature': req.headers['x-lark-signature'] ? '***' : 'missing',
        'x-lark-request-timestamp': req.headers['x-lark-request-timestamp'],
        'x-lark-request-nonce': req.headers['x-lark-request-nonce']
      },
      bodyType: req.body?.type,
      eventType: req.body?.event?.type
    });
    
    // 署名検証
    if (!verifyLarkSignature(req)) {
      console.error('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    
    // Challenge verification (初期設定時のURL検証)
    if (event.type === 'url_verification') {
      console.log('🔗 URL verification request:', event.challenge);
      return res.json({ challenge: event.challenge });
    }
    
    // イベントコールバック処理
    if (event.type === 'event_callback' && event.event) {
      const eventData = event.event;
      
      console.log('📧 Processing event:', {
        type: eventData.type,
        chatId: eventData.message?.chat_id,
        messageType: eventData.message?.message_type,
        senderType: eventData.sender?.sender_type
      });
      
      // メッセージ受信イベント
      if (eventData.type === 'im.message.receive_v1') {
        // ボット自身のメッセージは無視
        if (eventData.sender?.sender_type === 'bot') {
          console.log('🤖 Ignoring bot message');
          return res.json({ success: true });
        }
        
        // メッセージ処理
        await handleWorkspaceMessage(eventData);
      }
      
      // 他のイベントタイプの処理
      else if (eventData.type === 'im.message.message_read_v1') {
        console.log('👁️ Message read event received');
      }
      
      else {
        console.log('ℹ️ Unhandled event type:', eventData.type);
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed successfully in ${processingTime}ms`);
    
    res.json({ success: true, processingTime });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Webhook processing error:', {
      error: error.message,
      stack: error.stack,
      processingTime
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      processingTime
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', async (req, res) => {
  try {
    // Lark API 接続テスト
    const testResponse = await larkClient.auth.tenantAccessToken.internal({
      data: {
        app_id: process.env.APP_ID,
        app_secret: process.env.APP_SECRET
      }
    });
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      larkApi: testResponse.code === 0 ? 'connected' : 'disconnected',
      workspace: 'f82jyx0mblu.jp.larksuite.com'
    };
    
    res.json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// システム情報エンドポイント
app.get('/info', (req, res) => {
  res.json({
    service: 'Lark MCP Chat Agent Bot',
    version: '1.0.0',
    workspace: 'f82jyx0mblu.jp.larksuite.com',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    baseConfig: {
      appToken: 'FXdlb6PpNatocgsv6rcjFmmFpKb',
      tableId: 'tblY8xdYPEmG65ou',
      viewId: 'vewfMxGkiC'
    },
    wikiConfig: {
      nodeToken: 'DgH0w39GMiS2LVkhpsOjdpCDp0g'
    }
  });
});

// メトリクスエンドポイント（Prometheus形式）
app.get('/metrics', (req, res) => {
  const metrics = `
# HELP lark_bot_uptime_seconds Total uptime in seconds
# TYPE lark_bot_uptime_seconds counter
lark_bot_uptime_seconds ${Math.floor(process.uptime())}

# HELP lark_bot_memory_usage_bytes Memory usage in bytes
# TYPE lark_bot_memory_usage_bytes gauge
lark_bot_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}
lark_bot_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}

# HELP lark_bot_version_info Version information
# TYPE lark_bot_version_info gauge
lark_bot_version_info{version="1.0.0",workspace="f82jyx0mblu.jp.larksuite.com"} 1
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// エラーハンドリングミドルウェア
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
  console.log('\n🚀 Lark MCP Chat Agent Bot が起動しました！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server: http://${HOST}:${PORT}`);
  console.log(`🔗 Webhook: http://${HOST}:${PORT}/webhook`);
  console.log(`❤️ Health: http://${HOST}:${PORT}/health`);
  console.log(`📊 Metrics: http://${HOST}:${PORT}/metrics`);
  console.log(`ℹ️ Info: http://${HOST}:${PORT}/info`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏢 Workspace: f82jyx0mblu.jp.larksuite.com`);
  console.log(`📊 Base: FXdlb6PpNatocgsv6rcjFmmFpKb`);
  console.log(`📚 Wiki: DgH0w39GMiS2LVkhpsOjdpCDp0g`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 統合テスト実行
  if (process.env.RUN_TESTS !== 'false') {
    console.log('\n🧪 Running integration tests...');
    try {
      await testWorkspaceIntegration();
      console.log('✅ All integration tests passed!');
    } catch (error) {
      console.error('❌ Integration tests failed:', error.message);
    }
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Lark Developer Console で Webhook URL を設定してください');
  console.log(`   URL: https://your-domain.com/webhook`);
  console.log('2. ボットをグループチャットに追加してください');
  console.log('3. "こんにちは" とメッセージを送信してテストしてください');
  console.log('\n🎉 準備完了！ボットが応答を開始します。');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// 未処理の例外ハンドリング
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;