#!/usr/bin/env node

/**
 * Lark MCP ツールを使用して問い合わせ番号（Formula）フィールドを作成
 */

import { Client } from '@larksuiteoapi/node-sdk';

// Larkクライアントの設定
const client = new Client({
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  domain: 'https://open.larksuite.com',
  loggerLevel: 1
});

// Base情報
const APP_TOKEN = 'U38Xbik32acfCBsEbmmjm0NupRe';
const TABLE_ID = 'tblpU0WI9GEk2RrX';

// フィールドタイプ定義
enum FieldType {
  Formula = 20  // Formula field type
}

async function createFormulaField() {
  console.log('🚀 Formula フィールド作成を開始します...\n');

  const formulaField = {
    field_name: '問い合わせ番号',
    type: FieldType.Formula,
    property: {
      formula_expression: 'CONCATENATE("CS-", TEXT(TODAY(), "YYMMDD"), "-", MID(RECORD_ID(), 4, 6))'
    }
  };

  try {
    console.log(`📝 作成中: ${formulaField.field_name}`);
    console.log(`📐 Formula: ${formulaField.property.formula_expression}`);
    
    const resp = await client.bitable.appTableField.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      data: formulaField
    });

    if (resp.code === 0) {
      console.log(`✅ 成功: ${formulaField.field_name}`);
      console.log(`📊 フィールドID: ${resp.data?.field?.field_id}`);
      console.log(`🔍 フィールドタイプ: ${resp.data?.field?.type}`);
      console.log('\n✨ Formula フィールドが正常に作成されました！');
      console.log('\n📌 フォーマット例: CS-250118-BRH7jh');
      console.log('  - CS: Customer Support prefix');
      console.log('  - 250118: 日付 (YYMMDD形式)');
      console.log('  - BRH7jh: レコードIDの一部（ユニーク識別子）');
    } else {
      console.log(`⚠️  失敗: ${formulaField.field_name} - ${resp.msg}`);
      if (resp.code === 1254043) {
        console.log('💡 ヒント: フィールドが既に存在する可能性があります。');
      }
    }
  } catch (error: any) {
    console.log(`❌ エラー: ${formulaField.field_name} - ${error.message}`);
    console.error('詳細エラー:', error);
  }

  console.log(`\n🔗 Base URL: https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}`);
}

// 実行
createFormulaField().catch(console.error);