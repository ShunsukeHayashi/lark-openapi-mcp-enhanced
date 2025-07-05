// ===================================
// Lark Shift Management System with GAS (セキュア版)
// ===================================

// 設定情報 - 環境変数やPropertiesServiceを使用
const CONFIG = {
  // スクリプトプロパティから認証情報を取得
  get LARK_APP_ID() {
    return PropertiesService.getScriptProperties().getProperty('LARK_APP_ID');
  },
  get LARK_APP_SECRET() {
    return PropertiesService.getScriptProperties().getProperty('LARK_APP_SECRET');
  },
  
  // Base関連の設定（これらは公開されても問題ない）
  BASE_APP_TOKEN: 'GrBobXM1padlKGsk1MIjBOKvpob',
  
  // テーブルID
  TABLES: {
    STAFF: 'tbln3U7nMeHMQTu6',
    SHIFT: 'tbl44cmf8Rqzl8Qa',
    SALARY: 'tble32hLS2e9p7VQ'
  },
  
  // フィールドID
  FIELDS: {
    STAFF: {
      NAME: 'fld1iNDrKD',
      HOURLY_RATE: 'fldli5DQIL',
      STATUS: 'fldd0BfSvK',
      EMAIL: 'fldLdNauwT'
    },
    SHIFT: {
      STAFF_NAME: 'fldS2DHg34',
      WORK_DATE: 'fldxQDKkI1',
      START_TIME: 'fldQK8gz0E',
      END_TIME: 'fldgrnZX7v',
      BREAK_TIME: 'fldt0PhBim',
      STATUS: 'fldaHLXPtD'
    }
  }
};

// ===================================
// 初期設定関数（初回のみ実行）
// ===================================

/**
 * スクリプトプロパティに認証情報を設定
 * この関数は初回設定時に一度だけ実行してください
 */
function setupCredentials() {
  const ui = SpreadsheetApp.getUi();
  
  // App IDの入力
  const appIdResponse = ui.prompt(
    '認証情報設定',
    'Lark App IDを入力してください:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (appIdResponse.getSelectedButton() === ui.Button.CANCEL) {
    return;
  }
  
  // App Secretの入力
  const appSecretResponse = ui.prompt(
    '認証情報設定',
    'Lark App Secretを入力してください:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (appSecretResponse.getSelectedButton() === ui.Button.CANCEL) {
    return;
  }
  
  // プロパティに保存
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('LARK_APP_ID', appIdResponse.getResponseText());
  scriptProperties.setProperty('LARK_APP_SECRET', appSecretResponse.getResponseText());
  
  ui.alert('認証情報を設定しました。');
}

/**
 * 認証情報の存在確認
 */
function checkCredentials() {
  const appId = CONFIG.LARK_APP_ID;
  const appSecret = CONFIG.LARK_APP_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error('認証情報が設定されていません。メニューから「認証情報設定」を実行してください。');
  }
  
  return true;
}

// ===================================
// 以下、既存のコードに修正を加える
// ===================================

/**
 * Larkのアクセストークンを取得（改良版）
 */
function getLarkAccessToken() {
  // 認証情報の確認
  checkCredentials();
  
  const url = 'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal';
  
  const payload = {
    app_id: CONFIG.LARK_APP_ID,
    app_secret: CONFIG.LARK_APP_SECRET
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    if (data.code === 0) {
      return data.tenant_access_token;
    } else {
      throw new Error(`Failed to get access token: ${data.msg}`);
    }
  } catch (error) {
    console.error('Error getting Lark access token:', error);
    throw error;
  }
}

// ===================================
// メニューに認証情報設定を追加
// ===================================

/**
 * メニューを作成（スプレッドシート用）
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('シフト管理')
    .addItem('認証情報設定', 'setupCredentials')
    .addSeparator()
    .addItem('シフト登録フォーム', 'showShiftForm')
    .addItem('週次給料計算', 'showWeeklySalaryReport')
    .addItem('月次給料計算', 'showMonthlySalaryReport')
    .addSeparator()
    .addItem('トリガー設定', 'setupTriggers')
    .addItem('設定確認', 'checkConfiguration')
    .addToUi();
}

// ===================================
// 未定義関数の実装
// ===================================

/**
 * 給料クエリを処理
 */
