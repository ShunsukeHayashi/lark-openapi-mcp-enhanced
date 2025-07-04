import { mobiKOLSync, mobiKOLBatchSync } from '../../src/mcp-tool/tools/zh/builtin-tools/mobi/kol-sync';
import axios from 'axios';

// Axiosのモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Mobi KOL Sync', () => {
  const mockClient = {
    bitable: {
      v1: {
        appTableRecord: {
          create: jest.fn(),
          update: jest.fn(),
          search: jest.fn()
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('KOL URL検証', () => {
    it('YouTube チャンネルURLを正しく認識する', async () => {
      const params = {
        data: {
          kol_url: 'https://youtube.com/@testchannel',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          mobi_api_key: 'test_api_key',
          update_mode: 'create' as const
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          basic_info: {
            name: 'Test Channel',
            username: 'testchannel',
            category: 'Entertainment'
          },
          statistics: {
            followers: 100000,
            total_likes: 500000
          },
          engagement_metrics: {
            rate: 5.2
          }
        }
      });

      mockClient.bitable.v1.appTableRecord.create.mockResolvedValueOnce({
        data: { record: { record_id: 'recNewXXX' } }
      });

      const result = await mobiKOLSync.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mobimaster.ai/v1/kol/info',
        expect.objectContaining({
          url: params.data.kol_url,
          platform: 'youtube'
        }),
        expect.any(Object)
      );
    });

    it('TikTok プロフィールURLを正しく認識する', async () => {
      const params = {
        data: {
          kol_url: 'https://tiktok.com/@tiktoker',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          mobi_api_key: 'test_api_key',
          update_mode: 'create' as const
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          basic_info: {
            name: 'TikToker',
            username: 'tiktoker'
          },
          statistics: {
            followers: 50000
          }
        }
      });

      mockClient.bitable.v1.appTableRecord.create.mockResolvedValueOnce({
        data: { record: { record_id: 'recNewXXX' } }
      });

      const result = await mobiKOLSync.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(result.data.kol_info.platform).toBe('tiktok');
    });
  });

  describe('更新モード', () => {
    it('upsertモードで既存レコードを更新する', async () => {
      const params = {
        data: {
          kol_url: 'https://youtube.com/@existingchannel',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          mobi_api_key: 'test_api_key',
          update_mode: 'upsert' as const,
          unique_field: 'fld_url'
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          basic_info: {
            name: 'Existing Channel',
            username: 'existingchannel'
          },
          statistics: {
            followers: 200000
          }
        }
      });

      // 既存レコードが見つかる
      mockClient.bitable.v1.appTableRecord.search.mockResolvedValueOnce({
        data: {
          items: [{
            record_id: 'recExistingXXX',
            fields: {}
          }]
        }
      });

      mockClient.bitable.v1.appTableRecord.update.mockResolvedValueOnce({
        data: { record: { record_id: 'recExistingXXX' } }
      });

      const result = await mobiKOLSync.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(mockClient.bitable.v1.appTableRecord.update).toHaveBeenCalled();
      expect(mockClient.bitable.v1.appTableRecord.create).not.toHaveBeenCalled();
    });

    it('upsertモードで新規レコードを作成する', async () => {
      const params = {
        data: {
          kol_url: 'https://youtube.com/@newchannel',
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          mobi_api_key: 'test_api_key',
          update_mode: 'upsert' as const,
          unique_field: 'fld_url'
        }
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          basic_info: {
            name: 'New Channel'
          },
          statistics: {}
        }
      });

      // レコードが見つからない
      mockClient.bitable.v1.appTableRecord.search.mockResolvedValueOnce({
        data: { items: [] }
      });

      mockClient.bitable.v1.appTableRecord.create.mockResolvedValueOnce({
        data: { record: { record_id: 'recNewXXX' } }
      });

      const result = await mobiKOLSync.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(mockClient.bitable.v1.appTableRecord.create).toHaveBeenCalled();
      expect(mockClient.bitable.v1.appTableRecord.update).not.toHaveBeenCalled();
    });
  });

  describe('バッチ同期', () => {
    it('複数のKOLを一括同期する', async () => {
      const params = {
        data: {
          kol_urls: [
            'https://youtube.com/@channel1',
            'https://tiktok.com/@user2',
            'https://instagram.com/user3'
          ],
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          mobi_api_key: 'test_api_key',
          field_mapping: {
            name_field: 'fld_name',
            followers_field: 'fld_followers'
          }
        }
      };

      // 各KOLの成功レスポンス
      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            basic_info: { name: 'Channel 1' },
            statistics: { followers: 10000 }
          }
        })
        .mockResolvedValueOnce({
          data: {
            basic_info: { name: 'User 2' },
            statistics: { followers: 20000 }
          }
        })
        .mockResolvedValueOnce({
          data: {
            basic_info: { name: 'User 3' },
            statistics: { followers: 30000 }
          }
        });

      mockClient.bitable.v1.appTableRecord.create
        .mockResolvedValueOnce({ data: { record: { record_id: 'rec1' } } })
        .mockResolvedValueOnce({ data: { record: { record_id: 'rec2' } } })
        .mockResolvedValueOnce({ data: { record: { record_id: 'rec3' } } });

      const result = await mobiKOLBatchSync.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(3);
      expect(result.data.success_count).toBe(3);
      expect(result.data.failed_count).toBe(0);
      expect(mockClient.bitable.v1.appTableRecord.create).toHaveBeenCalledTimes(3);
    });

    it('エラーが発生したKOLを記録する', async () => {
      const params = {
        data: {
          kol_urls: [
            'https://youtube.com/@success',
            'https://invalid-url.com/fail'
          ],
          app_token: 'bascXXXXX',
          table_id: 'tblXXXXX',
          mobi_api_key: 'test_api_key',
          field_mapping: {}
        }
      };

      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            basic_info: { name: 'Success' },
            statistics: {}
          }
        });

      mockClient.bitable.v1.appTableRecord.create
        .mockResolvedValueOnce({ data: { record: { record_id: 'rec1' } } });

      const result = await mobiKOLBatchSync.customHandler!(mockClient as any, params);

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(2);
      expect(result.data.success_count).toBe(1);
      expect(result.data.failed_count).toBe(1);
      expect(result.data.results[1].success).toBe(false);
      expect(result.data.results[1].error).toContain('Unsupported KOL URL');
    });
  });
});