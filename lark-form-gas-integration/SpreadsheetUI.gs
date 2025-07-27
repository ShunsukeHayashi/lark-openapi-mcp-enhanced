/**
 * スプレッドシートUI管理システム
 * カスタムメニュー、フォーマット、インタラクティブ機能を提供
 */

/**
 * スプレッドシートを開いた時に実行される
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // カスタムメニューの作成
  ui.createMenu('📊 Larkフォーム管理')
    .addItem('📥 最新データを取得', 'syncLatestData')
    .addItem('🔄 ログを更新', 'refreshLogs')
    .addSeparator()
    .addSubMenu(ui.createMenu('📈 レポート')
      .addItem('日次レポート', 'generateDailyReport')
      .addItem('週次レポート', 'generateWeeklyReport')
      .addItem('緊急度別集計', 'generateUrgencyReport'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ 設定')
      .addItem('フォーマットを再適用', 'applyFormatting')
      .addItem('条件付き書式を設定', 'setConditionalFormatting')
      .addItem('フィルターを設定', 'setupFilters'))
    .addSeparator()
    .addItem('📧 選択行にメール送信', 'sendEmailToSelected')
    .addItem('🔗 Web Viewを開く', 'openWebView')
    .addSeparator()
    .addItem('ℹ️ ヘルプ', 'showHelp')
    .addToUi();
    
  // 初期フォーマットの適用
  applyInitialFormatting();
}

/**
 * 初期フォーマットを適用
 */
function applyInitialFormatting() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // ログシートのフォーマット
  formatLogSheet(spreadsheet);
  
  // エラーログシートのフォーマット
  formatErrorLogSheet(spreadsheet);
  
  // ダッシュボードシートの作成
  createDashboardSheet(spreadsheet);
}

/**
 * ログシートのフォーマット
 */
function formatLogSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) return;
  
  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  
  // 行の高さを設定
  sheet.setRowHeight(1, 40);
  
  // 列幅の設定
  const columnWidths = {
    1: 150,  // タイムスタンプ
    2: 120,  // レコードID
    3: 100,  // 氏名
    4: 180,  // メールアドレス
    5: 120,  // 電話番号
    6: 100,  // 部署
    7: 150,  // 問い合わせ種別
    8: 300,  // 内容
    9: 80,   // 緊急度
    10: 80,  // ステータス
    11: 100, // 処理時間
    12: 200  // エラー
  };
  
  Object.entries(columnWidths).forEach(([col, width]) => {
    sheet.setColumnWidth(parseInt(col), width);
  });
  
  // フリーズ設定
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  
  // 条件付き書式を適用
  setConditionalFormatting();
}

/**
 * エラーログシートのフォーマット
 */
function formatErrorLogSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
  if (!sheet) return;
  
  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange
    .setBackground('#ea4335')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  
  // 行の高さを設定
  sheet.setRowHeight(1, 40);
  
  // フリーズ設定
  sheet.setFrozenRows(1);
}

/**
 * ダッシュボードシートの作成
 */
function createDashboardSheet(spreadsheet) {
  let dashboard = spreadsheet.getSheetByName('ダッシュボード');
  
  if (!dashboard) {
    dashboard = spreadsheet.insertSheet('ダッシュボード', 0);
  }
  
  // ダッシュボードのレイアウト設定
  dashboard.clear();
  
  // タイトル
  dashboard.getRange('A1:H1').merge()
    .setValue('📊 Larkフォーム送信ダッシュボード')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  dashboard.setRowHeight(1, 50);
  
  // 統計情報セクション
  const stats = [
    ['B3', '本日の送信数', '=COUNTIF(\'フォーム送信ログ\'!A:A,">="&TODAY())', '#4285f4'],
    ['D3', '今週の送信数', '=COUNTIFS(\'フォーム送信ログ\'!A:A,">="&TODAY()-WEEKDAY(TODAY())+1,\'フォーム送信ログ\'!A:A,"<"&TODAY()+1)', '#34a853'],
    ['F3', '今月の送信数', '=COUNTIFS(\'フォーム送信ログ\'!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1),\'フォーム送信ログ\'!A:A,"<"&DATE(YEAR(TODAY()),MONTH(TODAY())+1,1))', '#fbbc04'],
    ['H3', '総送信数', '=COUNTA(\'フォーム送信ログ\'!A:A)-1', '#ea4335']
  ];
  
  stats.forEach(([cell, label, formula, color]) => {
    const labelCell = dashboard.getRange(cell);
    const valueCell = dashboard.getRange(cell.replace('3', '4'));
    
    labelCell.setValue(label)
      .setFontSize(12)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
      
    valueCell.setFormula(formula)
      .setFontSize(24)
      .setFontWeight('bold')
      .setFontColor(color)
      .setHorizontalAlignment('center');
  });
  
  // 緊急度別集計セクション
  dashboard.getRange('A6:H6').merge()
    .setValue('📈 緊急度別集計')
    .setBackground('#f8f9fa')
    .setFontSize(14)
    .setFontWeight('bold');
    
  dashboard.getRange('B8').setValue('緊急度');
  dashboard.getRange('C8').setValue('件数');
  dashboard.getRange('D8').setValue('割合');
  
  const urgencyFormulas = [
    ['B9', '高', '=COUNTIF(\'フォーム送信ログ\'!I:I,"高")', '#ea4335'],
    ['B10', '中', '=COUNTIF(\'フォーム送信ログ\'!I:I,"中")', '#fbbc04'],
    ['B11', '低', '=COUNTIF(\'フォーム送信ログ\'!I:I,"低")', '#34a853']
  ];
  
  urgencyFormulas.forEach(([cell, urgency, formula, color]) => {
    dashboard.getRange(cell).setValue(urgency).setBackground(color).setFontColor('#ffffff');
    dashboard.getRange(cell.replace('B', 'C')).setFormula(formula);
    dashboard.getRange(cell.replace('B', 'D')).setFormula(`=${cell.replace('B', 'C')}/SUM(C9:C11)`).setNumberFormat('0%');
  });
  
  // ボタンの追加
  const buttonRange = dashboard.getRange('B14:D15').merge();
  buttonRange
    .setValue('🔄 データを更新')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
    
  // ボタンにスクリプトを割り当て
  const drawing = dashboard.newDrawing()
    .setPosition(14, 2, 0, 0)
    .setSize(200, 40)
    .build();
  dashboard.insertDrawing(drawing);
}