function handleSalaryQuery(chatId, text) {
  try {
    let message = '給料情報:\n\n';
    
    if (text.includes('今月')) {
      // 今月の給料を計算
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      message += getMonthlySalaryInfo(monthStart);
    } else if (text.includes('先週')) {
      // 先週の給料を計算
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7 - lastWeekStart.getDay());
      message += getWeeklySalaryInfo(lastWeekStart);
    } else {
      message = '「今月の給料」または「先週の給料」と指定してください。';
    }
    
    sendLarkMessage(chatId, message);
  } catch (error) {
    sendLarkMessage(chatId, `給料情報の取得に失敗しました: ${error.message}`);
  }
}

/**
 * シフトクエリを処理
 */
function handleShiftQuery(chatId, text) {
  try {
    let message = 'シフト情報:\n\n';
    
    if (text.includes('今週')) {
      message += getWeeklyShiftInfo();
    } else if (text.includes('明日')) {
      message += getTomorrowShiftInfo();
    } else if (text.includes('今日')) {
      message += getTodayShiftInfo();
    } else {
      // スタッフ名が含まれているか確認
      const staffName = extractStaffName(text);
      if (staffName) {
        message += getStaffShiftInfo(staffName);
      } else {
        message = '「今週のシフト」「明日のシフト」「今日のシフト」または「〇〇さんのシフト」と指定してください。';
      }
    }
    
    sendLarkMessage(chatId, message);
  } catch (error) {
    sendLarkMessage(chatId, `シフト情報の取得に失敗しました: ${error.message}`);
  }
}

/**
 * ダイレクトメッセージを送信
 */
function sendDirectMessage(userId, message) {
  const token = getLarkAccessToken();
  const url = 'https://open.larksuite.com/open-apis/im/v1/messages';
  
  const payload = {
    receive_id: userId,
    msg_type: 'text',
    content: JSON.stringify({ text: message })
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url + '?receive_id_type=user_id', options);
    const data = JSON.parse(response.getContentText());
    
    if (data.code !== 0) {
      console.error('DM送信エラー:', data);
    }
  } catch (error) {
    console.error('Error sending direct message:', error);
  }
}

// ===================================
// ヘルパー関数の実装
// ===================================

/**
 * 月次給料情報を取得
 */
function getMonthlySalaryInfo(monthStart) {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  
  const filter = {
    conjunction: 'and',
    conditions: [
      {
        field_name: '計算期間開始',
        operator: 'isGreaterEqual',
        value: [monthStart.getTime().toString()]
      },
      {
        field_name: '計算期間終了',
        operator: 'isLessEqual',
        value: [monthEnd.getTime().toString()]
      },
      {
        field_name: '計算期間種別',
        operator: 'is',
        value: ['月次']
      }
    ]
  };
  
  const salaryRecords = searchLarkBaseRecords(CONFIG.TABLES.SALARY, filter);
  
  if (salaryRecords.length === 0) {
    return '今月の給料データはまだありません。';
  }
  
  let totalAmount = 0;
  let details = '';
  
  salaryRecords.forEach(record => {
    const amount = record.fields['支給額'] || 0;
    totalAmount += amount;
    details += `${record.fields['スタッフ名']}: ¥${amount.toLocaleString()}\n`;
  });
  
  return `合計支給額: ¥${totalAmount.toLocaleString()}\n\n詳細:\n${details}`;
}

/**
 * 週次給料情報を取得
 */
function getWeeklySalaryInfo(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const filter = {
    conjunction: 'and',
    conditions: [
      {
        field_name: '計算期間開始',
        operator: 'isGreaterEqual',
        value: [weekStart.getTime().toString()]
      },
      {
        field_name: '計算期間終了',
        operator: 'isLessEqual',
        value: [weekEnd.getTime().toString()]
      },
      {
        field_name: '計算期間種別',
        operator: 'is',
        value: ['週次']
      }
    ]
  };
  
  const salaryRecords = searchLarkBaseRecords(CONFIG.TABLES.SALARY, filter);
  
  if (salaryRecords.length === 0) {
    return '指定週の給料データはありません。';
  }
  
  let totalAmount = 0;
  let details = '';
  
  salaryRecords.forEach(record => {
    const amount = record.fields['支給額'] || 0;
    totalAmount += amount;
    details += `${record.fields['スタッフ名']}: ¥${amount.toLocaleString()}\n`;
  });
  
  return `週間支給額: ¥${totalAmount.toLocaleString()}\n期間: ${formatDate(weekStart)} - ${formatDate(weekEnd)}\n\n詳細:\n${details}`;
}

