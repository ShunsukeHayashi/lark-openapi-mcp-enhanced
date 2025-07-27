# 🚨 緊急注文対応ダッシュボード (GCP Serverless)

LarkのBase（多維表格）から緊急注文データを取得し、リアルタイムに可視化するサーバーレスダッシュボードです。

## 📊 ダッシュボード機能

- **緊急発注アラート**: 在庫切れが予測される商品を一覧表示
- **在庫切れ予測分析**: 7日/14日/30日以内の在庫切れ予測を円グラフで可視化
- **売上TOP10商品**: 30日間の販売数ランキングと在庫状況
- **緊急度別カラーコード**: 危険度に応じた視覚的な警告表示

## 🏗️ アーキテクチャ

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

## 🚀 セットアップ手順

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

### 4. デプロイ

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

## 📝 環境設定

### Lark Base設定

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

## 📄 ライセンス

MIT License