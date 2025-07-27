# Lark Base セットアップガイド

このガイドでは、緊急注文対応ダッシュボードのためのLark Baseテーブルを作成し、APIで接続する手順を説明します。

## 📋 前提条件

1. Larkアカウントとワークスペース
2. Lark開発者アプリケーション（App ID/Secret取得済み）
3. Base（多維表格）の作成権限

## 🗂️ Step 1: Lark Baseの作成

### 1.1 新しいBaseを作成

1. Larkにログインし、ワークスペースに移動
2. 「＋」ボタンから「多維表格」を選択
3. 「空白から作成」を選択
4. 名前を「緊急注文管理」に設定

### 1.2 テーブル構造の定義

以下のフィールドを作成してください：

| フィールド名 | フィールドタイプ | 説明 | 必須 |
|------------|---------------|------|------|
| 商品名 | テキスト | 商品の名称 | ✓ |
| 緊急発注フラグ | 単一選択 | 🚩緊急 / 通常 | ✓ |
| 在庫切れ予測 | 数値 | 在庫切れまでの日数 | ✓ |
| 発注残数 | 数値 | 未着の発注数量 | ✓ |
| 30日販売数 | 数値 | 過去30日間の販売数 | ✓ |
| 現在庫数 | 数値 | 現在の在庫数量 | ✓ |
| 最終発注日 | 日付 | 最後に発注した日付 | |
| 納期予定 | 日付 | 次回入荷予定日 | |

### 1.3 単一選択フィールドの設定

「緊急発注フラグ」フィールドの選択肢：
- 🚩緊急（赤色）
- 通常（グレー色）

## 🔑 Step 2: APIアクセスの設定

### 2.1 Base URLの取得

1. 作成したBaseを開く
2. URLから以下の情報を取得：
   ```
   https://f82jyx0mblu.jp.larksuite.com/base/[APP_TOKEN]?table=[TABLE_ID]&view=[VIEW_ID]
   ```
   - `APP_TOKEN`: Base識別子（例：bascnCMII2ORej2RItqpZZUNMLE）
   - `TABLE_ID`: テーブル識別子（例：tblxI8tWaxP5dG7p）

### 2.2 アプリケーション権限の設定

1. [Lark開発者コンソール](https://open.larksuite.com/app)にアクセス
2. あなたのアプリケーションを選択
3. 「権限管理」→「権限設定」に移動
4. 以下の権限を追加：
   - `bitable:app` - Baseアプリの読み書き
   - `bitable:app:readonly` - Baseアプリの読み取り（最小権限）

### 2.3 Baseへのアプリ追加

1. Baseの右上の「...」メニューをクリック
2. 「設定」→「権限管理」を選択
3. 「アプリを追加」をクリック
4. あなたのアプリケーションを検索して追加
5. 「編集可能」権限を付与

## 💻 Step 3: コードの更新

### 3.1 環境変数の更新

`.env`ファイルを以下のように更新：

```env
# Lark/Feishu Application Credentials
LARK_APP_ID=cli_a8d2fdb1f1f8d02d
LARK_APP_SECRET=V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ

# Lark Base Configuration
LARK_APP_TOKEN=あなたのAPP_TOKEN
LARK_TABLE_ID=あなたのTABLE_ID

# Server Configuration
PORT=3000
```

### 3.2 サーバーコードの更新

`local-server/server.ts`の`fetchLarkData`関数を以下のように修正：

```typescript
// Lark Baseからデータを取得
async function fetchLarkData(accessToken: string): Promise<LarkRecord[]> {
  const allRecords: LarkRecord[] = [];
  let pageToken: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    params.append('page_size', '500');
    if (pageToken) params.append('page_token', pageToken);

    try {
      const response = await axios.get(
        `https://open.larksuite.com/open-apis/bitable/v1/apps/${LARK_CONFIG.APP_TOKEN}/tables/${LARK_CONFIG.TABLE_ID}/records?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      const data = response.data.data;
      allRecords.push(...(data.items || []));
      hasMore = data.has_more;
      pageToken = data.page_token;
    } catch (error) {
      console.error('Failed to fetch Lark data:', error);
      throw new Error('Failed to fetch data from Lark Base');
    }
  }

  return allRecords;
}
```

## 📊 Step 4: サンプルデータの入力

Baseに以下のサンプルデータを入力してテスト：

| 商品名 | 緊急発注フラグ | 在庫切れ予測 | 発注残数 | 30日販売数 | 現在庫数 |
|-------|--------------|------------|---------|-----------|---------|
| プレミアムコーヒー豆 1kg | 🚩緊急 | 2 | 50 | 380 | 15 |
| オーガニック紅茶セット | 🚩緊急 | 3 | 0 | 250 | 8 |
| チョコレートギフトボックス | 🚩緊急 | 5 | 100 | 420 | 30 |
| 手作りクッキー詰め合わせ | 🚩緊急 | 6 | 0 | 180 | 45 |
| 季節限定ジャムセット | 🚩緊急 | 7 | 75 | 165 | 22 |

## ✅ Step 5: 動作確認

1. サーバーを再起動：
   ```bash
   cd local-server
   npm run build
   npm start
   ```

2. ブラウザでダッシュボードにアクセス：
   - http://localhost:3000/mobile-dashboard.html

3. 実際のLark Baseデータが表示されることを確認

## 🔧 トラブルシューティング

### エラー: "Permission denied: bitable:app"
- アプリケーションに`bitable:app`権限が付与されているか確認
- Baseにアプリケーションが追加されているか確認

### エラー: "Invalid app_token"
- APP_TOKENが正しくコピーされているか確認
- BaseのURLから正確に取得してください

### データが表示されない
- Baseにデータが入力されているか確認
- フィールド名が完全に一致しているか確認（スペースも含む）

## 📚 参考リンク

- [Lark Base API ドキュメント](https://open.larksuite.com/document/server-docs/docs/bitable-v1/app-table-record/list)
- [Lark 開発者ガイド](https://open.larksuite.com/document/home/index)
- [権限スコープ一覧](https://open.larksuite.com/document/server-docs/docs/permission)