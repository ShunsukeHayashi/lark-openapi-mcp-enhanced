# Clasp (Command Line Apps Script) セットアップガイド

## 📋 Claspとは

Clasp（Command Line Apps Script）は、Google Apps Scriptをローカルで開発・管理するためのCLIツールです。

### メリット
- ✅ ローカルでコード編集（VSCode等のエディタを使用可能）
- ✅ Gitでバージョン管理
- ✅ TypeScript対応
- ✅ npmパッケージの使用（バンドル必要）
- ✅ 自動デプロイ・同期

## 🚀 セットアップ手順

### 1. Claspのインストール

```bash
# グローバルインストール（推奨）
npm install -g @google/clasp

# または yarn
yarn global add @google/clasp

# pnpmの場合
pnpm install -g @google/clasp
```

### 2. Google Apps Script APIを有効化

1. [Google Apps Script Settings](https://script.google.com/home/usersettings)にアクセス
2. 「Google Apps Script API」をONに設定

### 3. Claspにログイン

```bash
clasp login
```
- ブラウザが開きGoogleアカウントの認証を求められます
- 権限を許可してください

### 4. 新規プロジェクトの作成

```bash
# 新規ディレクトリを作成
mkdir my-gas-project
cd my-gas-project

# GASプロジェクトを作成
clasp create --title "My GAS Project" --type standalone

# タイプオプション:
# --type standalone    # スタンドアロン
# --type sheets       # Googleスプレッドシート
# --type docs         # Googleドキュメント
# --type slides       # Googleスライド
# --type forms        # Googleフォーム
# --type webapp       # Webアプリ
```

### 5. 既存プロジェクトのクローン

```bash
# プロジェクトIDを使用してクローン
clasp clone <scriptId>

# 例: 
clasp clone 1234567890abcdefghijklmnopqrstuvwxyz
```

## 📝 プロジェクト構成

### 基本構成
```
my-gas-project/
├── .clasp.json        # Claspの設定ファイル
├── .claspignore       # アップロード除外設定
├── appsscript.json    # GASマニフェストファイル
├── Code.js           # メインコード
└── Utils.js          # ユーティリティ関数
```

### TypeScriptを使用する場合
```
my-gas-project/
├── .clasp.json
├── .claspignore
├── appsscript.json
├── tsconfig.json      # TypeScript設定
├── package.json       # npm設定
├── src/
│   ├── index.ts      # メインコード
│   └── utils.ts      # ユーティリティ
└── dist/             # コンパイル済みファイル
```

## 🔧 設定ファイル

### .clasp.json
```json
{
  "scriptId": "your-script-id",
  "rootDir": "./src",
  "projectId": "your-project-id"
}
```

### .claspignore
```
**/**
!*.js
!*.ts
!appsscript.json

# TypeScript設定の場合
!src/**/*.ts
node_modules/
```

### appsscript.json
```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

### tsconfig.json (TypeScript使用時)
```json
{
  "compilerOptions": {
    "lib": ["es2019"],
    "target": "ES2019",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 📤 基本的な使い方

### コードのプッシュ（アップロード）
```bash
# ローカルの変更をGASにアップロード
clasp push

# 監視モード（ファイル変更時に自動プッシュ）
clasp push --watch
```

### コードのプル（ダウンロード）
```bash
# GASから最新のコードを取得
clasp pull
```

### Webエディタを開く
```bash
# ブラウザでGASエディタを開く
clasp open

# 特定のプロジェクトを開く
clasp open --webapp
```

### デプロイ
```bash
# 新しいデプロイを作成
clasp deploy --description "Initial deployment"

# デプロイ一覧を表示
clasp deployments

# 特定のバージョンをデプロイ
clasp deploy --versionNumber 2
```

### ログの確認
```bash
# ログを表示
clasp logs

# リアルタイムでログを監視
clasp logs --watch
```

## 🛠️ 実践的な開発フロー

### 1. Larkシフト管理システムの例

```bash
# プロジェクト作成
mkdir lark-shift-management
cd lark-shift-management
clasp create --title "Lark Shift Management" --type sheets

# TypeScript設定
npm init -y
npm install --save-dev @types/google-apps-script typescript

# ディレクトリ構成
mkdir src
```

### 2. TypeScriptでコード作成

`src/index.ts`:
```typescript
// Lark設定の型定義
interface LarkConfig {
  appId: string;
  appSecret: string;
  baseAppToken: string;
}

// PropertiesServiceから設定を取得
function getConfig(): LarkConfig {
  const props = PropertiesService.getScriptProperties();
  return {
    appId: props.getProperty('LARK_APP_ID') || '',
    appSecret: props.getProperty('LARK_APP_SECRET') || '',
    baseAppToken: props.getProperty('BASE_APP_TOKEN') || ''
  };
}

// メイン関数
function main(): void {
  const config = getConfig();
  console.log('Lark Shift Management System initialized');
}
```

### 3. ビルド＆デプロイ

```bash
# TypeScriptをコンパイル
npx tsc

# GASにプッシュ
clasp push

# Webエディタで確認
clasp open
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. "Files in subfolder are not accounted for" 警告
**解決策**: `.claspignore`ファイルを適切に設定

#### 2. 403エラー（Push時）
**解決策**: Google Apps Script APIが有効になっているか確認

#### 3. TypeScriptの型エラー
**解決策**: 
```bash
npm install --save-dev @types/google-apps-script
```

#### 4. Prettierとの競合
**解決策**: `.prettierrc`を設定
```json
{
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 120
}
```

## 📚 高度な使い方

### npmパッケージの使用

1. Webpackでバンドル
```bash
npm install --save-dev webpack webpack-cli
npm install dayjs  # 例: 日付ライブラリ
```

2. webpack.config.js
```javascript
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
```

### 環境変数の管理

```typescript
// 開発環境と本番環境で設定を切り替え
function getEnvironment(): 'development' | 'production' {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('ENVIRONMENT') as any || 'development';
}

function getApiEndpoint(): string {
  const env = getEnvironment();
  return env === 'production' 
    ? 'https://open.larksuite.com/open-apis'
    : 'https://open.feishu.cn/open-apis';
}
```

## 🎯 ベストプラクティス

1. **常にバージョン管理を使用**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **環境変数は PropertiesService で管理**

3. **TypeScriptの使用を推奨**

4. **定期的にバックアップ**
   ```bash
   clasp pull
   git commit -am "Backup: $(date)"
   ```

5. **チーム開発時はブランチ戦略を採用**

## 🔗 参考リンク

- [Clasp公式ドキュメント](https://github.com/google/clasp)
- [Google Apps Script リファレンス](https://developers.google.com/apps-script/reference)
- [TypeScript + GAS チュートリアル](https://developers.google.com/apps-script/guides/typescript)