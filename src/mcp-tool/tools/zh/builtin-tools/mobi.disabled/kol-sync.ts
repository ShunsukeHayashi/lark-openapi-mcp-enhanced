import { z } from 'zod';
import { McpTool } from '../../../../types';
import axios from 'axios';

// Mobi AI Master API設定
const MOBI_API_BASE_URL = 'https://api.mobimaster.ai/v1';

// KOLプラットフォーム
const KOL_PLATFORMS = ['youtube', 'tiktok', 'instagram', 'rednote'] as const;

// KOL URLパターン
const KOL_URL_PATTERNS = {
  youtube: /youtube\.com\/(?:c\/|channel\/|user\/|@)([a-zA-Z0-9_-]+)/,
  tiktok: /tiktok\.com\/@([\w.-]+)/,
  instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/,
  rednote: /xiaohongshu\.com\/user\/profile\/([a-zA-Z0-9]+)/
};

// プラットフォーム判定
function detectKOLPlatform(url: string): string | null {
  for (const [platform, pattern] of Object.entries(KOL_URL_PATTERNS)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return null;
}

// Mobi AI APIでKOL情報取得
async function getMobiKOLData(kolUrl: string, apiKey: string) {
  const platform = detectKOLPlatform(kolUrl);
  if (!platform) {
    throw new Error(`Unsupported KOL URL: ${kolUrl}`);
  }

  try {
    const response = await axios.post(
      `${MOBI_API_BASE_URL}/kol/info`,
      {
        url: kolUrl,
        platform: platform,
        fetch_options: {
          basic_info: true,
          statistics: true,
          recent_posts: true,
          engagement_metrics: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30秒タイムアウト
      }
    );

    return {
      name: response.data.basic_info?.name || '',
      username: response.data.basic_info?.username || '',
      platform: platform,
      followers: response.data.statistics?.followers || 0,
      following: response.data.statistics?.following || 0,
      totalPosts: response.data.statistics?.total_posts || 0,
      totalLikes: response.data.statistics?.total_likes || 0,
      avgViews: response.data.statistics?.avg_views || 0,
      engagementRate: response.data.engagement_metrics?.rate || 0,
      category: response.data.basic_info?.category || '',
      bio: response.data.basic_info?.bio || '',
      verified: response.data.basic_info?.verified || false,
      recentPostsData: response.data.recent_posts || []
    };
  } catch (error: any) {
    throw new Error(`Mobi AI API error: ${error.message}`);
  }
}

export const mobiKOLSync: McpTool = {
  project: 'mobi',
  name: 'mobi.builtin.kol.sync',
  accessTokens: ['tenant'],
  description: '[Mobi AI Master] - KOL（インフルエンサー）情報をLark Baseに同期',
  schema: {
    data: z.object({
      kol_url: z.string().url().describe('KOLプロフィールURL'),
      app_token: z.string().describe('Lark Base App Token'),
      table_id: z.string().describe('KOL管理テーブルID'),
      mobi_api_key: z.string().describe('Mobi AI Master APIキー'),
      update_mode: z.enum(['create', 'update', 'upsert']).describe('更新モード').default('upsert'),
      unique_field: z.string().describe('重複チェック用フィールドID（upsertモード時）').optional(),
      field_mapping: z.object({
        name_field: z.string().describe('名前フィールドID').optional(),
        username_field: z.string().describe('ユーザー名フィールドID').optional(),
        platform_field: z.string().describe('プラットフォームフィールドID').optional(),
        followers_field: z.string().describe('フォロワー数フィールドID').optional(),
        total_likes_field: z.string().describe('総いいね数フィールドID').optional(),
        avg_views_field: z.string().describe('平均再生数フィールドID').optional(),
        engagement_rate_field: z.string().describe('エンゲージメント率フィールドID').optional(),
        category_field: z.string().describe('カテゴリフィールドID').optional(),
        bio_field: z.string().describe('プロフィールフィールドID').optional(),
        verified_field: z.string().describe('認証済みフィールドID').optional(),
        profile_url_field: z.string().describe('プロフィールURLフィールドID').optional(),
        last_updated_field: z.string().describe('最終更新日時フィールドID').optional()
      }).describe('フィールドマッピング設定').optional()
    })
  },
  customHandler: async (client, params) => {
    try {
      // 1. Mobi AI APIでKOL情報取得
      const kolData = await getMobiKOLData(params.data.kol_url, params.data.mobi_api_key);
      
      // 2. フィールドマッピングに基づいてデータを準備
      const fields: Record<string, any> = {};
      const mapping = params.data.field_mapping || {};
      
      if (mapping.name_field) {
        fields[mapping.name_field] = kolData.name;
      }
      if (mapping.username_field) {
        fields[mapping.username_field] = kolData.username;
      }
      if (mapping.platform_field) {
        fields[mapping.platform_field] = kolData.platform;
      }
      if (mapping.followers_field) {
        fields[mapping.followers_field] = kolData.followers;
      }
      if (mapping.total_likes_field) {
        fields[mapping.total_likes_field] = kolData.totalLikes;
      }
      if (mapping.avg_views_field) {
        fields[mapping.avg_views_field] = kolData.avgViews;
      }
      if (mapping.engagement_rate_field) {
        fields[mapping.engagement_rate_field] = kolData.engagementRate;
      }
      if (mapping.category_field) {
        fields[mapping.category_field] = kolData.category;
      }
      if (mapping.bio_field) {
        fields[mapping.bio_field] = kolData.bio;
      }
      if (mapping.verified_field) {
        fields[mapping.verified_field] = kolData.verified;
      }
      if (mapping.profile_url_field) {
        fields[mapping.profile_url_field] = params.data.kol_url;
      }
      if (mapping.last_updated_field) {
        fields[mapping.last_updated_field] = new Date().toISOString();
      }
      
      // 3. 更新モードに応じて処理
      let result;
      
      if (params.data.update_mode === 'create') {
        // 新規作成
        result = await client.bitable.v1.appTableRecord.create({
          app_token: params.data.app_token,
          table_id: params.data.table_id,
          data: { fields }
        });
      } else if (params.data.update_mode === 'upsert' && params.data.unique_field) {
        // 既存レコードを検索
        const searchResult = await client.bitable.v1.appTableRecord.search({
          app_token: params.data.app_token,
          table_id: params.data.table_id,
          data: {
            filter: {
              conditions: [{
                field_name: params.data.unique_field,
                operator: 'is',
                value: [params.data.kol_url]
              }]
            }
          }
        });
        
        if (searchResult.data?.items?.length > 0) {
          // 既存レコードを更新
          const recordId = searchResult.data.items[0].record_id;
          result = await client.bitable.v1.appTableRecord.update({
            app_token: params.data.app_token,
            table_id: params.data.table_id,
            record_id: recordId,
            data: { fields }
          });
        } else {
          // 新規作成
          result = await client.bitable.v1.appTableRecord.create({
            app_token: params.data.app_token,
            table_id: params.data.table_id,
            data: { fields }
          });
        }
      }
      
      return {
        success: true,
        data: {
          kol_info: {
            name: kolData.name,
            platform: kolData.platform,
            followers: kolData.followers,
            engagement_rate: kolData.engagementRate
          },
          operation: params.data.update_mode,
          updated_fields: Object.keys(fields),
          recent_posts_count: kolData.recentPostsData.length
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// バッチKOL情報取得ツール
export const mobiKOLBatchSync: McpTool = {
  project: 'mobi',
  name: 'mobi.builtin.kol.batch_sync',
  accessTokens: ['tenant'],
  description: '[Mobi AI Master] - 複数のKOL情報を一括でLark Baseに同期',
  schema: {
    data: z.object({
      kol_urls: z.array(z.string().url()).describe('KOLプロフィールURLのリスト'),
      app_token: z.string().describe('Lark Base App Token'),
      table_id: z.string().describe('KOL管理テーブルID'),
      mobi_api_key: z.string().describe('Mobi AI Master APIキー'),
      field_mapping: z.object({
        name_field: z.string().describe('名前フィールドID').optional(),
        username_field: z.string().describe('ユーザー名フィールドID').optional(),
        platform_field: z.string().describe('プラットフォームフィールドID').optional(),
        followers_field: z.string().describe('フォロワー数フィールドID').optional(),
        profile_url_field: z.string().describe('プロフィールURLフィールドID').optional()
      }).describe('フィールドマッピング設定')
    })
  },
  customHandler: async (client, params) => {
    const results = [];
    
    for (const kolUrl of params.data.kol_urls) {
      try {
        const kolData = await getMobiKOLData(kolUrl, params.data.mobi_api_key);
        
        const fields: Record<string, any> = {};
        const mapping = params.data.field_mapping;
        
        if (mapping.name_field) fields[mapping.name_field] = kolData.name;
        if (mapping.username_field) fields[mapping.username_field] = kolData.username;
        if (mapping.platform_field) fields[mapping.platform_field] = kolData.platform;
        if (mapping.followers_field) fields[mapping.followers_field] = kolData.followers;
        if (mapping.profile_url_field) fields[mapping.profile_url_field] = kolUrl;
        
        const createResult = await client.bitable.v1.appTableRecord.create({
          app_token: params.data.app_token,
          table_id: params.data.table_id,
          data: { fields }
        });
        
        results.push({
          url: kolUrl,
          success: true,
          record_id: createResult.data?.record?.record_id
        });
      } catch (error: any) {
        results.push({
          url: kolUrl,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      data: {
        total: params.data.kol_urls.length,
        success_count: results.filter(r => r.success).length,
        failed_count: results.filter(r => !r.success).length,
        results: results
      }
    };
  }
};

// ツールをエクスポート
export const mobiKOLTools = [mobiKOLSync, mobiKOLBatchSync];