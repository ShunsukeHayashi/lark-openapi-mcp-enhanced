# Lark MCP Bundles

MCPツールを専門分野ごとに分割したバンドル構成です。コンテキスト使用量を削減し、効率的に必要な機能だけを有効化できます。

## バンドル一覧

### 1. **base** - Base/Table専門 (15ツール)
- Lark Base アプリケーションの作成・管理
- テーブル、フィールド、レコードの操作
- ビュー、ダッシュボードの管理
- `bitable.*` APIグループ

### 2. **docs** - ドキュメント管理 (15ツール)
- ドキュメントの作成・編集・検索
- Wiki/知識ベースの管理
- スプレッドシートの操作
- ファイル/フォルダ管理
- `docx.*`, `docs.*`, `wiki.*`, `drive.*`, `sheets.*` APIグループ

### 3. **collab** - コラボレーション (15ツール)
- インスタントメッセージング
- カレンダー・イベント管理
- タスク管理
- ビデオ会議
- メール送信
- `im.*`, `calendar.*`, `vc.*`, `task.*`, `mail.*` APIグループ

### 4. **admin** - 管理者機能 (15ツール)
- ユーザー・部門管理
- セキュリティ・監査
- 承認ワークフロー
- 人事・勤怠管理
- OKR管理
- `admin.*`, `contact.*`, `hire.*`, `approval.*`, `okr.*` APIグループ

### 5. **genesis** - AI機能 (6ツール)
- AI駆動のBase作成
- 要件分析・最適化
- ビュー・ダッシュボード自動生成
- ワークフロー設計
- `genesis.*` APIグループ

## 使用方法

### 1. 環境変数の設定

```bash
export APP_ID="your_app_id"
export APP_SECRET="your_app_secret"
```

### 2. 単体バンドルの起動

```bash
# Base機能のみ
./bundles/start-bundle.sh base

# ドキュメント機能のみ
./bundles/start-bundle.sh docs

# コラボレーション機能のみ
./bundles/start-bundle.sh collab
```

### 3. Claude Desktopでの設定

1. `claude-desktop-config-example.json`を参考に設定
2. 必要なバンドルのみ有効化
3. APP_IDとAPP_SECRETを実際の値に置換

```json
{
  "mcpServers": {
    "lark-base": {
      "command": "bash",
      "args": [
        "/path/to/bundles/start-bundle.sh",
        "base"
      ],
      "env": {
        "APP_ID": "cli_xxxxx",
        "APP_SECRET": "xxxxx"
      }
    }
  }
}
```

## バンドル選択ガイド

| 用途 | 推奨バンドル | ツール数 |
|------|------------|----------|
| Base開発 | base + genesis | 21 |
| ドキュメント作成 | docs | 15 |
| チーム協業 | collab | 15 |
| 組織管理 | admin | 15 |
| 最小セット | custom-minimal | 6 |

## カスタムバンドルの作成

新しいバンドルを作成する場合：

1. `bundles/custom/config.json`を作成
2. 必要なツールを`tools`配列に指定
3. または`allowProjects`でAPIグループを指定

```json
{
  "appId": "${APP_ID}",
  "appSecret": "${APP_SECRET}",
  "tools": [
    "bitable.v1.app.list",
    "im.v1.message.create",
    "docx.builtin.search"
  ]
}
```

## パフォーマンス比較

| 構成 | ツール数 | コンテキスト使用 | 起動時間 |
|------|---------|----------------|----------|
| 全ツール | 1,300+ | 即座にオーバー | 遅い |
| 単一バンドル | 15 | 効率的 | 高速 |
| カスタム最小 | 6 | 最小 | 最速 |

## トラブルシューティング

### エラー: "Tool xxx is already registered"
同じツールが複数のバンドルで重複している場合に発生。
一度に1つのバンドルのみ有効化してください。

### エラー: "APP_ID not set"
環境変数が設定されていません。
`export APP_ID=xxx`を実行してください。