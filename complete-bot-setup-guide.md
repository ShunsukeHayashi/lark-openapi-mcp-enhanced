# 🤖 Lark Bot 完全セットアップガイド

## 概要

MCPボットの作成は4つの主要段階で構成されます：

1. **Larkアプリの作成** - Lark開発者コンソールでボットのIDと権限を設定
2. **環境構築** - Node.jsとlark-mcpツールのインストール
3. **MCPサービスの実行** - コンピューター上でMCPツールを起動し、Larkアプリに接続
4. **AIエージェントとの統合** - AIツールが実行中のMCPサービスを使用するよう設定

---

## ステップ1: Larkアプリケーションの作成と設定

### 1.1 アプリの作成

1. **[Lark開発者コンソール](https://open.feishu.cn)** にログイン
2. **「カスタムアプリを作成」** をクリック
3. アプリ名（例：「AI Assistant Bot」）と説明を入力

### 1.2 認証情報の取得

1. アプリページで **「認証情報と基本情報」** タブを開く
2. **App ID** と **App Secret** をメモ（安全に保管）

### 1.3 Bot機能の有効化

1. **「機能の追加」** タブへ移動
2. **「Bot」** 機能を有効化

### 1.4 権限の設定（最重要）

1. **「権限とスコープ」** タブへ移動
2. **「アプリに権限スコープを追加」** をクリック
3. 必要な権限を選択：

#### 基本的な開始点（グループチャット作成とメッセージ送信）
```
im:chat                    # チャット管理
im:message:send_as_bot     # Botとしてメッセージ送信
```

#### 推奨権限セット（一般的な用途）
```
im:message
im:message:send_as_bot
im:chat
im:chat:readonly
im:resource
contact:user.base:readonly
contact:contact:readonly
calendar:calendar:readonly
calendar:event
docx:document:readonly
```

### 1.5 アプリの公開

1. 権限設定後、**「バージョン作成と公開」** をクリック
2. リリースプロセスを完了して権限を有効化

---

## ステップ2: ローカル環境のセットアップ

### 2.1 Node.jsのインストール

1. **Node.js v18.20.8以上** が必要
2. [Node.js公式サイト](https://nodejs.org/)からダウンロード
3. インストール確認：
   ```bash
   node -v
   npm -v
   ```

### 2.2 lark-mcpツールのインストール

```bash
npm install -g @larksuiteoapi/lark-mcp
```

権限エラーが発生した場合：
- **macOS/Linux**: `sudo npm install -g @larksuiteoapi/lark-mcp`
- **Windows**: 管理者権限でコマンドプロンプトを実行

インストール確認：
```bash
lark-mcp -V
```

---

## ステップ3: MCPサービスの実行

### オプションA: 基本起動（アプリケーションID使用）

最もシンプルな方法。ボットは自身として動作します。

```bash
lark-mcp mcp -a <your_app_id> -s <your_app_secret>
```

### オプションB: 高度な起動（プリセットツールセット使用）

APIの公開を制御し、トークン使用量を削減。メッセージとチャット管理のプリセットを使用：

```bash
lark-mcp mcp -a <your_app_id> -s <your_app_secret> -t preset.im.default
```

### オプションC: 高度な起動（ユーザーID使用）

Bitable作成など、特定のユーザーとして実行する必要がある場合：

1. `user_access_token`を取得（FAQの手順を参照）
2. `-u`フラグを使用してサービスを実行：

```bash
lark-mcp mcp -a <your_app_id> -s <your_app_secret> -u <your_user_access_token>
```

**重要**: コマンド実行後、ターミナルウィンドウは開いたままにしてください。MCPサービスが実行中で、AIエージェントからの指示を待っています。

---

## ステップ4: AIエージェントとの統合

### Claude Desktopの例

1. Claude Desktopの設定ファイルを開く：
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. 以下の設定を追加：

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
        "<your_app_id>",
        "-s",
        "<your_app_secret>"
      ]
    }
  }
}
```

プリセットを使用する場合：
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
        "<your_app_id>",
        "-s",
        "<your_app_secret>",
        "-t",
        "preset.im.default"
      ]
    }
  }
}
```

3. Claude Desktopを再起動

---

## ステップ5: ボットのテスト

### 5.1 準備

1. LarkでボットをグループチャットにInvite
2. AIエージェントのチャットインターフェースを開く

### 5.2 テストコマンド例

#### 基本的なメッセージ送信
```
「Larkボットを使って、'プロジェクトフェニックス'グループに'おはようございます！今日の会議は10時からです。'というメッセージを送信してください」
```

#### グループチャット作成
```
「新しいグループチャット'開発チーム'を作成して、'ようこそ！'というメッセージを送信してください」
```

#### カレンダーイベント作成（カレンダー権限が必要）
```
「明日の午後2時に'プロジェクトレビュー'という1時間の会議をカレンダーに追加してください」
```

---

## 📋 トラブルシューティング

### よくある問題と解決策

#### 1. 権限エラー
```
エラー: "Permission denied"
```
**解決策**: 
- 開発者コンソールで必要な権限が追加されているか確認
- アプリが公開されているか確認

#### 2. 接続エラー
```
エラー: "Connection failed"
```
**解決策**:
- App IDとApp Secretが正しいか確認
- ネットワーク接続を確認

#### 3. ツールが見つからない
```
エラー: "Tool not found"
```
**解決策**:
- プリセットを使用している場合、必要なツールが含まれているか確認
- `-t`パラメータを調整または削除

---

## 🚀 次のステップ

### 権限の拡張
基本機能が動作したら、以下の権限を追加して機能を拡張：

```yaml
Base操作:
  - bitable:app
  - bitable:table
  - bitable:record

ドキュメント作成:
  - docx:document
  - docs:doc

タスク管理:
  - task:task
```

### 高度な使用例

#### CRM Base自動作成
```
「顧客管理用のBaseを作成して、顧客情報、案件、活動記録のテーブルを設定してください」
```

#### 自動レポート生成
```
「今週の活動をまとめてLarkドキュメントを作成し、チームに共有してください」
```

---

## 🔗 関連リソース

- [Lark開発者コンソール](https://open.feishu.cn)
- [権限詳細ガイド](./permissions-matrix.md)
- [MCPツール設定詳細](./CLAUDE.md)
- [プロンプト管理システム](./prompt-management/README.md)

これで、AIアシスタントがLarkで様々なタスクを実行できるようになります！🎉