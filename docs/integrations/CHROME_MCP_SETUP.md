# Chrome MCP Server セットアップガイド

## 🌐 概要

Chrome MCP Serverは、Claude DesktopからChromeブラウザを直接操作できる革新的なツールです。既存のブラウザセッション（ログイン状態、クッキー、拡張機能）をそのまま活用できます。

## 📋 Chrome MCP の機能

### 🌐 ブラウザ操作
- **chrome_navigate** - URL遷移、新規ウィンドウ開く
- **chrome_close_tabs** - タブ/ウィンドウを閉じる
- **chrome_go_back_or_forward** - 履歴の前後移動
- **get_windows_and_tabs** - 開いているタブ一覧取得

### 📸 スクリーンショット
- **chrome_screenshot** - ページ全体や特定要素をキャプチャ

### 🎯 ページ操作
- **chrome_click_element** - 要素クリック
- **chrome_fill_or_select** - フォーム入力
- **chrome_keyboard** - キーボード操作（Ctrl+C等）
- **chrome_inject_script** - カスタムJavaScript実行

### 🔍 コンテンツ取得
- **chrome_get_web_content** - ページコンテンツ取得
- **search_tabs_content** - AI検索（セマンティック）
- **chrome_get_interactive_elements** - クリック可能要素一覧

### 📊 ネットワーク監視
- **chrome_network_capture_start/stop** - HTTPリクエスト監視
- **chrome_network_request** - ブラウザ経由でAPI実行

### 📚 データ管理
- **chrome_history** - 履歴検索
- **chrome_bookmark_search/add/delete** - ブックマーク操作

## 🚀 セットアップ手順

### 1. Chrome MCP Bridgeのインストール

```bash
# pnpmを使用（推奨）
pnpm config set enable-pre-post-scripts true
pnpm install -g mcp-chrome-bridge

# または npm
npm install -g mcp-chrome-bridge

# 手動登録が必要な場合
mcp-chrome-bridge register
```

### 2. Chrome拡張機能のインストール

1. [MCP Chrome Extension](https://github.com/hangwin/mcp-chrome)から拡張機能をダウンロード
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. ダウンロードした拡張機能フォルダを選択
6. 拡張機能アイコンをクリックして「Connect」を選択

### 3. Claude Desktop設定

現在の設定ファイルに Chrome MCP を追加：

```json
{
  "mcpServers": {
    "streamable-mcp-server": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:12306/mcp"
    },
    "lark-genesis": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/lark-openapi-mcp-enhanced/dist/cli.js",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.genesis.default"
      ],
      "env": {
        "APP_ID": "YOUR_LARK_APP_ID_HERE",
        "APP_SECRET": "YOUR_LARK_APP_SECRET_HERE"
      }
    },
    "chrome-mcp": {
      "type": "streamable-http",
      "url": "http://127.0.0.1:12306/mcp"
    }
  }
}
```

### 4. 詳細オプション（Chrome Remote Debugging）

より高度な機能を使用する場合：

```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

## 💡 使用例

### ウェブスクレイピング

```text
「GitHub のトレンドリポジトリ一覧を取得して、各リポジトリの情報をスプレッドシートにまとめてください」
```

Claude が以下の手順を実行：
1. GitHub トレンドページに移動
2. リポジトリ情報を抽出
3. Lark Base/Spreadsheet に自動入力

### 自動フォーム入力

```text
「この求人応募フォームに私の履歴書情報を自動入力してください」
```

Claude が：
1. フォーム要素を識別
2. 事前に提供された情報で自動入力
3. 入力内容を確認

### ページ監視とデータ収集

```text
「この商品ページの価格変動を1時間ごとに確認して、変更があったらLarkに通知してください」
```

### ワークフロー自動化

```text
「毎日午前9時に社内ダッシュボードのスクリーンショットを撮って、チームチャットに共有してください」
```

## 🔧 高度な活用例

### 1. Webアプリのテスト自動化

```typescript
// Claude に指示
「このWebアプリの登録フローをテストして、各ステップのスクリーンショットを撮ってください」
```

### 2. 競合他社分析

```typescript
// Claude に指示  
「競合他社のウェブサイト5社を訪問して、価格情報と機能比較表を作成してください」
```

### 3. ソーシャルメディア管理

```typescript
// Claude に指示
「TwitterとLinkedInで指定したキーワードの最新投稿を検索して、関連するものにいいねとリツイートをしてください」
```

### 4. オンライン調査

```typescript
// Claude に指示
「この技術トピックについて、主要な技術ブログ10サイトから最新記事を収集して要約してください」
```

## 🛡️ セキュリティ注意事項

### ✅ 安全な点
- **100%ローカル実行** - データは外部に送信されない
- **既存セッション利用** - 再認証不要
- **権限制御** - Chrome拡張機能の権限内で動作

### ⚠️ 注意点
- **機密情報** - 自動入力する情報に注意
- **ログイン状態** - 重要なアカウントでの使用は慎重に
- **スクリプト実行** - 信頼できないサイトでのJavaScript実行は避ける

## 🔗 連携パターン

### Chrome + Lark Genesis の組み合わせ

```text
「このECサイトから商品データを収集して、在庫管理用のLark Baseを自動生成してください」
```

1. **Chrome MCP** でECサイトからデータ収集
2. **Lark Genesis** で最適な在庫管理Baseを生成
3. **Lark MCP** でデータを自動投入

### Chrome + GAS Interpreter の組み合わせ

```text
「Webページから取得したデータをGoogleスプレッドシートに整理して、グラフを作成してください」
```

1. **Chrome MCP** でWebデータ収集
2. **GAS Interpreter** でスプレッドシート操作
3. 自動グラフ生成とレポート作成

## 📋 トラブルシューティング

### 1. 拡張機能が動作しない
- Chrome の拡張機能ページで有効になっているか確認
- 「Connect」ボタンをクリックしているか確認
- ブラウザを再起動

### 2. 接続エラー
- ポート12306が使用可能か確認
- ファイアウォール設定を確認
- mcp-chrome-bridgeが正しくインストールされているか確認

### 3. 権限エラー
- Chrome拡張機能の権限設定を確認
- 必要なサイトでの権限が付与されているか確認

### 4. スクリーンショットが撮れない
- タブがアクティブになっているか確認
- ページが完全に読み込まれているか確認

## 🎯 Chrome MCP の優位性

### 従来のブラウザ自動化 vs Chrome MCP

| 項目 | Playwright/Puppeteer | Chrome MCP |
|------|---------------------|------------|
| ログイン状態 | 毎回再認証が必要 | ✅ 既存セッション利用 |
| 拡張機能 | 使用不可 | ✅ そのまま利用可能 |
| クッキー | 手動設定が必要 | ✅ 自動的に維持 |
| ブックマーク | アクセス不可 | ✅ 直接操作可能 |
| 設定・履歴 | 初期状態 | ✅ 個人設定を保持 |

### AI統合の利点

- **自然言語指示** - プログラミング不要
- **エラー処理** - 自動的な問題解決
- **学習機能** - 操作パターンの記憶
- **複雑な判断** - 人間のような柔軟な対応

## 🚀 今すぐ始める

1. **Bridge インストール**: `pnpm install -g mcp-chrome-bridge`
2. **拡張機能追加**: Chrome ウェブストアから追加
3. **Claude Desktop 設定**: 上記の設定をコピー
4. **接続確認**: 拡張機能で「Connect」をクリック
5. **テスト実行**: 「現在のタブのスクリーンショットを撮ってください」と指示

これで、Claude DesktopからChromeブラウザを自由自在に操作できます！