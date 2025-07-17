import { 
  ConversationStorage,
  FileConversationStorage, 
  StorageFactory,
  ConversationManager,
  ConversationData, 
  StorageConfig, 
  ConversationFilter,
  StorageStats,
  SQLiteConversationStorage
} from '@/storage/conversation-storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    mkdir: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(),
}));

// Mock sqlite3
jest.mock('sqlite3', () => ({
  verbose: () => ({
    Database: jest.fn().mockImplementation(function(path: string) {
      return mockDatabase;
    })
  })
}), { virtual: true });

// Mock crypto for createCipheriv/createDecipheriv
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn((size) => Buffer.from('a'.repeat(size))),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => Buffer.from('hashed_key_32_bytes_long________'))
  })),
  createCipheriv: jest.fn((algorithm, key, iv) => ({
    update: jest.fn((data) => 'encrypted_' + data),
    final: jest.fn(() => '_final')
  })),
  createDecipheriv: jest.fn((algorithm, key, iv) => ({
    update: jest.fn((data) => data.replace('encrypted_', '').replace('_final', '')),
    final: jest.fn(() => '')
  }))
}));

const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock database instance
const mockDatabase = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  close: jest.fn()
};

describe('ConversationStorage Base Class', () => {
  class TestStorage extends ConversationStorage {
    constructor(config: StorageConfig) {
      super(config);
    }
    
    async initialize(): Promise<void> {}
    async saveConversation(conversation: ConversationData): Promise<void> {}
    async getConversation(conversationId: string): Promise<ConversationData | null> { return null; }
    async updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void> {}
    async deleteConversation(conversationId: string): Promise<void> {}
    async listConversations(filter?: ConversationFilter): Promise<ConversationData[]> { return []; }
    async getStats(): Promise<any> { return {}; }
    async cleanup(): Promise<number> { return 0; }
    async close(): Promise<void> {}
  }

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const config: StorageConfig = {
        type: 'memory',
        encryptionKey: 'test-key-32-bytes-long-enough!!!'
      };
      const storage = new TestStorage(config);

      const originalData = 'sensitive data';
      const encrypted = (storage as any).encrypt(originalData);
      const decrypted = (storage as any).decrypt(encrypted);

      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });

    test('should return original data when no encryption key', () => {
      const config: StorageConfig = { type: 'memory' };
      const storage = new TestStorage(config);

      const originalData = 'plain data';
      const encrypted = (storage as any).encrypt(originalData);
      const decrypted = (storage as any).decrypt(encrypted);

      expect(encrypted).toBe(originalData);
      expect(decrypted).toBe(originalData);
    });
  });

  describe('Serialization/Deserialization', () => {
    test('should serialize and deserialize conversation correctly', () => {
      const config: StorageConfig = { type: 'memory' };
      const storage = new TestStorage(config);

      const testConversation: ConversationData = {
        conversationId: 'test-conv-123',
        userId: 'user-123',
        chatId: 'chat-456',
        agentName: 'TestAgent',
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date('2025-01-01T10:00:00Z')
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: new Date('2025-01-01T10:00:01Z')
          }
        ],
        metadata: { topic: 'greeting' },
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:01Z')
      };

      const serialized = (storage as any).serializeConversation(testConversation);
      const deserialized = (storage as any).deserializeConversation(serialized);

      expect(deserialized.conversationId).toBe(testConversation.conversationId);
      expect(deserialized.messages).toHaveLength(2);
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.messages[0].timestamp).toBeInstanceOf(Date);
    });

    test('should handle conversations with expires date', () => {
      const config: StorageConfig = { type: 'memory' };
      const storage = new TestStorage(config);

      const testConversation: ConversationData = {
        conversationId: 'test-conv-123',
        userId: 'user-123',
        chatId: 'chat-456',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:01Z'),
        expiresAt: new Date('2025-12-31T23:59:59Z')
      };

      const serialized = (storage as any).serializeConversation(testConversation);
      const deserialized = (storage as any).deserializeConversation(serialized);

      expect(deserialized.expiresAt).toBeInstanceOf(Date);
      expect(deserialized.expiresAt).toEqual(testConversation.expiresAt);
    });
  });
});

