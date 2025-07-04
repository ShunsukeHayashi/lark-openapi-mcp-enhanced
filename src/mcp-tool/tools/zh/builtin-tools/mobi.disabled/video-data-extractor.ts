import { z } from 'zod';
import { McpTool } from '../../../../types';
import axios from 'axios';

// Mobi AI Master API設定
const MOBI_API_BASE_URL = 'https://api.mobimaster.ai/v1';

// サポートされる動画プラットフォーム
const SUPPORTED_PLATFORMS = ['youtube', 'tiktok', 'instagram', 'rednote'] as const;

// 動画URLパターン
const VIDEO_URL_PATTERNS = {
  youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  tiktok: /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
  instagram: /instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/,
  rednote: /xiaohongshu\.com\/discovery\/item\/([a-zA-Z0-9]+)/
};

// プラットフォーム判定
function detectPlatform(url: string): string | null {
  for (const [platform, pattern] of Object.entries(VIDEO_URL_PATTERNS)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return null;
}

// Mobi AI Master APIを呼び出す
async function callMobiAPI(videoUrl: string, apiKey: string) {
  const platform = detectPlatform(videoUrl);
  if (!platform) {
    throw new Error(`Unsupported video URL: ${videoUrl}`);
  }

  try {
    const response = await axios.post(
      `${MOBI_API_BASE_URL}/video/extract`,
      {
        url: videoUrl,
        platform: platform,
        extract_options: {
          summary: true,
          transcript: true,
          tags: true,
          metadata: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60秒タイムアウト
      }
    );

    return {
      summary: response.data.summary || '',
      transcript: response.data.transcript || '',
      tags: response.data.tags || [],
      platform: platform,
      duration: response.data.metadata?.duration || 0,
      viewCount: response.data.metadata?.view_count || 0,
      likeCount: response.data.metadata?.like_count || 0,
      commentCount: response.data.metadata?.comment_count || 0,
      shareCount: response.data.metadata?.share_count || 0,
      publishedAt: response.data.metadata?.published_at || new Date().toISOString(),
      author: response.data.metadata?.author || {}
    };
  } catch (error: any) {
    throw new Error(`Mobi AI API error: ${error.message}`);
  }
}

export const mobiVideoDataExtractor: McpTool = {
  project: 'mobi',
  name: 'mobi.builtin.video.extract',
  accessTokens: ['tenant'],
  description: '[Mobi AI Master] - 動画URLからコンテンツとメタデータを抽出し、Lark Baseに保存',
  schema: {
    data: z.object({
      video_url: z.string().url().describe('動画URL（YouTube/TikTok/Instagram/RedNote対応）'),
      app_token: z.string().describe('Lark Base App Token'),
      table_id: z.string().describe('対象テーブルID'),
      record_id: z.string().describe('更新対象レコードID'),
      mobi_api_key: z.string().describe('Mobi AI Master APIキー'),
      field_mapping: z.object({
        summary_field: z.string().describe('要約を保存するフィールドID').optional(),
        transcript_field: z.string().describe('文字起こしを保存するフィールドID').optional(),
        tags_field: z.string().describe('タグを保存するフィールドID').optional(),
        platform_field: z.string().describe('プラットフォームを保存するフィールドID').optional(),
        duration_field: z.string().describe('動画時間を保存するフィールドID').optional(),
        view_count_field: z.string().describe('再生数を保存するフィールドID').optional(),
        like_count_field: z.string().describe('いいね数を保存するフィールドID').optional(),
        author_name_field: z.string().describe('投稿者名を保存するフィールドID').optional(),
        published_at_field: z.string().describe('公開日時を保存するフィールドID').optional()
      }).describe('フィールドマッピング設定').optional()
    })
  },
  customHandler: async (client, params) => {
    try {
      // 1. Mobi AI APIを呼び出して動画データ取得
      const videoData = await callMobiAPI(params.data.video_url, params.data.mobi_api_key);
      
      // 2. フィールドマッピングに基づいてデータを準備
      const fields: Record<string, any> = {};
      const mapping = params.data.field_mapping || {};
      
      if (mapping.summary_field) {
        fields[mapping.summary_field] = videoData.summary;
      }
      if (mapping.transcript_field) {
        fields[mapping.transcript_field] = videoData.transcript;
      }
      if (mapping.tags_field) {
        fields[mapping.tags_field] = videoData.tags.join(', ');
      }
      if (mapping.platform_field) {
        fields[mapping.platform_field] = videoData.platform;
      }
      if (mapping.duration_field) {
        fields[mapping.duration_field] = videoData.duration;
      }
      if (mapping.view_count_field) {
        fields[mapping.view_count_field] = videoData.viewCount;
      }
      if (mapping.like_count_field) {
        fields[mapping.like_count_field] = videoData.likeCount;
      }
      if (mapping.author_name_field && videoData.author.name) {
        fields[mapping.author_name_field] = videoData.author.name;
      }
      if (mapping.published_at_field) {
        fields[mapping.published_at_field] = videoData.publishedAt;
      }
      
      // 3. Lark Baseレコードを更新
      const updateResult = await client.bitable.v1.appTableRecord.update({
        app_token: params.data.app_token,
        table_id: params.data.table_id,
        record_id: params.data.record_id,
        data: { fields }
      });
      
      return {
        success: true,
        data: {
          record_id: params.data.record_id,
          updated_fields: Object.keys(fields),
          video_data: {
            platform: videoData.platform,
            summary_length: videoData.summary.length,
            transcript_length: videoData.transcript.length,
            tags_count: videoData.tags.length,
            view_count: videoData.viewCount
          }
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

// ツールをエクスポート
export const mobiVideoTools = [mobiVideoDataExtractor];