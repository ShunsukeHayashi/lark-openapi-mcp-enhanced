/**
 * Lark Form to GAS Web View Integration
 * 
 * このスクリプトは、Larkフォームの送信をトリガーにして、
 * カスタムWeb Viewのリンクを自動送信する仕組みを提供します。
 */

// ===== 設定値 =====
// スクリプトプロパティに以下を設定してください：
// - LARK_APP_ID: LarkアプリのApp ID
// - LARK_APP_SECRET: LarkアプリのApp Secret
// - LARK_BASE_TABLE_ID: 対象のBase Table ID
// - LARK_BASE_APP_TOKEN: Base App Token

// ===== 認証ヘルパー関数 =====

/**
 * Lark APIのアクセストークンを取得
 */
function getLarkAccessToken() {
  const props = PropertiesService.getScriptProperties();
  const appId = props.getProperty('LARK_APP_ID');
  const appSecret = props.getProperty('LARK_APP_SECRET');
  
  const url = 'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal';
  const payload = {
    app_id: appId,
    app_secret: appSecret
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.code === 0) {
      return result.tenant_access_token;
    } else {
      throw new Error(`Failed to get access token: ${result.msg}`);
    }
  } catch (error) {
    console.error('Error getting Lark access token:', error);
    throw error;
  }
}

/**
 * キャッシュを使用してトークンを管理
 */
function getCachedLarkToken() {
  const cache = CacheService.getScriptCache();
  const cachedToken = cache.get('LARK_ACCESS_TOKEN');
  
  if (cachedToken) {
    return cachedToken;
  }
  
  const token = getLarkAccessToken();
  // トークンを110分間キャッシュ（有効期限120分より少し短め）
  cache.put('LARK_ACCESS_TOKEN', token, 6600);
  return token;
}

// ===== Lark API関数 =====

/**
 * Larkユーザーにメッセージを送信
 */
function sendLarkMessage(userId, text) {
  const token = getCachedLarkToken();
  const url = 'https://open.larksuite.com/open-apis/im/v1/messages';
  
  const payload = {
    receive_id: userId,
    msg_type: 'text',
    content: JSON.stringify({ text: text })
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    payload: JSON.stringify(payload),
    params: {
      'receive_id_type': 'user_id'
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url + '?receive_id_type=user_id', options);
    const result = JSON.parse(response.getContentText());
    
    if (result.code !== 0) {
      console.error('Failed to send message:', result);
    }
    return result;
  } catch (error) {
    console.error('Error sending Lark message:', error);
    throw error;
  }
}

/**
 * Lark Baseからレコードの詳細を取得
 */
