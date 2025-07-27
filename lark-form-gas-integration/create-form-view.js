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

async function createFormView() {
  console.log('📋 フォームビューを作成します...\n');

  try {
    // フォームビューの作成
    const createFormResp = await client.bitable.appTableForm.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      data: {
        name: 'お問い合わせフォーム',
        description: 'GAS連携用のお問い合わせフォームです。送信後、確認用のリンクが自動で送信されます。',
        shared: true,  // 共有を有効化
        submit_limit_once: false  // 複数回の送信を許可
      }
    });

    if (createFormResp.code === 0) {
      const formId = createFormResp.data.form.form_id;
      const formShareUrl = createFormResp.data.form.shared_url;
      
      console.log('✅ フォームビューが作成されました！');
      console.log(`\n📝 フォーム情報:`);
      console.log(`- フォームID: ${formId}`);
      console.log(`- フォーム名: お問い合わせフォーム`);
      console.log(`\n🔗 共有URL:`);
      console.log(formShareUrl || `https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}&view=${formId}`);
      
      // フォーム設定の更新
      console.log('\n⚙️  フォーム設定を更新中...');
      
      // フォームメタ情報の更新を試みる
      try {
        const updateResp = await client.bitable.appTableFormField.update({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID,
            form_id: formId,
            field_id: 'all'  // 全フィールド
          },
          data: {
            required: true,  // 必須にする
            visible: true    // 表示する
          }
        });
        
        if (updateResp.code === 0) {
          console.log('✅ フォーム設定が更新されました');
        }
      } catch (error) {
        console.log('ℹ️  フォーム設定の詳細カスタマイズはUIから行ってください');
      }
      
      console.log('\n📋 次のステップ:');
      console.log('1. フォームの共有URLにアクセスしてテスト送信');
      console.log('2. 自動化フローを設定（レコード作成時 → Webhook送信）');
      console.log('3. GASのスクリプトプロパティを更新');
      
      return formId;
      
    } else {
      console.error('❌ フォーム作成エラー:', createFormResp.msg);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

// 実行
createFormView().catch(console.error);