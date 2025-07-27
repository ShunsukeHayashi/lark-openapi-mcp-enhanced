#!/bin/bash

# 🚨 緊急発注アラートView作成 - MCP Tool実行スクリプト
# 
# このスクリプトはMCPツールの制約を考慮して作成されています
# - View作成のみAPIで実行
# - フィルター・ソート設定は手動

echo "🚀 緊急発注アラートView作成 (MCP Tool版)"
echo "========================================"

# 環境変数チェック
if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
    echo "❌ エラー: 認証情報が設定されていません"
    echo ""
    echo "以下のコマンドで設定してください:"
    echo "export APP_ID=your_app_id"
    echo "export APP_SECRET=your_app_secret"
    exit 1
fi

# 設定
APP_TOKEN="KgFMw2G2Yiphx7kxNz0jA8DFpqd"
TABLE_ID="blkaRu69SEx1D08B"
VIEW_NAME="🚨緊急発注アラート"

echo ""
echo "📋 実行内容:"
echo "- App Token: $APP_TOKEN"
echo "- Table ID: $TABLE_ID"
echo "- View Name: $VIEW_NAME"
echo ""

# Step 1: フィールド情報を取得
echo "1️⃣ フィールド情報を取得中..."
FIELDS_RESPONSE=$(npx -y @larksuiteoapi/lark-mcp mcp \
  --mode stdio \
  --app-id "$APP_ID" \
  --app-secret "$APP_SECRET" \
  --tools "bitable.v1.appTableField.list" \
  --silent \
  <<EOF
{
  "method": "tools/call",
  "params": {
    "name": "bitable.v1.appTableField.list",
    "arguments": {
      "path": {
        "app_token": "$APP_TOKEN",
        "table_id": "$TABLE_ID"
      },
      "params": {
        "page_size": 100
      }
    }
  }
}
EOF
)

if [ $? -eq 0 ]; then
    echo "✅ フィールド情報を取得しました"
else
    echo "⚠️  フィールド情報の取得に失敗しました（続行します）"
fi

# Step 2: Viewを作成
echo ""
echo "2️⃣ 緊急発注アラートViewを作成中..."
VIEW_RESPONSE=$(npx -y @larksuiteoapi/lark-mcp mcp \
  --mode stdio \
  --app-id "$APP_ID" \
  --app-secret "$APP_SECRET" \
  --tools "bitable.v1.appTableView.create" \
  --silent \
  <<EOF
{
  "method": "tools/call",
  "params": {
    "name": "bitable.v1.appTableView.create",
    "arguments": {
      "path": {
        "app_token": "$APP_TOKEN",
        "table_id": "$TABLE_ID"
      },
      "data": {
        "view_name": "$VIEW_NAME",
        "view_type": "grid"
      }
    }
  }
}
EOF
)

if [ $? -eq 0 ]; then
    echo "✅ Viewを作成しました！"
    
    # ViewIDを抽出（簡易的な方法）
    VIEW_ID=$(echo "$VIEW_RESPONSE" | grep -o '"view_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$VIEW_ID" ]; then
        echo "   View ID: $VIEW_ID"
    fi
else
    echo "❌ Viewの作成に失敗しました"
    echo "詳細: $VIEW_RESPONSE"
    exit 1
fi

# Step 3: 手動設定の案内
echo ""
echo "📝 手動設定が必要な項目:"
echo "================================"
echo ""
echo "以下のURLにアクセスして、Viewの設定を完了してください:"
echo "https://f82jyx0mblu.jp.larksuite.com/base/$APP_TOKEN?table=$TABLE_ID&view=$VIEW_ID"
echo ""
echo "【フィルター設定】"
echo "1. フィルターアイコンをクリック"
echo "2. AND条件で以下を設定:"
echo "   - 緊急発注フラグ = \"🚩緊急\""
echo "   - 発注残数 = 0"
echo "   - 在庫切れ予測 < 30"
echo "   - 30日販売数 > 0"
echo ""
echo "【ソート設定】"
echo "1. ソートアイコンをクリック"
echo "2. 以下の順序で設定:"
echo "   - 在庫切れ予測（昇順）"
echo "   - 30日販売数（降順）"
echo "   - 利益率（降順）"
echo ""
echo "【条件付き書式】"
echo "1. フォーマット → 条件付き書式"
echo "2. 在庫切れ予測:"
echo "   - ≤10日: 赤 (#FF4444)"
echo "   - 11-20日: 黄 (#FFD700)"
echo "   - 21-30日: 橙 (#FFA500)"
echo "3. 利益率:"
echo "   - ≥50%: 緑 (#90EE90)"
echo "   - 30-49%: 淡黄 (#FFFFE0)"
echo "   - <30%: 淡赤 (#FFE4E1)"
echo ""
echo "✨ 完了！"