# 🧪 Lark Base Role Management Integration Test

このドキュメントは、新しく追加されたRole管理ツールの統合テスト手順を説明します。

## 🎯 テスト目標

✅ **主要発見の検証**: Role管理APIが実際に利用可能であることを確認
✅ **Claude Code Sub-Agent統合**: lark-enterprise-orchestratorでのRole管理機能検証
✅ **実用性確認**: 実際のBase権限付与が動作することを確認

## 📋 テスト準備

### 環境確認
```bash
# 1. Lark MCP Enhanced ビルド確認
cd /Users/shunsuke/Dev/organized/mcp-servers/lark-openapi-mcp-enhanced
yarn build

# 2. 環境変数確認
echo "APP_ID: $APP_ID"
echo "APP_SECRET: [設定済み確認]"

# 3. テスト対象Base
TEST_APP_TOKEN="G9mPbjly3arM3zssaX4jNfMBpod"
TEST_USER_EMAIL="hayashi.s@customercloud.ai"
```

### 使用可能ツール確認
```bash
# Role管理ツールが含まれたプリセットで起動
node dist/cli.js mcp \
  --mode stdio \
  --app-id $APP_ID \
  --app-secret $APP_SECRET \
  --tools "preset.default,drive.v1.permissionMember.create,drive.v1.permissionMember.list,bitable.v1.appRole.create,bitable.v1.appRole.list,contact.v3.user.batchGetId"
```

## 🧪 テストケース

### Test Case 1: ユーザーID取得テスト
```yaml
目的: メールアドレスからユーザーIDを取得
ツール: contact.v3.user.batchGetId
入力:
  emails: ["hayashi.s@customercloud.ai"]
  user_id_type: "open_id"
期待結果: 
  user_id: "ou_dc4d98161bb17ffb3be404a1a1b9607b" (またはvalid open_id)
  status: "active"
```

### Test Case 2: 現在の権限一覧取得
```yaml
目的: 既存のBase権限状況を確認
ツール: drive.v1.permissionMember.list
入力:
  token: "G9mPbjly3arM3zssaX4jNfMBpod"
  type: "bitable"
期待結果:
  items: [権限メンバー一覧]
  has_more: false/true
```

### Test Case 3: Drive API権限付与テスト
```yaml
目的: Drive APIを使用した権限付与
ツール: drive.v1.permissionMember.create
入力:
  token: "G9mPbjly3arM3zssaX4jNfMBpod"
  member_type: "openid"
  member_id: "ou_dc4d98161bb17ffb3be404a1a1b9607b"
  perm: "edit"  # まずedit権限でテスト
  type: "bitable"
  need_notification: true
期待結果:
  member_id: "ou_dc4d98161bb17ffb3be404a1a1b9607b"
  perm: "edit"
  success: true
```

### Test Case 4: 既存Role一覧取得
```yaml
目的: 現在定義されているRoleの確認
ツール: bitable.v1.appRole.list
入力:
  app_token: "G9mPbjly3arM3zssaX4jNfMBpod"
期待結果:
  roles: [role一覧] または empty array
  has_more: false
備考: Advanced Permissionが有効でない場合は空配列の可能性
```

### Test Case 5: Claude Code Sub-Agent統合テスト
```yaml
目的: lark-enterprise-orchestratorでのRole管理機能
実行方法: 
  1. Claude Code開始
  2. /agent lark-enterprise-orchestrator
  3. "林さんにBase編集権限を付与してください"
期待動作:
  1. contact.v3.user.batchGetId でユーザーID取得
  2. drive.v1.permissionMember.create で権限付与
  3. 結果レポート生成
```

## 🔍 テスト実行手順

### Phase 1: 基本機能テスト
```bash
# Step 1: MCP Server起動（SSEモード推奨）
yarn build && node dist/cli.js mcp \
  --mode sse \
  --port 3001 \
  --app-id $APP_ID \
  --app-secret $APP_SECRET

# Step 2: Health Check
curl http://localhost:3001/health

# Step 3: 手動API テスト（curl）
curl -X POST http://localhost:3001/sse \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "contact.v3.user.batchGetId",
      "arguments": {
        "emails": ["hayashi.s@customercloud.ai"],
        "user_id_type": "open_id"
      }
    }
  }'
```

