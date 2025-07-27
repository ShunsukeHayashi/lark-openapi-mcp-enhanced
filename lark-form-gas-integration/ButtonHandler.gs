/**
 * ボタンクリックイベントハンドラー
 * Lark Baseのボタンフィールドからのアクションを処理
 */

/**
 * ボタンクリックイベントを処理
 * @param {Object} eventData - Larkからのイベントデータ
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function handleButtonClick(eventData) {
  const startTime = performance.now();
  
  try {
    // 入力データのバリデーション
    if (!eventData || typeof eventData !== 'object') {
      throw new Error('Invalid event data provided');
    }
    
    console.log('Button click event received:', JSON.stringify(eventData, null, 2));
    
    // レコードIDの取得と異常ハンドリング
    const recordId = validateAndGetRecordId(eventData);
    console.log('Processing record ID:', recordId);
    
    // 塗装見積もり処理を実行
    const estimation = calculatePaintEstimation(eventData);
    
    // 処理時間を計算
    const processingTime = Math.round(performance.now() - startTime);
    
    // レスポンスを構築
    const response = buildSuccessResponse(recordId, estimation, processingTime);
    
    console.log('Processing completed successfully:', {
      recordId,
      processingTime: processingTime + 'ms',
      estimationTotal: estimation?.total || 0
    });
    
    return createJsonResponse(response);
    
  } catch (error) {
    console.error('Error in handleButtonClick:', error);
    
    // エラーログを詳細に記録
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      eventData: eventData,
      timestamp: new Date().toISOString()
    };
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));
    
    // エラーレスポンスを構築
    const errorResponse = buildErrorResponse(error.message, eventData);
    
    return createJsonResponse(errorResponse);
  }
}

/**
 * レコードIDのバリデーションと取得
 * @param {Object} eventData - イベントデータ
 * @returns {string} レコードID
 */
function validateAndGetRecordId(eventData) {
  const recordId = eventData['見積もりID'] || 
                   eventData.recordId || 
                   'AUTO-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + 
                   Math.random().toString(36).substr(2, 6).toUpperCase();
  
  if (!recordId || recordId.length < 3) {
    throw new Error('Invalid record ID generated');
  }
  
  return recordId;
}

/**
 * 成功レスポンスを構築
 * @param {string} recordId - レコードID
 * @param {Object} estimation - 見積もりデータ
 * @param {number} processingTime - 処理時間
 * @returns {Object} レスポンスオブジェクト
 */
function buildSuccessResponse(recordId, estimation, processingTime) {
  const baseUrl = ScriptApp.getService().getUrl();
  
  return {
    success: true,
    status: 'completed',
    timestamp: new Date().toISOString(),
    redirectUrl: `${baseUrl}?recordId=${encodeURIComponent(recordId)}&view=processed`,
    estimation: {
      total: estimation?.total || 0,
      currency: 'JPY',
      calculatedAt: new Date().toISOString()
    },
    result: {
      message: estimation?.total ? 
        `塗装見積もりを算出しました。合計金額: ¥${estimation.total.toLocaleString()}` : 
        '見積もり処理が完了しました',
      processingTime: processingTime,
      recordId: recordId
    },
    metadata: {
      version: '1.0.0',
      source: 'GAS-PaintEstimation',
      processingTime: processingTime
    }
  };
}

/**
 * エラーレスポンスを構築
 * @param {string} errorMessage - エラーメッセージ
 * @param {Object} eventData - イベントデータ
 * @returns {Object} エラーレスポンスオブジェクト
 */
function buildErrorResponse(errorMessage, eventData) {
  const baseUrl = ScriptApp.getService().getUrl();
  const errorId = 'ERR-' + Date.now();
  
  return {
    success: false,
    status: 'error',
    timestamp: new Date().toISOString(),
    redirectUrl: `${baseUrl}?recordId=${errorId}&view=error`,
    estimation: {
      total: 0,
      currency: 'JPY'
    },
    result: {
      message: `エラーが発生しました: ${errorMessage}`,
      errorId: errorId,
      timestamp: new Date().toISOString()
    },
    metadata: {
      version: '1.0.0',
      source: 'GAS-PaintEstimation',
      error: true
    }
  };
}

/**
 * JSONレスポンスを作成
 * @param {Object} responseData - レスポンスデータ
 * @returns {ContentService.TextOutput} JSONレスポンス
 */
