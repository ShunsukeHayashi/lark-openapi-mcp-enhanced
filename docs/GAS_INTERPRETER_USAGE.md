# GAS Interpreter Agent 使用ガイド

## 概要

GAS Interpreter Agentは、自然言語でGoogle Apps Script（GAS）を実行できる専門エージェントです。Gmail、Calendar、Drive、Spreadsheetなど、Googleサービスへのアクセスと自動化を実現します。

## 主な機能

### 1. 自然言語からのコード生成
- 日本語での指示をGASコードに変換
- 意図を理解して適切なGoogle APIを選択
- コンテキストに応じたパラメータ設定

### 2. 即時実行
- 生成されたコードを即座に実行
- 実行結果をリアルタイムで取得
- エラー時の自動修正と再実行

### 3. サポートするGoogleサービス
- **Gmail**: メール送信、検索、ラベル管理
- **Spreadsheet**: データ作成、読み取り、分析
- **Calendar**: イベント作成、予定確認
- **Drive**: ファイル検索、フォルダ作成
- **Forms**: アンケート作成、回答収集

## 使用例

### メール操作

```typescript
// エージェントに自然言語で指示
await agent.executeTask('山田さんに会議の連絡メールを送って');

// 生成されるコード例
const recipient = "yamada@example.com";
const subject = "会議のご連絡";
const body = "山田様\n\n本日の会議についてご連絡いたします。";
GmailApp.sendEmail(recipient, subject, body);
return `メールを送信しました: ${recipient}`;
```

### スプレッドシート操作

```typescript
// 売上データのスプレッドシート作成
await agent.executeTask('今月の売上データをスプレッドシートにまとめて');

// 生成されるコード例
const spreadsheet = SpreadsheetApp.create("2025年1月売上データ");
const sheet = spreadsheet.getActiveSheet();
const data = [
  ["日付", "商品", "数量", "金額"],
  ["2025/1/1", "商品A", "10", "10000"],
  ["2025/1/2", "商品B", "5", "7500"]
];
sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
return `スプレッドシートを作成しました: ${spreadsheet.getUrl()}`;
```

### カレンダー操作

```typescript
// 明日の会議予定を追加
await agent.executeTask('明日の14時から会議の予定を入れて');

// 生成されるコード例
const calendar = CalendarApp.getDefaultCalendar();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0);
const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000);
const event = calendar.createEvent("会議", tomorrow, endTime);
return `イベントを作成しました: ${event.getTitle()} - ${tomorrow}`;
```

### ドライブ操作

```typescript
// AI関連ファイルの検索
await agent.executeTask('ドライブからAIに関するファイルを探して');

// 生成されるコード例
const files = DriveApp.searchFiles('title contains "AI"');
const fileList = [];
while (files.hasNext() && fileList.length < 10) {
  const file = files.next();
  fileList.push({
    name: file.getName(),
    url: file.getUrl()
  });
}
return JSON.stringify(fileList, null, 2);
```

## 高度な使用方法

### バッチ処理

```typescript
// 複数のタスクを順次実行
const tasks = [
  '未読メールの件数を確認',
  '今日の予定をチェック',
  'AIフォルダの容量を確認'
];

for (const task of tasks) {
  const result = await agent.executeTask(task);
  console.log(`${task}: ${result.result}`);
}
```

### エラーハンドリング

```typescript
try {
  const result = await agent.executeTask('大量のデータを処理');
  
  if (!result.success) {
    // エラー時は自動的に修正版が実行される
    console.log('修正後の結果:', result);
  }
} catch (error) {
  console.error('実行エラー:', error);
}
```

### カスタムコンテキスト

```typescript
// 詳細なコンテキストを提供
const result = await agent.executeTask('メールを送信', {
  recipient: 'team@example.com',
  subject: '週次レポート',
  body: '今週の進捗状況をお送りします。',
  attachments: ['report.pdf']
});
```

## API仕様

### executeTask(intent: string, context?: any)
自然言語の指示からGASコードを生成・実行

**パラメータ:**
- `intent`: 実行したいタスクの説明（日本語可）
- `context`: 追加のコンテキスト情報（オプション）

**戻り値:**
```typescript
{
  success: boolean;
  result?: string;
  error?: string;
  executionId?: string;
}
```

### ツール一覧

1. **executeScript**: GASコードの直接実行
2. **generateGASCode**: 意図からコード生成
3. **getExecutionHistory**: 実行履歴の取得

## セキュリティ

- APIキーは環境変数で管理
- 実行は認証されたGoogle環境内で行われる
- センシティブ情報はログに出力されない

## トラブルシューティング

### よくあるエラー

1. **タイムアウトエラー**
   - 処理を小さく分割
   - バッチサイズを減らす

2. **権限エラー**
   - 必要なGoogle APIが有効か確認
   - スコープが適切に設定されているか確認

3. **構文エラー**
   - 自動修正機能により再実行される
   - より具体的な指示を提供

## ベストプラクティス

1. **明確な指示**: 曖昧さを避け、具体的に指示
2. **段階的実行**: 複雑なタスクは分割して実行
3. **エラー処理**: 常にエラーケースを考慮
4. **ログ確認**: 実行履歴で問題を特定

## 制限事項

- 実行時間: 最大30秒
- 同時実行: 最大5タスク
- APIレート制限に準拠

## サンプルコード集

`gas-examples.ts`ファイルに、カテゴリ別の実行可能なサンプルコードが含まれています：

- Gmail操作
- スプレッドシート操作
- カレンダー操作
- ドライブ操作
- フォーム作成
- 外部API連携
- バッチ処理
- データ分析

これらのサンプルを参考に、独自の自動化タスクを構築できます。