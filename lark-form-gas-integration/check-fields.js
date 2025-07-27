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

// フィールドタイプのマッピング
const fieldTypeNames = {
  1: 'テキスト',
  2: '数値',
  3: '単一選択',
  4: '複数選択',
  5: '日付',
  7: 'チェックボックス',
  11: 'ユーザー',
  13: '電話番号',
  15: 'URL',
  17: 'メール',
  18: '通貨',
  22: 'メール',
  99: '通貨',
  1001: '作成日時',
  1002: '更新日時',
  1003: '作成者',
  1004: '更新者',
  1005: 'メール'
};

async function checkFields() {
  console.log('📊 テーブルのフィールドを確認します...\n');
  console.log(`Base App Token: ${APP_TOKEN}`);
  console.log(`Table ID: ${TABLE_ID}\n`);
  console.log('=' .repeat(80));

  try {
    // フィールド一覧を取得
    const listFieldsResp = await client.bitable.appTableField.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      params: {
        page_size: 100
      }
    });

    if (listFieldsResp.code === 0) {
      const fields = listFieldsResp.data.items || [];
      
      console.log(`\n📋 フィールド数: ${fields.length}\n`);
      
      // フィールド情報を表示
      fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field.field_name}`);
        console.log(`   - ID: ${field.field_id}`);
        console.log(`   - タイプ: ${fieldTypeNames[field.type] || field.type} (${field.type})`);
        console.log(`   - UIタイプ: ${field.ui_type || 'N/A'}`);
        
        // 単一選択の場合、オプションを表示
        if (field.type === 3 && field.property && field.property.options) {
          console.log(`   - 選択肢:`);
          field.property.options.forEach(opt => {
            const color = opt.color !== undefined ? ` (色: ${opt.color})` : '';
            console.log(`     • ${opt.name}${color}`);
          });
        }
        
        console.log('');
      });
      
      console.log('=' .repeat(80));
      console.log('\n✅ フィールド確認が完了しました！\n');
      
      // 必要なフィールドが存在するかチェック
      const requiredFields = ['氏名', 'メールアドレス', '電話番号', '部署', '問い合わせ種別', '内容', '緊急度'];
      const existingFieldNames = fields.map(f => f.field_name);
      
      console.log('📌 必須フィールドの確認:');
      requiredFields.forEach(fieldName => {
        const exists = existingFieldNames.includes(fieldName);
        console.log(`${exists ? '✅' : '❌'} ${fieldName}`);
      });
      
      const missingFields = requiredFields.filter(f => !existingFieldNames.includes(f));
      if (missingFields.length > 0) {
        console.log(`\n⚠️  不足しているフィールド: ${missingFields.join(', ')}`);
      } else {
        console.log('\n✨ すべての必須フィールドが存在します！');
      }
      
    } else {
      console.error('❌ フィールド一覧の取得に失敗:', listFieldsResp.msg);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
  }
}

// 実行
checkFields().catch(console.error);