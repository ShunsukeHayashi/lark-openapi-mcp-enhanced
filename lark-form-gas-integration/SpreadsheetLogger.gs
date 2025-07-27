/**
 * スプレッドシートログシステム
 * フォーム送信データとシステムログを記録
 */

// ===== スプレッドシート設定 =====
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID');
const LOG_SHEET_NAME = 'フォーム送信ログ';
const ERROR_LOG_SHEET_NAME = 'エラーログ';

/**
 * スプレッドシートの初期化
 */
function initializeSpreadsheet() {
  try {
    let spreadsheet;
    
    // スプレッドシートIDが設定されていない場合は新規作成
    if (!SPREADSHEET_ID) {
      spreadsheet = SpreadsheetApp.create('Lark Form GAS Integration Logs');
      const newId = spreadsheet.getId();
      PropertiesService.getScriptProperties().setProperty('LOG_SPREADSHEET_ID', newId);
      console.log('Created new spreadsheet:', newId);
    } else {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    
    // フォーム送信ログシートの作成
    let logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
      
      // ヘッダー行の設定
      const headers = [
        'タイムスタンプ',
        'レコードID',
        '氏名',
        'メールアドレス',
        '電話番号',
        '部署',
        '問い合わせ種別',
        '内容',
        '緊急度',
        'ステータス',
        '処理時間(ms)',
        'エラー'
      ];
      
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // ヘッダーのフォーマット
      const headerRange = logSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285F4');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      
      // 列幅の自動調整
      for (let i = 1; i <= headers.length; i++) {
        logSheet.autoResizeColumn(i);
      }
      
      // フィルターの設定
      logSheet.getRange(1, 1, 1, headers.length).createFilter();
    }
    
    // エラーログシートの作成
    let errorSheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
    if (!errorSheet) {
      errorSheet = spreadsheet.insertSheet(ERROR_LOG_SHEET_NAME);
      
      const errorHeaders = [
        'タイムスタンプ',
        'エラータイプ',
        'エラーメッセージ',
        'スタックトレース',
        'レコードID',
        'リクエストデータ'
      ];
      
      errorSheet.getRange(1, 1, 1, errorHeaders.length).setValues([errorHeaders]);
      
      // ヘッダーのフォーマット
      const errorHeaderRange = errorSheet.getRange(1, 1, 1, errorHeaders.length);
      errorHeaderRange.setBackground('#EA4335');
      errorHeaderRange.setFontColor('#FFFFFF');
      errorHeaderRange.setFontWeight('bold');
      errorHeaderRange.setHorizontalAlignment('center');
      
      // 列幅の自動調整
      for (let i = 1; i <= errorHeaders.length; i++) {
        errorSheet.autoResizeColumn(i);
      }
    }
    
    return spreadsheet.getUrl();
    
  } catch (error) {
    console.error('Error initializing spreadsheet:', error);
    throw error;
  }
}

/**
 * フォーム送信ログを記録
 */
function logFormSubmission(data) {
  const startTime = new Date().getTime();
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Log sheet not found');
    }
    
    // ログデータの準備
    const logRow = [
      new Date(),                          // タイムスタンプ
      data.recordId || '',                 // レコードID
      data.fields['氏名'] || '',          // 氏名
      data.fields['メールアドレス'] || '', // メールアドレス
      data.fields['電話番号'] || '',       // 電話番号
      data.fields['部署'] || '',           // 部署
      data.fields['問い合わせ種別'] || '', // 問い合わせ種別
      data.fields['内容'] || '',           // 内容
      data.fields['緊急度'] || '',         // 緊急度
      'SUCCESS',                           // ステータス
      new Date().getTime() - startTime,    // 処理時間
      ''                                   // エラー（なし）
    ];
    
    // 最終行に追加
    sheet.appendRow(logRow);
    
    // 緊急度によって行の背景色を設定
    const lastRow = sheet.getLastRow();
    const urgencyCell = sheet.getRange(lastRow, 9); // 緊急度の列
    const urgency = urgencyCell.getValue();
    
    if (urgency === '高') {
      sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).setBackground('#FFCDD2');
    } else if (urgency === '中') {
      sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).setBackground('#FFF9C4');
    } else if (urgency === '低') {
      sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).setBackground('#C8E6C9');
    }
    
    console.log('Form submission logged successfully');
    
  } catch (error) {
    console.error('Error logging form submission:', error);
    logError('FORM_LOG_ERROR', error, data.recordId, data);
  }
}

/**
 * エラーログを記録
 */
function logError(errorType, error, recordId = '', requestData = null) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(ERROR_LOG_SHEET_NAME);
    
    if (!sheet) {
      console.error('Error log sheet not found');
      return;
    }
    
    const errorRow = [
      new Date(),                                    // タイムスタンプ
      errorType,                                     // エラータイプ
      error.message || error.toString(),             // エラーメッセージ
      error.stack || '',                            // スタックトレース
      recordId,                                      // レコードID
      JSON.stringify(requestData || {}, null, 2)     // リクエストデータ
    ];
    
    sheet.appendRow(errorRow);
    
    // エラー行を赤色でハイライト
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).setBackground('#FFEBEE');
    
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

/**
 * ログビューアーのHTMLを生成
 */
function getLogViewerHtml() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    
    if (!logSheet) {
      return '<p>ログシートが見つかりません</p>';
    }
    
    // 最新50件のログを取得
    const lastRow = logSheet.getLastRow();
    const startRow = Math.max(2, lastRow - 49);
    const numRows = Math.min(50, lastRow - 1);
    
    if (numRows <= 0) {
      return '<p>ログがありません</p>';
    }
    
    const logs = logSheet.getRange(startRow, 1, numRows, 12).getValues();
    const headers = logSheet.getRange(1, 1, 1, 12).getValues()[0];
    
    // HTMLテーブルを生成
    let html = '<table class="log-table">';
    html += '<thead><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // ログを新しい順に表示
    logs.reverse().forEach(log => {
      html += '<tr>';
      log.forEach((cell, index) => {
        if (index === 0) {
          // タイムスタンプをフォーマット
          cell = Utilities.formatDate(new Date(cell), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        }
        html += `<td>${cell || ''}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    return html;
    
  } catch (error) {
    console.error('Error generating log viewer HTML:', error);
    return `<p>エラー: ${error.message}</p>`;
  }
}

/**
 * スプレッドシートのURLを取得
 */
function getSpreadsheetUrl() {
  try {
    if (!SPREADSHEET_ID) {
      return initializeSpreadsheet();
    }
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    return spreadsheet.getUrl();
  } catch (error) {
    console.error('Error getting spreadsheet URL:', error);
    return null;
  }
}