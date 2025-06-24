# 📄 Lark Document Creation Test

## 🎯 Document Creation Command

Claude Desktopで以下のコマンドを実行してください：

### 基本ドキュメント作成
```
「Lark MCPツールを使用して新しいドキュメントを作成してください。

ドキュメント名: MCP Agent Test Document
内容:
- Enhanced MCP Agent v2.0 の概要
- User Access Token実装完了
- LarkSuite domain修正完了
- Base作成機能テスト結果

User Access Token: u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI
Domain: https://open.larksuite.com

ドキュメント作成をテストしてください。」
```

### 詳細レポート作成
```
「以下の内容でLarkドキュメントを作成してください：

タイトル: TeachableCRM-Integration システム構築レポート

内容:
# システム構築完了報告

## 1. 実装システム概要
- システム名: TeachableCRM-Integration
- 構築日: 2025-06-23
- Agent Version: Enhanced MCP Agent v2.0

## 2. 作成されたBase
### v1.0 Base
- URL: https://feishu.cn/base/QsyGbbnQ6aUdaMscMJ8jVHoFpHb
- テーブル数: 6
- 機能: 基本CRM機能

### v2.0 Enhanced Base  
- URL: https://feishu.cn/base/MCiqbFD1waxdewsR519j3tJbpuz
- テーブル数: 6 (高度なフィールドタイプ)
- 機能: 拡張CRM機能

## 3. 技術実装詳細
- App ID: cli_a8d2fdb1f1f8d02d
- Authentication: User Access Token実装
- Domain: LarkSuite国際版対応
- MCP Tools: 完全動作確認済み

## 4. 次のステップ
- テーブル間リレーション設定
- ロールアップ計算実装
- ワークフロー自動化
- 本格運用開始

このレポートをLarkドキュメントとして作成してください。」
```

## 🔧 Document API Test Commands

### API直接テスト
```bash
# Create document test
curl -X POST "https://open.larksuite.com/open-apis/docx/v1/documents" \
     -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "MCP Agent Test Document",
       "folder_token": ""
     }'
```

### Document Content Addition
```bash
# Add content to document
curl -X POST "https://open.larksuite.com/open-apis/docx/v1/documents/{document_id}/blocks" \
     -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     -H "Content-Type: application/json" \
     -d '{
       "children": [
         {
           "block_type": 2,
           "text": {
             "elements": [
               {
                 "text_run": {
                   "content": "Enhanced MCP Agent v2.0 Test Document"
                 }
               }
             ]
           }
         }
       ]
     }'
```

## 📊 Expected Results

### Success Indicators
- ✅ Document creation successful
- ✅ Title and content properly set
- ✅ Document accessible via Lark interface
- ✅ Sharing permissions configured

### Document Features to Test
- **Rich Text**: 書式設定とスタイル
- **Tables**: データ表の挿入
- **Images**: 画像とメディア
- **Links**: 内部・外部リンク
- **Collaboration**: 共有と権限設定

## 🎯 Advanced Document Tests

### Template Document Creation
```
「Larkドキュメントテンプレートを作成してください：

タイトル: CRM業務フローガイド

セクション:
1. 新規顧客登録手順
2. VIPメンバー管理プロセス
3. 売上データ分析方法
4. 月次レポート作成手順

各セクションに詳細な説明と、対応するBaseテーブルへのリンクを含めてください。」
```

### Integration Test
```
「Base作成とドキュメント作成を組み合わせてテストしてください：

1. 新しいBase 'Doc-Integration-Test' を作成
2. そのBaseの使用方法を説明するドキュメントを作成
3. ドキュメント内にBase URLへのリンクを挿入
4. 両方の作成結果を報告

これにより、BaseとDocumentの連携機能をテストします。」
```

## 🔍 Troubleshooting

### Common Document Issues
1. **Permission denied**
   - 解決策: `docx:document` 権限確認
   
2. **Template not found**
   - 解決策: Document type指定
   
3. **Content formatting errors**
   - 解決策: Rich text format確認

### Debug Commands
```bash
# Check document permissions
curl -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     "https://open.larksuite.com/open-apis/docx/v1/documents"

# List available templates
curl -H "Authorization: Bearer u-feLBF4cHZbUqy4aO.uPPoRY05516542roO0w407w22ZI" \
     "https://open.larksuite.com/open-apis/docx/v1/document_templates"
```

---

📄 **Document creation test ready! Execute the commands in Claude Desktop to test Lark document creation functionality.**