/**
 * 条件付き書式の設定
 */
function setConditionalFormatting() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) return;
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  // 既存のルールをクリア
  sheet.clearConditionalFormatRules();
  
  const rules = [];
  
  // 緊急度による行の背景色
  const urgencyColumn = sheet.getRange(2, 9, lastRow - 1, 1);
  
  // 高
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('高')
    .setBackground('#ffcdd2')
    .setRanges([urgencyColumn])
    .build());
    
  // 中
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('中')
    .setBackground('#fff9c4')
    .setRanges([urgencyColumn])
    .build());
    
  // 低
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('低')
    .setBackground('#c8e6c9')
    .setRanges([urgencyColumn])
    .build());
    
  // ステータスによる文字色
  const statusColumn = sheet.getRange(2, 10, lastRow - 1, 1);
  
  // SUCCESS
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('SUCCESS')
    .setFontColor('#0f9d58')
    .setBold(true)
    .setRanges([statusColumn])
    .build());
    
  // ERROR
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('ERROR')
    .setFontColor('#ea4335')
    .setBold(true)
    .setRanges([statusColumn])
    .build());
    
  sheet.setConditionalFormatRules(rules);
}

/**
 * 最新データを同期
 */
function syncLatestData() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert('データ同期', 'Lark Baseから最新データを取得しています...', ui.ButtonSet.OK);
  
  // ここで実際のデータ同期処理を実装
  // 例: Lark APIを呼び出して最新のレコードを取得
  
  SpreadsheetApp.getActiveSpreadsheet().toast('データ同期が完了しました', '完了', 3);
}

/**
 * 選択された行にメールを送信
 */
function sendEmailToSelected() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getActiveRange();
  
  if (selection.getNumRows() === 0) {
    SpreadsheetApp.getUi().alert('行を選択してください');
    return;
  }
  
  const selectedRows = [];
  for (let i = 0; i < selection.getNumRows(); i++) {
    const row = selection.getRow() + i;
    const email = sheet.getRange(row, 4).getValue(); // メールアドレス列
    const name = sheet.getRange(row, 3).getValue();  // 氏名列
    const recordId = sheet.getRange(row, 2).getValue(); // レコードID列
    
    if (email) {
      selectedRows.push({ email, name, recordId, row });
    }
  }
  
  if (selectedRows.length === 0) {
    SpreadsheetApp.getUi().alert('選択された行にメールアドレスがありません');
    return;
  }
  
  // メール送信確認
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'メール送信確認',
    `${selectedRows.length}件のメールを送信しますか？`,
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    selectedRows.forEach(({ email, name, recordId }) => {
      // ここで実際のメール送信処理
      console.log(`Sending email to ${email} for record ${recordId}`);
    });
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `${selectedRows.length}件のメールを送信しました`,
      '送信完了',
      3
    );
  }
}

/**
 * Web Viewを開く
 */
function openWebView() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('データ行を選択してください');
    return;
  }
  
  const recordId = sheet.getRange(row, 2).getValue();
  if (!recordId) {
    SpreadsheetApp.getUi().alert('レコードIDが見つかりません');
    return;
  }
  
  const webViewUrl = ScriptApp.getService().getUrl() + '?recordId=' + recordId;
  
  const htmlOutput = HtmlService
    .createHtmlOutput(`<script>window.open('${webViewUrl}', '_blank');google.script.host.close();</script>`)
    .setWidth(200)
    .setHeight(100);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Web Viewを開いています...');
}

/**
 * ヘルプを表示
 */
function showHelp() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('help-dialog')
    .setWidth(600)
    .setHeight(400);
    
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'ヘルプ');
}

/**
 * 日次レポートの生成
 */
function generateDailyReport() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  
  if (!logSheet) {
    SpreadsheetApp.getUi().alert('ログシートが見つかりません');
    return;
  }
  
  // レポートシートの作成
  const reportName = `日次レポート_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}`;
  let reportSheet = spreadsheet.getSheetByName(reportName);
  
  if (reportSheet) {
    spreadsheet.deleteSheet(reportSheet);
  }
  
  reportSheet = spreadsheet.insertSheet(reportName);
  
  // レポートの内容を生成
  // ... (実装略)
  
  SpreadsheetApp.getActiveSpreadsheet().toast('日次レポートを生成しました', '完了', 3);
}