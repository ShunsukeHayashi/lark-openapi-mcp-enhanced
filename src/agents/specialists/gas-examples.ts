/**
 * GAS Code Examples and Templates
 * Common patterns for Google Apps Script execution
 */

export const GASExamples = {
  // Gmail Examples
  gmail: {
    sendEmail: {
      title: 'メール送信',
      code: `const recipient = "email@example.com";
const subject = "GAS Interpreter Test";
const body = "Hello from GAS Interpreter!";
GmailApp.sendEmail(recipient, subject, body);
return \`Email sent successfully to \${recipient} with subject: '\${subject}' and body: '\${body}'\`;`,
    },

    searchEmails: {
      title: '間近5件のメール検索',
      code: `const threads = GmailApp.getInboxThreads(0, 5);
const emailDetails = threads.map(thread => {
  const messages = thread.getMessages();
  const lastMessage = messages[messages.length - 1];
  const subject = lastMessage.getSubject();
  const from = lastMessage.getFrom();
  const date = lastMessage.getDate();
  const body = lastMessage.getPlainBody().slice(0, 150);
  return {
    subject,
    from,
    date: date.toString(),
    body
  }
});
return JSON.stringify(emailDetails);`,
    },

    unreadEmails: {
      title: '未読メール確認',
      code: `const unreadThreads = GmailApp.search('is:unread', 0, 10);
const unreadCount = GmailApp.getInboxUnreadCount();
const unreadDetails = unreadThreads.map(thread => {
  const firstMessage = thread.getMessages()[0];
  return {
    subject: thread.getFirstMessageSubject(),
    from: firstMessage.getFrom(),
    date: firstMessage.getDate().toString()
  };
});
return JSON.stringify({
  totalUnread: unreadCount,
  recentUnread: unreadDetails
}, null, 2);`,
    },
  },

  // Spreadsheet Examples
  spreadsheet: {
    createWithData: {
      title: 'スプレッドシート作成',
      code: `const spreadsheet = SpreadsheetApp.create("GAS Interpreter Sheet");
const sheet = spreadsheet.getActiveSheet();
const data = [
  ["Name", "Score"],
  ["山田", "88"],
  ["佐藤", "92"]
];
sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

const dataText = data.map(row => row.join(", ")).join("; ");
return \`Sheet created and data added: \${dataText}. Sheet URL: \${spreadsheet.getUrl()}\`;`,
    },

    readData: {
      title: 'データ読み取り',
      code: `const sheet = SpreadsheetApp.getActiveSheet();
const data = sheet.getDataRange().getValues();
const headers = data[0];
const rows = data.slice(1);

const formatted = rows.map(row => {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index];
  });
  return obj;
});

return JSON.stringify({
  headers: headers,
  rowCount: rows.length,
  data: formatted.slice(0, 5) // First 5 rows
}, null, 2);`,
    },

    createChart: {
      title: 'グラフ作成',
      code: `const sheet = SpreadsheetApp.getActiveSheet();
const range = sheet.getRange("A1:B6");
const chart = sheet.newChart()
  .setChartType(Charts.ChartType.COLUMN)
  .addRange(range)
  .setPosition(5, 5, 0, 0)
  .setOption('title', 'Score Chart')
  .build();
sheet.insertChart(chart);
return "Chart created successfully";`,
    },
  },

  // Calendar Examples
  calendar: {
    createEvent: {
      title: 'カレンダーイベント作成',
      code: `const calendar = CalendarApp.getDefaultCalendar();
const title = 'Meeting with GAS Interpreter';
const startTime = new Date();
startTime.setHours(startTime.getHours() + 1);
const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

const event = calendar.createEvent(title, startTime, endTime, {
  description: 'Created by GAS Interpreter',
  location: 'Online'
});

return \`Event created: \${event.getTitle()} on \${startTime.toDateString()} from \${startTime.toTimeString()} to \${endTime.toTimeString()}\`;`,
    },

    getTodayEvents: {
      title: '今日の予定確認',
      code: `const calendar = CalendarApp.getDefaultCalendar();
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const events = calendar.getEvents(today, tomorrow);
const eventDetails = events.map(event => ({
  title: event.getTitle(),
  start: event.getStartTime().toString(),
  end: event.getEndTime().toString(),
  location: event.getLocation() || 'N/A'
}));

return JSON.stringify({
  date: today.toDateString(),
  eventCount: events.length,
  events: eventDetails
}, null, 2);`,
    },
  },

  // Google Drive Examples
  drive: {
    searchFiles: {
      title: 'ファイル検索',
      code: `const files = DriveApp.searchFiles('title contains "AI"');
const spreadsheet = SpreadsheetApp.create("AI Files Links");
const sheet = spreadsheet.getActiveSheet();
sheet.appendRow(["File Name", "Link"]);

while (files.hasNext()) {
  const file = files.next();
  sheet.appendRow([file.getName(), file.getUrl()]);
}

const fileInfoText = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues()
  .map(row => \`\${row[0]}: \${row[1]}\`).join("; ");

return \`Spreadsheet with AI files created: \${spreadsheet.getUrl()}. Files included: \${fileInfoText}\`;`,
    },

    createFolder: {
      title: 'フォルダ作成',
      code: `const folderName = "GAS Interpreter Files";
const folder = DriveApp.createFolder(folderName);
const readme = folder.createFile("README.txt", "This folder was created by GAS Interpreter");

return \`Folder created: \${folder.getName()}\nFolder URL: \${folder.getUrl()}\nReadme file created: \${readme.getName()}\`;`,
    },

    getStorageInfo: {
      title: 'ストレージ情報',
      code: `const storageLimit = DriveApp.getStorageLimit();
const storageUsed = DriveApp.getStorageUsed();
const storageFree = storageLimit - storageUsed;

return JSON.stringify({
  totalStorage: \`\${(storageLimit / (1024 * 1024 * 1024)).toFixed(2)} GB\`,
  usedStorage: \`\${(storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB\`,
  freeStorage: \`\${(storageFree / (1024 * 1024 * 1024)).toFixed(2)} GB\`,
  usagePercentage: \`\${((storageUsed / storageLimit) * 100).toFixed(2)}%\`
}, null, 2);`,
    },
  },

  // Forms Examples
  forms: {
    createSurvey: {
      title: 'アンケートフォーム作成',
      code: `const form = FormApp.create('ChatGPT利用状況調査');
form.setDescription('この調査はChatGPTの利用状況に関するものです。回答は研究目的でのみ使用されます。');
form.addMultipleChoiceItem()
  .setTitle('どのくらいの頻度でChatGPTを使用しますか？')
  .setChoiceValues(['毎日', '週に数回', '月に数回', 'ほとんど使用しない'])
  .setRequired(true);
form.addParagraphTextItem()
  .setTitle('ChatGPTを使用する主な目的を教えてください。')
  .setRequired(true);
form.addScaleItem()
  .setTitle('ChatGPTの満足度を評価してください。')
  .setBounds(1, 5)
  .setLabels('非常に不満', '非常に満足')
  .setRequired(true);

form.addParagraphTextItem()
  .setTitle('改善してほしい点や提案があればご記入ください。');
return \`フォームが作成されました。編集リンク: \${form.getEditUrl()}\`;`,
    },
  },

  // Utility Examples
  utility: {
    urlFetch: {
      title: '外部API呼び出し',
      code: `const url = "https://api.github.com/users/google";
const response = UrlFetchApp.fetch(url);
const data = JSON.parse(response.getContentText());

return JSON.stringify({
  name: data.name,
  company: data.company,
  location: data.location,
  public_repos: data.public_repos,
  followers: data.followers
}, null, 2);`,
    },

    sendSlackNotification: {
      title: 'Slack通知送信',
      code: `const webhookUrl = "YOUR_SLACK_WEBHOOK_URL";
const payload = {
  text: "Hello from GAS Interpreter!",
  username: "GAS Bot",
  icon_emoji: ":robot_face:"
};

const options = {
  method: "post",
  contentType: "application/json",
  payload: JSON.stringify(payload)
};

try {
  UrlFetchApp.fetch(webhookUrl, options);
  return "Slack notification sent successfully!";
} catch (e) {
  return "Please set a valid Slack webhook URL";
}`,
    },
  },

  // Advanced Examples
  advanced: {
    batchEmailProcessing: {
      title: 'バッチメール処理',
      code: `const label = GmailApp.getUserLabelByName("処理待ち") || GmailApp.createLabel("処理待ち");
const threads = label.getThreads(0, 10);
const processed = [];

threads.forEach(thread => {
  const messages = thread.getMessages();
  messages.forEach(message => {
    if (!message.isStarred()) {
      message.star();
      processed.push({
        subject: message.getSubject(),
        from: message.getFrom(),
        date: message.getDate().toString()
      });
    }
  });
  thread.removeLabel(label);
});

return JSON.stringify({
  processedCount: processed.length,
  processedEmails: processed
}, null, 2);`,
    },

    dataAnalysis: {
      title: 'データ分析レポート',
      code: `const sheet = SpreadsheetApp.getActiveSheet();
const data = sheet.getDataRange().getValues();
const headers = data[0];
const rows = data.slice(1);

// Simple statistics
const numericColumns = {};
headers.forEach((header, index) => {
  const values = rows.map(row => row[index]).filter(val => typeof val === 'number');
  if (values.length > 0) {
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    numericColumns[header] = {
      count: values.length,
      sum: sum.toFixed(2),
      average: avg.toFixed(2),
      max: max,
      min: min
    };
  }
});

return JSON.stringify({
  totalRows: rows.length,
  columns: headers,
  numericAnalysis: numericColumns
}, null, 2);`,
    },
  },
};

/**
 * Get example code by category and name
 */
export function getGASExample(category: string, name: string): { title: string; code: string } | null {
  const categoryExamples = GASExamples[category as keyof typeof GASExamples];
  if (!categoryExamples) return null;

  const example = categoryExamples[name as keyof typeof categoryExamples];
  return example || null;
}

/**
 * Get all examples in a category
 */
export function getExamplesByCategory(category: string): string[] {
  const categoryExamples = GASExamples[category as keyof typeof GASExamples];
  if (!categoryExamples) return [];

  return Object.keys(categoryExamples);
}

/**
 * Get all categories
 */
export function getExampleCategories(): string[] {
  return Object.keys(GASExamples);
}
