# 🚀 Base Creation Test Guide

## 🎯 Quick Base Creation Test

MCPサーバーが起動しています。Claude Desktopで以下のコマンドをテストしてください：

### 基本的なBase作成
```
「新しいBaseを作成してください。名前は'テストBase'にしてください」
```

### CRM Base作成
```
「CRM用のBaseを作成してください。以下のテーブルを含めてください：
1. 顧客情報テーブル（会社名、担当者、連絡先）
2. 案件テーブル（案件名、金額、ステータス）
3. 活動記録テーブル（日付、活動内容、顧客）」
```

### プロジェクト管理Base
```
「プロジェクト管理用のBaseを作成してください：
- プロジェクトテーブル
- タスクテーブル  
- メンバーテーブル
- 進捗管理テーブル」
```

## 🔧 Current Status

✅ **MCP Server**: 起動完了  
✅ **App Credentials**: 設定済み  
✅ **Base Permissions**: `bitable:app` 権限が必要  
⚠️ **権限確認**: 開発者コンソールで権限が有効か確認してください

## 📊 Expected Results

成功時の応答例：
```
✅ Base 'テストBase' を作成しました
📊 Base ID: bascXXXXXXXXXX  
🔗 URL: https://xxxxx.feishu.cn/base/bascXXXXXXXXXX
```

エラー時の対処：
- **Permission denied** → 権限インポートが必要
- **Authentication failed** → App Secret確認
- **Connection timeout** → ネットワーク確認

## 🔗 Useful Links

- [Base Permissions Import](./base-permissions-final.md)
- [Setup Guide](./base-setup-guide.md)
- [Lark Developer Console](https://open.feishu.cn)

## 🎯 Next Steps

1. **Base作成テスト** - 上記コマンドを実行
2. **権限確認** - エラーが出た場合は権限インポート
3. **機能テスト** - テーブル・レコード操作
4. **自動化設定** - プロンプトチェーン実装

準備完了！Claude Desktopでテストを開始してください。