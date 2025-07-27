import express from 'express';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Lark設定
const LARK_CONFIG = {
  WIKI_TOKEN: process.env.LARK_APP_TOKEN || 'KgFMw2G2Yiphx7kxNz0jA8DFpqd',
  TABLE_ID: process.env.LARK_TABLE_ID || 'tblPSgtK8IBbw9pP',
  APP_ID: process.env.LARK_APP_ID || '',
  APP_SECRET: process.env.LARK_APP_SECRET || '',
  IS_WIKI: true // Wikiテーブルを使用
};

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

// デモデータを生成
function createDemoData(): LarkRecord[] {
  return [
    {
      record_id: '1',
      fields: {
        '商品名': 'プレミアムコーヒー豆 1kg',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': '2',
        '発注残数': '50',
        '30日販売数': '380',
        '現在庫数': '15'
      }
    },
    {
      record_id: '2',
      fields: {
        '商品名': 'オーガニック紅茶セット',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': '3',
        '発注残数': '0',
        '30日販売数': '250',
        '現在庫数': '8'
      }
    },
    {
      record_id: '3',
      fields: {
        '商品名': 'チョコレートギフトボックス',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': '5',
        '発注残数': '100',
        '30日販売数': '420',
        '現在庫数': '30'
      }
    },
    {
      record_id: '4',
      fields: {
        '商品名': '手作りクッキー詰め合わせ',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': '6',
        '発注残数': '0',
        '30日販売数': '180',
        '現在庫数': '45'
      }
    },
    {
      record_id: '5',
      fields: {
        '商品名': '季節限定ジャムセット',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': '7',
        '発注残数': '75',
        '30日販売数': '165',
        '現在庫数': '22'
      }
    },
    {
      record_id: '6',
      fields: {
        '商品名': 'スペシャルティ緑茶',
        '緊急発注フラグ': '',
        '在庫切れ予測': '35',
        '発注残数': '0',
        '30日販売数': '320',
        '現在庫数': '120'
      }
    },
    {
      record_id: '7',
      fields: {
        '商品名': 'アーモンドクッキー',
        '緊急発注フラグ': '🚩緊急',
        '在庫切れ予測': '8',
        '発注残数': '0',
        '30日販売数': '280',
        '現在庫数': '45'
      }
    },
    {
      record_id: '8',
      fields: {
        '商品名': '蜂蜜セット',
        '緊急発注フラグ': '',
        '在庫切れ予測': '45',
        '発注残数': '0',
        '30日販売数': '250',
        '現在庫数': '200'
      }
    },
    {
      record_id: '9',
      fields: {
        '商品名': 'ドライフルーツMIX',
        '緊急発注フラグ': '',
        '在庫切れ予測': '18',
        '発注残数': '30',
        '30日販売数': '220',
        '現在庫数': '85'
      }
    },
    {
      record_id: '10',
      fields: {
        '商品名': 'ナッツアソート',
        '緊急発注フラグ': '',
        '在庫切れ予測': '40',
        '発注残数': '0',
        '30日販売数': '195',
        '現在庫数': '150'
      }
    }
  ];
}

// Larkアクセストークンを取得
async function getLarkAccessToken(): Promise<string> {
  try {
    const response = await axios.post(
      'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: LARK_CONFIG.APP_ID,
        app_secret: LARK_CONFIG.APP_SECRET
      }
    );
    return response.data.tenant_access_token;
  } catch (error) {
    console.error('Failed to get Lark access token:', error);
    throw new Error('Authentication failed');
  }
}

// Lark Baseからデータを取得
async function fetchLarkData(accessToken: string): Promise<LarkRecord[]> {
  try {
    // WikiテーブルはBase APIではアクセスできないため、デモデータを返す
    // 実際のWikiテーブルデータにアクセスするには、Wiki APIを使用する必要があります
    console.log('Note: Wikiテーブルは直接APIでアクセスできません。デモデータを表示します。');
    console.log('Wiki Token:', LARK_CONFIG.WIKI_TOKEN);
    console.log('Table ID:', LARK_CONFIG.TABLE_ID);
    
    // デモデータを返す
    return createDemoData();
  } catch (error) {
    console.error('Failed to fetch Lark data:', error);
    throw new Error('Failed to fetch data from Lark');
  }
}

// データを集計
function aggregateData(records: LarkRecord[]) {
  // 緊急発注商品のフィルタリング
  const emergencyItems = records.filter(record => {
    const urgentFlag = record.fields['緊急発注フラグ'];
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
    const stockoutDays = parseInt(record.fields['在庫切れ予測'] || '999');
    if (stockoutDays <= 7) stockoutGroups.critical_7days++;
    else if (stockoutDays <= 14) stockoutGroups.warning_14days++;
    else if (stockoutDays <= 30) stockoutGroups.caution_30days++;
    else stockoutGroups.normal++;
  });

  // 発注残数がある商品
  const pendingOrders = records.filter(record => {
    const remaining = parseInt(record.fields['発注残数'] || '0');
    return remaining > 0;
  });

  // 売上TOP10
  const topSellers = records
    .filter(record => {
      const sales = parseInt(record.fields['30日販売数'] || '0');
      return sales > 0;
    })
    .sort((a, b) => {
      const salesA = parseInt(a.fields['30日販売数'] || '0');
      const salesB = parseInt(b.fields['30日販売数'] || '0');
      return salesB - salesA;
    })
    .slice(0, 10)
    .map(record => ({
      name: record.fields['商品名'] || '不明',
      sales: parseInt(record.fields['30日販売数'] || '0'),
      stock: parseInt(record.fields['現在庫数'] || '0'),
      stockoutDays: parseInt(record.fields['在庫切れ予測'] || '999')
    }));

  // 緊急対応商品リスト
  const criticalProducts = emergencyItems
    .filter(record => {
      const days = parseInt(record.fields['在庫切れ予測'] || '999');
      return days <= 7;
    })
    .sort((a, b) => {
      const daysA = parseInt(a.fields['在庫切れ予測'] || '999');
      const daysB = parseInt(b.fields['在庫切れ予測'] || '999');
      return daysA - daysB;
    })
    .slice(0, 20)
    .map(record => ({
      name: record.fields['商品名'] || '不明',
      stockoutDays: parseInt(record.fields['在庫切れ予測'] || '999'),
      currentStock: parseInt(record.fields['現在庫数'] || '0'),
      orderRemaining: parseInt(record.fields['発注残数'] || '0'),
      sales30Days: parseInt(record.fields['30日販売数'] || '0')
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
      return res.status(400).json({ 
        error: 'Lark credentials not configured',
        message: 'Please set LARK_APP_ID and LARK_APP_SECRET in environment variables'
      });
    }

    // データ取得と集計
    const accessToken = await getLarkAccessToken();
    const records = await fetchLarkData(accessToken);
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
    larkConfigured: !!(LARK_CONFIG.APP_ID && LARK_CONFIG.APP_SECRET)
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/`);
  console.log(`🔧 API endpoint: http://localhost:${PORT}/api/dashboard-data`);
  
  if (!LARK_CONFIG.APP_ID || !LARK_CONFIG.APP_SECRET) {
    console.warn('⚠️  Warning: Lark credentials not configured. Please set LARK_APP_ID and LARK_APP_SECRET');
  }
});