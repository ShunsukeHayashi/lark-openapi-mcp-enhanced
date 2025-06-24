# Lark Server Bot Deployment Guide - Chat Agent System

**目的**: Lark Developer Console を使ってChat Agent SystemをLarkサーバーボットとしてデプロイする  
**対象**: DevOps, システム管理者, 開発者  
**最終更新**: 2025-06-24

## 🚀 概要

このガイドでは、開発したChat Agent SystemをLark Developer Console経由でサーバーボットとしてデプロイする手順を説明します。

### デプロイオプション
1. **サーバーボット (推奨)** - Lark Developer Console で作成、高機能
2. **カスタムボット** - グループチャットで直接作成、簡易版

## 📋 事前準備

### 必要なもの
- Lark Developer Console アカウント
- HTTPS エンドポイント (ボット本体をホスト)
- ドメイン名またはパブリックIP
- SSL証明書

### システム要件
- Node.js ≥16.20.0
- メモリ: 4GB以上推奨
- CPU: 2コア以上推奨
- ネットワーク: 安定したインターネット接続

## 🏗️ Step 1: Lark Developer Console でアプリケーション作成

### 1.1 Developer Console アクセス
```
1. https://open.larksuite.com にアクセス
2. 右上の「Developer Console」をクリック
3. Lark アカウントでログイン
```

### 1.2 新しいアプリケーション作成
```
1. Developer Console で「Create App」をクリック
2. アプリケーション情報を入力:
   - App Name: "MCP Chat Agent"
   - Description: "Intelligent AI assistant for Lark integration"
   - App Icon: アプリケーションアイコンをアップロード
3. 「Create」をクリック
```

### 1.3 App ID と App Secret を取得
```
作成後、以下の情報をメモ:
- App ID: cli_xxxxxxxxxxxxxxxxx
- App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔧 Step 2: ボット機能の設定

### 2.1 ボット機能を有効化
```
1. アプリ設定画面で「Bot」タブを選択
2. 「Enable Bot」をクリック
3. ボット設定:
   - Bot Name: "AI Assistant"
   - Description: "Your intelligent AI assistant powered by MCP"
   - Bot Avatar: ボットアイコンをアップロード
```

### 2.2 メッセージ処理設定
```
1. 「Message & Events」タブを選択
2. 「Event Subscriptions」を有効化
3. Request URL を設定: https://your-domain.com/webhook
4. 「Events」で以下を選択:
   - im.message.receive_v1 (メッセージ受信)
   - im.message.message_read_v1 (メッセージ既読)
```

## 🔑 Step 3: 権限設定

### 3.1 必要な権限を設定
```
「Permissions & Scopes」タブで以下の権限を追加:

📧 Messaging:
- im:message (メッセージ送受信)
- im:message:send_as_bot (ボットとしてメッセージ送信)
- im:chat (チャット管理)

👥 Contact:
- contact:user.base:readonly (ユーザー基本情報)
- contact:user.id:readonly (ユーザーID取得)

📊 Bitable:
- bitable:app (Base アプリケーション)
- bitable:app:readonly (Base 読み取り)

📄 Drive:
- drive:drive (ドライブアクセス)
- docs:doc (ドキュメントアクセス)
```

### 3.2 リクエスト権限を送信
```
1. すべての必要な権限を選択
2. 「Save」をクリック
3. 「Request Approval」で管理者に承認を依頼
```

## 🌐 Step 4: サーバー環境の準備

### 4.1 HTTPS エンドポイントの設定

#### Option A: Nginx + Let's Encrypt
```bash
# Nginx インストール
sudo apt update
sudo apt install nginx

# Let's Encrypt SSL証明書取得
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Nginx 設定
sudo nano /etc/nginx/sites-available/lark-bot
```

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

#### Option B: Docker + Traefik
```yaml
# docker-compose.yml
version: '3.8'

services:
  lark-chat-agent:
    build: .
    container_name: lark-bot
    environment:
      - APP_ID=${APP_ID}
      - APP_SECRET=${APP_SECRET}
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.lark-bot.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.lark-bot.tls.certresolver=letsencrypt"
      - "traefik.http.services.lark-bot.loadbalancer.server.port=3000"
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true
```

### 4.2 環境変数設定
```bash
# .env ファイル作成
cat > .env << EOF
# Lark App 設定
APP_ID=cli_xxxxxxxxxxxxxxxxx
APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# サーバー設定
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Bot 設定
BOT_NAME=AI Assistant
DEFAULT_LANGUAGE=ja
WEBHOOK_PATH=/webhook

# ログ設定
LOG_LEVEL=info
LOG_FILE=/var/log/lark-bot/app.log
EOF
```

## 🚀 Step 5: Chat Agent システムのデプロイ

### 5.1 アプリケーションのビルド
```bash
# プロジェクトディレクトリに移動
cd /path/to/lark-openapi-mcp

