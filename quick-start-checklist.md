# ✅ Lark Bot クイックスタートチェックリスト

## 30分でLark Botを動かす！

### 📋 事前準備チェック
- [ ] Larkアカウントを持っている
- [ ] 管理者権限がある（またはアプリ作成権限）
- [ ] Node.js v18.20.8+ がインストール済み（`node -v`で確認）

---

## 🚀 5ステップ設定

### ステップ1️⃣: Larkアプリ作成（5分）
- [ ] [開発者コンソール](https://open.feishu.cn)にログイン
- [ ] カスタムアプリを作成
- [ ] App ID をコピー: `cli_________________`
- [ ] App Secret をコピー: `________________________`
- [ ] Bot機能を有効化

### ステップ2️⃣: 権限設定（5分）
- [ ] 「権限とスコープ」タブを開く
- [ ] 以下の最小権限を追加：
  ```
  im:message:send_as_bot
  im:chat:readonly
  ```
- [ ] アプリを公開（バージョン作成→公開申請）

### ステップ3️⃣: MCPツールインストール（5分）
- [ ] ターミナル/コマンドプロンプトを開く
- [ ] 以下を実行：
  ```bash
  npm install -g @larksuiteoapi/lark-mcp
  ```
- [ ] インストール確認：
  ```bash
  lark-mcp -V
  ```

### ステップ4️⃣: Claude Desktop設定（10分）
- [ ] 設定ファイルを開く：
  - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

- [ ] 以下を追加（YOUR_APP_IDとYOUR_APP_SECRETを置き換え）：
  ```json
  {
    "mcpServers": {
      "lark_bot": {
        "command": "npx",
        "args": [
          "-y",
          "@larksuiteoapi/lark-mcp",
          "mcp",
          "-a",
          "YOUR_APP_ID",
          "-s",
          "YOUR_APP_SECRET"
        ]
      }
    }
  }
  ```

- [ ] Claude Desktopを再起動

### ステップ5️⃣: 動作テスト（5分）
- [ ] Claude Desktopで🔧アイコンが表示されることを確認
- [ ] 以下のテストメッセージを送信：
  ```
  「Larkボットの接続状態を確認してください」
  ```
- [ ] 成功したら、実際のタスクを試す：
  ```
  「Larkで'テストメッセージ'を送信してください」
  ```

---

## 🎯 よくあるエラーと解決策

### ❌ エラー1: "Permission denied"
```yaml
原因: 権限が不足している
解決: 
  1. 権限を再確認
  2. アプリが公開されているか確認
  3. 10分待って再試行
```

### ❌ エラー2: "lark-mcp: command not found"
```yaml
原因: MCPツールがインストールされていない
解決:
  1. npm install -g @larksuiteoapi/lark-mcp を再実行
  2. sudoを使用: sudo npm install -g @larksuiteoapi/lark-mcp
  3. npmのパスを確認: npm config get prefix
```

### ❌ エラー3: "Connection failed"
```yaml
原因: App ID/Secretが間違っている
解決:
  1. 認証情報を再確認
  2. 余分なスペースがないか確認
  3. 新しいApp Secretを生成
```

---

## 🚀 次のレベルへ

### 権限追加でできること
```yaml
メッセージ管理:
  - im:message             # メッセージ読み取り
  - im:chat                # チャット作成・管理

ドキュメント:
  - docx:document          # ドキュメント作成
  - docs:doc:readonly      # Docs読み取り

Base（データベース）:
  - bitable:app:readonly   # Base読み取り
  - bitable:app            # Base作成・管理

カレンダー:
  - calendar:event         # イベント作成
  - calendar:calendar:readonly # カレンダー読み取り
```

### 高度な設定
```bash
# プリセット使用（推奨）
lark-mcp mcp -a APP_ID -s APP_SECRET -t preset.im.default

# 特定のツールのみ有効化
lark-mcp mcp -a APP_ID -s APP_SECRET --tools "im,docs"

# デバッグモード
lark-mcp mcp -a APP_ID -s APP_SECRET --debug
```

---

## 📚 参考リンク

- 🔐 [権限詳細ガイド](./permissions-matrix.md)
- 🤖 [完全セットアップガイド](./complete-bot-setup-guide.md)
- 📋 [トラブルシューティング](./troubleshooting.md)
- 🚀 [高度な使用例](./advanced-usage.md)

---

## ✨ 成功のコツ

1. **最小権限から始める** - まずはメッセージ送信だけ
2. **段階的に拡張** - 動作確認後に権限追加
3. **エラーメッセージを読む** - 多くの場合、解決策が書いてある
4. **10分待つ** - 権限反映には時間がかかることがある

---

🎉 **おめでとうございます！** これでAIアシスタントがLarkで作業できるようになりました！