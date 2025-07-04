import { mobiVideoDataExtractor } from '../../src/mcp-tool/tools/zh/builtin-tools/mobi/video-data-extractor';
import axios from 'axios';

// Axiosのモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Mobi Video Data Extractor', () => {
  const mockClient = {
    bitable: {
      v1: {
        appTableRecord: {
          update: jest.fn()
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('動画URL検証', () => {
    it('YouTubeのURLを正しく認識する', async () => {
      const params = {
        data: {
          video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          record_id: 'recXXXXX',
          mobi_api_key: 'test_api_key'
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          summary: 'Test summary',
          transcript: 'Test transcript',
          tags: ['test', 'video'],
          metadata: {
            duration: 300,
            view_count: 1000,
            like_count: 100
          }
        }
      });

      mockClient.bitable.v1.appTableRecord.update.mockResolvedValueOnce({
        data: { record: { record_id: 'recXXXXX' } }
      });

      const result = await mobiVideoDataExtractor.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mobimaster.ai/v1/video/extract',
        expect.objectContaining({
          url: params.data.video_url,
          platform: 'youtube'
        }),
        expect.any(Object)
      );
    });

    it('TikTokのURLを正しく認識する', async () => {
      const params = {
        data: {
          video_url: 'https://tiktok.com/@user/video/123456789',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          record_id: 'recXXXXX',
          mobi_api_key: 'test_api_key'
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          summary: 'TikTok video summary',
          transcript: 'TikTok transcript',
          tags: ['tiktok', 'short'],
          metadata: {
            duration: 60,
            view_count: 50000
          }
        }
      });

      mockClient.bitable.v1.appTableRecord.update.mockResolvedValueOnce({
        data: { record: { record_id: 'recXXXXX' } }
      });

      const result = await mobiVideoDataExtractor.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mobimaster.ai/v1/video/extract',
        expect.objectContaining({
          platform: 'tiktok'
        }),
        expect.any(Object)
      );
    });

    it('サポートされていないURLでエラーを返す', async () => {
      const params = {
        data: {
          video_url: 'https://example.com/video',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          record_id: 'recXXXXX',
          mobi_api_key: 'test_api_key'
        }
      };

      const result = await mobiVideoDataExtractor.customHandler!(mockClient as any, params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported video URL');
    });
  });

  describe('フィールドマッピング', () => {
    it('指定されたフィールドにデータをマッピングする', async () => {
      const params = {
        data: {
          video_url: 'https://youtube.com/watch?v=test',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          record_id: 'recXXXXX',
          mobi_api_key: 'test_api_key',
          field_mapping: {
            summary_field: 'fld_summary',
            transcript_field: 'fld_transcript',
            tags_field: 'fld_tags',
            view_count_field: 'fld_views'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          summary: 'Mapped summary',
          transcript: 'Mapped transcript',
          tags: ['tag1', 'tag2'],
          metadata: {
            view_count: 2000
          }
        }
      });

      mockClient.bitable.v1.appTableRecord.update.mockResolvedValueOnce({
        data: { record: { record_id: 'recXXXXX' } }
      });

      await mobiVideoDataExtractor.customHandler!(mockClient as any, params);

      expect(mockClient.bitable.v1.appTableRecord.update).toHaveBeenCalledWith({
        app_token: 'bascXXXXX',
        table_id: 'tblXXXXX',
        record_id: 'recXXXXX',
        data: {
          fields: {
            fld_summary: 'Mapped summary',
            fld_transcript: 'Mapped transcript',
            fld_tags: 'tag1, tag2',
            fld_views: 2000
          }
        }
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('API呼び出しエラーを適切に処理する', async () => {
      const params = {
        data: {
          video_url: 'https://youtube.com/watch?v=error',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          record_id: 'recXXXXX',
          mobi_api_key: 'test_api_key'
        }
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await mobiVideoDataExtractor.customHandler!(mockClient as any, params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mobi AI API error');
    });

    it('Lark API更新エラーを適切に処理する', async () => {
      const params = {
        data: {
          video_url: 'https://youtube.com/watch?v=test',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          record_id: 'recXXXXX',
          mobi_api_key: 'test_api_key'
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          summary: 'Test',
          transcript: 'Test',
          tags: []
        }
      });

      mockClient.bitable.v1.appTableRecord.update.mockRejectedValueOnce(
        new Error('Lark API Error')
      );

      const result = await mobiVideoDataExtractor.customHandler!(mockClient as any, params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});