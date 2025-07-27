import { CloudEvent, cloudEvent } from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import axios from 'axios';

const firestore = new Firestore();
const secretManager = new SecretManagerServiceClient();

// 緊急注文対応レコードの型定義
interface EmergencyOrderRecord {
  record_id: string;
  fields: {
    '商品名'?: any[];
    '緊急発注フラグ'?: any[];
    '在庫切れ予測'?: any[];
    '発注残数'?: any[];
    '30日販売数'?: any[];
    '現在庫数'?: any[];
    '最終発注日'?: any[];
    '納期予定'?: any[];
    [key: string]: any;
  };
}

// Lark APIのレスポンス型
interface LarkApiResponse {
  has_more: boolean;
  page_token: string;
  items: EmergencyOrderRecord[];
}

// Larkの認証情報を取得するヘルパー関数
async function getLarkCredentials(): Promise<{ appId: string; appSecret: string }> {
  const projectId = process.env.GCP_PROJECT || await secretManager.getProjectId();
  
  const [appIdVersion] = await secretManager.accessSecretVersion({ 
    name: `projects/${projectId}/secrets/LARK_APP_ID/versions/latest` 
  });
  const [appSecretVersion] = await secretManager.accessSecretVersion({ 
    name: `projects/${projectId}/secrets/LARK_APP_SECRET/versions/latest` 
  });
  
  return {
    appId: appIdVersion.payload?.data?.toString() || '',
    appSecret: appSecretVersion.payload?.data?.toString() || '',
  };
}

// Cloud Scheduler (+Pub/Sub) によってトリガーされる
cloudEvent('updateEmergencyOrderCache', async (cloudEvent: CloudEvent) => {
  console.log('Starting emergency order data cache update...');

  try {
    // 1. Lark APIの認証情報を取得
    const { appId, appSecret } = await getLarkCredentials();
    const tokenResponse = await axios.post('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: appId,
      app_secret: appSecret,
    });
    const tenantAccessToken = tokenResponse.data.tenant_access_token;

    // 2. テーブル情報の確認（緊急注文対応状況ビューのテーブル）
    const APP_TOKEN = 'Pvo3bR2b8aeh14sqVppjAXR4pkN';
    const TABLE_ID = 'tblQxv1OFCMxyjEy'; // 提供されたURLから取得
    
    // 2-1. フィールド情報を取得して構造を確認
    const fieldsResponse = await axios.get(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/fields`,
      { headers: { Authorization: `Bearer ${tenantAccessToken}` } }
    );
    console.log('Available fields:', fieldsResponse.data.data?.items?.map((f: any) => f.field_name));
    
    // 2-2. 全レコードを取得（ページネーション対応）
    let allItems: EmergencyOrderRecord[] = [];
    let pageToken: string | undefined = undefined;
    let hasMore = true;
    
    while (hasMore) {
      const params = new URLSearchParams();
      params.append('page_size', '500'); // 一度に取得する最大数
      if (pageToken) params.append('page_token', pageToken);
      
      const recordsResponse = await axios.get(
        `https://open.larksuite.com/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records?${params.toString()}`,
        { headers: { Authorization: `Bearer ${tenantAccessToken}` } }
      );

      const data = recordsResponse.data.data as LarkApiResponse;
      allItems = allItems.concat(data.items);
      hasMore = data.has_more;
      pageToken = data.page_token;
    }

    // 3. 緊急発注データの集計
    const emergencyItems = allItems.filter(item => {
      const urgentFlag = item.fields['緊急発注フラグ']?.[0]?.text || item.fields['緊急発注フラグ'];
      return urgentFlag === '🚩緊急' || urgentFlag === '緊急';
    });

    // 在庫切れ予測日数でグループ化
    const stockoutGroups = emergencyItems.reduce((acc, item) => {
      const stockoutDays = parseInt(item.fields['在庫切れ予測']?.[0]?.text || item.fields['在庫切れ予測'] || '999');
      let group: string;
      if (stockoutDays <= 7) group = 'critical_7days';
      else if (stockoutDays <= 14) group = 'warning_14days';
      else if (stockoutDays <= 30) group = 'caution_30days';
      else group = 'normal';
      
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 発注残数がある商品
    const pendingOrders = allItems.filter(item => {
      const remaining = parseInt(item.fields['発注残数']?.[0]?.text || item.fields['発注残数'] || '0');
      return remaining > 0;
    });

    // 売上ランキングTOP10（30日販売数ベース）
    const topSellers = allItems
      .filter(item => {
        const sales = parseInt(item.fields['30日販売数']?.[0]?.text || item.fields['30日販売数'] || '0');
        return sales > 0;
      })
      .sort((a, b) => {
        const salesA = parseInt(a.fields['30日販売数']?.[0]?.text || a.fields['30日販売数'] || '0');
        const salesB = parseInt(b.fields['30日販売数']?.[0]?.text || b.fields['30日販売数'] || '0');
        return salesB - salesA;
      })
      .slice(0, 10)
      .map(item => ({
        name: item.fields['商品名']?.[0]?.text || item.fields['商品名'] || '不明',
        sales: parseInt(item.fields['30日販売数']?.[0]?.text || item.fields['30日販売数'] || '0'),
        stock: parseInt(item.fields['現在庫数']?.[0]?.text || item.fields['現在庫数'] || '0'),
        stockoutDays: parseInt(item.fields['在庫切れ予測']?.[0]?.text || item.fields['在庫切れ予測'] || '999')
      }));

    // 4. 集計結果をFirestoreに保存
    const cacheDoc = firestore.collection('emergency_order_cache').doc('summary');
    await cacheDoc.set({
      totalProducts: allItems.length,
      emergencyCount: emergencyItems.length,
      stockoutGroups,
      pendingOrdersCount: pendingOrders.length,
      topSellers,
      criticalProducts: emergencyItems
        .filter(item => {
          const days = parseInt(item.fields['在庫切れ予測']?.[0]?.text || item.fields['在庫切れ予測'] || '999');
          return days <= 7;
        })
        .slice(0, 20) // 最大20件
        .map(item => ({
          name: item.fields['商品名']?.[0]?.text || item.fields['商品名'] || '不明',
          stockoutDays: parseInt(item.fields['在庫切れ予測']?.[0]?.text || item.fields['在庫切れ予測'] || '999'),
          currentStock: parseInt(item.fields['現在庫数']?.[0]?.text || item.fields['現在庫数'] || '0'),
          orderRemaining: parseInt(item.fields['発注残数']?.[0]?.text || item.fields['発注残数'] || '0'),
          sales30Days: parseInt(item.fields['30日販売数']?.[0]?.text || item.fields['30日販売数'] || '0')
        })),
      lastUpdated: new Date().toISOString(),
    });

    console.log(`Successfully updated emergency order cache. Total: ${allItems.length}, Emergency: ${emergencyItems.length}`);
  } catch (error) {
    console.error('Error updating cache:', error);
    // エラー詳細をFirestoreに保存（デバッグ用）
    const errorDoc = firestore.collection('emergency_order_cache').doc('error_log');
    await errorDoc.set({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error; // Cloud Functionsのリトライメカニズムに任せる
  }
});