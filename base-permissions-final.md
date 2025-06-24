# 🎯 Base作成用 - 最終権限設定

## ✅ Base作成に必要な権限（確認済み）

有効な権限リストから、Base作成に必要な権限を抽出：

### 🔴 Base作成・管理セット（推奨）
```json
{
  "scopes": {
    "tenant": [
      "bitable:app",
      "im:message:send_as_bot",
      "im:message",
      "im:chat",
      "im:chat:create",
      "docx:document",
      "docx:document:create",
      "contact:user.base:readonly",
      "drive:drive",
      "drive:file"
    ],
    "user": []
  }
}
```

### 🟡 Base読み取り専用セット
```json
{
  "scopes": {
    "tenant": [
      "bitable:app:readonly",
      "im:message:send_as_bot",
      "docx:document:readonly",
      "contact:user.base:readonly"
    ],
    "user": []
  }
}
```

## 📋 Base関連の有効な権限一覧

確認された有効なBase権限：
- ✅ `bitable:app` - **Base完全管理**（作成・編集・削除）
- ✅ `bitable:app:readonly` - Base読み取り専用

## 🚀 追加推奨権限

Base作成をサポートする権限：
- ✅ `im:message:send_as_bot` - 作成完了通知
- ✅ `im:chat:create` - 専用チャット作成
- ✅ `docx:document:create` - レポート生成
- ✅ `drive:file` - ファイル管理
- ✅ `contact:user.base:readonly` - ユーザー情報取得

## 🎯 最小構成（Base作成のみ）
```json
{
  "scopes": {
    "tenant": [
      "bitable:app"
    ],
    "user": []
  }
}
```

## 🔧 インポート手順

1. **推奨設定**をコピー（上記JSON）
2. [Lark開発者コンソール](https://open.feishu.cn)を開く
3. アプリ選択 → **権限とスコープ**
4. **インポート** → JSONペースト → 実行
5. **バージョン作成** → **公開**

## ⚡ テストコマンド

権限設定後、Claude Desktopで以下をテスト：

```
「新しいBaseを作成してください。名前は'テストBase'で、顧客情報のテーブルを含めてください」
```

## 📊 権限レベル比較

| レベル | Base作成 | Base編集 | メッセージ | ドキュメント |
|--------|:--------:|:--------:|:----------:|:------------:|
| 最小 | ✅ | ✅ | ❌ | ❌ |
| 推奨 | ✅ | ✅ | ✅ | ✅ |

**推奨設定**でBase作成 + 通知 + レポート生成が可能になります！