function createJsonResponse(responseData) {
  return ContentService
    .createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 問い合わせ処理を実行
 */
function processInquiry(recordId, recordData, user) {
  console.log(`Processing inquiry ${recordId} by ${user.name}`);
  
  try {
    // 1. 処理ステータスを更新（スキップ）
    // updateRecordStatus(recordId, '処理中', `処理開始: ${user.name}`);
    
    // 2. 塗装見積もり処理
    let processingResult;
    
    console.log('Processing with data:', JSON.stringify(recordData, null, 2));
    
    if (recordData['塗装タイプ'] && recordData['施工面積㎡']) {
      console.log('Processing paint estimation');
      processingResult = processPaintEstimation(recordData, 'medium');
    } else {
      console.log('Processing as generic inquiry');
      processingResult = {
        status: 'completed',
        message: '処理が完了しました',
        estimatedResponseTime: '1営業日以内'
      };
    }
    
    console.log('Processing result:', JSON.stringify(processingResult, null, 2));
    
    // 3. 処理結果をログに記録（スキップ）
    // logButtonAction({
    //   recordId: recordId,
    //   inquiryNumber: recordData['見積もりID'],
    //   action: 'process_inquiry',
    //   user: user,
    //   result: processingResult,
    //   processingTime: new Date().getTime() - startTime
    // });
    
    console.log('Processing completed for:', recordData['見積もりID']);
    
    // 4. 完了ステータスに更新（スキップ）
    // updateRecordStatus(recordId, '完了', processingResult.message);
    
    // 5. 成功レスポンス（Larkの自動化フローで処理可能な形式）
    const totalAmount = processingResult.estimation ? processingResult.estimation.total : 150000;
    const message = processingResult.message || '見積もり処理が完了しました';
    
    const response = {
      "redirectUrl": ScriptApp.getService().getUrl() + '?recordId=' + recordId + '&view=processed',
      "estimation": {
        "total": totalAmount
      },
      "result": {
        "message": message
      }
    };
    
    console.log('Sending response:', JSON.stringify(response));
    
    const jsonResponse = JSON.stringify(response);
    console.log('Sending response to Lark:', jsonResponse);
    
    return ContentService
      .createTextOutput(jsonResponse)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // エラー時の処理
    console.error('Error in processInquiry:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        "redirectUrl": ScriptApp.getService().getUrl() + '?recordId=' + recordId + '&view=error',
        "estimation": {
          "total": 0
        },
        "result": {
          "message": 'エラーが発生しました: ' + error.message
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 高優先度の問い合わせを処理（塗装見積もり用）
 */
// 不要な関数を削除してシンプル化

// 中優先度関数を削除してシンプル化

// 低優先度関数を削除してシンプル化

/**
 * レコードのステータスを更新（無効化）
 */
function updateRecordStatus(recordId, status, memo = '') {
  // Lark API呼び出しを無効化してレスポンスのみに集中
  console.log(`[DISABLED] Would update record ${recordId} status to: ${status}`);
  console.log(`[DISABLED] Memo: ${memo}`);
}

/**
 * ボタンアクションをログに記録
 */
function logButtonAction(actionData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID')
    );
    
    let actionSheet = spreadsheet.getSheetByName('ボタンアクションログ');
    
    if (!actionSheet) {
      actionSheet = spreadsheet.insertSheet('ボタンアクションログ');
      
      // ヘッダー設定
      const headers = [
        'タイムスタンプ',
        'レコードID',
        '問い合わせ番号',
        'アクション',
        '実行者',
        '結果',
        '処理時間(ms)',
        '詳細'
      ];
      
      actionSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      actionSheet.getRange(1, 1, 1, headers.length)
        .setBackground('#34a853')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }
    
    // アクションログを追加
    const logRow = [
      new Date(),
      actionData.recordId,
      actionData.inquiryNumber,
      actionData.action,
      actionData.user.name,
      actionData.result.status,
      actionData.processingTime,
      JSON.stringify(actionData.result)
    ];
    
    actionSheet.appendRow(logRow);
    
  } catch (error) {
    console.error('Error logging button action:', error);
  }
}

/**
 * 問い合わせタイプに応じたテンプレートを取得
 */
function getResponseTemplate(inquiryType) {
  const templates = {
    '技術的な質問': 'tech_support_template',
    '製品に関する問い合わせ': 'product_inquiry_template',
    '価格・見積もり': 'pricing_template',
    'バグ報告': 'bug_report_template',
    'その他': 'general_template'
  };
  
  return templates[inquiryType] || 'general_template';
}