describe('SQLiteConversationStorage', () => {
  let storage: SQLiteConversationStorage;
  const mockFsMkdirSync = fs.mkdirSync as jest.Mock;
  const mockFsExistsSync = fs.existsSync as jest.Mock;
  const mockFsStatSync = fs.statSync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFsExistsSync.mockReturnValue(true);
    mockFsStatSync.mockReturnValue({ size: 1024 });
    
    // Reset database mocks
    mockDatabase.run.mockReset();
    mockDatabase.get.mockReset();
    mockDatabase.all.mockReset();
    mockDatabase.close.mockReset();
  });

  describe('Initialization', () => {
    test('should create data directory if not exists', async () => {
      mockFsExistsSync.mockReturnValue(false);
      
      const config: StorageConfig = {
        type: 'sqlite',
        dataDir: '/test/data'
      };
      
      storage = new SQLiteConversationStorage(config);
      
      // Mock table creation to avoid timeout
      mockDatabase.run.mockImplementation((sql, callback) => {
        if (typeof callback === 'function') callback(null);
      });
      
      await storage.initialize();

      expect(mockFsMkdirSync).toHaveBeenCalledWith(
        '/test/data',
        { recursive: true }
      );
    });

    test('should initialize database and create tables', async () => {
      const config: StorageConfig = {
        type: 'sqlite',
        connectionString: '/test/db/conversations.db'
      };

      storage = new SQLiteConversationStorage(config);
      
      // Mock table creation
      mockDatabase.run.mockImplementation((sql, callback) => {
        callback(null);
      });

      await storage.initialize();

      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS conversations'),
        expect.any(Function)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'SQLite conversation storage initialized: /test/db/conversations.db'
      );
    });

    test('should handle table creation error', async () => {
      const config: StorageConfig = { type: 'sqlite' };
      storage = new SQLiteConversationStorage(config);

      const error = new Error('Table creation failed');
      mockDatabase.run.mockImplementation((sql, callback) => {
        callback(error);
      });

      await expect(storage.initialize()).rejects.toThrow('Table creation failed');
    });
  });

  describe('Save Conversation', () => {
    beforeEach(async () => {
      const config: StorageConfig = { type: 'sqlite' };
      storage = new SQLiteConversationStorage(config);
      
      mockDatabase.run.mockImplementation((sql, callback) => {
        if (typeof callback === 'function') callback(null);
      });
      
      await storage.initialize();
    });

    test('should save conversation successfully', async () => {
      const testConversation: ConversationData = {
        conversationId: 'test-conv-123',
        userId: 'user-123',
        chatId: 'chat-456',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:01Z')
      };

      mockDatabase.run.mockImplementation((sql, params, callback) => {
        callback(null);
      });

      await storage.saveConversation(testConversation);

      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO conversations'),
        expect.arrayContaining([
          testConversation.conversationId,
          testConversation.userId,
          testConversation.chatId,
          testConversation.agentName
        ]),
        expect.any(Function)
      );
    });

    test('should handle save error', async () => {
      const testConversation: ConversationData = {
        conversationId: 'test-conv-123',
        userId: 'user-123',
        chatId: 'chat-456',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const error = new Error('Save failed');
      mockDatabase.run.mockImplementation((sql, params, callback) => {
        if (sql.includes('INSERT')) callback(error);
      });

      await expect(storage.saveConversation(testConversation))
        .rejects.toThrow('Save failed');
    });
  });

  describe('Get Conversation', () => {
    beforeEach(async () => {
      const config: StorageConfig = { type: 'sqlite' };
      storage = new SQLiteConversationStorage(config);
      
      mockDatabase.run.mockImplementation((sql, callback) => {
        if (typeof callback === 'function') callback(null);
      });
      
      await storage.initialize();
    });

    test('should retrieve conversation successfully', async () => {
      const testConversation = {
        conversationId: 'test-conv-123',
        userId: 'user-123',
        chatId: 'chat-456',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const serializedData = JSON.stringify(testConversation);
      mockDatabase.get.mockImplementation((sql, params, callback) => {
        callback(null, { messages_data: serializedData });
      });

      const result = await storage.getConversation('test-conv-123');

      expect(result).toBeTruthy();
      expect(result?.conversationId).toBe(testConversation.conversationId);
      expect(mockDatabase.get).toHaveBeenCalledWith(
        'SELECT * FROM conversations WHERE conversation_id = ?',
        ['test-conv-123'],
        expect.any(Function)
      );
    });

    test('should return null for non-existent conversation', async () => {
      mockDatabase.get.mockImplementation((sql, params, callback) => {
        callback(null, null);
      });

      const result = await storage.getConversation('non-existent');

      expect(result).toBeNull();
    });

    test('should handle deserialization error', async () => {
      mockDatabase.get.mockImplementation((sql, params, callback) => {
        callback(null, { messages_data: 'invalid json' });
      });

      await expect(storage.getConversation('test-conv-123'))
        .rejects.toThrow('Failed to deserialize conversation');
    });
  });

  describe('List Conversations', () => {
    beforeEach(async () => {
      const config: StorageConfig = { type: 'sqlite' };
      storage = new SQLiteConversationStorage(config);
      
      mockDatabase.run.mockImplementation((sql, callback) => {
        if (typeof callback === 'function') callback(null);
      });
      
      await storage.initialize();
    });

    test('should apply filters correctly', async () => {
      const filter: ConversationFilter = {
        userId: 'user-123',
        chatId: 'chat-456',
        agentName: 'TestAgent',
        fromDate: new Date('2025-01-01'),
        toDate: new Date('2025-12-31'),
        limit: 10,
        offset: 5
      };

      mockDatabase.all.mockImplementation((sql, params, callback) => {
        callback(null, []);
      });

      await storage.listConversations(filter);

      expect(mockDatabase.all).toHaveBeenCalledWith(
        expect.stringContaining('AND user_id = ?'),
        expect.arrayContaining([
          'user-123',
          'chat-456',
          'TestAgent',
          filter.fromDate!.toISOString(),
          filter.toDate!.toISOString(),
          10,
          5
        ]),
        expect.any(Function)
      );
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      const config: StorageConfig = {
        type: 'sqlite',
        retentionDays: 30
      };
      storage = new SQLiteConversationStorage(config);
      
      mockDatabase.run.mockImplementation((sql, callback) => {
        if (typeof callback === 'function') callback(null);
      });
      
      await storage.initialize();
    });

    test('should cleanup old conversations', async () => {
      mockDatabase.run.mockImplementation(function(this: any, sql, params, callback) {
        if (sql.includes('DELETE FROM conversations WHERE created_at')) {
          this.changes = 5;
          callback.call(this, null);
        }
      });

      const count = await storage.cleanup();

      expect(count).toBe(5);
      expect(mockDatabase.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM conversations WHERE created_at'),
        expect.any(Array),
        expect.any(Function)
      );
    });
  });
});

