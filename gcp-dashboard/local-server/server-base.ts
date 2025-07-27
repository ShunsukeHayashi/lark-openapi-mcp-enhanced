import express from 'express';
import cors from 'cors';
import path from 'path';
import * as lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Lark設定
const LARK_CONFIG = {
  APP_TOKEN: process.env.LARK_APP_TOKEN || '',
  TABLE_ID: process.env.LARK_TABLE_ID || '',
  APP_ID: process.env.LARK_APP_ID || process.env.APP_ID || '',
  APP_SECRET: process.env.LARK_APP_SECRET || process.env.APP_SECRET || ''
};

// Larkクライアントの初期化
const client = new lark.Client({
  appId: LARK_CONFIG.APP_ID,
  appSecret: LARK_CONFIG.APP_SECRET,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Lark,
});

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../demo')));

// Larkレコードの型定義
interface LarkRecord {
  record_id: string;
  fields: {
    [key: string]: any;
  };
}

// キャッシュ用変数
let cachedData: any = null;
let lastFetchTime: Date | null = null;
const CACHE_DURATION = 60000; // 1分間キャッシュ

// Lark Baseからデータを取得
async function fetchLarkData(): Promise<LarkRecord[]> {
  const allRecords: LarkRecord[] = [];
  let pageToken: string | undefined = undefined;
  
  console.log('Fetching data from Lark Base...');
  console.log('App Token:', LARK_CONFIG.APP_TOKEN);
  console.log('Table ID:', LARK_CONFIG.TABLE_ID);

  try {
    do {
      const response = await client.bitable.appTableRecord.list({
        path: {
          app_token: LARK_CONFIG.APP_TOKEN,
          table_id: LARK_CONFIG.TABLE_ID,
        },
        params: {
          page_size: 500,
          page_token: pageToken,
        },
      });

      if (response.code !== 0) {
        throw new Error(`Lark API error: ${response.msg}`);
      }

      const items = response.data?.items || [];
      // record_idが必ず存在するようにフィルタリング
      const validItems = items.filter((item: any) => item.record_id) as LarkRecord[];
      allRecords.push(...validItems);
      pageToken = response.data?.page_token;
      
    } while (pageToken);

    console.log(`Fetched ${allRecords.length} records from Lark Base`);
    return allRecords;
  } catch (error) {
    console.error('Failed to fetch Lark data:', error);
    
    // エラー時はデモデータを返す
    console.log('Falling back to demo data...');
    return createDemoData();
  }
}

// デモデータを生成
function createDemoData(): LarkRecord[] {
  return [
    {
      record_id: '1',
      fields: {
        '商品名': 'プレミアムコーヒー豆 1kg',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': 2,
        '発注残数': 50,
        '30日販売数': 380,
        '現在庫数': 15
      }
    },
    {
      record_id: '2',
      fields: {
        '商品名': 'オーガニック紅茶セット',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': 3,
        '発注残数': 0,
        '30日販売数': 250,
        '現在庫数': 8
      }
    },
    {
      record_id: '3',
      fields: {
        '商品名': 'チョコレートギフトボックス',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': 5,
        '発注残数': 100,
        '30日販売数': 420,
        '現在庫数': 30
      }
    },
    {
      record_id: '4',
      fields: {
        '商品名': '手作りクッキー詰め合わせ',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': 6,
        '発注残数': 0,
        '30日販売数': 180,
        '現在庫数': 45
      }
    },
    {
      record_id: '5',
      fields: {
        '商品名': '季節限定ジャムセット',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': 7,
        '発注残数': 75,
        '30日販売数': 165,
        '現在庫数': 22
      }
    }
  ];
}

// フィールド値を安全に取得
function getFieldValue(field: any, defaultValue: any = ''): any {
  if (!field) return defaultValue;
  
  // Lark Baseのフィールドタイプに応じて値を取得
  if (Array.isArray(field)) {
    // 選択フィールドの場合
    return field[0]?.text || field[0] || defaultValue;
  }
  if (typeof field === 'object' && field.text) {
    // テキストオブジェクトの場合
    return field.text;
  }
  if (typeof field === 'object' && field.value !== undefined) {
    // 数値オブジェクトの場合
    return field.value;
  }
  
  // プリミティブ値の場合
  return field || defaultValue;
}

