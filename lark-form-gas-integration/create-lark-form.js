#!/usr/bin/env node

/**
 * Lark Form Creation Script
 * このスクリプトは、GAS連携用のLark BaseとFormを作成します
 */

const { Client } = require('@larksuiteoapi/node-sdk');

// Larkクライアントの設定
const client = new Client({
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  domain: 'https://open.larksuite.com',
  loggerLevel: 1
});

// フィールドタイプの定義
const FieldType = {
  TEXT: 1,           // テキスト
  NUMBER: 2,         // 数値
  SINGLE_SELECT: 3,  // 単一選択
  MULTI_SELECT: 4,   // 複数選択
  DATE: 5,           // 日付
  CHECKBOX: 7,       // チェックボックス
  USER: 11,          // ユーザー
  PHONE: 13,         // 電話番号
  URL: 15,           // URL
  EMAIL: 17,         // メール
  CURRENCY: 18,      // 通貨
  CREATED_TIME: 1001, // 作成日時
  MODIFIED_TIME: 1002, // 更新日時
  CREATED_USER: 1003, // 作成者
  MODIFIED_USER: 1004  // 更新者
};

async function createFormBase() {
  try {
    console.log('=== Lark Form Creation for GAS Integration ===\n');

    // Step 1: 新しいBaseを作成
    console.log('1. Creating new Base...');
    const createBaseResp = await client.bitable.app.create({
      data: {
        name: 'GAS Integration Form Data',
        folder_token: ''  // ルートフォルダに作成
      }
    });

    if (createBaseResp.code !== 0) {
      throw new Error(`Failed to create base: ${createBaseResp.msg}`);
    }

    const appToken = createBaseResp.data.app.app_token;
    console.log(`   ✓ Base created: ${appToken}\n`);

    // Step 2: デフォルトのテーブルIDを取得
    console.log('2. Getting default table...');
    const listTablesResp = await client.bitable.appTable.list({
      path: {
        app_token: appToken
      }
    });

    if (listTablesResp.code !== 0) {
      throw new Error(`Failed to list tables: ${listTablesResp.msg}`);
    }

    const tableId = listTablesResp.data.items[0].table_id;
    console.log(`   ✓ Default table ID: ${tableId}\n`);

    // Step 3: テーブルの名前を変更
    console.log('3. Renaming table...');
    await client.bitable.appTable.update({
      path: {
        app_token: appToken,
        table_id: tableId
      },
      data: {
        name: 'フォーム回答'
      }
    });
    console.log('   ✓ Table renamed to "フォーム回答"\n');

    // Step 4: フィールドを追加
    console.log('4. Adding fields to table...');
    
    const fields = [
      {
        field_name: '氏名',
        type: FieldType.TEXT,
        property: {
          options: []
        }
      },
      {
        field_name: 'メールアドレス',
        type: FieldType.EMAIL,
        property: {
          options: []
        }
      },
      {
        field_name: '電話番号',
        type: FieldType.PHONE,
        property: {
          options: []
        }
      },
      {
        field_name: '部署',
        type: FieldType.SINGLE_SELECT,
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
        type: FieldType.SINGLE_SELECT,
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
        type: FieldType.TEXT,
        property: {
          options: []
        }
      },
      {
        field_name: '緊急度',
        type: FieldType.SINGLE_SELECT,
        property: {
          options: [
            { name: '高', color: 0 },  // Red
            { name: '中', color: 1 },  // Yellow
            { name: '低', color: 2 }   // Green
          ]
        }
      }
    ];

    for (const field of fields) {
      console.log(`   - Adding field: ${field.field_name}`);
      const createFieldResp = await client.bitable.appTableField.create({
        path: {
          app_token: appToken,
          table_id: tableId
        },
        data: field
      });

      if (createFieldResp.code !== 0) {
        console.warn(`     ⚠ Failed to create field ${field.field_name}: ${createFieldResp.msg}`);
      } else {
        console.log(`     ✓ Field created`);
      }
    }

    console.log('\n5. Creating form view...');
    // フォームビューの作成
    const createFormResp = await client.bitable.appTableForm.create({
      path: {
        app_token: appToken,
        table_id: tableId
      },
      data: {
        name: 'お問い合わせフォーム',
        description: 'GAS連携テスト用のフォームです。送信後、自動でメッセージが送信されます。',
        shared: true  // 共有を有効化
      }
    });

    if (createFormResp.code !== 0) {
      throw new Error(`Failed to create form: ${createFormResp.msg}`);
    }

    const formId = createFormResp.data.form.form_id;
    console.log(`   ✓ Form created: ${formId}\n`);

    // 結果を表示
    console.log('=== Setup Complete! ===\n');
    console.log('重要な情報を以下に記録してください：\n');
    console.log(`Base App Token: ${appToken}`);
    console.log(`Table ID: ${tableId}`);
    console.log(`Form ID: ${formId}`);
    console.log('\nGASのスクリプトプロパティに設定してください：');
    console.log(`LARK_BASE_APP_TOKEN: ${appToken}`);
    console.log(`LARK_BASE_TABLE_ID: ${tableId}`);
    console.log('\nBase URL:');
    console.log(`https://open.larksuite.com/base/${appToken}`);
    console.log('\nForm URL (共有用):');
    console.log(`https://open.larksuite.com/base/${appToken}?table=${tableId}&view=${formId}`);

    // 設定ファイルに保存
    const fs = require('fs');
    const configData = {
      appToken,
      tableId,
      formId,
      createdAt: new Date().toISOString(),
      fields: fields.map(f => f.field_name)
    };
    
    fs.writeFileSync('lark-form-config.json', JSON.stringify(configData, null, 2));
    console.log('\n設定をlark-form-config.jsonに保存しました。');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// 実行
createFormBase();