describe('FileConversationStorage', () => {
  let storage: FileConversationStorage;
  const tempDir = path.join(os.tmpdir(), 'test-conversation-storage');
  const testConversationId = 'test-conv-123';
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    (mockFs.promises.readdir as jest.Mock).mockResolvedValue([]);
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({ size: 1024 });
    
    // Create storage instance
    storage = new FileConversationStorage({ 
      type: 'file',
      dataDir: tempDir 
    });
    
    // Initialize storage
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('initialize', () => {
    test('should create data directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const newStorage = new FileConversationStorage({ 
        type: 'file',
        dataDir: tempDir 
      });
      
      await newStorage.initialize();
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(tempDir, { recursive: true });
    });
  });

  describe('saveConversation', () => {
    test('should save a conversation to file', async () => {
      const conversationData: ConversationData = {
        conversationId: testConversationId,
        userId: 'user-456',
        chatId: 'chat-789',
        agentName: 'TestAgent',
        messages: [
          { 
            id: '1',
            role: 'user', 
            content: 'Hello', 
            timestamp: new Date('2025-01-01T00:00:00Z')
          }
        ],
        metadata: { test: true },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      await storage.saveConversation(conversationData);

      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, `${testConversationId}.json`),
        expect.any(String),
        'utf8'
      );

      // Verify the saved data structure
      const savedData = JSON.parse((mockFs.promises.writeFile as jest.Mock).mock.calls[0][1]);
      expect(savedData.conversationId).toBe(testConversationId);
      expect(savedData.messages).toHaveLength(1);
    });

    test('should handle save errors', async () => {
      (mockFs.promises.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

      const conversationData: ConversationData = {
        conversationId: testConversationId,
        userId: 'user-456',
        chatId: 'chat-789',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(storage.saveConversation(conversationData)).rejects.toThrow();
      
      // Reset the mock for subsequent tests
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    });
  });

  describe('getConversation', () => {
    test('should retrieve a conversation from file', async () => {
      const conversationData: ConversationData = {
        conversationId: testConversationId,
        userId: 'user-456',
        chatId: 'chat-789',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z' as any,
        updatedAt: '2025-01-01T00:00:00Z' as any,
      };

      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(conversationData)
      );

      const retrieved = await storage.getConversation(testConversationId);

      expect(mockFs.promises.readFile).toHaveBeenCalledWith(
        path.join(tempDir, `${testConversationId}.json`),
        'utf8'
      );
      expect(retrieved?.conversationId).toBe(testConversationId);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
    });

    test('should return null for non-existent conversation', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (mockFs.promises.readFile as jest.Mock).mockRejectedValue(error);

      const result = await storage.getConversation('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateConversation', () => {
    test('should update an existing conversation', async () => {
      const originalData: ConversationData = {
        conversationId: testConversationId,
        userId: 'user-456',
        chatId: 'chat-789',
        agentName: 'TestAgent',
        messages: [],
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z' as any,
        updatedAt: '2025-01-01T00:00:00Z' as any,
      };

      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(originalData)
      );

      await storage.updateConversation(testConversationId, {
        messages: [{ 
          id: '1',
          role: 'user', 
          content: 'Updated', 
          timestamp: new Date('2025-01-02T00:00:00Z')
        }]
      });

      expect(mockFs.promises.writeFile).toHaveBeenCalled();
      const savedData = JSON.parse((mockFs.promises.writeFile as jest.Mock).mock.calls[0][1]);
      expect(savedData.messages).toHaveLength(1);
      expect(savedData.messages[0].content).toBe('Updated');
    });

    test('should throw error if conversation does not exist', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (mockFs.promises.readFile as jest.Mock).mockRejectedValue(error);

      await expect(
        storage.updateConversation('non-existent', { metadata: {} })
      ).rejects.toThrow('Conversation non-existent not found');
    });
  });

  describe('deleteConversation', () => {
    test('should delete a conversation file', async () => {
      await storage.deleteConversation(testConversationId);

      expect(mockFs.promises.unlink).toHaveBeenCalledWith(
        path.join(tempDir, `${testConversationId}.json`)
      );
    });

    test('should not throw error if file does not exist', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (mockFs.promises.unlink as jest.Mock).mockRejectedValue(error);

      await expect(storage.deleteConversation('non-existent')).resolves.not.toThrow();
    });
  });

  describe('listConversations', () => {
    test('should list all conversations', async () => {
      const mockFiles = ['conv1.json', 'conv2.json', 'not-json.txt'];
      (mockFs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const conv1Data = {
        conversationId: 'conv1',
        userId: 'user1',
        chatId: 'chat1',
        agentName: 'Agent1',
        messages: [],
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const conv2Data = {
        conversationId: 'conv2',
        userId: 'user2',
        chatId: 'chat2',
        agentName: 'Agent2',
        messages: [],
        metadata: {},
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (mockFs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(conv1Data))
        .mockResolvedValueOnce(JSON.stringify(conv2Data));

      const conversations = await storage.listConversations();

      expect(conversations).toHaveLength(2);
      expect(conversations[0].conversationId).toBe('conv2'); // Should be sorted by date
      expect(conversations[1].conversationId).toBe('conv1');
    });

    test('should filter conversations by userId', async () => {
      const mockFiles = ['conv1.json', 'conv2.json'];
      (mockFs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const conv1Data = {
        conversationId: 'conv1',
        userId: 'user1',
        chatId: 'chat1',
        agentName: 'Agent1',
        messages: [],
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const conv2Data = {
        conversationId: 'conv2',
        userId: 'user2',
        chatId: 'chat2',
        agentName: 'Agent2',
        messages: [],
        metadata: {},
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (mockFs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(conv1Data))
        .mockResolvedValueOnce(JSON.stringify(conv2Data));

      const filter: ConversationFilter = { userId: 'user1' };
      const conversations = await storage.listConversations(filter);

      expect(conversations).toHaveLength(1);
      expect(conversations[0].userId).toBe('user1');
    });

    test('should apply limit and offset', async () => {
      const mockFiles = ['conv1.json', 'conv2.json', 'conv3.json'];
      (mockFs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const mockConversations = mockFiles.map((file, index) => ({
        conversationId: `conv${index + 1}`,
        userId: 'user1',
        chatId: `chat${index + 1}`,
        agentName: 'Agent',
        messages: [],
        metadata: {},
        createdAt: `2025-01-0${index + 1}T00:00:00Z`,
        updatedAt: `2025-01-0${index + 1}T00:00:00Z`,
      }));

      mockConversations.forEach(conv => {
        (mockFs.promises.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(conv));
      });

      const filter: ConversationFilter = { limit: 2, offset: 1 };
      const conversations = await storage.listConversations(filter);

      expect(conversations).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    test('should calculate storage statistics', async () => {
      const mockFiles = ['conv1.json', 'conv2.json'];
      (mockFs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const conv1Data = {
        conversationId: 'conv1',
        userId: 'user1',
        chatId: 'chat1',
        agentName: 'Agent1',
        messages: [
          { 
            id: '1',
            role: 'user', 
            content: 'Hello', 
            timestamp: new Date('2025-01-01T00:00:00Z')
          },
          { 
            id: '2',
            role: 'assistant', 
            content: 'Hi', 
            timestamp: new Date('2025-01-01T00:01:00Z')
          }
        ],
        metadata: {},
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      const conv2Data = {
        conversationId: 'conv2',
        userId: 'user2',
        chatId: 'chat2',
        agentName: 'Agent2',
        messages: [
          { 
            id: '1',
            role: 'user', 
            content: 'Test', 
            timestamp: new Date('2025-01-02T00:00:00Z')
          }
        ],
        metadata: {},
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (mockFs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(conv1Data))
        .mockResolvedValueOnce(JSON.stringify(conv2Data));

      (mockFs.promises.stat as jest.Mock).mockResolvedValue({ size: 1024 });

      const stats = await storage.getStats();

      expect(stats.totalConversations).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.oldestConversation).toEqual(new Date('2025-01-01T00:00:00Z'));
      expect(stats.newestConversation).toEqual(new Date('2025-01-02T00:00:00Z'));
      expect(stats.diskUsage).toBe(2048); // 2 files * 1024 bytes
    });
  });

  describe('cleanup', () => {
    test('should delete expired conversations', async () => {
      const mockFiles = ['conv1.json', 'conv2.json'];
      (mockFs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const oldConversation = {
        conversationId: 'conv1',
        userId: 'user1',
        chatId: 'chat1',
        agentName: 'Agent1',
        messages: [],
        metadata: {},
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days old
        updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const recentConversation = {
        conversationId: 'conv2',
        userId: 'user2',
        chatId: 'chat2',
        agentName: 'Agent2',
        messages: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (mockFs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(oldConversation))
        .mockResolvedValueOnce(JSON.stringify(recentConversation));

      const deletedCount = await storage.cleanup();

      expect(deletedCount).toBe(1);
      expect(mockFs.promises.unlink).toHaveBeenCalledWith(
        path.join(tempDir, 'conv1.json')
      );
    });
  });
});

describe('StorageFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockFsExistsSync = fs.existsSync as jest.Mock;
    mockFsExistsSync.mockReturnValue(true);
  });

  test('should create SQLite storage', async () => {
    const config: StorageConfig = { type: 'sqlite' };
    
    // Mock SQLite initialization
    mockDatabase.run.mockImplementation((sql, callback) => {
      if (typeof callback === 'function') callback(null);
    });

    const storage = await StorageFactory.createStorage(config);
    
    expect(storage).toBeInstanceOf(SQLiteConversationStorage);
  });

  test('should create FileConversationStorage', async () => {
    const config: StorageConfig = {
      type: 'file',
      dataDir: '/tmp/test'
    };

    const storage = await StorageFactory.createStorage(config);
    expect(storage).toBeInstanceOf(FileConversationStorage);
  });

  test('should fallback memory to file storage', async () => {
    const config: StorageConfig = { type: 'memory' };
    
    const storage = await StorageFactory.createStorage(config);
    
    expect(storage).toBeInstanceOf(FileConversationStorage);
  });

  test('should throw error for unsupported storage type', async () => {
    const config: any = {
      type: 'unsupported'
    };

    await expect(StorageFactory.createStorage(config)).rejects.toThrow(
      'Unsupported storage type: unsupported'
    );
  });
});

describe('ConversationManager', () => {
  let manager: ConversationManager;
  let mockStorage: jest.Mocked<FileConversationStorage>;

  beforeEach(() => {
    // Create a mock storage
    mockStorage = {
      initialize: jest.fn().mockResolvedValue(undefined),
      saveConversation: jest.fn().mockResolvedValue(undefined),
      getConversation: jest.fn().mockResolvedValue(null),
      updateConversation: jest.fn().mockResolvedValue(undefined),
      deleteConversation: jest.fn().mockResolvedValue(undefined),
      listConversations: jest.fn().mockResolvedValue([]),
      getStats: jest.fn().mockResolvedValue({
        totalConversations: 0,
        totalMessages: 0,
        oldestConversation: new Date(),
        newestConversation: new Date(),
      }),
      cleanup: jest.fn().mockResolvedValue(0),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    manager = new ConversationManager(mockStorage);
  });

  test('should save conversation context', async () => {
    const agent = { name: 'TestAgent' } as any;
    const context = {
      agent,
      conversationId: 'test-conv-123',
      userId: 'user-456',
      chatId: 'chat-123',
      history: [],
      metadata: {}
    };

    await manager.saveContext(context);

    expect(mockStorage.saveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'test-conv-123',
        chatId: 'chat-123',
        agentName: 'TestAgent',
        userId: 'user-456',
        messages: [],
      })
    );
  });

  test('should add a message to conversation', async () => {
    const conversationId = 'test-conv-123';
    const existingConv: ConversationData = {
      conversationId,
      userId: 'user-456',
      chatId: 'chat-789',
      agentName: 'TestAgent',
      messages: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStorage.getConversation.mockResolvedValue(existingConv);

    await manager.addMessage(conversationId, {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date()
    });

    expect(mockStorage.saveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Hello',
          })
        ])
      })
    );
  });

  test('should load conversation context', async () => {
    const conversationId = 'test-conv-123';
    const existingConv: ConversationData = {
      conversationId,
      userId: 'user-456',
      chatId: 'chat-789',
      agentName: 'TestAgent',
      messages: [
        { 
          id: '1',
          role: 'user', 
          content: 'Hello', 
          timestamp: new Date('2025-01-01T00:00:00Z')
        },
        { 
          id: '2',
          role: 'assistant', 
          content: 'Hi there!', 
          timestamp: new Date('2025-01-01T00:01:00Z')
        },
      ],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStorage.getConversation.mockResolvedValue(existingConv);

    const context = await manager.loadContext(conversationId);

    expect(context).not.toBeNull();
    expect(context?.conversationId).toBe(conversationId);
    expect(context?.history).toHaveLength(2);
    expect(context?.history[0].content).toBe('Hello');
    expect(context?.history[1].content).toBe('Hi there!');
  });
});