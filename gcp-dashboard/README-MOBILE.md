# 🚨 緊急注文対応ダッシュボード

LarkのBase（多維表格）から緊急注文データを取得し、リアルタイムに可視化するダッシュボードです。

## 🌟 新機能

### 📱 モバイル対応
- **ネイティブアプリのようなUX**: スマートフォンで快適に操作できるモバイル専用UI
- **プルダウンリフレッシュ**: 画面を下に引っ張ってデータ更新
- **タブナビゲーション**: グラフと商品リストを簡単に切り替え
- **PWA対応**: ホーム画面に追加してアプリのように使用可能

### 🔗 Lark Baseリアルタイム連携
- **ローカルサーバー経由**: Lark Baseからリアルタイムでデータ取得
- **1分間キャッシュ**: APIリクエストを最適化
- **自動更新**: ダッシュボードは1分ごとに自動更新

## 📊 ダッシュボード機能

- **緊急発注アラート**: 在庫切れが予測される商品を一覧表示
- **在庫切れ予測分析**: 7日/14日/30日以内の在庫切れ予測を円グラフで可視化
- **売上TOP10商品**: 30日間の販売数ランキングと在庫状況
- **緊急度別カラーコード**: 危険度に応じた視覚的な警告表示

## 🏗️ アーキテクチャ

### GCPサーバーレス構成
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Cloud Scheduler │────▶│ Pub/Sub Topic   │────▶│ Update Function │
│ (毎時実行)      │     │                 │     │ (データ更新)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User Browser    │────▶│ View Function   │────▶│ Cloud Firestore │
│                 │     │ (ダッシュボード) │     │ (データキャッシュ)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### ローカルサーバー構成（Lark Baseリアルタイム連携）
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User Browser    │────▶│ Express Server  │────▶│ Lark Base API  │
│ (モバイル/PC)   │     │ (API + Static)  │     │ (リアルタイム)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 クイックスタート（ローカルサーバー）

Lark Baseとリアルタイムで連携するダッシュボードをすぐに試したい場合：

### 1. 環境設定
```bash
# プロジェクトに移動
cd gcp-dashboard

# 環境変数ファイルを作成
cp .env.example .env

# .envファイルを編集してLark認証情報を設定
# LARK_APP_ID=your_app_id
# LARK_APP_SECRET=your_app_secret
```

### 2. ローカルサーバーの起動
```bash
# ローカルサーバーディレクトリに移動
cd local-server

# 依存関係をインストール
npm install

# サーバーを起動
npm run dev
```

### 3. ダッシュボードにアクセス

ブラウザで以下のURLにアクセス：
- **PC版**: http://localhost:3000/
- **モバイル版**: http://localhost:3000/mobile-dashboard.html

## 🚀 GCPサーバーレスセットアップ

### 1. 前提条件

- Google Cloud Platform アカウント
- Node.js 18以上
- gcloud CLI インストール済み
- Lark/Feishu アプリケーション（App ID/Secretを取得済み）

### 2. プロジェクトのクローン

```bash
git clone [your-repo-url]
cd gcp-dashboard
```

### 3. GCPプロジェクトの設定

```bash
# GCPにログイン
gcloud auth login

# プロジェクトを作成または選択
gcloud projects create YOUR-PROJECT-ID
gcloud config set project YOUR-PROJECT-ID
```

### 4. GCPへのデプロイ

付属のデプロイスクリプトを使用すると、必要なリソースが自動的に作成されます：

```bash
# デプロイスクリプトを実行
./deploy.sh YOUR-PROJECT-ID
```

スクリプトは以下を自動的に実行します：
- 必要なGCP APIの有効化
- Secret Managerでの認証情報の設定（対話的に入力）
- Cloud Firestoreの初期化
- Cloud Functionsのデプロイ
- Cloud Schedulerの設定

### 5. 初回データ更新

デプロイ完了後、初回のデータ更新を手動で実行します：

```bash
gcloud pubsub topics publish emergency-order-update --message='{}' --project=YOUR-PROJECT-ID
```

## 📝 Lark Base設定要件

対象のLark Baseテーブルには以下のフィールドが必要です：

- `商品名`: 商品の名称
- `緊急発注フラグ`: 🚩緊急 または 緊急
- `在庫切れ予測`: 在庫切れまでの日数（数値）
- `発注残数`: 未着の発注数量
- `30日販売数`: 過去30日間の販売数
- `現在庫数`: 現在の在庫数量

### カスタマイズ

`src/updateCache.ts`内の以下の定数を環境に合わせて変更してください：

```typescript
const APP_TOKEN = 'Pvo3bR2b8aeh14sqVppjAXR4pkN';  // あなたのBase App Token
const TABLE_ID = 'tblQxv1OFCMxyjEy';              // あなたのTable ID
```

## 🔧 メンテナンス

### ログの確認

```bash
# データ更新関数のログ
gcloud functions logs read updateEmergencyOrderCache --limit=50

# ダッシュボード表示関数のログ
gcloud functions logs read viewEmergencyOrderDashboard --limit=50
```

### データ更新頻度の変更

Cloud Schedulerの設定を変更します：

```bash
gcloud scheduler jobs update pubsub emergency-order-scheduler \
    --schedule="*/30 * * * *" \  # 30分ごとに変更
    --location=asia-northeast1
```

### 手動でのデータ更新

```bash
gcloud pubsub topics publish emergency-order-update --message='{}'
```

## 🛡️ セキュリティ

- Larkの認証情報はGoogle Secret Managerで安全に管理
- ダッシュボードへのアクセスは必要に応じてIAMで制限可能
- HTTPSによる暗号化通信

## 💰 コスト見積もり

月間コスト目安（小規模利用の場合）：
- Cloud Functions: 無料枠内
- Cloud Firestore: 無料枠内
- Cloud Scheduler: 無料枠内
- Secret Manager: 無料枠内

**合計: 月額 $0〜$5程度**

## 🐛 トラブルシューティング

### エラー: "Permission denied"
Secret Managerへのアクセス権限を確認してください：
```bash
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
    --member="serviceAccount:YOUR-SERVICE-ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
```

### エラー: "Table not found"
`APP_TOKEN`と`TABLE_ID`が正しいか確認してください。

### データが更新されない
1. Cloud Schedulerのジョブが有効か確認
2. Lark APIの認証情報が正しいか確認
3. Cloud Functionsのエラーログを確認

## 📱 モバイルダッシュボードの特徴

### UI/UX最適化
- **タッチ操作最適化**: ボタン・カードのサイズを親指で操作しやすいサイズに
- **横スクロールメトリクス**: 主要指標を横スクロールで確認
- **カード型UI**: 商品情報をカード形式で表示
- **フローティングアクションボタン**: リフレッシュボタンを常に表示

### パフォーマンス
- **軽量化**: Chart.jsのみを使用し、余計なライブラリを排除
- **キャッシュ機能**: 1分間のAPIキャッシュで通信量削減
- **ライト/ダークモード**: システム設定に自動追従

### アクセシビリティ
- **大きなタップターゲット**: 44px以上のタップ可能領域
- **高コントラスト**: WCAGガイドラインに準拠
- **明確な状態表示**: 色とバッジで緊急度を明示

## 📄 ライセンス

MIT License