// データを集計
function aggregateData(records: LarkRecord[]) {
  // 緊急発注商品のフィルタリング
  const emergencyItems = records.filter(record => {
    const urgentFlag = getFieldValue(record.fields['緊急発注フラグ']);
    return urgentFlag === '🚩緊急' || urgentFlag === '緊急';
  });

  // 在庫切れ予測日数でグループ化
  const stockoutGroups = {
    critical_7days: 0,
    warning_14days: 0,
    caution_30days: 0,
    normal: 0
  };

  emergencyItems.forEach(record => {
    const stockoutDays = parseInt(getFieldValue(record.fields['在庫切れ予測'], '999'));
    if (stockoutDays <= 7) stockoutGroups.critical_7days++;
    else if (stockoutDays <= 14) stockoutGroups.warning_14days++;
    else if (stockoutDays <= 30) stockoutGroups.caution_30days++;
    else stockoutGroups.normal++;
  });

  // 発注残数がある商品
  const pendingOrders = records.filter(record => {
    const remaining = parseInt(getFieldValue(record.fields['発注残数'], '0'));
    return remaining > 0;
  });

  // 売上TOP10
  const topSellers = records
    .filter(record => {
      const sales = parseInt(getFieldValue(record.fields['30日販売数'], '0'));
      return sales > 0;
    })
    .sort((a, b) => {
      const salesA = parseInt(getFieldValue(a.fields['30日販売数'], '0'));
      const salesB = parseInt(getFieldValue(b.fields['30日販売数'], '0'));
      return salesB - salesA;
    })
    .slice(0, 10)
    .map(record => ({
      name: getFieldValue(record.fields['商品名'], '不明'),
      sales: parseInt(getFieldValue(record.fields['30日販売数'], '0')),
      stock: parseInt(getFieldValue(record.fields['現在庫数'], '0')),
      stockoutDays: parseInt(getFieldValue(record.fields['在庫切れ予測'], '999'))
    }));

  // 緊急対応商品リスト
  const criticalProducts = emergencyItems
    .filter(record => {
      const days = parseInt(getFieldValue(record.fields['在庫切れ予測'], '999'));
      return days <= 7;
    })
    .sort((a, b) => {
      const daysA = parseInt(getFieldValue(a.fields['在庫切れ予測'], '999'));
      const daysB = parseInt(getFieldValue(b.fields['在庫切れ予測'], '999'));
      return daysA - daysB;
    })
    .slice(0, 20)
    .map(record => ({
      name: getFieldValue(record.fields['商品名'], '不明'),
      stockoutDays: parseInt(getFieldValue(record.fields['在庫切れ予測'], '999')),
      currentStock: parseInt(getFieldValue(record.fields['現在庫数'], '0')),
      orderRemaining: parseInt(getFieldValue(record.fields['発注残数'], '0')),
      sales30Days: parseInt(getFieldValue(record.fields['30日販売数'], '0'))
    }));

  return {
    totalProducts: records.length,
    emergencyCount: emergencyItems.length,
    stockoutGroups,
    pendingOrdersCount: pendingOrders.length,
    topSellers,
    criticalProducts,
    lastUpdated: new Date().toISOString()
  };
}

// APIエンドポイント: ダッシュボードデータ取得
app.get('/api/dashboard-data', async (req, res) => {
  try {
    // キャッシュチェック
    const now = new Date();
    if (cachedData && lastFetchTime && (now.getTime() - lastFetchTime.getTime() < CACHE_DURATION)) {
      return res.json(cachedData);
    }

    // Lark認証情報チェック
    if (!LARK_CONFIG.APP_ID || !LARK_CONFIG.APP_SECRET) {
      console.warn('Lark credentials not configured, using demo data');
      const demoRecords = createDemoData();
      const aggregatedData = aggregateData(demoRecords);
      return res.json(aggregatedData);
    }

    if (!LARK_CONFIG.APP_TOKEN || !LARK_CONFIG.TABLE_ID) {
      return res.status(400).json({ 
        error: 'Base configuration missing',
        message: 'Please set LARK_APP_TOKEN and LARK_TABLE_ID in environment variables'
      });
    }

    // データ取得と集計
    const records = await fetchLarkData();
    const aggregatedData = aggregateData(records);

    // キャッシュ更新
    cachedData = aggregatedData;
    lastFetchTime = now;

    res.json(aggregatedData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    larkConfigured: !!(LARK_CONFIG.APP_ID && LARK_CONFIG.APP_SECRET),
    baseConfigured: !!(LARK_CONFIG.APP_TOKEN && LARK_CONFIG.TABLE_ID)
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/`);
  console.log(`📱 Mobile dashboard: http://localhost:${PORT}/mobile-dashboard.html`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/dashboard-data`);
  
  if (!LARK_CONFIG.APP_ID || !LARK_CONFIG.APP_SECRET) {
    console.warn('⚠️  Warning: Lark credentials not configured. Using demo data.');
  } else if (!LARK_CONFIG.APP_TOKEN || !LARK_CONFIG.TABLE_ID) {
    console.warn('⚠️  Warning: Base configuration not set. Please configure LARK_APP_TOKEN and LARK_TABLE_ID');
  } else {
    console.log('✅ Lark Base integration configured');
  }
});