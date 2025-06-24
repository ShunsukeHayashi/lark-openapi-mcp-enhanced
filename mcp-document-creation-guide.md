# MCPツールでドキュメント作成する方法

## 🎯 **現在の状況**

### ✅ **現在利用可能**
- `docx:document:readonly` - ドキュメント読み取り
- MCPツール経由でのLark Docs読み取り

### ❌ **追加が必要な権限**
```
docx:document              # ドキュメント作成・編集
docs:doc                   # Docs操作
docs:doc:readonly          # Docs読み取り
wiki:wiki                  # Wiki作成・編集
```

## 🚀 **MCPでできるドキュメント操作**

### 1. **Lark Docs作成**
```javascript
// 新しいドキュメント作成
{
  "tool": "docx.v1.document.create",
  "params": {
    "title": "MCPで作成したドキュメント",
    "content": "# はじめに\n\nこのドキュメントはMCPツールで自動生成されました。",
    "folder_token": "folder_id_here"
  }
}
```

### 2. **既存ドキュメント更新**
```javascript
// ドキュメント内容追加
{
  "tool": "docx.v1.document.patch",
  "params": {
    "document_id": "doc_id_here",
    "requests": [
      {
        "insertText": {
          "location": {"index": 0},
          "text": "新しいセクション\n"
        }
      }
    ]
  }
}
```

### 3. **Wiki作成**
```javascript
// Wiki ページ作成
{
  "tool": "wiki.v2.space.node.create",
  "params": {
    "space_id": "space_id_here",
    "obj_type": "doc",
    "title": "MCP自動生成Wiki",
    "content": "Wiki内容..."
  }
}
```

## 🔧 **実装手順**

### **Step 1: 権限追加**
```
https://open.feishu.cn/app/cli_a8d2fdb1f1f8d02d/dev-config/permission
```

以下の権限を追加:
```
docx:document              # ドキュメント作成・編集
docs:doc                   # Docs操作  
wiki:wiki                  # Wiki操作
```

### **Step 2: MCPツールでテスト**
```bash
# ドキュメント作成機能付きで起動
node dist/cli.js mcp --config config.json --tools "docs"
```

### **Step 3: 実際の作成例**
```javascript
// プロンプトからドキュメント自動生成
const doc_creation = {
  tool: "docx.v1.document.create",
  params: {
    title: "CRM設計書",
    content: `
# CRM システム設計書

## 概要
本ドキュメントはMCPツールにより自動生成されたCRM設計書です。

## 要件
- 顧客管理
- 案件管理
- 活動記録

## 設計
### データベース設計
[ER図をここに挿入]

### UI設計
[画面設計をここに挿入]
    `,
    folder_token: "target_folder"
  }
}
```

## 📋 **具体的な活用例**

### **例1: 設計書自動生成**
```
ユーザー: 「CRMのBase設計書をドキュメントで作って」
↓
AI (MCPツール経由):
1. 要件をヒアリング
2. Base設計を作成
3. Lark Docsで設計書を自動生成
4. ER図とテーブル定義を挿入
5. チームに共有
```

### **例2: 会議議事録生成**
```
ユーザー: 「今日の会議内容をまとめてドキュメントにして」
↓
AI (MCPツール経由):
1. 会議の録音/メモを分析
2. 要点を抽出・整理
3. 議事録をLark Docsで作成
4. アクションアイテムを自動抽出
5. 関係者に自動共有
```

### **例3: プロジェクト文書一括生成**
```
ユーザー: 「新プロジェクトの文書一式を作って」
↓
AI (MCPツール経由):
1. プロジェクト企画書
2. 要件定義書  
3. 設計書
4. テスト計画書
5. 運用手順書
→ 全て自動生成してフォルダに整理
```

## 🛠 **今すぐできること（現在の権限で）**

### **ドキュメント読み取り・分析**
```bash
# 既存ドキュメントの内容を分析
node dist/cli.js mcp --config config.json --tools "docs"

# 実行例:
# - 複数ドキュメントの内容要約
# - ドキュメント間の関連性分析
# - 情報抽出・構造化
```

### **現在利用可能なAPI**
```javascript
// ドキュメント読み取り
docx.v1.document.get
docx.v1.document.raw_content

// ドキュメント検索
docs.v1.document.search
```

## 🎯 **権限追加後にできること**

### **完全なドキュメント管理**
```javascript
// 作成
docx.v1.document.create

// 更新
docx.v1.document.patch
docx.v1.document.update

// コラボレーション
docx.v1.document.permission.create
docx.v1.document.permission.transfer
```

### **自動化ワークフロー**
```
要件入力 → AI分析 → ドキュメント生成 → フォーマット調整 → 自動共有
```

## 🚀 **次のステップ**

### **1. 権限追加（5分）**
開発者コンソールで権限追加

### **2. 簡単テスト（10分）**
```bash
# テスト用ドキュメント作成
curl -X POST "https://open.feishu.cn/open-apis/docx/v1/documents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "MCPテスト文書"}'
```

### **3. 本格活用（即座）**
MCPツール経由でのドキュメント自動生成開始！

## 💡 **ポイント**

- ✅ **読み取りは現在も可能** - 既存ドキュメントの分析はすぐできる
- 🔧 **作成には権限追加が必要** - でも5分で完了
- 🚀 **権限追加後は完全自動化** - ドキュメント作成から共有まで全自動

MCPツールでドキュメント作成は完全に可能です！権限を追加すれば即座に使えます。