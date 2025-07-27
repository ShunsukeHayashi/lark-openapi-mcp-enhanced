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
  console.log('📋 ビューを作成します...\n');

  try {
    // ビューの作成（フォームタイプ）
    const createViewResp = await client.bitable.appTableView.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      data: {
        view_name: 'お問い合わせフォーム',
        view_type: 'form'  // フォームビュー
      }
    });

    if (createViewResp.code === 0) {
      const viewId = createViewResp.data.view.view_id;
      
      console.log('✅ フォームビューが作成されました！');
      console.log(`\n📝 ビュー情報:`);
      console.log(`- ビューID: ${viewId}`);
      console.log(`- ビュー名: お問い合わせフォーム`);
      console.log(`- タイプ: フォーム`);
      
      console.log(`\n🔗 フォームURL:`);
      console.log(`https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}&view=${viewId}`);
      
      console.log('\n📋 次のステップ:');
      console.log('1. 上記URLにアクセスしてフォームの設定を完了');
      console.log('2. 共有設定で「リンクを知っている人が送信可能」に設定');
      console.log('3. 自動化フローを設定');
      
      // 設定ファイルを更新
      const fs = require('fs');
      const configPath = './lark-form-config.json';
      
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.formViewId = viewId;
        config.formUrl = `https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}&view=${viewId}`;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('\n✅ 設定ファイルが更新されました');
      }
      
      return viewId;
      
    } else {
      console.error('❌ ビュー作成エラー:', createViewResp.msg);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.response) {
      console.error('詳細:', error.response.data);
    }
  }
}

// 実行
createFormView().catch(console.error);