#!/usr/bin/env node

/**
 * Lark Base フィールド追加スクリプト
 * 既存のBaseにフォーム用のフィールドを追加します
 */

const { Client } = require('@larksuiteoapi/node-sdk');

// Larkクライアントの設定
const client = new Client({
  appId: 'cli_a8d2fdb1f1f8d02d',
  appSecret: 'V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ',
  domain: 'https://open.larksuite.com',  // 国際版ドメイン
  loggerLevel: 1
});

// Base情報（作成済みのものを使用）
const APP_TOKEN = 'U38Xbik32acfCBsEbmmjm0NupRe';
const TABLE_ID = 'tblpU0WI9GEk2RrX';

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
  EMAIL: 22,         // メール（正しいタイプに修正）
  CURRENCY: 99,      // 通貨
  CREATED_TIME: 1001, // 作成日時
  MODIFIED_TIME: 1002, // 更新日時
  CREATED_USER: 1003, // 作成者
  MODIFIED_USER: 1004  // 更新者
};

async function addFormFields() {
  try {
    console.log('=== Lark Base フィールド追加 ===\n');
    console.log(`Base App Token: ${APP_TOKEN}`);
    console.log(`Table ID: ${TABLE_ID}\n`);

    // 追加するフィールドの定義
    const fields = [
      {
        field_name: '氏名',
        type: FieldType.TEXT,
        description: 'お名前を入力してください'
      },
      {
        field_name: 'メールアドレス',
        type: FieldType.EMAIL,
        description: '連絡先メールアドレス'
      },
      {
        field_name: '電話番号',
        type: FieldType.PHONE,
        description: '連絡先電話番号'
      },
      {
        field_name: '部署',
        type: FieldType.SINGLE_SELECT,
        description: '所属部署を選択してください',
        property: {
          options: [
            { name: '営業部', color: 0 },
            { name: '開発部', color: 1 },
            { name: '人事部', color: 2 },
            { name: 'マーケティング部', color: 3 },
            { name: 'その他', color: 4 }
          ]
        }
      },
      {
        field_name: '問い合わせ種別',
        type: FieldType.SINGLE_SELECT,
        description: 'お問い合わせの種類を選択してください',
        property: {
          options: [
            { name: '技術的な質問', color: 5 },
            { name: '製品に関する問い合わせ', color: 6 },
            { name: '価格・見積もり', color: 7 },
            { name: 'バグ報告', color: 0 },
            { name: 'その他', color: 4 }
          ]
        }
      },
      {
        field_name: '内容',
        type: FieldType.TEXT,
        description: 'お問い合わせ内容を詳しくご記入ください',
        property: {
          // 長文テキスト設定
        }
      },
      {
        field_name: '緊急度',
        type: FieldType.SINGLE_SELECT,
        description: '緊急度を選択してください',
        property: {
          options: [
            { name: '高', color: 0 },    // 赤
            { name: '中', color: 1 },    // 黄
            { name: '低', color: 2 }     // 緑
          ]
        }
      }
    ];

    console.log('フィールドを追加しています...\n');

    // 各フィールドを追加
    for (const field of fields) {
      try {
        console.log(`📝 ${field.field_name} を追加中...`);
        
        const createFieldResp = await client.bitable.appTableField.create({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID
          },
          data: field
        });

        if (createFieldResp.code === 0) {
          console.log(`   ✅ ${field.field_name} を追加しました`);
        } else {
          console.log(`   ⚠️  ${field.field_name} の追加に失敗: ${createFieldResp.msg}`);
        }
      } catch (error) {
        console.log(`   ❌ ${field.field_name} でエラー: ${error.message}`);
      }
    }

    console.log('\n=== フィールド追加完了 ===\n');
    console.log('次のステップ:');
    console.log('1. Lark Baseでフォームビューを作成');
    console.log('2. 自動化フローを設定');
    console.log('3. GASのスクリプトプロパティを更新\n');
    
    console.log('Base URL:');
    console.log(`https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}`);

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
    process.exit(1);
  }
}

// メイン実行
addFormFields();