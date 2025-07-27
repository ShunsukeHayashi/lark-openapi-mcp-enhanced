#!/usr/bin/env node

const { Client } = require('@larksuiteoapi/node-sdk');

// Larkクライアントの設定
const client = new Client({
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  domain: 'https://open.larksuite.com',
  loggerLevel: 1
});

const APP_TOKEN = 'U38Xbik32acfCBsEbmmjm0NupRe';
const TABLE_ID = 'tblpU0WI9GEk2RrX';

async function addStatusFields() {
  console.log('📊 ステータス管理用フィールドを追加します...\n');

  const fields = [
    {
      field_name: '処理ステータス',
      type: 3, // SingleSelect
      ui_type: 'SingleSelect',
      property: {
        options: [
          { name: '未処理', color: 4 },    // グレー
          { name: '処理中', color: 1 },    // 黄色
          { name: '完了', color: 2 },      // 緑
          { name: 'エラー', color: 0 },    // 赤
          { name: '保留', color: 3 }       // 青
        ]
      }
    },
    {
      field_name: '処理開始時刻',
      type: 5, // DateTime
      ui_type: 'DateTime',
      property: {
        date_format: 'yyyy-MM-dd',
        time_format: 'HH:mm',
        auto_fill: false
      }
    },
    {
      field_name: '処理完了時刻',
      type: 5, // DateTime
      ui_type: 'DateTime',
      property: {
        date_format: 'yyyy-MM-dd',
        time_format: 'HH:mm',
        auto_fill: false
      }
    },
    {
      field_name: 'エラーメッセージ',
      type: 1, // Text
      ui_type: 'Text'
    },
    {
      field_name: '処理担当者',
      type: 11, // User
      ui_type: 'User',
      property: {
        multiple: false
      }
    },
    {
      field_name: '処理メモ',
      type: 1, // Text (長文)
      ui_type: 'Text',
      property: {}
    }
  ];

  // 各フィールドを作成
  for (const field of fields) {
    try {
      console.log(`📝 作成中: ${field.field_name}`);
      
      const resp = await client.bitable.appTableField.create({
        path: {
          app_token: APP_TOKEN,
          table_id: TABLE_ID
        },
        data: field
      });

      if (resp.code === 0) {
        console.log(`✅ 成功: ${field.field_name} (ID: ${resp.data.field.field_id})`);
      } else {
        console.log(`⚠️  失敗: ${field.field_name} - ${resp.msg}`);
      }
    } catch (error) {
      console.log(`❌ エラー: ${field.field_name} - ${error.message}`);
    }
  }

  console.log('\n✨ ステータスフィールドの追加が完了しました！');
  console.log('\n📋 次のステップ:');
  console.log('1. Lark Baseでボタンフィールド「GAS処理実行」を手動で追加');
  console.log('2. 自動化フローを設定（button-automation-config.json参照）');
  console.log('3. GAS側でボタンクリックイベントの処理を実装');
}

// 実行
addStatusFields().catch(console.error);