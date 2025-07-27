#!/bin/bash

# GCP緊急注文ダッシュボード デプロイスクリプト
# 使用方法: ./deploy.sh [project-id]

set -e

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# プロジェクトIDの設定
PROJECT_ID=${1:-$(gcloud config get-value project)}
if [ -z "$PROJECT_ID" ]; then
    log_error "プロジェクトIDが指定されていません"
    echo "使用方法: ./deploy.sh [project-id]"
    exit 1
fi

REGION="asia-northeast1"
log_info "プロジェクト: $PROJECT_ID, リージョン: $REGION"

# 必要なAPIの有効化
log_info "必要なGCP APIを有効化しています..."
gcloud services enable cloudfunctions.googleapis.com \
    cloudbuild.googleapis.com \
    cloudscheduler.googleapis.com \
    firestore.googleapis.com \
    secretmanager.googleapis.com \
    pubsub.googleapis.com \
    --project=$PROJECT_ID

# Secret Managerのセットアップ
log_info "Secret Managerの設定を確認しています..."
if ! gcloud secrets describe LARK_APP_ID --project=$PROJECT_ID >/dev/null 2>&1; then
    log_warn "LARK_APP_ID シークレットが見つかりません"
    read -p "Lark App IDを入力してください: " APP_ID
    echo -n "$APP_ID" | gcloud secrets create LARK_APP_ID --data-file=- --project=$PROJECT_ID
    log_info "LARK_APP_ID シークレットを作成しました"
fi

if ! gcloud secrets describe LARK_APP_SECRET --project=$PROJECT_ID >/dev/null 2>&1; then
    log_warn "LARK_APP_SECRET シークレットが見つかりません"
    read -s -p "Lark App Secretを入力してください: " APP_SECRET
    echo
    echo -n "$APP_SECRET" | gcloud secrets create LARK_APP_SECRET --data-file=- --project=$PROJECT_ID
    log_info "LARK_APP_SECRET シークレットを作成しました"
fi

# Pub/Subトピックの作成
log_info "Pub/Subトピックを作成しています..."
gcloud pubsub topics create emergency-order-update --project=$PROJECT_ID 2>/dev/null || log_info "トピックは既に存在します"

# Firestoreの初期化
log_info "Firestoreデータベースを初期化しています..."
gcloud firestore databases create --location=$REGION --project=$PROJECT_ID 2>/dev/null || log_info "Firestoreは既に初期化されています"

# TypeScriptのビルド
log_info "TypeScriptをビルドしています..."
npm install
npm run build

# Cloud Functionsのデプロイ
log_info "データ更新用Cloud Functionをデプロイしています..."
gcloud functions deploy updateEmergencyOrderCache \
    --runtime nodejs20 \
    --trigger-topic emergency-order-update \
    --entry-point updateEmergencyOrderCache \
    --source ./dist \
    --region $REGION \
    --project $PROJECT_ID \
    --memory 512MB \
    --timeout 540s \
    --set-env-vars GCP_PROJECT=$PROJECT_ID \
    --service-account default

# デフォルトのサービスアカウントにSecret Manager権限を付与
SERVICE_ACCOUNT=$(gcloud iam service-accounts list --filter="displayName:Default compute service account" --format="value(email)" --project=$PROJECT_ID)
log_info "サービスアカウント $SERVICE_ACCOUNT に権限を付与しています..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

log_info "ダッシュボード表示用Cloud Functionをデプロイしています..."
gcloud functions deploy viewEmergencyOrderDashboard \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point viewEmergencyOrderDashboard \
    --source ./dist \
    --region $REGION \
    --project $PROJECT_ID \
    --memory 256MB \
    --timeout 60s

# Cloud Schedulerのセットアップ
log_info "Cloud Schedulerジョブを作成しています..."
gcloud scheduler jobs create pubsub emergency-order-scheduler \
    --schedule="0 * * * *" \
    --topic=emergency-order-update \
    --location=$REGION \
    --project=$PROJECT_ID \
    --message-body='{}' \
    2>/dev/null || log_info "スケジューラージョブは既に存在します"

# 関数のURLを取得
DASHBOARD_URL=$(gcloud functions describe viewEmergencyOrderDashboard --region=$REGION --format="value(httpsTrigger.url)" --project=$PROJECT_ID)

log_info "デプロイが完了しました！"
echo ""
echo "========================================="
echo "ダッシュボードURL: ${GREEN}$DASHBOARD_URL${NC}"
echo "========================================="
echo ""
log_info "初回データ更新を手動で実行する場合:"
echo "gcloud pubsub topics publish emergency-order-update --message='{}' --project=$PROJECT_ID"