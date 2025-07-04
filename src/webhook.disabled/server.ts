import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { 
  handleWebhookValidation, 
  handleBatchFieldShortcut 
} from './field-shortcut-handler';

// Express アプリケーションの作成
export function createWebhookServer() {
  const app = express();
  
  // ミドルウェア設定
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // ヘルスチェックエンドポイント
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'mobi-lark-webhook',
      timestamp: new Date().toISOString()
    });
  });
  
  // Lark Base フィールドショートカット Webhook エンドポイント
  app.post('/webhook/field-shortcut', handleWebhookValidation);
  
  // バッチ処理用エンドポイント
  app.post('/webhook/batch-process', handleBatchFieldShortcut);
  
  // エラーハンドリング
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });
  
  return app;
}

// サーバー起動
export function startWebhookServer(port: number = 3001) {
  const app = createWebhookServer();
  
  app.listen(port, () => {
    console.log(`Mobi-Lark Webhook Server started on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Webhook endpoint: http://localhost:${port}/webhook/field-shortcut`);
    console.log(`Batch endpoint: http://localhost:${port}/webhook/batch-process`);
  });
  
  // グレースフルシャットダウン
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
  });
}

// CLIから起動された場合
if (require.main === module) {
  const port = parseInt(process.env.WEBHOOK_PORT || '3001', 10);
  startWebhookServer(port);
}