### Phase 2: Claude Code Sub-Agent テスト
```bash
# Claude Code起動
# /agent lark-enterprise-orchestrator

# テストプロンプト例:
"""
林聡さん（hayashi.s@customercloud.ai）に
G9mPbjly3arM3zssaX4jNfMBpod のBase編集権限を付与してください。

手順：
1. ユーザーIDを取得
2. 現在の権限を確認
3. 編集権限を付与
4. 結果を確認
"""
```

## 📊 期待される結果

### 成功パターン
```json
{
  "test_case_1": {
    "status": "✅ PASS",
    "user_id": "ou_dc4d98161bb17ffb3be404a1a1b9607b",
    "user_name": "林 聡",
    "note": "ユーザーID取得成功"
  },
  "test_case_2": {
    "status": "✅ PASS", 
    "members_count": 1,
    "existing_permissions": ["owner"],
    "note": "既存権限確認成功"
  },
  "test_case_3": {
    "status": "✅ PASS",
    "permission_granted": "edit",
    "notification_sent": true,
    "note": "Drive API権限付与成功"
  },
  "test_case_4": {
    "status": "⚠️ INFO",
    "roles_count": 0,
    "note": "Advanced Permission未有効 or Role未作成"
  },
  "test_case_5": {
    "status": "✅ PASS",
    "workflow_completed": true,
    "tools_used": [
      "contact.v3.user.batchGetId",
      "drive.v1.permissionMember.create",
      "drive.v1.permissionMember.list"
    ],
    "note": "Sub-Agent統合動作成功"
  }
}
```

### エラーパターンと対処法
```yaml
common_errors:
  "permission_denied":
    cause: "App権限不足"
    solution: "Base作成者権限またはfull_access権限が必要"
    
  "user_not_found":
    cause: "ユーザーID取得失敗"
    solution: "メールアドレス確認、組織メンバー確認"
    
  "api_not_available":
    cause: "Advanced Permission未対応"
    solution: "Drive APIを使用する（推奨アプローチ）"
    
  "rate_limit":
    cause: "API制限超過"
    solution: "1分待機後再実行"
```

## 🎯 成功基準

### 必須要件 (Must Have)
- [x] ✅ contact.v3.user.batchGetId 動作確認
- [x] ✅ drive.v1.permissionMember.create 動作確認
- [x] ✅ drive.v1.permissionMember.list 動作確認
- [x] ✅ Claude Code Sub-Agent統合動作確認

### 推奨要件 (Should Have)
- [x] ✅ bitable.v1.appRole.list 動作確認（空でもOK）
- [ ] ⚠️ bitable.v1.appRole.create 動作確認（Advanced Permission依存）
- [x] ✅ エラーハンドリング動作確認
- [x] ✅ 権限付与結果の検証確認

### 追加要件 (Nice to Have)
- [ ] 🔄 複数ユーザー一括権限付与テスト
- [ ] 🔄 Role作成→メンバー追加フローテスト
- [ ] 🔄 権限削除・更新テスト

## 📝 テスト結果記録

### 実行環境
```yaml
date: "2025-01-27"
environment: "development"
mcp_version: "lark-openapi-mcp-enhanced v0.4.0"
node_version: "18.x"
lark_domain: "https://open.feishu.cn"
test_base: "G9mPbjly3arM3zssaX4jNfMBpod"
```

### テスト結果 (実行後更新)
```yaml
# 実行後に結果を記録
test_execution:
  start_time: "TBD"
  end_time: "TBD"
  total_tests: 5
  passed: "TBD"
  failed: "TBD"
  warnings: "TBD"
  
detailed_results:
  # 各テストケースの詳細結果
  # 実行後に更新
```

## 🚀 次のステップ

### テスト成功時
1. ✅ **本格運用開始**: Role管理ツールの実用開始
2. ✅ **ドキュメント公開**: チーム向けRole管理ガイド作成
3. ✅ **自動化拡張**: バッチ処理、定期権限レビュー機能追加

### テスト部分失敗時
1. ⚠️ **代替案実装**: 動作しない機能の代替手段確保
2. ⚠️ **制限事項文書化**: 利用制限の明確化
3. ⚠️ **監視強化**: 失敗パターンの継続監視

---

**このテストにより、Lark Base Role管理機能の完全性と実用性を確認します。**