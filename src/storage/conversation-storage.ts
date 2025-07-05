/**
 * Persistent Storage System for Agent Conversations
 * SQLite + Redis + File-based storage options
 */

import { ConversationMessage, RunContext, AgentResult } from '../agents/agent';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Storage interfaces
export interface StorageConfig {
  type: 'sqlite' | 'redis' | 'file' | 'memory';
  connectionString?: string;
  dataDir?: string;
  maxConversations?: number;
  retentionDays?: number;
  encryptionKey?: string;
}

export interface ConversationData {
  conversationId: string;
  userId?: string;
  chatId: string;
  agentName: string;
  messages: ConversationMessage[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface ConversationFilter {
  userId?: string;
  chatId?: string;
  agentName?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface StorageStats {
  totalConversations: number;
  totalMessages: number;
  oldestConversation: Date;
  newestConversation: Date;
  diskUsage?: number;
  memoryUsage?: number;
}

// Abstract base class for storage implementations
export abstract class ConversationStorage {
  protected config: StorageConfig;
  protected encryptionKey?: string;

  constructor(config: StorageConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey;
  }

  // Core storage operations
  abstract initialize(): Promise<void>;
  abstract saveConversation(conversation: ConversationData): Promise<void>;
  abstract getConversation(conversationId: string): Promise<ConversationData | null>;
  abstract updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void>;
  abstract deleteConversation(conversationId: string): Promise<void>;
  abstract listConversations(filter?: ConversationFilter): Promise<ConversationData[]>;
  abstract getStats(): Promise<StorageStats>;
  abstract cleanup(): Promise<number>; // Returns number of cleaned up conversations
  abstract close(): Promise<void>;

  // Helper methods
  protected encrypt(data: string): string {
    if (!this.encryptionKey) return data;

    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(16);

    // Ensure the key is exactly 32 bytes for AES-256
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend IV to the encrypted data for use in decryption
    return iv.toString('hex') + ':' + encrypted;
  }

  protected decrypt(encryptedData: string): string {
    if (!this.encryptionKey) return encryptedData;

    // Extract IV from the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Ensure the key is exactly 32 bytes for AES-256
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  protected serializeConversation(conversation: ConversationData): string {
    const data = JSON.stringify(conversation);
    return this.encrypt(data);
  }

  protected deserializeConversation(data: string): ConversationData {
    const decrypted = this.decrypt(data);
    const conversation = JSON.parse(decrypted);

    // Convert date strings back to Date objects
    conversation.createdAt = new Date(conversation.createdAt);
    conversation.updatedAt = new Date(conversation.updatedAt);
    if (conversation.expiresAt) {
      conversation.expiresAt = new Date(conversation.expiresAt);
    }

    // Convert message timestamps
    conversation.messages.forEach((msg: any) => {
      msg.timestamp = new Date(msg.timestamp);
    });

    return conversation;
  }
}

// SQLite Implementation
export class SQLiteConversationStorage extends ConversationStorage {
  private db: any; // sqlite3 database instance
  private dbPath: string;

  constructor(config: StorageConfig) {
    super(config);
    this.dbPath = config.connectionString || path.join(config.dataDir || './data', 'conversations.db');
  }

  async initialize(): Promise<void> {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Import sqlite3 dynamically
    let sqlite3: any;
    try {
      sqlite3 = require('sqlite3').verbose();
    } catch (error) {
      throw new Error('sqlite3 package not installed. Run: npm install sqlite3');
    }

    // Initialize database
    this.db = new sqlite3.Database(this.dbPath);

    // Create tables
    await this.createTables();

    console.log(`SQLite conversation storage initialized: ${this.dbPath}`);
  }

  private async createTables(): Promise<void> {
    const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id TEXT PRIMARY KEY,
        user_id TEXT,
        chat_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        messages_data TEXT NOT NULL,
        metadata_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        message_count INTEGER DEFAULT 0,
        INDEX(user_id),
        INDEX(chat_id),
        INDEX(agent_name),
        INDEX(created_at),
        INDEX(expires_at)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.run(createConversationsTable, (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async saveConversation(conversation: ConversationData): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO conversations 
      (conversation_id, user_id, chat_id, agent_name, messages_data, metadata_data, 
       created_at, updated_at, expires_at, message_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const messagesData = this.serializeConversation(conversation);
    const metadataData = JSON.stringify(conversation.metadata);

    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        [
          conversation.conversationId,
          conversation.userId,
          conversation.chatId,
          conversation.agentName,
          messagesData,
          metadataData,
          conversation.createdAt.toISOString(),
          conversation.updatedAt.toISOString(),
          conversation.expiresAt?.toISOString(),
          conversation.messages.length,
        ],
        (err: Error) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  async getConversation(conversationId: string): Promise<ConversationData | null> {
    const sql = 'SELECT * FROM conversations WHERE conversation_id = ?';

    return new Promise((resolve, reject) => {
      this.db.get(sql, [conversationId], (err: Error, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          try {
            const conversation = this.deserializeConversation(row.messages_data);
            resolve(conversation);
          } catch (error) {
            reject(new Error(`Failed to deserialize conversation: ${error}`));
          }
        }
      });
    });
  }

  async updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void> {
    const existingConversation = await this.getConversation(conversationId);
    if (!existingConversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const updatedConversation = { ...existingConversation, ...updates };
    updatedConversation.updatedAt = new Date();

    await this.saveConversation(updatedConversation);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const sql = 'DELETE FROM conversations WHERE conversation_id = ?';

    return new Promise((resolve, reject) => {
      this.db.run(sql, [conversationId], (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async listConversations(filter: ConversationFilter = {}): Promise<ConversationData[]> {
    let sql = 'SELECT * FROM conversations WHERE 1=1';
    const params: any[] = [];

    if (filter.userId) {
      sql += ' AND user_id = ?';
      params.push(filter.userId);
    }

    if (filter.chatId) {
      sql += ' AND chat_id = ?';
      params.push(filter.chatId);
    }

    if (filter.agentName) {
      sql += ' AND agent_name = ?';
      params.push(filter.agentName);
    }

    if (filter.fromDate) {
      sql += ' AND created_at >= ?';
      params.push(filter.fromDate.toISOString());
    }

    if (filter.toDate) {
      sql += ' AND created_at <= ?';
      params.push(filter.toDate.toISOString());
    }

    sql += ' ORDER BY updated_at DESC';

    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    if (filter.offset) {
      sql += ' OFFSET ?';
      params.push(filter.offset);
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: Error, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          try {
            const conversations = rows.map((row) => this.deserializeConversation(row.messages_data));
            resolve(conversations);
          } catch (error) {
            reject(new Error(`Failed to deserialize conversations: ${error}`));
          }
        }
      });
    });
  }

  async getStats(): Promise<StorageStats> {
    const sql = `
      SELECT 
        COUNT(*) as total_conversations,
        SUM(message_count) as total_messages,
        MIN(created_at) as oldest_conversation,
        MAX(created_at) as newest_conversation
      FROM conversations
    `;

    return new Promise((resolve, reject) => {
      this.db.get(sql, [], (err: Error, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalConversations: row.total_conversations || 0,
            totalMessages: row.total_messages || 0,
            oldestConversation: row.oldest_conversation ? new Date(row.oldest_conversation) : new Date(),
            newestConversation: row.newest_conversation ? new Date(row.newest_conversation) : new Date(),
            diskUsage: this.getDiskUsage(),
          });
        }
      });
    });
  }

  async cleanup(): Promise<number> {
    const retentionDays = this.config.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const sql = 'DELETE FROM conversations WHERE created_at < ? OR (expires_at IS NOT NULL AND expires_at < ?)';
    const now = new Date().toISOString();

    return new Promise<number>((resolve, reject) => {
      this.db.run(sql, [cutoffDate.toISOString(), now], function (this: any, err: Error) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private getDiskUsage(): number {
    try {
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
}

// File-based Implementation (fallback)
export class FileConversationStorage extends ConversationStorage {
  private dataDir: string;

  constructor(config: StorageConfig) {
    super(config);
    this.dataDir = config.dataDir || './data/conversations';
  }

  async initialize(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    console.log(`File-based conversation storage initialized: ${this.dataDir}`);
  }

  private getFilePath(conversationId: string): string {
    return path.join(this.dataDir, `${conversationId}.json`);
  }

  async saveConversation(conversation: ConversationData): Promise<void> {
    const filePath = this.getFilePath(conversation.conversationId);
    const data = this.serializeConversation(conversation);

    await fs.promises.writeFile(filePath, data, 'utf8');
  }

  async getConversation(conversationId: string): Promise<ConversationData | null> {
    const filePath = this.getFilePath(conversationId);

    try {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return this.deserializeConversation(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void> {
    const existingConversation = await this.getConversation(conversationId);
    if (!existingConversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const updatedConversation = { ...existingConversation, ...updates };
    updatedConversation.updatedAt = new Date();

    await this.saveConversation(updatedConversation);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const filePath = this.getFilePath(conversationId);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async listConversations(filter: ConversationFilter = {}): Promise<ConversationData[]> {
    const files = await fs.promises.readdir(this.dataDir);
    const conversations: ConversationData[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const conversationId = path.basename(file, '.json');
        const conversation = await this.getConversation(conversationId);

        if (conversation && this.matchesFilter(conversation, filter)) {
          conversations.push(conversation);
        }
      } catch (error) {
        console.warn(`Failed to load conversation from ${file}:`, error);
      }
    }

    // Sort by updated date
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Apply limit and offset
    const start = filter.offset || 0;
    const end = filter.limit ? start + filter.limit : undefined;

    return conversations.slice(start, end);
  }

  async getStats(): Promise<StorageStats> {
    const conversations = await this.listConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

    const dates = conversations.map((conv) => conv.createdAt);
    const oldestConversation = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
    const newestConversation = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();

    return {
      totalConversations: conversations.length,
      totalMessages,
      oldestConversation,
      newestConversation,
      diskUsage: await this.calculateDiskUsage(),
    };
  }

  async cleanup(): Promise<number> {
    const retentionDays = this.config.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const conversations = await this.listConversations();
    let deletedCount = 0;

    for (const conversation of conversations) {
      const shouldDelete =
        conversation.createdAt < cutoffDate || (conversation.expiresAt && conversation.expiresAt < new Date());

      if (shouldDelete) {
        await this.deleteConversation(conversation.conversationId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async close(): Promise<void> {
    // No resources to close for file-based storage
  }

  private matchesFilter(conversation: ConversationData, filter: ConversationFilter): boolean {
    if (filter.userId && conversation.userId !== filter.userId) return false;
    if (filter.chatId && conversation.chatId !== filter.chatId) return false;
    if (filter.agentName && conversation.agentName !== filter.agentName) return false;
    if (filter.fromDate && conversation.createdAt < filter.fromDate) return false;
    if (filter.toDate && conversation.createdAt > filter.toDate) return false;

    return true;
  }

  private async calculateDiskUsage(): Promise<number> {
    try {
      const files = await fs.promises.readdir(this.dataDir);
      let totalSize = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.dataDir, file);
          const stats = await fs.promises.stat(filePath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }
}

// Storage Factory
export class StorageFactory {
  static async createStorage(config: StorageConfig): Promise<ConversationStorage> {
    let storage: ConversationStorage;

    switch (config.type) {
      case 'sqlite':
        storage = new SQLiteConversationStorage(config);
        break;
      case 'file':
        storage = new FileConversationStorage(config);
        break;
      case 'memory':
        // Fallback to file storage for memory type
        storage = new FileConversationStorage({ ...config, type: 'file' });
        break;
      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }

    await storage.initialize();
    return storage;
  }
}

// Conversation Manager - High-level interface
export class ConversationManager {
  private storage: ConversationStorage;

  constructor(storage: ConversationStorage) {
    this.storage = storage;
  }

  static async create(config: StorageConfig): Promise<ConversationManager> {
    const storage = await StorageFactory.createStorage(config);
    return new ConversationManager(storage);
  }

  async saveContext(context: RunContext): Promise<void> {
    const conversation: ConversationData = {
      conversationId: context.conversationId,
      userId: context.userId,
      chatId: context.chatId,
      agentName: context.agent.name,
      messages: context.history,
      metadata: context.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storage.saveConversation(conversation);
  }

  async loadContext(conversationId: string): Promise<RunContext | null> {
    const conversation = await this.storage.getConversation(conversationId);
    if (!conversation) return null;

    // Note: Agent instance needs to be provided separately
    return {
      agent: null as any, // Will be set by the caller
      conversationId: conversation.conversationId,
      userId: conversation.userId,
      chatId: conversation.chatId,
      history: conversation.messages,
      metadata: conversation.metadata,
    };
  }

  async addMessage(conversationId: string, message: ConversationMessage): Promise<void> {
    const conversation = await this.storage.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    await this.storage.saveConversation(conversation);
  }

  async getConversationHistory(filter: ConversationFilter): Promise<ConversationData[]> {
    return this.storage.listConversations(filter);
  }

  async getStats(): Promise<StorageStats> {
    return this.storage.getStats();
  }

  async cleanup(): Promise<number> {
    return this.storage.cleanup();
  }

  async close(): Promise<void> {
    await this.storage.close();
  }
}
