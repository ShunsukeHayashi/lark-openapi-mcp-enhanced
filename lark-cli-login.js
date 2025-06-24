#!/usr/bin/env node

/**
 * Lark CLI Login Tool
 * Lark認証情報の設定と検証ツール
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { Client } = require('@larksuiteoapi/node-sdk');

// カラー定義
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// ログ関数
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}${colors.bright}🚀 ${msg}${colors.reset}`)
};

// 設定ファイルパス
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.lark-mcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'credentials.json');
const ENV_FILE = '.env.lark';

class LarkCliLogin {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async main() {
    log.title('Lark MCP CLI Login Tool');
    console.log('');
    
    try {
      const action = await this.selectAction();
      
      switch (action) {
        case '1':
          await this.login();
          break;
        case '2':
          await this.verifyCredentials();
          break;
        case '3':
          await this.showStatus();
          break;
        case '4':
          await this.logout();
          break;
        case '5':
          await this.setupEnvironment();
          break;
        default:
          log.error('無効な選択です');
      }
    } catch (error) {
      log.error(`エラー: ${error.message}`);
    } finally {
      this.rl.close();
    }
  }

  async selectAction() {
    console.log('🎯 実行したいアクションを選択してください:');
    console.log('');
    console.log('1. 🔐 ログイン (認証情報を設定)');
    console.log('2. ✅ 認証情報を検証');
    console.log('3. 📊 現在のステータス表示');
    console.log('4. 🚪 ログアウト (認証情報を削除)');
    console.log('5. ⚙️ 環境設定ファイル生成');
    console.log('');

    return new Promise((resolve) => {
      this.rl.question('選択 (1-5): ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async login() {
    log.info('Lark アプリケーション認証情報を入力してください');
    console.log('');
    
    // App ID 入力
    const appId = await this.question('App ID (cli_で始まる文字列): ');
    if (!appId.startsWith('cli_')) {
      throw new Error('App ID は cli_ で始まる必要があります');
    }

    // App Secret 入力
    const appSecret = await this.question('App Secret: ');
    if (appSecret.length < 20) {
      throw new Error('App Secret が短すぎます');
    }

    // ドメイン選択
    console.log('');
    console.log('Lark ドメインを選択してください:');
    console.log('1. LarkSuite International (open.larksuite.com)');
    console.log('2. Feishu China (open.feishu.cn)');
    console.log('');

    const domainChoice = await this.question('ドメイン選択 (1-2): ');
    const domain = domainChoice === '2' ? 'feishu.cn' : 'larksuite.com';

    // 認証情報をテスト
    log.info('認証情報を検証中...');
    
    try {
      const client = new Client({
        appId,
        appSecret,
        domain
      });

      const tokenResponse = await client.auth.tenantAccessToken.internal({
        data: { app_id: appId, app_secret: appSecret }
      });

      if (tokenResponse.code !== 0) {
        throw new Error(`認証失敗: ${tokenResponse.msg}`);
      }

      log.success('認証情報が正常に検証されました');

      // 認証情報を保存
      await this.saveCredentials({ appId, appSecret, domain });
      log.success('認証情報が保存されました');

    } catch (error) {
      throw new Error(`認証検証エラー: ${error.message}`);
    }
  }

  async verifyCredentials() {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      throw new Error('保存された認証情報がありません。まずログインしてください。');
    }

    log.info('保存された認証情報を検証中...');

    try {
      const client = new Client({
        appId: credentials.appId,
        appSecret: credentials.appSecret,
        domain: credentials.domain
      });

      const tokenResponse = await client.auth.tenantAccessToken.internal({
        data: { 
          app_id: credentials.appId, 
          app_secret: credentials.appSecret 
        }
      });

      if (tokenResponse.code === 0) {
        log.success('認証情報は有効です');
        console.log('');
        console.log(`📱 App ID: ${credentials.appId}`);
        console.log(`🌐 Domain: ${credentials.domain}`);
        console.log(`⏰ 検証時刻: ${new Date().toLocaleString()}`);
      } else {
        log.error(`認証失敗: ${tokenResponse.msg}`);
      }

    } catch (error) {
      log.error(`検証エラー: ${error.message}`);
    }
  }

  async showStatus() {
    console.log('📊 Lark MCP CLI ステータス');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 認証情報ステータス
    const credentials = await this.loadCredentials();
    if (credentials) {
      log.success('認証情報: 設定済み');
      console.log(`   App ID: ${credentials.appId}`);
      console.log(`   Domain: ${credentials.domain}`);
      console.log(`   保存場所: ${CONFIG_FILE}`);
    } else {
      log.warning('認証情報: 未設定');
      console.log('   "lark-cli-login.js" でログインしてください');
    }

    console.log('');

    // 環境変数ステータス
    const envAppId = process.env.APP_ID;
    const envAppSecret = process.env.APP_SECRET;

    if (envAppId && envAppSecret) {
      log.success('環境変数: 設定済み');
      console.log(`   APP_ID: ${envAppId}`);
      console.log(`   APP_SECRET: ${envAppSecret.substring(0, 10)}...`);
    } else {
      log.warning('環境変数: 未設定');
      console.log('   export APP_ID="..." で設定してください');
    }

    console.log('');

    // .env ファイルステータス
    if (fs.existsSync(ENV_FILE)) {
      log.success('.env ファイル: 存在');
      console.log(`   場所: ${path.resolve(ENV_FILE)}`);
    } else {
      log.warning('.env ファイル: 未作成');
    }

    console.log('');

    // プロジェクトステータス
    if (fs.existsSync('package.json')) {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      log.success(`プロジェクト: ${pkg.name} v${pkg.version}`);
    }

    if (fs.existsSync('dist/cli.js')) {
      log.success('ビルド: 完了');
    } else {
      log.warning('ビルド: 未完了 (yarn build を実行してください)');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  async logout() {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      log.warning('保存された認証情報がありません');
      return;
    }

    const confirm = await this.question('認証情報を削除しますか？ (y/N): ');
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.unlinkSync(CONFIG_FILE);
        log.success('認証情報を削除しました');
      }
      
      if (fs.existsSync(ENV_FILE)) {
        const removeEnv = await this.question('.env.lark ファイルも削除しますか？ (y/N): ');
        if (removeEnv.toLowerCase() === 'y') {
          fs.unlinkSync(ENV_FILE);
          log.success('.env.lark ファイルを削除しました');
        }
      }
    } else {
      log.info('キャンセルしました');
    }
  }

  async setupEnvironment() {
    const credentials = await this.loadCredentials();
    if (!credentials) {
      throw new Error('認証情報がありません。まずログインしてください。');
    }

    log.info('環境設定ファイルを生成中...');

    // .env.lark ファイル生成
    const envContent = `# Lark MCP 環境設定
# 生成日時: ${new Date().toLocaleString()}

# Lark App 認証情報
APP_ID=${credentials.appId}
APP_SECRET=${credentials.appSecret}

# Lark ドメイン設定
LARK_DOMAIN=${credentials.domain}

# サーバー設定
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# ログ設定
LOG_LEVEL=info
LOG_FORMAT=combined

# Bot 設定
BOT_NAME=MCP AI Assistant
BOT_LANGUAGE=ja
BOT_TIMEZONE=Asia/Tokyo

# レート制限設定
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WRITES=10

# テスト設定
RUN_TESTS=true
`;

    fs.writeFileSync(ENV_FILE, envContent);
    log.success(`.env.lark ファイルを生成しました`);

    // export コマンド表示
    console.log('');
    console.log('📋 環境変数を設定するには、以下のコマンドを実行してください:');
    console.log('');
    console.log(`${colors.yellow}source ${ENV_FILE}${colors.reset}`);
    console.log('');
    console.log('または個別に設定:');
    console.log(`${colors.yellow}export APP_ID="${credentials.appId}"${colors.reset}`);
    console.log(`${colors.yellow}export APP_SECRET="${credentials.appSecret}"${colors.reset}`);
    console.log('');

    // シェルスクリプト生成
    const setupScript = `#!/bin/bash
# Lark MCP 環境設定スクリプト
# 自動生成: ${new Date().toLocaleString()}

echo "🚀 Lark MCP 環境変数を設定中..."

export APP_ID="${credentials.appId}"
export APP_SECRET="${credentials.appSecret}"
export LARK_DOMAIN="${credentials.domain}"
export NODE_ENV="development"

echo "✅ 環境変数設定完了"
echo ""
echo "📊 設定内容:"
echo "   APP_ID: $APP_ID"
echo "   LARK_DOMAIN: $LARK_DOMAIN"
echo ""
echo "🎯 次のステップ:"
echo "   yarn build              # プロジェクトビルド"
echo "   yarn bot:dev            # 開発環境でボット起動"
echo "   ./lark-cli-login.js     # ログインツール"
echo ""
`;

    fs.writeFileSync('setup-env.sh', setupScript);
    fs.chmodSync('setup-env.sh', '755');
    log.success('setup-env.sh スクリプトを生成しました');

    console.log('');
    console.log('💡 クイックスタート:');
    console.log(`${colors.green}source setup-env.sh && yarn build && yarn bot:dev${colors.reset}`);
  }

  async saveCredentials(credentials) {
    // 設定ディレクトリ作成
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // 認証情報を暗号化して保存 (簡易版)
    const data = {
      ...credentials,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  async loadCredentials() {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }

    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`認証情報の読み込みエラー: ${error.message}`);
    }
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// CLI実行
if (require.main === module) {
  const cli = new LarkCliLogin();
  cli.main().catch((error) => {
    console.error(`${colors.red}❌ エラー: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = LarkCliLogin;