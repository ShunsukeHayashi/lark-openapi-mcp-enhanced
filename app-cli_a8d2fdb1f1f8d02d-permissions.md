# 🔧 App ID: cli_a8d2fdb1f1f8d02d パーミッション設定ガイド

## 🎯 対象アプリ情報

**App ID**: `cli_a8d2fdb1f1f8d02d`  
**設定対象**: このアプリのパーミッション設定  
**目的**: Lark Base作成・管理機能の有効化

## 📋 開発者コンソール設定手順

### Step 1: コンソールアクセス

1. **Lark開発者コンソール**を開く: [https://open.feishu.cn](https://open.feishu.cn)
2. **ログイン**してアプリ一覧を表示
3. **App ID**: `cli_a8d2fdb1f1f8d02d` を検索・選択

### Step 2: パーミッション設定画面

1. 左サイドバーから**「権限とスコープ」**をクリック
2. **「アプリに権限スコープを追加」**をクリック

### Step 3: 推奨権限設定

#### 🔴 基本セット（Base作成用）
以下の権限を個別に追加：

```
✅ bitable:app （Base完全管理）
✅ im:message:send_as_bot （Bot送信）
```

#### 🟡 標準セット（通知機能付き）
```
✅ bitable:app
✅ im:message:send_as_bot  
✅ im:message （メッセージ読み取り）
✅ im:chat （チャット管理）
```

#### 🚀 完全セット（フル機能）
```
✅ bitable:app
✅ im:message:send_as_bot
✅ im:message
✅ im:chat
✅ docx:document （ドキュメント作成）
✅ contact:user.base:readonly （ユーザー情報）
```

### Step 4: 一括インポート方法

**「インポート」**ボタンを使用して以下のJSONを貼り付け：

#### 基本設定
```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "im:message:send_as_bot"
    ],
    "user": []
  }
}
```

#### 推奨設定
```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "im:message:send_as_bot",
      "im:message",
      "im:chat",
      "docx:document",
      "contact:user.base:readonly"
    ],
    "user": []
  }
}
```

### Step 5: バージョン公開

1. **「バージョン作成と公開」**タブに移動
2. **「バージョン作成」**をクリック
3. 変更内容を確認
4. **「公開申請」**を実行
5. 承認完了まで待機（通常5-10分）

## 🔍 権限詳細説明

### Base関連権限
| 権限 | 機能 | 必要性 |
|------|------|--------|
| `bitable:app` | Base作成・編集・削除・管理 | ✅ 必須 |
| `bitable:app:readonly` | Base読み取り専用 | 🟢 オプション |

### コミュニケーション権限
| 権限 | 機能 | 必要性 |
|------|------|--------|
| `im:message:send_as_bot` | Botとしてメッセージ送信 | ✅ 推奨 |
| `im:message` | メッセージ読み取り | 🟡 標準 |
| `im:chat` | チャット作成・管理 | 🟡 標準 |

### その他の権限
| 権限 | 機能 | 必要性 |
|------|------|--------|
| `docx:document` | ドキュメント作成・編集 | 🟢 オプション |
| `contact:user.base:readonly` | ユーザー基本情報読み取り | 🟢 オプション |

## ⚠️ 設定時の注意点

### 権限申請のコツ
1. **最小権限から開始** - まず`bitable:app`のみで動作確認
2. **段階的追加** - 必要に応じて権限を追加
3. **用途を明記** - 申請時に使用目的を詳細記述

### よくある問題と対策
1. **権限が見つからない**
   - 検索機能を活用
   - 正確な権限名を使用

2. **申請が通らない**
   - 権限の必要性を具体的に説明
   - 最小限の権限のみ申請

3. **権限が反映されない**
   - 公開完了後、5-30分待機
   - ブラウザキャッシュをクリア

## 🚀 設定完了後のテスト

### 認証テスト
App Secretが必要です。設定後に以下で確認：

```bash
curl -s "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
     -H "Content-Type: application/json" \
     -d '{"app_id":"cli_a8d2fdb1f1f8d02d","app_secret":"YOUR_APP_SECRET"}'
```

### 機能テスト
Claude Desktopでの動作確認：

```
「App ID cli_a8d2fdb1f1f8d02d を使用してテストBaseを作成してください」
```

## 📊 権限設定レベル比較

| レベル | Base作成 | メッセージ | ドキュメント | 推奨度 |
|--------|:--------:|:----------:|:------------:|:------:|
| 最小 | ✅ | ❌ | ❌ | 🟢 初心者 |
| 標準 | ✅ | ✅ | ❌ | 🟡 一般 |
| 完全 | ✅ | ✅ | ✅ | 🔴 上級者 |

## 🎯 次のステップ

### 設定完了後
1. **App Secret取得** - 認証情報として必要
2. **MCP設定更新** - 新しいApp IDでの設定
3. **動作テスト** - Base作成機能の確認

### 本格利用時
1. **権限の最適化** - 不要な権限の削除
2. **セキュリティ確認** - 定期的な権限レビュー
3. **機能拡張** - 必要に応じた権限追加

---

🔧 **App ID `cli_a8d2fdb1f1f8d02d` のパーミッション設定は上記手順で完了します。まずは基本権限から始めることをお勧めします。**