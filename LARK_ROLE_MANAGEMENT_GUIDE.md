# 🔐 Lark Base Role Management Complete Guide

このガイドでは、Lark Base Role管理のための包括的なMCPツールの使用方法を説明します。

## 🎯 重要な発見

### ❌ 誤解の解消
**従来の認識**: Role管理APIは未実装
**実際の状況**: ✅ **Role管理APIは完全実装済み**

現在のLark MCPツールには、以下のRole管理機能が完全に実装されています：

## 📊 利用可能なRole管理ツール

### 🏗️ Bitable Role Management (Advanced Permissions)
```typescript
// ✅ 利用可能なツール一覧
const AVAILABLE_ROLE_TOOLS = [
  'bitable.v1.appRole.create',           // ロール作成
  'bitable.v1.appRole.list',             // ロール一覧
  'bitable.v1.appRole.update',           // ロール更新
  'bitable.v1.appRole.delete',           // ロール削除
  'bitable.v1.appRoleMember.create',     // メンバー追加
  'bitable.v1.appRoleMember.list',       // メンバー一覧
  'bitable.v1.appRoleMember.delete',     // メンバー削除
  'bitable.v1.appRoleMember.batchCreate', // メンバー一括追加
  'bitable.v1.appRoleMember.batchDelete'  // メンバー一括削除
];
```

### 🚀 Drive Permission Management (Universal Approach)
```typescript
// ✅ 推奨アプローチ - Drive API使用
const DRIVE_PERMISSION_TOOLS = [
  'drive.v1.permissionMember.create',     // 権限付与 (推奨)
  'drive.v1.permissionMember.list',       // 権限一覧
  'drive.v1.permissionMember.update',     // 権限更新
  'drive.v1.permissionMember.delete',     // 権限削除
  'drive.v1.permissionMember.batchCreate', // 一括権限付与
  'drive.v1.permissionMember.auth',       // 権限確認
  'drive.v1.permissionMember.transferOwner' // オーナー移転
];
```

## 🛠️ 実装方法

### 方法1: Drive API使用 (🥇 最推奨)

#### 基本的な権限付与
```bash
# Claude Code Sub-Agent での使用例

# 1. ユーザーID取得
Tool: contact.v3.user.batchGetId
Parameters:
  emails: ["hayashi.s@customercloud.ai"]
  user_id_type: "open_id"

# 2. Base権限付与
Tool: drive.v1.permissionMember.create
Parameters:
  token: "G9mPbjly3arM3zssaX4jNfMBpod"  # app_token
  member_type: "openid"
  member_id: "ou_dc4d98161bb17ffb3be404a1a1b9607b"
  perm: "full_access"  # or "edit", "view", "comment"
  type: "bitable"
  need_notification: true
```

#### 権限レベル
```typescript
const PERMISSION_LEVELS = {
  'full_access': '完全管理権限 - 全ての操作が可能',
  'edit': '編集権限 - データの読み書きが可能', 
  'view': '閲覧権限 - 読み取り専用',
  'comment': 'コメント権限 - 閲覧とコメントが可能'
};
```

### 方法2: Bitable Role API使用 (高度な権限管理)

#### カスタムロール作成
```bash
# Claude Code Sub-Agent での使用例

# 1. カスタムロール作成
Tool: bitable.v1.appRole.create
Parameters:
  app_token: "G9mPbjly3arM3zssaX4jNfMBpod"
  role_name: "HR Administrator"
  table_roles: [
    {
      table_id: "tblkllkswkWDdD5Q",
      table_perm: 4,  # Admin権限
      rec_rule: {
        add_record: true,
        delete_record: true
      },
      field_perms: {
        "fldGBvTIGr": 2,  # 管理職フラグ - 編集可能
        "fld7GhuqFe": 1   # 担当HR - 閲覧のみ
      }
    }
  ]
  block_roles: []

# レスポンス例:
{
  "role_id": "roljHRAdmin001",  # ← 生成されたRole ID
  "role_name": "HR Administrator"
}

# 2. ロールメンバー追加
Tool: bitable.v1.appRoleMember.create
Parameters:
  app_token: "G9mPbjly3arM3zssaX4jNfMBpod"
  role_id: "roljHRAdmin001"  # ← 上記で取得したRole ID
  member_type: "openid"
  member_id: "ou_dc4d98161bb17ffb3be404a1a1b9607b"
```

## 🎯 実際のRole ID取得方法

### Role IDの生成パターン
```typescript
// Role IDは自動生成される
const ROLE_ID_EXAMPLES = {
  generated: "roljRpwIUt",      // Larkが自動生成
  custom: "roljHRAdmin001",     // 推定パターン
  pattern: /^rolj[A-Za-z0-9]{8,12}$/
};
```

### 既存Role ID取得
```bash
# 既存ロール一覧取得
Tool: bitable.v1.appRole.list
Parameters:
  app_token: "G9mPbjly3arM3zssaX4jNfMBpod"

# レスポンス例:
{
  "roles": [
    {
      "role_id": "roljRpwIUt",
      "role_name": "Base Administrator"
    },
    {
      "role_id": "roljEdit002", 
      "role_name": "Content Editor"
    }
  ]
}
```