function getRecordDetailsFromLark(recordId) {
  const token = getCachedLarkToken();
  const props = PropertiesService.getScriptProperties();
  const appToken = props.getProperty('LARK_BASE_APP_TOKEN');
  const tableId = props.getProperty('LARK_BASE_TABLE_ID');
  
  const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`;
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.code === 0) {
      return result.data.record.fields;
    } else {
      throw new Error(`Failed to get record: ${result.msg}`);
    }
  } catch (error) {
    console.error('Error getting record from Lark:', error);
    throw error;
  }
}

// ===== Webhookハンドラー =====

/**
 * Larkの自動化フローからのWebhookを受け取る
 * @param {Object} e - Google Apps Scriptのリクエストオブジェクト
 * @returns {ContentService.TextOutput} レスポンス
 */
function doPost(e) {
  const startTime = performance.now();
  
  try {
    // リッチなログ出力
    console.log('=== Webhook Request Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Content-Type:', e.headers ? e.headers['Content-Type'] : 'unknown');
    console.log('Request body:', e.postData ? e.postData.contents : 'no body');
    
    // リッチなログ出力
    logRequestDetails(e);
    
    // スプレッドシートの初期化（必要な場合）
    // initializeSpreadsheet(); // 現在は無効化
    
    // Larkからのデータをパース
    const eventData = JSON.parse(e.postData.contents);
    console.log('Parsed event data:', JSON.stringify(eventData, null, 2));
    
    // レコードIDを取得
    let recordId = 'auto-generated-' + new Date().getTime();
    let recordData = eventData;
    
    // ボタンクリックイベントの場合は直接処理
    if (eventData['見積もりID']) {
      console.log('Processing as button click event');
      return handleButtonClick(eventData);
    }
    
    console.log('Using record ID:', recordId);
    
    // パフォーマンスメトリクスを記録
    const processingTime = Math.round(performance.now() - startTime);
    console.log('Request processing completed in:', processingTime + 'ms');
    
    // Lark Baseからレコードの詳細を取得してログに記録
    try {
      recordData = getRecordDetailsFromLark(recordId);
      
      // スプレッドシートにログを記録
      logFormSubmission({
        recordId: recordId,
        fields: recordData,
        processingTime: new Date().getTime() - startTime
      });
      
    } catch (error) {
      console.error('Error fetching record details:', error);
      logError('FETCH_RECORD_ERROR', error, recordId, eventData);
    }
    
    // Web ViewのURLを生成
    const scriptUrl = ScriptApp.getService().getUrl();
    const webViewUrl = `${scriptUrl}?recordId=${recordId}&view=success`;
    
    // 送信者にメッセージを送信（オプション）
    try {
      if (recordData['作成者'] && recordData['作成者'][0]) {
        const userId = recordData['作成者'][0].id;
        const message = `フォームの送信ありがとうございます！\n\n` +
                       `受付番号: ${recordId}\n` +
                       `確認用URL: ${webViewUrl}`;
        sendLarkMessage(userId, message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      logError('SEND_MESSAGE_ERROR', error, recordId, { userId: recordData['作成者'] });
    }
    
    // リダイレクトレスポンスを返す
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        redirect_url: webViewUrl,
        message: 'フォームが正常に送信されました',
        recordId: recordId
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('=== Error in doPost ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request data:', e.postData ? e.postData.contents : 'no data');
    
    // エラーレスポンスを構築
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: 'req-' + Date.now(),
      metadata: {
        version: '1.0.0',
        source: 'GAS-doPost'
      }
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * リッチなリチクエストログを出力
 * @param {Object} e - リチクエストオブジェクト
 */
function logRequestDetails(e) {
  const details = {
    method: e.method || 'POST',
    parameters: e.parameter || {},
    headers: e.headers || {},
    contentLength: e.postData ? e.postData.contents.length : 0,
    userAgent: e.headers ? e.headers['User-Agent'] : 'unknown',
    timestamp: new Date().toISOString()
  };
  
  console.log('Request details:', JSON.stringify(details, null, 2));
}

// ===== Web Viewハンドラー =====

/**
 * カスタムWeb Viewを表示
 */
function doGet(e) {
  try {
    const recordId = e.parameter.recordId;
    const view = e.parameter.view;
    
    // ログビューアーを表示
    if (view === 'logs') {
      const template = HtmlService.createTemplateFromFile('log-viewer');
      template.spreadsheetUrl = getSpreadsheetUrl();
      return template.evaluate()
        .setTitle('ログビューアー')
        .setWidth(1200)
        .setHeight(800)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    
    // 成功ビューを表示
    if (view === 'success' && recordId) {
      const template = HtmlService.createTemplateFromFile('success-view');
      template.recordId = recordId;
      return template.evaluate()
        .setTitle('送信完了')
        .setWidth(800)
        .setHeight(600)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    
    // 処理済みビューを表示
    if (view === 'processed' && recordId) {
      const template = HtmlService.createTemplateFromFile('processed-view');
      template.recordId = recordId;
      return template.evaluate()
        .setTitle('処理結果')
        .setWidth(800)
        .setHeight(600)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
    
    if (!recordId) {
      return HtmlService.createHtmlOutput('<h1>エラー</h1><p>レコードIDが指定されていません。</p>');
    }
    
    // Lark Baseからレコードデータを取得
    const recordData = getRecordDetailsFromLark(recordId);
    
    // HTMLテンプレートにデータを渡す
    const template = HtmlService.createTemplateFromFile('index');
    template.recordId = recordId;
    template.data = recordData;
    
    return template.evaluate()
      .setTitle('フォーム送信内容の確認')
      .setWidth(800)
      .setHeight(600)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  } catch (error) {
    console.error('Error in doGet:', error);
    logError('DOGET_ERROR', error, e.parameter.recordId || '');
    return HtmlService.createHtmlOutput(`<h1>エラー</h1><p>${error.message}</p>`);
  }
}

/**
 * HTMLファイルをインクルードするヘルパー関数
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ===== テスト関数 =====

/**
 * 設定値のテスト
 */
function testConfiguration() {
  const props = PropertiesService.getScriptProperties();
  const requiredProps = ['LARK_APP_ID', 'LARK_APP_SECRET', 'LARK_BASE_TABLE_ID', 'LARK_BASE_APP_TOKEN'];
  
  requiredProps.forEach(prop => {
    const value = props.getProperty(prop);
    console.log(`${prop}: ${value ? 'Set' : 'Not set'}`);
  });
  
  // トークン取得のテスト
  try {
    const token = getLarkAccessToken();
    console.log('Token acquired successfully:', token.substring(0, 10) + '...');
  } catch (error) {
    console.error('Failed to get token:', error);
  }
}