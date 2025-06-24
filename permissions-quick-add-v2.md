# 🔐 Lark MCP 権限設定ガイド

## 🚀 クイックスタート

### 開発者コンソール
```
https://open.feishu.cn/app/cli_a8d2fdb1f1f8d02d/dev-config/permission
```

## 📋 権限セット（コピペ用）

### 🟢 スターターセット（基本機能）
```
im:message
im:message:send_as_bot
im:chat:readonly
contact:user.base:readonly
docx:document:readonly
```

### 🟡 スタンダードセット（推奨）
```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
contact:department.base:readonly
calendar:calendar:readonly
calendar:event
docx:document
docs:doc
sheets:spreadsheet:readonly
drive:drive:readonly
bitable:app:readonly
bitable:table:readonly
bitable:record:readonly
```

### 🔴 プロフェッショナルセット（全機能）
```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
contact:department.base:readonly
contact:user.email:readonly
contact:user.employee_id:readonly
calendar:calendar
calendar:calendar:readonly
calendar:event
docx:document
docs:doc
docs:doc:readonly
sheets:spreadsheet
drive:drive
drive:drive:readonly
task:task
task:task:readonly
bitable:app
bitable:table
bitable:record
bitable:field:readonly
wiki:wiki
wiki:wiki:readonly
approval:approval:readonly
attendance:attendance:readonly
```

## 🎯 用途別権限ガイド

### 💬 **チャット自動化**
```yaml
必須:
  - im:message              # メッセージ読み取り
  - im:message:send_as_bot  # Bot送信
  - im:chat:readonly        # チャット情報

推奨:
  - im:resource            # ファイル・画像
  - im:chat                # チャット管理
```

### 📊 **Base（データベース）操作**
```yaml
読み取り専用:
  - bitable:app:readonly    # Base読み取り
  - bitable:table:readonly  # テーブル読み取り
  - bitable:record:readonly # レコード読み取り

フル機能:
  - bitable:app            # Base作成・管理
  - bitable:table          # テーブル作成・管理
  - bitable:record         # レコード作成・管理
  - bitable:field:readonly # フィールド情報
```

### 📄 **ドキュメント管理**
```yaml
読み取り専用:
  - docx:document:readonly  # ドキュメント読み取り
  - docs:doc:readonly      # Docs読み取り

フル機能:
  - docx:document          # ドキュメント作成・編集
  - docs:doc               # Docs作成・編集
  - wiki:wiki              # Wiki作成・編集
```

### 📅 **カレンダー連携**
```yaml
基本:
  - calendar:calendar:readonly  # カレンダー読み取り
  - calendar:event             # イベント管理

拡張:
  - calendar:calendar          # カレンダー作成・管理
```

### 📈 **スプレッドシート処理**
```yaml
基本:
  - sheets:spreadsheet:readonly # 読み取り専用

フル機能:
  - sheets:spreadsheet         # 作成・編集
```

### 👥 **ユーザー情報取得**
```yaml
基本:
  - contact:user.base:readonly      # 基本情報
  - contact:contact:readonly        # 連絡先

拡張:
  - contact:department.base:readonly # 部門情報
  - contact:user.email:readonly     # メールアドレス
  - contact:user.employee_id:readonly # 従業員ID
```

### ✅ **タスク・プロジェクト管理**
```yaml
基本:
  - task:task:readonly      # タスク読み取り

フル機能:
  - task:task              # タスク作成・管理
```

### 📁 **ファイル管理**
```yaml
読み取り専用:
  - drive:drive:readonly    # ドライブ読み取り

フル機能:
  - drive:drive            # ドライブ管理
```

### 🔄 **ワークフロー**
```yaml
承認:
  - approval:approval:readonly  # 承認情報読み取り

勤怠:
  - attendance:attendance:readonly # 勤怠情報読み取り
```

## 🛠️ 権限追加手順

### 1️⃣ 開発者コンソールを開く
```
https://open.feishu.cn/app/cli_a8d2fdb1f1f8d02d/dev-config/permission
```

### 2️⃣ 権限を検索・追加
1. 「権限を追加」をクリック
2. 権限名で検索（例: `bitable`）
3. 必要な権限を選択
4. 「追加」をクリック

### 3️⃣ アプリを再公開
1. 「バージョン管理」へ移動
2. 新しいバージョンを作成
3. 公開申請を提出

## 💡 ベストプラクティス

### ✅ **段階的アプローチ**
1. **Week 1**: スターターセットで基本機能確認
2. **Week 2**: 必要に応じて権限追加
3. **Week 3**: フル機能へ拡張

### ✅ **セキュリティ考慮**
- 最小権限の原則を守る
- 読み取り専用から始める
- 必要な時だけ書き込み権限を追加

### ✅ **チーム連携**
- 権限変更は事前にチームに通知
- ドキュメントに変更履歴を記録
- テスト環境で検証後に本番適用

## 🔍 トラブルシューティング

### ❌ **権限エラーの対処**
```yaml
"Permission denied":
  - 必要な権限が追加されているか確認
  - アプリが公開されているか確認
  - トークンが正しいか確認

"API not found":
  - 権限名が正しいか確認
  - APIが利用可能か確認
```

### 📝 **権限確認コマンド**
```bash
# 現在の権限を確認
curl -X GET "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal" \
  -H "Content-Type: application/json" \
  -d '{"app_id":"cli_a8d2fdb1f1f8d02d","app_secret":"..."}'
```

## 📊 権限マトリックス

| 機能 | 読み取り | 作成・編集 | 削除 |
|------|----------|------------|------|
| メッセージ | `im:message` | `im:message:send_as_bot` | - |
| Base | `bitable:app:readonly` | `bitable:app` | `bitable:app` |
| ドキュメント | `docx:document:readonly` | `docx:document` | `docx:document` |
| カレンダー | `calendar:calendar:readonly` | `calendar:event` | `calendar:event` |
| タスク | `task:task:readonly` | `task:task` | `task:task` |

## 🎯 次のステップ

1. **現在の権限確認** → 不足を特定
2. **必要な権限を追加** → 用途別ガイド参照
3. **アプリ再公開** → 変更を反映
4. **動作テスト** → Claude Desktop で確認

---

💡 **ヒント**: 権限は後から追加できるので、まずは最小限から始めて徐々に拡張していくのがおすすめです。