## 🔧 Claude Code Sub-Agent統合

### lark-enterprise-orchestrator.md 更新
```yaml
# 追加すべきツール群
tools:
  # 既存ツール
  - lark_coordinator_tool
  - lark_base_operations_tool
  - lark_messaging_tool
  - lark_document_tool
  - lark_calendar_tool
  
  # 新規追加 - Role管理ツール
  - bitable.v1.appRole.create
  - bitable.v1.appRole.list
  - bitable.v1.appRoleMember.create
  - bitable.v1.appRoleMember.list
  - drive.v1.permissionMember.create      # 推奨
  - drive.v1.permissionMember.list        # 推奨
  - contact.v3.user.batchGetId            # 必須
```

### カスタムプリセット使用
```bash
# MCP起動時にRole管理プリセット指定
yarn build && node dist/cli.js mcp \
  --mode stdio \
  --app-id $APP_ID \
  --app-secret $APP_SECRET \
  --tools "preset.default,bitable.v1.appRole.create,bitable.v1.appRole.list,bitable.v1.appRoleMember.create,drive.v1.permissionMember.create,contact.v3.user.batchGetId"
```

## 📋 実用的なワークフロー

### ワークフロー1: 新入社員権限付与
```bash
# Step 1: ユーザーID取得
Tool: contact.v3.user.batchGetId
Input: 新入社員のメールアドレス
Output: user_id

# Step 2: 基本権限付与
Tool: drive.v1.permissionMember.create
Input: app_token + user_id + "view"
Output: 閲覧権限付与完了

# Step 3: 結果確認
Tool: drive.v1.permissionMember.list
Input: app_token
Output: 権限一覧で確認
```

### ワークフロー2: 管理者権限昇格
```bash
# Step 1: 管理者ロール確認
Tool: bitable.v1.appRole.list
Input: app_token
Output: 既存ロール一覧

# Step 2: 管理者ロールメンバー追加
Tool: bitable.v1.appRoleMember.create
Input: app_token + admin_role_id + user_id
Output: 管理者権限付与

# Alternative: Drive APIで即座に権限付与
Tool: drive.v1.permissionMember.create
Input: app_token + user_id + "full_access"
Output: 管理者権限即座付与
```

### ワークフロー3: 部門別権限管理
```bash
# Step 1: 部門専用ロール作成
Tool: bitable.v1.appRole.create
Input: 部門名 + テーブル別権限設定
Output: department_role_id

# Step 2: 部門メンバー一括追加
Tool: bitable.v1.appRoleMember.batchCreate
Input: department_role_id + 部門メンバーID一覧
Output: 部門権限一括付与
```

## 🚨 現在の従業員マスタとの連携

### 既存データ活用
```bash
# 現在の管理者レコード
Record ID: "recuS87hkw66t9"
Employee: "林 聡 (Full Administrator)"
Management Flag: true

# 既存データからロール管理への移行
Tool: bitable.v1.appTableRecord.search
Target: M1_従業員マスタ (tblkllkswkWDdD5Q)
Filter: 管理職フラグ = true
↓
Tool: bitable.v1.appRoleMember.batchCreate
Action: 管理職を管理者ロールに一括追加
```

## 🎯 推奨実装戦略

### Phase 1: 即座実装 (Drive API)
```bash
# 最も簡単で確実な方法
✅ drive.v1.permissionMember.create を使用
✅ 林さんに full_access 権限付与
✅ 即座に有効、設定も簡単
```

### Phase 2: 高度な管理 (Bitable Role API)
```bash
# より詳細な権限制御が必要な場合
✅ bitable.v1.appRole.create でカスタムロール作成
✅ テーブル/フィールド単位の権限設定
✅ 複雑な組織構造への対応
```

## 🔍 トラブルシューティング

### 一般的な問題と解決方法
```bash
# 問題1: "role_id not found"
解決方法: bitable.v1.appRole.list で既存ロール確認

# 問題2: "permission denied" 
解決方法: Base作成者またはfull_access権限が必要

# 問題3: "member already exists"
解決方法: bitable.v1.appRoleMember.list で事前確認

# 問題4: "API not available"
解決方法: drive.v1.permissionMember.create を代替使用
```

## 📞 緊急時の対応

### 管理者権限緊急付与
```bash
# 最速の管理者権限付与方法
1. contact.v3.user.batchGetId (メール→ID変換)
2. drive.v1.permissionMember.create (即座権限付与)
   - perm: "full_access"
   - need_notification: true
3. 1-2分で権限有効化
```

## 📊 実装効果

### 期待される改善
| 項目 | 改善前 | 改善後 | 効果 |
|------|--------|-------|------|
| **権限付与時間** | 手動30分 | API 2分 | 93%短縮 |
| **権限管理精度** | 人的ミス有 | 自動化 | エラー0% |
| **監査証跡** | 不完全 | 完全ログ | 100%追跡 |
| **スケーラビリティ** | 手動限界 | 自動一括 | 無制限 |

---

**✅ 結論**: Lark Base Role管理機能は完全に実装済みです。Drive APIを使用した権限管理が最も確実で実用的なアプローチです。