# 依存関係インストール
yarn install --production

# TypeScript ビルド
yarn build

# 本番用ディレクトリに移動
sudo mkdir -p /opt/lark-bot
sudo cp -r dist/ package.json yarn.lock .env /opt/lark-bot/
cd /opt/lark-bot
```

### 5.2 Lark Webhook ハンドラーの作成
```typescript
// webhook-server.ts
import express from 'express';
import crypto from 'crypto';
import { Agent, AgentRunner } from './dist/agents/agent';
import { getOrCreateAgent } from './dist/mcp-tool/tools/en/builtin-tools/system/lark-chat-agent';

const app = express();
app.use(express.json());

// Lark SDK 初期化
import { Client } from '@larksuiteoapi/node-sdk';

const client = new Client({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
  domain: 'larksuite.com' // または 'feishu.cn'
});

// Webhook 署名検証
function verifyLarkSignature(req: express.Request): boolean {
  const signature = req.headers['x-lark-signature'] as string;
  const timestamp = req.headers['x-lark-request-timestamp'] as string;
  const nonce = req.headers['x-lark-request-nonce'] as string;
  
  if (!signature || !timestamp || !nonce) return false;
  
  const body = JSON.stringify(req.body);
  const stringToSign = `${timestamp}${nonce}${process.env.ENCRYPT_KEY || ''}${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.ENCRYPT_KEY || '')
    .update(stringToSign)
    .digest('base64');
  
  return signature === expectedSignature;
}

// メインの Webhook ハンドラー
app.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    
    // 署名検証 (本番環境では必須)
    if (process.env.NODE_ENV === 'production' && !verifyLarkSignature(req)) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const event = req.body;
    
    // Challenge verification (初期設定時)
    if (event.type === 'url_verification') {
      return res.json({ challenge: event.challenge });
    }
    
    // メッセージイベント処理
    if (event.type === 'event_callback' && event.event) {
      await handleMessageEvent(event.event);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// メッセージイベントハンドラー
async function handleMessageEvent(event: any) {
  if (event.type !== 'im.message.receive_v1') return;
  
  const message = event.message;
  const sender = event.sender;
  
  // ボット自身のメッセージは無視
  if (sender.sender_type === 'bot') return;
  
  console.log(`Processing message: ${message.content?.text || 'No text'}`);
  
  try {
    // Chat Agent 取得
    const agent = await getOrCreateAgent('LarkAssistant', 'ja', client);
    
    // メッセージ処理
    const result = await AgentRunner.runWithLarkClient(
      agent,
      message.content?.text || '',
      message.chat_id,
      client,
      sender.sender_id?.user_id
    );
    
    console.log('Agent response:', result.success ? 'Success' : 'Failed');
    
    // エラーハンドリング
    if (!result.success) {
      await client.im.message.create({
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: message.chat_id,
          msg_type: 'text',
          content: JSON.stringify({
            text: '申し訳ございません。エラーが発生しました。しばらく後でもう一度お試しください。'
          })
        }
      });
    }
    
  } catch (error) {
    console.error('Message processing error:', error);
    
    // エラー通知
    await client.im.message.create({
      params: { receive_id_type: 'chat_id' },
      data: {
        receive_id: message.chat_id,
        msg_type: 'text',
        content: JSON.stringify({
          text: 'システムエラーが発生しました。管理者にお問い合わせください。'
        })
      }
    });
  }
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Lark Bot server running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
});
```

### 5.3 systemd サービス設定
```bash
# systemd サービスファイル作成
sudo nano /etc/systemd/system/lark-bot.service
```

```ini
[Unit]
Description=Lark MCP Chat Agent Bot
After=network.target

[Service]
Type=simple
User=lark-bot
WorkingDirectory=/opt/lark-bot
ExecStart=/usr/bin/node webhook-server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/lark-bot/.env

# ログ設定
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lark-bot

# セキュリティ設定
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lark-bot/logs

[Install]
WantedBy=multi-user.target
```

```bash
# サービス有効化と起動
sudo systemctl daemon-reload
sudo systemctl enable lark-bot
sudo systemctl start lark-bot

# ステータス確認
sudo systemctl status lark-bot
```

## 🧪 Step 6: テストとデバッグ

### 6.1 ローカルテスト
```bash
# Webhook テスト用 ngrok (開発時のみ)
npx ngrok http 3000

# Test payload
curl -X POST https://your-ngrok-url.ngrok.io/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url_verification",
    "challenge": "test_challenge"
  }'
```

### 6.2 Lark Developer Console で動作確認
```
1. Developer Console → 你的应用 → Event Subscriptions
2. Request URL に本番URLを入力: https://your-domain.com/webhook
3. 「Save」をクリックして接続テスト
4. 「Verified」と表示されれば成功
```

### 6.3 実際のメッセージテスト
```
1. Lark アプリで新しいグループチャットを作成
2. ボットをグループに追加:
   - グループ設定 → Members → Add Member
   - 作成したボットを検索して追加
3. メッセージを送信してレスポンスを確認:
   - "こんにちは"
   - "help"
   - "顧客データを検索して"
```

## 📊 Step 7: 監視とログ

### 7.1 ログ監視
```bash
# リアルタイムログ確認
sudo journalctl -u lark-bot -f

# エラーログのみ
sudo journalctl -u lark-bot -p err

# 過去24時間のログ
sudo journalctl -u lark-bot --since "24 hours ago"
```

### 7.2 パフォーマンス監視
```typescript
// metrics.ts - Prometheus メトリクス
import prometheus from 'prom-client';

export const messageCounter = new prometheus.Counter({
  name: 'lark_bot_messages_total',
  help: 'Total number of messages processed',
  labelNames: ['status', 'message_type']
});

export const responseTime = new prometheus.Histogram({
  name: 'lark_bot_response_time_seconds',
  help: 'Response time in seconds',
  labelNames: ['agent_type']
});

// メトリクスエンドポイント
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

## 🔧 Step 8: 本番運用設定

### 8.1 自動バックアップ
```bash
# 日次バックアップスクリプト
cat > /opt/lark-bot/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/lark-bot/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# 設定ファイルバックアップ
cp -r /opt/lark-bot/.env $BACKUP_DIR/
cp -r /opt/lark-bot/config/ $BACKUP_DIR/ 2>/dev/null || true

# ログバックアップ
sudo journalctl -u lark-bot --since "24 hours ago" > $BACKUP_DIR/app.log

# 古いバックアップ削除 (7日以上)
find /backup/lark-bot -name "202*" -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /opt/lark-bot/backup.sh

# crontab に追加
echo "0 2 * * * /opt/lark-bot/backup.sh" | sudo crontab -
```

### 8.2 アラート設定
```bash
# Webhook によるアラート通知
cat > /opt/lark-bot/alert.sh << 'EOF'
#!/bin/bash
SERVICE_STATUS=$(systemctl is-active lark-bot)

if [ "$SERVICE_STATUS" != "active" ]; then
    curl -X POST "https://your-monitoring-webhook.com/alert" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"🚨 Lark Bot service is down: $SERVICE_STATUS\"}"
fi
EOF

chmod +x /opt/lark-bot/alert.sh

# 5分間隔でチェック
echo "*/5 * * * * /opt/lark-bot/alert.sh" | sudo crontab -
```

## 🚀 Step 9: 高可用性設定 (オプション)

### 9.1 ロードバランサー設定
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  lark-bot-1:
    build: .
    environment:
      - APP_ID=${APP_ID}
      - APP_SECRET=${APP_SECRET}
      - NODE_ENV=production
      - INSTANCE_ID=bot-1

  lark-bot-2:
    build: .
    environment:
      - APP_ID=${APP_ID}
      - APP_SECRET=${APP_SECRET}
      - NODE_ENV=production
      - INSTANCE_ID=bot-2

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    depends_on:
      - lark-bot-1
      - lark-bot-2
```

### 9.2 Redis によるセッション共有
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// 会話コンテキストをRedisに保存
async function saveConversationContext(userId: string, context: any) {
  await redis.setex(`conversation:${userId}`, 3600, JSON.stringify(context));
}

async function getConversationContext(userId: string) {
  const data = await redis.get(`conversation:${userId}`);
  return data ? JSON.parse(data) : null;
}
```

## 📋 Step 10: セキュリティ強化

### 10.1 ファイアウォール設定
```bash
# UFW でポート制限
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # Node.js ポートは直接アクセス禁止
sudo ufw enable
```

### 10.2 SSL 設定強化
```nginx
# Nginx SSL 強化設定
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000" always;

# その他のセキュリティヘッダー
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## 🎉 完了！

### ✅ デプロイ完了チェックリスト
- [ ] Lark Developer Console でアプリ作成完了
- [ ] 必要な権限設定完了
- [ ] HTTPS エンドポイント設定完了
- [ ] Webhook URL 設定と検証完了
- [ ] Chat Agent システムデプロイ完了
- [ ] 実際のメッセージテスト成功
- [ ] ログ監視設定完了
- [ ] バックアップ設定完了

### 🎯 次のステップ
1. **ユーザートレーニング**: ボットの使い方をチームに説明
2. **パフォーマンス最適化**: レスポンス時間の最適化
3. **機能拡張**: カスタムツールの追加
4. **分析設定**: 利用状況の分析とレポート

**🚀 おめでとうございます！Lark Chat Agent ボットが正常にデプロイされました！**

---
**サポート**: 問題が発生した場合は、ログを確認して `docs/CHAT_AGENT_GUIDE.md` のトラブルシューティングセクションを参照してください。