/**
 * 今週のシフト情報を取得
 */
function getWeeklyShiftInfo() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return getShiftInfoForPeriod(weekStart, weekEnd, '今週');
}

/**
 * 明日のシフト情報を取得
 */
function getTomorrowShiftInfo() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);
  
  return getShiftInfoForPeriod(tomorrow, tomorrowEnd, '明日');
}

/**
 * 今日のシフト情報を取得
 */
function getTodayShiftInfo() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  return getShiftInfoForPeriod(today, todayEnd, '今日');
}

/**
 * 期間指定でシフト情報を取得
 */
function getShiftInfoForPeriod(startDate, endDate, periodName) {
  const filter = {
    conjunction: 'and',
    conditions: [
      {
        field_name: '勤務日',
        operator: 'isGreaterEqual',
        value: [startDate.getTime().toString()]
      },
      {
        field_name: '勤務日',
        operator: 'isLessEqual',
        value: [endDate.getTime().toString()]
      }
    ]
  };
  
  const shifts = searchLarkBaseRecords(CONFIG.TABLES.SHIFT, filter);
  
  if (shifts.length === 0) {
    return `${periodName}のシフトはありません。`;
  }
  
  let shiftInfo = `${periodName}のシフト:\n\n`;
  
  // 日付でソート
  shifts.sort((a, b) => a.fields['勤務日'] - b.fields['勤務日']);
  
  shifts.forEach(shift => {
    const workDate = new Date(shift.fields['勤務日']);
    const startTime = new Date(shift.fields['出勤時刻']);
    const endTime = new Date(shift.fields['退勤時刻']);
    
    shiftInfo += `${formatDate(workDate)} ${shift.fields['スタッフ名']}: ${formatTime(startTime)}-${formatTime(endTime)} (${shift.fields['ステータス']})\n`;
  });
  
  return shiftInfo;
}

/**
 * スタッフ名を抽出
 */
function extractStaffName(text) {
  // 既知のスタッフ名リストから検索
  const staffNames = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美代'];
  
  for (const name of staffNames) {
    if (text.includes(name)) {
      return name;
    }
  }
  
  // 「〇〇さんのシフト」パターンで抽出
  const match = text.match(/(.+?)(さん|の)シフト/);
  if (match) {
    return match[1].trim();
  }
  
  return null;
}

/**
 * スタッフのシフト情報を取得
 */
function getStaffShiftInfo(staffName) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const filter = {
    conjunction: 'and',
    conditions: [
      {
        field_name: 'スタッフ名',
        operator: 'is',
        value: [staffName]
      },
      {
        field_name: '勤務日',
        operator: 'isGreaterEqual',
        value: [monthStart.getTime().toString()]
      },
      {
        field_name: '勤務日',
        operator: 'isLessEqual',
        value: [monthEnd.getTime().toString()]
      }
    ]
  };
  
  const shifts = searchLarkBaseRecords(CONFIG.TABLES.SHIFT, filter);
  
  if (shifts.length === 0) {
    return `${staffName}さんの今月のシフトはありません。`;
  }
  
  let shiftInfo = `${staffName}さんの今月のシフト:\n\n`;
  
  // 日付でソート
  shifts.sort((a, b) => a.fields['勤務日'] - b.fields['勤務日']);
  
  shifts.forEach(shift => {
    const workDate = new Date(shift.fields['勤務日']);
    const startTime = new Date(shift.fields['出勤時刻']);
    const endTime = new Date(shift.fields['退勤時刻']);
    
    shiftInfo += `${formatDate(workDate)}: ${formatTime(startTime)}-${formatTime(endTime)} (${shift.fields['ステータス']})\n`;
  });
  
  return shiftInfo;
}

// ===================================
// 既存の関数はそのまま使用（認証情報関連以外）
// ===================================