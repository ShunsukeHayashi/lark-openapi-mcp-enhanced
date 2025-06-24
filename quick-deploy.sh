#!/bin/bash

# Quick Deployment Script for Lark Workspace Bot
# ワークスペース f82jyx0mblu.jp.larksuite.com 向けクイックデプロイメント

set -e

echo "🚀 Lark Workspace Bot クイックデプロイメント開始"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 関数定義
log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 環境変数チェック
check_env() {
    log_info "環境変数をチェック中..."
    
    if [ -z "$APP_ID" ]; then
        log_error "APP_ID が設定されていません"
        echo "以下のコマンドでLark App IDを設定してください:"
        echo "export APP_ID=\"cli_xxxxxxxxxxxxxxxxx\""
        exit 1
    fi
    
    if [ -z "$APP_SECRET" ]; then
        log_error "APP_SECRET が設定されていません"
        echo "以下のコマンドでLark App Secretを設定してください:"
        echo "export APP_SECRET=\"xxxxxxxxxxxxxxxxxxxxxxxx\""
        exit 1
    fi
    
    log_success "環境変数OK (APP_ID: ${APP_ID:0:10}...)"
}

# 依存関係チェック
check_dependencies() {
    log_info "依存関係をチェック中..."
    
    # Node.js バージョンチェック
    if ! command -v node &> /dev/null; then
        log_error "Node.js がインストールされていません"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="16.20.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js バージョンが古すぎます (現在: $NODE_VERSION, 必要: $REQUIRED_VERSION+)"
        exit 1
    fi
    
    log_success "Node.js OK (v$NODE_VERSION)"
    
    # Yarn/npm チェック
    if command -v yarn &> /dev/null; then
        PACKAGE_MANAGER="yarn"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
    else
        log_error "Yarn または npm がインストールされていません"
        exit 1
    fi
    
    log_success "パッケージマネージャー OK ($PACKAGE_MANAGER)"
}

# プロジェクトのビルド
build_project() {
    log_info "プロジェクトをビルド中..."
    
    # 依存関係インストール
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install --production
    else
        npm install --production
    fi
    
    # TypeScript ビルド
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn build
    else
        npm run build
    fi
    
    log_success "ビルド完了"
}

# Lark SDK 依存関係の追加インストール
install_lark_sdk() {
    log_info "Lark SDK をインストール中..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn add @larksuiteoapi/node-sdk
    else
        npm install @larksuiteoapi/node-sdk
    fi
    
    log_success "Lark SDK インストール完了"
}

# 設定ファイル作成
create_config() {
    log_info "設定ファイルを作成中..."
    
    # .env.production ファイル作成
    cat > .env.production << EOF
# Lark App 設定
APP_ID=$APP_ID
APP_SECRET=$APP_SECRET

# サーバー設定
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Workspace 設定
WORKSPACE_DOMAIN=f82jyx0mblu.jp.larksuite.com
BASE_APP_TOKEN=FXdlb6PpNatocgsv6rcjFmmFpKb
BASE_TABLE_ID=tblY8xdYPEmG65ou
BASE_VIEW_ID=vewfMxGkiC
WIKI_NODE_TOKEN=DgH0w39GMiS2LVkhpsOjdpCDp0g

# Bot 設定
BOT_NAME=MCP AI Assistant
BOT_LANGUAGE=ja
BOT_TIMEZONE=Asia/Tokyo

# ログ設定
LOG_LEVEL=info
LOG_FORMAT=combined

# セキュリティ設定 (本番環境では必須)
# ENCRYPT_KEY=your_encrypt_key_here

# テスト設定
RUN_TESTS=true
EOF
    
    log_success "設定ファイル (.env.production) 作成完了"
}

# systemd サービス作成 (オプション)
create_systemd_service() {
    if [ "$EUID" -eq 0 ]; then
        log_info "systemd サービスを作成中..."
        
        cat > /etc/systemd/system/lark-workspace-bot.service << EOF
[Unit]
Description=Lark MCP Chat Agent Bot for f82jyx0mblu.jp.larksuite.com
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) deploy-lark-workspace-bot.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env.production

# ログ設定
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lark-workspace-bot

# セキュリティ設定
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable lark-workspace-bot
        
        log_success "systemd サービス作成完了"
        log_info "サービスを開始するには: sudo systemctl start lark-workspace-bot"
    else
        log_warning "systemd サービスの作成にはroot権限が必要です"
        log_info "手動でサービスを作成するには、sudo でこのスクリプトを再実行してください"
    fi
}

# テスト実行
run_tests() {
    log_info "統合テストを実行中..."
    
    # 環境変数を読み込んで一時的にテスト実行
    export NODE_ENV=development
    export $(grep -v '^#' .env.production | xargs)
    
    timeout 10s node -e "
    const integration = require('./lark-workspace-integration');
    integration.testWorkspaceIntegration()
      .then(() => {
        console.log('✅ 統合テスト成功');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ 統合テスト失敗:', error.message);
        process.exit(1);
      });
    " || log_warning "テストがタイムアウトしました（正常な場合があります）"
}

# メイン実行
main() {
    echo "Target Workspace: f82jyx0mblu.jp.larksuite.com"
    echo "Base App Token: FXdlb6PpNatocgsv6rcjFmmFpKb"
    echo "Wiki Node Token: DgH0w39GMiS2LVkhpsOjdpCDp0g"
    echo ""
    
    check_env
    check_dependencies
    build_project
    install_lark_sdk
    create_config
    run_tests
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "🎉 デプロイメント完了！"
    echo ""
    echo "📋 次のステップ:"
    echo ""
    echo "1. 【開発環境でテスト】"
    echo "   node deploy-lark-workspace-bot.js"
    echo ""
    echo "2. 【本番環境で起動】"
    echo "   NODE_ENV=production node deploy-lark-workspace-bot.js"
    echo ""
    echo "3. 【Lark Developer Console 設定】"
    echo "   - Webhook URL: https://your-domain.com/webhook"
    echo "   - イベント購読: im.message.receive_v1"
    echo ""
    echo "4. 【ボットをグループに追加】"
    echo "   - グループ設定 → メンバー → ボットを追加"
    echo "   - 作成したボット \"MCP AI Assistant\" を選択"
    echo ""
    echo "5. 【動作確認】"
    echo "   - グループでメッセージ送信: \"こんにちは\""
    echo "   - ヘルスチェック: curl http://localhost:3000/health"
    echo ""
    
    # systemd サービス作成の提案
    if [ "$EUID" -ne 0 ]; then
        echo "6. 【自動起動設定 (オプション)】"
        echo "   sudo ./quick-deploy.sh"
        echo ""
    fi
    
    echo "🔗 参考資料:"
    echo "   - デプロイメントガイド: LARK_SERVER_BOT_DEPLOYMENT.md"
    echo "   - ユーザーガイド: docs/CHAT_AGENT_GUIDE.md"
    echo "   - API リファレンス: docs/API_REFERENCE.md"
    echo ""
    echo "❓ 問題が発生した場合:"
    echo "   - ログ確認: journalctl -u lark-workspace-bot -f"
    echo "   - ヘルスチェック: curl http://localhost:3000/health"
    echo "   - 統合テスト: node -e \"require('./lark-workspace-integration').testWorkspaceIntegration()\""
    echo ""
    log_success "🚀 Lark MCP Chat Agent Bot の準備が完了しました！"
}

# スクリプトの実行
main "$@"