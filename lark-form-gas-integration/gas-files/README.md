# 🎨 Lark Form + GAS モダンWeb View

デモサイトのような美しいUIでLarkフォームの送信内容を表示するシステムです。

## ⚡ クイックスタート（5分で完成）

### 1. GASプロジェクトを作成
1. [Google Apps Script](https://script.google.com/)を開く
2. 「新規プロジェクト」作成
3. プロジェクト名: `Lark Form Integration`

### 2. ファイルをコピー＆ペースト

#### 📄 コード.gs（メインファイル）
- デフォルトの「コード.gs」に`Code.gs`の内容をすべてコピー

#### 📄 SpreadsheetLogger（新規作成）
1. ファイル → 新規 → スクリプト
2. 名前: `SpreadsheetLogger`
3. `SpreadsheetLogger.gs`の内容をコピー

#### 📄 SpreadsheetUI（新規作成）
1. ファイル → 新規 → スクリプト
2. 名前: `SpreadsheetUI`
3. `SpreadsheetUI.gs`の内容をコピー

#### 🎨 HTMLファイル（3つ）
各HTMLファイルを作成：
1. ファイル → 新規 → HTML
2. 名前を変更（拡張子なし）
3. 内容をコピー

| ファイル名 | 説明 | 使用するファイル |
|-----------|------|-----------------|
| index | メイン表示画面 | `index-enhanced.html` |
| success-view | 送信完了画面 | `success-view-enhanced.html` |
| log-viewer | ログビューアー | `log-viewer-enhanced.html` |

### 3. スクリプトプロパティを設定
プロジェクトの設定（歯車アイコン）→ スクリプトプロパティ

| プロパティ名 | 値 |
|------------|---|
| LARK_APP_ID | cli_a8d2fdb1f1f8d02d |
| LARK_APP_SECRET | V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ |
| LARK_BASE_APP_TOKEN | U38Xbik32acfCBsEbmmjm0NupRe |
| LARK_BASE_TABLE_ID | tblGI9VZmGATO97c |

### 4. デプロイ
1. デプロイ → 新しいデプロイ
2. 種類: **ウェブアプリ**
3. 設定:
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員**
4. デプロイをクリック
5. **Web アプリの URL をコピー** 📋

### 5. Lark自動化を設定
1. [Lark Base](https://f82jyx0mblu.jp.larksuite.com/base/U38Xbik32acfCBsEbmmjm0NupRe?table=tblGI9VZmGATO97c)を開く
2. 自動化タブ → 新しいワークフロー
3. トリガー: **レコードが作成されたとき**
4. アクション: **HTTPリクエストを送信**
   - URL: `（GASのWeb アプリURL）`
   - メソッド: `POST`
   - ヘッダー: `Content-Type: application/json`
   - ボディ:
   ```json
   {
     "record_id": "{{record_id}}"
   }
   ```
5. ワークフローを有効化

## 🧪 テスト

1. [フォーム](https://f82jyx0mblu.jp.larksuite.com/base/U38Xbik32acfCBsEbmmjm0NupRe?table=tblGI9VZmGATO97c&view=vewJeXMwzE)でテスト送信
2. GASの実行数で確認
3. Web App URLに`?view=logs`を追加してログを確認

## 🎨 デザインの特徴

- **ダークモード**: 目に優しいモダンなダークテーマ
- **グラデーション**: 美しいグラデーション背景
- **アニメーション**: スムーズなフェードイン効果
- **レスポンシブ**: モバイル対応
- **パーティクル効果**: 成功画面の動的な背景

## 📸 画面プレビュー

### 送信完了画面
- ✅ 成功アニメーション
- 🎨 パーティクル効果
- 📋 受付番号表示

### 詳細表示画面
- 📊 カード形式のフィールド表示
- 🏷️ 緊急度バッジ
- 📅 メタデータセクション

### ログビューアー
- 📊 統計ダッシュボード
- 📈 リアルタイム更新
- 📥 CSVエクスポート

## 🚀 完成！

これで、デモサイトのような美しいWeb Viewでフォーム送信内容を確認できます！

---
Created with ❤️ by Lark × GAS Integration
