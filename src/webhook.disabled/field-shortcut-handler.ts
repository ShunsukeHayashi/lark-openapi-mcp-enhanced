import { Request, Response } from 'express';
import { LarkMcpTool } from '../mcp-tool/lark-mcp-tool';

// サポートされる動画URLパターン
const VIDEO_URL_PATTERNS = [
  /youtube\.com\/watch\?v=/,
  /youtu\.be\//,
  /tiktok\.com\/@[\w.-]+\/video\//,
  /instagram\.com\/(?:p|reel)\//,
  /xiaohongshu\.com\/discovery\/item\//
];

// KOL URLパターン
const KOL_URL_PATTERNS = [
  /youtube\.com\/(?:c\/|channel\/|user\/|@)/,
  /tiktok\.com\/@[\w.-]+$/,
  /instagram\.com\/[\w.-]+$/,
  /xiaohongshu\.com\/user\/profile\//
];

// URLが動画URLかどうかチェック
function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some(pattern => pattern.test(url));
}

// URLがKOL URLかどうかチェック
function isKOLUrl(url: string): boolean {
  return KOL_URL_PATTERNS.some(pattern => pattern.test(url));
}

// Webhookリクエストの型定義
interface FieldShortcutWebhookRequest {
  event_type: string;
  app_token: string;
  table_id: string;
  record_id: string;
  field_id: string;
  field_name?: string;
  value: any;
  old_value?: any;
  user_id?: string;
  timestamp?: string;
}

// フィールドマッピング設定の型定義
interface FieldMappingConfig {
  video_extract?: {
    summary_field?: string;
    transcript_field?: string;
    tags_field?: string;
    platform_field?: string;
    view_count_field?: string;
  };
  kol_sync?: {
    name_field?: string;
    followers_field?: string;
    platform_field?: string;
    engagement_rate_field?: string;
  };
}

// 環境変数からフィールドマッピング設定を取得
function getFieldMapping(): FieldMappingConfig {
  return {
    video_extract: {
      summary_field: process.env.VIDEO_SUMMARY_FIELD_ID,
      transcript_field: process.env.VIDEO_TRANSCRIPT_FIELD_ID,
      tags_field: process.env.VIDEO_TAGS_FIELD_ID,
      platform_field: process.env.VIDEO_PLATFORM_FIELD_ID,
      view_count_field: process.env.VIDEO_VIEW_COUNT_FIELD_ID
    },
    kol_sync: {
      name_field: process.env.KOL_NAME_FIELD_ID,
      followers_field: process.env.KOL_FOLLOWERS_FIELD_ID,
      platform_field: process.env.KOL_PLATFORM_FIELD_ID,
      engagement_rate_field: process.env.KOL_ENGAGEMENT_FIELD_ID
    }
  };
}

// Webhookハンドラー
export async function handleFieldShortcut(req: Request, res: Response) {
  try {
    const webhookData: FieldShortcutWebhookRequest = req.body;
    
    // イベントタイプの確認
    if (webhookData.event_type !== 'field_changed') {
      return res.json({ 
        success: true, 
        message: 'Event type not supported' 
      });
    }
    
    // URLフィールドの値を取得
    const url = webhookData.value;
    if (!url || typeof url !== 'string') {
      return res.json({ 
        success: true, 
        message: 'No URL provided' 
      });
    }
    
    // MCPクライアントの初期化
    const mcpClient = new LarkMcpTool({
      appId: process.env.APP_ID!,
      appSecret: process.env.APP_SECRET!
    });
    
    // フィールドマッピング設定を取得
    const fieldMapping = getFieldMapping();
    
    // Mobi API キーの確認
    const mobiApiKey = process.env.MOBI_API_KEY;
    if (!mobiApiKey) {
      throw new Error('MOBI_API_KEY not configured');
    }
    
    let result;
    
    // URLタイプに応じて処理を分岐
    if (isVideoUrl(url)) {
      // 動画データ抽出
      console.log(`Processing video URL: ${url}`);
      
      result = await mcpClient.execute('mobi.builtin.video.extract', {
        video_url: url,
        app_token: webhookData.app_token,
        table_id: webhookData.table_id,
        record_id: webhookData.record_id,
        mobi_api_key: mobiApiKey,
        field_mapping: fieldMapping.video_extract
      });
      
    } else if (isKOLUrl(url)) {
      // KOL情報同期
      console.log(`Processing KOL URL: ${url}`);
      
      result = await mcpClient.execute('mobi.builtin.kol.sync', {
        kol_url: url,
        app_token: webhookData.app_token,
        table_id: webhookData.table_id,
        mobi_api_key: mobiApiKey,
        update_mode: 'upsert',
        unique_field: webhookData.field_id,
        field_mapping: fieldMapping.kol_sync
      });
      
    } else {
      return res.json({ 
        success: true, 
        message: 'URL type not supported' 
      });
    }
    
    // 処理結果をレスポンス
    res.json({
      success: true,
      data: {
        processed_url: url,
        record_id: webhookData.record_id,
        result: result
      }
    });
    
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// 検証用Webhookハンドラー（Lark Baseからの検証リクエスト用）
export async function handleWebhookValidation(req: Request, res: Response) {
  const { challenge } = req.body;
  
  if (challenge) {
    // Lark Baseの検証リクエストに応答
    return res.json({ challenge });
  }
  
  // 通常のWebhookリクエストを処理
  return handleFieldShortcut(req, res);
}

// バッチ処理用Webhookハンドラー
export async function handleBatchFieldShortcut(req: Request, res: Response) {
  try {
    const { records, app_token, table_id, field_id } = req.body;
    
    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        error: 'Records must be an array'
      });
    }
    
    // MCPクライアントの初期化
    const mcpClient = new LarkMcpTool({
      appId: process.env.APP_ID!,
      appSecret: process.env.APP_SECRET!
    });
    
    const mobiApiKey = process.env.MOBI_API_KEY;
    if (!mobiApiKey) {
      throw new Error('MOBI_API_KEY not configured');
    }
    
    const results = [];
    
    // 各レコードを処理
    for (const record of records) {
      const url = record.fields[field_id];
      
      if (!url || typeof url !== 'string') {
        results.push({
          record_id: record.record_id,
          success: false,
          error: 'No URL provided'
        });
        continue;
      }
      
      try {
        let result;
        
        if (isVideoUrl(url)) {
          result = await mcpClient.execute('mobi.builtin.video.extract', {
            video_url: url,
            app_token,
            table_id,
            record_id: record.record_id,
            mobi_api_key: mobiApiKey,
            field_mapping: getFieldMapping().video_extract
          });
        } else if (isKOLUrl(url)) {
          result = await mcpClient.execute('mobi.builtin.kol.sync', {
            kol_url: url,
            app_token,
            table_id,
            mobi_api_key: mobiApiKey,
            update_mode: 'update',
            field_mapping: getFieldMapping().kol_sync
          });
        } else {
          results.push({
            record_id: record.record_id,
            success: false,
            error: 'URL type not supported'
          });
          continue;
        }
        
        results.push({
          record_id: record.record_id,
          success: true,
          result
        });
      } catch (error: any) {
        results.push({
          record_id: record.record_id,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        total: records.length,
        success_count: results.filter(r => r.success).length,
        failed_count: results.filter(r => !r.success).length,
        results
      }
    });
    
  } catch (error: any) {
    console.error('Batch webhook handler error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}