#!/usr/bin/env node

/**
 * MCP Tool実行可能な緊急発注アラートView作成スクリプト
 * 
 * MCPツールの制約:
 * - bitable.v1.appTableView.create: Viewの作成のみ（フィルター・ソート設定不可）
 * - bitable.v1.appTableField.list: フィールド情報の取得
 * - bitable.v1.appTableRecord.search: レコード検索
 * 
 * 制約により、フィルターとソートはUI上で手動設定が必要
 */

import { Client } from '@larksuiteoapi/node-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

// 設定
const APP_TOKEN = 'KgFMw2G2Yiphx7kxNz0jA8DFpqd';
const TABLE_ID = 'blkaRu69SEx1D08B';
const VIEW_NAME = '🚨緊急発注アラート';

// 初期化
const client = new Client({
  appId: process.env.APP_ID!,
  appSecret: process.env.APP_SECRET!,
  domain: process.env.LARK_DOMAIN || 'https://open.larksuite.com',
  loggerLevel: 2
});

interface FieldInfo {
  field_id: string;
  field_name: string;
  type: number;
}

async function executeWithMcpConstraints() {
  console.log('🚀 MCPツール制約対応版 - 緊急発注アラートView作成');
  console.log('================================================\n');

  try {
    // Step 1: フィールド情報を取得（利用可能API）
    console.log('1️⃣ フィールド情報を取得中...');
    const fieldsResponse = await client.bitable.appTableField.list({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      params: {
        page_size: 100
      }
    });

    if (!fieldsResponse.data?.items) {
      throw new Error('フィールド情報の取得に失敗しました');
    }

    const fields: FieldInfo[] = fieldsResponse.data.items;
    console.log(`✅ ${fields.length}個のフィールドを検出\n`);

    // フィールド名とIDのマッピングを表示
    console.log('📋 フィールド一覧:');
    const fieldMap: Record<string, string> = {};
    fields.forEach((field) => {
      fieldMap[field.field_name] = field.field_id;
      console.log(`  - ${field.field_name} (ID: ${field.field_id})`);
    });

    // Step 2: グリッドViewを作成（利用可能API）
    console.log('\n2️⃣ 緊急発注アラートViewを作成中...');
    const viewResponse = await client.bitable.appTableView.create({
      path: {
        app_token: APP_TOKEN,
        table_id: TABLE_ID
      },
      data: {
        view_name: VIEW_NAME,
        view_type: 'grid'  // グリッドビューのみサポート
      }
    });

    if (!viewResponse.data?.view?.view_id) {
      throw new Error('Viewの作成に失敗しました');
    }

    const viewId = viewResponse.data.view.view_id;
    console.log(`✅ View作成成功！ (ID: ${viewId})\n`);

    // Step 3: 緊急発注が必要なレコードを検索（利用可能API）
    console.log('3️⃣ 緊急発注が必要な商品を検索中...');
    
    // 検索条件を構築
    const searchConditions = [];
    
    // 緊急発注フラグフィールドがある場合
    const urgentFieldId = fieldMap['緊急発注フラグ'] || fieldMap['Urgent Order Flag'];
    if (urgentFieldId) {
      searchConditions.push({
        field_id: urgentFieldId,
        operator: 'is',
        value: ['🚩緊急']
      });
    }

    // 在庫切れ予測フィールドがある場合
    const stockoutFieldId = fieldMap['在庫切れ予測'] || fieldMap['Stockout Prediction'];
    if (stockoutFieldId) {
      searchConditions.push({
        field_id: stockoutFieldId,
        operator: 'isLess',
        value: ['30']
      });
    }

    // 検索実行
    if (searchConditions.length > 0) {
      try {
        const searchResponse = await client.bitable.appTableRecord.search({
          path: {
            app_token: APP_TOKEN,
            table_id: TABLE_ID
          },
          data: {
            filter: {
              conjunction: 'and',
              conditions: searchConditions
            },
            automatic_fields: false
          }
        });

        const recordCount = searchResponse.data?.items?.length || 0;
        console.log(`✅ ${recordCount}件の緊急発注商品を検出\n`);
      } catch (searchError) {
        console.log('⚠️  レコード検索はスキップ（権限不足の可能性）\n');
      }
    }

    // Step 4: 手動設定の案内
    console.log('📝 手動設定が必要な項目:');
    console.log('================================');
    console.log('\n以下の設定はLark Base UIで手動で行ってください：\n');

    console.log('1. フィルター設定:');
    console.log('   - 緊急発注フラグ = "🚩緊急"');
    console.log('   - 発注残数 = 0');
    console.log('   - 在庫切れ予測 < 30');
    console.log('   - 30日販売数 > 0\n');

    console.log('2. ソート設定:');
    console.log('   - 第1: 在庫切れ予測（昇順）');
    console.log('   - 第2: 30日販売数（降順）');
    console.log('   - 第3: 利益率（降順）\n');

    console.log('3. 条件付き書式:');
    console.log('   在庫切れ予測:');
    console.log('   - ≤10日: 背景色 赤(#FF4444)');
    console.log('   - 11-20日: 背景色 黄(#FFD700)');
    console.log('   - 21-30日: 背景色 橙(#FFA500)\n');

    console.log('   利益率:');
    console.log('   - ≥50%: 背景色 緑(#90EE90)');
    console.log('   - 30-49%: 背景色 淡黄(#FFFFE0)');
    console.log('   - <30%: 背景色 淡赤(#FFE4E1)\n');

    // 成功メッセージとURL
    console.log('✨ 完了！');
    console.log('================================');
    console.log(`📍 View URL: https://f82jyx0mblu.jp.larksuite.com/base/${APP_TOKEN}?table=${TABLE_ID}&view=${viewId}`);
    console.log('\n上記URLにアクセスして、手動設定を完了してください。');

    // 設定用JSONを生成
    const configJson = {
      viewId,
      fieldMapping: fieldMap,
      manualConfiguration: {
        filters: [
          { field: '緊急発注フラグ', operator: 'equals', value: '🚩緊急' },
          { field: '発注残数', operator: 'equals', value: '0' },
          { field: '在庫切れ予測', operator: 'lessThan', value: '30' },
          { field: '30日販売数', operator: 'greaterThan', value: '0' }
        ],
        sorting: [
          { field: '在庫切れ予測', order: 'asc' },
          { field: '30日販売数', order: 'desc' },
          { field: '利益率', order: 'desc' }
        ]
      }
    };

    // 設定ファイルを保存
    const fs = require('fs');
    fs.writeFileSync('emergency-view-config.json', JSON.stringify(configJson, null, 2));
    console.log('\n💾 設定情報をemergency-view-config.jsonに保存しました');

  } catch (error: any) {
    console.error('\n❌ エラーが発生しました:');
    console.error(error.message);
    
    if (error.response?.data) {
      console.error('詳細:', JSON.stringify(error.response.data, null, 2));
    }

    // エラー時の対処法
    console.log('\n🔧 トラブルシューティング:');
    console.log('1. 認証情報の確認:');
    console.log('   - APP_IDとAPP_SECRETが正しく設定されているか');
    console.log('   - ユーザーアクセストークンが必要な場合は設定');
    console.log('\n2. 権限の確認:');
    console.log('   - Base appへの編集権限があるか');
    console.log('   - 該当ワークスペースへのアクセス権があるか');
    console.log('\n3. ドメインの確認:');
    console.log('   - 日本: https://open.feishu.cn');
    console.log('   - 国際: https://open.larksuite.com');
    
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  executeWithMcpConstraints()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('予期しないエラー:', error);
      process.exit(1);
    });
}