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

async function createFields() {
  console.log('🚀 フィールド作成を開始します...\n');

  const fields = [
    {
      field_name: '氏名',
      type: 1,  // Text
      ui_type: 'Text'
    },
    {
      field_name: 'メールアドレス', 
      type: 1,  // Text (Emailタイプがないのでテキストで代用)
      ui_type: 'Text'
    },
    {
      field_name: '電話番号',
      type: 13,  // Phone
      ui_type: 'Phone'
    },
    {
      field_name: '部署',
      type: 3,  // SingleSelect
      ui_type: 'SingleSelect',
      property: {
        options: [
          { name: '営業部' },
          { name: '開発部' },
          { name: '人事部' },
          { name: 'マーケティング部' },
          { name: 'その他' }
        ]
      }
    },
    {
      field_name: '問い合わせ種別',
      type: 3,  // SingleSelect
      ui_type: 'SingleSelect',
      property: {
        options: [
          { name: '技術的な質問' },
          { name: '製品に関する問い合わせ' },
          { name: '価格・見積もり' },
          { name: 'バグ報告' },
          { name: 'その他' }
        ]
      }
    },
    {
      field_name: '内容',
      type: 1,  // Text
      ui_type: 'Text',
      property: {}
    },
    {
      field_name: '緊急度',
      type: 3,  // SingleSelect
      ui_type: 'SingleSelect',
      property: {
        options: [
          { name: '高', color: 0 },  // 赤
          { name: '中', color: 1 },  // 黄
          { name: '低', color: 2 }   // 緑
        ]
      }
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

  console.log('\n✨ フィールド作成が完了しました！');
  console.log('\n📋 次のステップ:');
  console.log('1. Lark Baseでフォームビューを作成');
  console.log('2. 共有設定を有効化');
  console.log('3. 自動化フローを設定');
  console.log(`\n🔗 Base URL: https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}`);
}

// 実行
createFields().catch(console.error);