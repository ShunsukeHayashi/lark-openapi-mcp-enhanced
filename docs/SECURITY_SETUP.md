# セキュリティ設定ガイド

## 🚨 緊急対応が必要な事項

公開されたコードに認証情報が含まれていました。以下の手順で直ちに対応してください：

### 1. Lark App Secretの再生成

1. [Lark開発者コンソール](https://open.larksuite.com/app)にアクセス
2. アプリID `cli_a8d7e83aab78d02d` のアプリを選択
3. 「Credentials & Basic Info」セクションへ移動
4. 「Reset App Secret」をクリックして新しいSecretを生成
5. 新しいApp Secretをメモ（安全な場所に保管）

### 2. セキュアなコードの実装

提供した`gas-shift-management-secure.js`を使用してください。このバージョンでは：

- 認証情報をGoogle Apps ScriptのPropertiesServiceに保存
- コードに直接認証情報を記載しない
- UIから簡単に認証情報を設定可能

### 3. セットアップ手順

#### 3.1 コードのデプロイ

1. Google Apps Scriptエディタを開く
2. 既存のコードを削除
3. `gas-shift-management-secure.js`の内容をコピー
4. 保存

#### 3.2 認証情報の設定

1. スプレッドシートを開く
2. メニューから「シフト管理」→「認証情報設定」を選択
3. 新しいApp IDとApp Secretを入力
4. OKをクリック

#### 3.3 動作確認

1. メニューから「シフト管理」→「設定確認」を実行
2. 「Lark API接続: 成功」と表示されることを確認

## 🔒 今後のセキュリティベストプラクティス

### 1. 認証情報の管理

- **絶対にコードに直接記載しない**
- PropertiesServiceやEnvironment Variablesを使用
- 定期的にSecretを更新

### 2. アクセス制御

```javascript
// Webhookの署名検証を追加
function verifyWebhookSignature(request) {
  const signature = request.headers['X-Lark-Signature'];
  const timestamp = request.headers['X-Lark-Request-Timestamp'];
  
  // 署名検証ロジックを実装
  // ...
}
```

### 3. ログ管理

```javascript
// 認証情報をログに出力しない
function safeLog(message, data) {
  // センシティブ情報をマスク
  const sanitized = JSON.stringify(data)
    .replace(/app_secret":\s*"[^"]+"/g, 'app_secret":"***"')
    .replace(/Bearer\s+[^\s]+/g, 'Bearer ***');
  
  console.log(message, sanitized);
}
```

### 4. エラーハンドリング

```javascript
// エラーメッセージにセンシティブ情報を含めない
try {
  // API呼び出し
} catch (error) {
  // 認証情報を含まないエラーメッセージ
  throw new Error('API call failed. Check configuration.');
}
```

## 📋 チェックリスト

- [ ] Larkコンソールで新しいApp Secretを生成した
- [ ] 古いApp Secretを無効化した
- [ ] セキュアなコードに更新した
- [ ] PropertiesServiceに認証情報を設定した
- [ ] 動作確認を完了した
- [ ] チーム全員にセキュリティインシデントを共有した

## 🆘 トラブルシューティング

### 問題: 「認証情報が設定されていません」エラー

**解決方法:**
1. メニューから「認証情報設定」を実行
2. 正しいApp IDとApp Secretを入力

### 問題: API接続エラー

**確認事項:**
1. 新しいApp Secretが正しく入力されているか
2. Larkアプリが有効になっているか
3. 必要な権限が付与されているか

## 📞 サポート

セキュリティに関する質問や懸念事項がある場合は、直ちにチームリーダーまたはセキュリティ担当者に連絡してください。