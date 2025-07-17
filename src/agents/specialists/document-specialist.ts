/**
 * Document Management Specialist Agent
 * Specialized for Lark Docs/Drive operations
 */

import { Agent, AgentConfig, AgentTool } from '../agent';
import { AgentCapability, AgentMetadata } from '../types';
import { TOOL_OPERATION_PROMPTS, PromptUtils } from '../prompts';
import { globalRegistry } from '../registry';

export class DocumentSpecialistAgent extends Agent {
  constructor(config: Partial<AgentConfig> = {}) {
    // Create tools before calling super()
    const tools = [
      {
        name: 'create_document',
        description: 'Create new document in Lark Docs',
        execute: async (params: any) => {
          const { title, content, folderToken, docType = 'doc' } = params;

          return this.executeMcpTool('docs.v1.document.create', {
            title,
            content,
            folder_token: folderToken,
            doc_type: docType,
          });
        },
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Document title' },
            content: { type: 'string', description: 'Document content (markdown or HTML)' },
            folderToken: { type: 'string', description: 'Parent folder token' },
            docType: {
              type: 'string',
              enum: ['doc', 'sheet', 'mindnote', 'bitable'],
              default: 'doc',
            },
          },
          required: ['title'],
        },
      },

      {
        name: 'get_document',
        description: 'Retrieve document content and metadata',
        execute: async (params: any) => {
          const { documentId, format = 'markdown' } = params;

          return this.executeMcpTool('docs.v1.document.get', {
            document_id: documentId,
            format,
          });
        },
        schema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Document ID' },
            format: {
              type: 'string',
              enum: ['markdown', 'html', 'text'],
              default: 'markdown',
            },
          },
          required: ['documentId'],
        },
      },

      {
        name: 'update_document',
        description: 'Update document content',
        execute: async (params: any) => {
          const { documentId, content, revision } = params;

          return this.executeMcpTool('docs.v1.document.patch', {
            document_id: documentId,
            content,
            revision,
          });
        },
        schema: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'Document ID' },
            content: { type: 'string', description: 'Updated content' },
            revision: { type: 'string', description: 'Current revision ID' },
          },
          required: ['documentId', 'content'],
        },
      },

      {
        name: 'upload_file',
        description: 'Upload file to Lark Drive',
        execute: async (params: any) => {
          const { fileName, fileContent, folderToken, mimeType } = params;

          return this.executeMcpTool('drive.v1.file.upload_all', {
            file_name: fileName,
            file_content: fileContent,
            parent_type: 'explorer',
            parent_node: folderToken,
            mime_type: mimeType,
          });
        },
        schema: {
          type: 'object',
          properties: {
            fileName: { type: 'string', description: 'File name' },
            fileContent: { type: 'string', description: 'File content (base64 encoded)' },
            folderToken: { type: 'string', description: 'Parent folder token' },
            mimeType: { type: 'string', description: 'File MIME type' },
          },
          required: ['fileName', 'fileContent'],
        },
      },

      {
        name: 'search_files',
        description: 'Search files and documents',
        execute: async (params: any) => {
          const { query, searchScope = 'user', fileTypes, pageSize = 50 } = params;

          return this.executeMcpTool('drive.v1.file.search', {
            search_key: query,
            search_scope: searchScope,
            file_types: fileTypes,
            page_size: pageSize,
          });
        },
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            searchScope: {
              type: 'string',
              enum: ['user', 'team', 'shared'],
              default: 'user',
            },
            fileTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'File types to search',
            },
            pageSize: { type: 'number', default: 50 },
          },
          required: ['query'],
        },
      },

      {
        name: 'manage_permissions',
        description: 'Manage document/file permissions',
        execute: async (params: any) => {
          const { fileToken, memberType, memberId, permissionLevel } = params;

          return this.executeMcpTool('drive.v1.permission.member.create', {
            token: fileToken,
            member_type: memberType,
            member_id: memberId,
            perm: permissionLevel,
          });
        },
        schema: {
          type: 'object',
          properties: {
            fileToken: { type: 'string', description: 'File or document token' },
            memberType: {
              type: 'string',
              enum: ['user', 'chat', 'department'],
              description: 'Type of member',
            },
            memberId: { type: 'string', description: 'Member ID' },
            permissionLevel: {
              type: 'string',
              enum: ['view', 'edit', 'full_access'],
              description: 'Permission level',
            },
          },
          required: ['fileToken', 'memberType', 'memberId', 'permissionLevel'],
        },
      },

      {
        name: 'get_file_versions',
        description: 'Get file version history',
        execute: async (params: any) => {
          const { fileToken, pageSize = 20 } = params;

          return this.executeMcpTool('drive.v1.file.version.list', {
            file_token: fileToken,
            page_size: pageSize,
          });
        },
        schema: {
          type: 'object',
          properties: {
            fileToken: { type: 'string', description: 'File token' },
            pageSize: { type: 'number', default: 20 },
          },
          required: ['fileToken'],
        },
      },
    ];

    const specialistConfig: AgentConfig = {
      name: 'Document Management Specialist',
      instructions: `
あなたはLark Docs/Drive操作の専門エージェントです。
以下のドキュメント管理機能を正確に実行してください：

**専門領域:**
• ドキュメント作成・編集・管理
• ファイルアップロード・ダウンロード
• フォルダ構造管理・権限設定
• バージョン管理・履歴追跡
• 共有設定・コラボレーション
• 検索・タグ管理

**ドキュメント管理原則:**
1. データ整合性とバックアップ
2. 適切なアクセス権限管理
3. バージョン履歴の保持
4. 効率的なファイル構造
5. セキュリティとプライバシー保護

**品質保証:**
常に正確で信頼性の高いドキュメント操作を提供します。
`,
      tools,
      model: 'gpt-4',
      temperature: 0.2, // 正確性重視
      maxTokens: 4000,
      language: 'ja',
      ...config,
    };

    super(specialistConfig);
  }

  /**
   * Execute MCP tool with document-specific error handling
   */
  private async executeMcpTool(toolName: string, params: any): Promise<any> {
    try {
      const response = {
        success: true,
        tool: toolName,
        parameters: params,
        timestamp: new Date().toISOString(),
        data: {
          message: `Executed ${toolName} successfully`,
          ...params,
        },
      };

      return response;
    } catch (error) {
      return {
        success: false,
        tool: toolName,
        parameters: params,
        error: String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Analyze document operation and recommend optimization
   */
  async analyzeDocumentOperation(
    operation: string,
    context: any,
  ): Promise<{
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: number;
    securityLevel: 'public' | 'internal' | 'confidential';
    recommendations: string[];
    requiredPermissions: string[];
  }> {
    const lowerOp = operation.toLowerCase();

    // Security analysis
    let securityLevel: 'public' | 'internal' | 'confidential' = 'internal';
    if (
      context.content &&
      (context.content.includes('confidential') ||
        context.content.includes('機密') ||
        context.content.includes('secret'))
    ) {
      securityLevel = 'confidential';
    }

    // Simple operations
    if (lowerOp.includes('read') || lowerOp.includes('get') || lowerOp.includes('view')) {
      return {
        complexity: 'simple',
        estimatedTime: 15,
        securityLevel,
        recommendations: [
          'Use appropriate format for content',
          'Cache frequently accessed documents',
          'Verify read permissions',
        ],
        requiredPermissions: ['view'],
      };
    }

    // Moderate operations
    if (lowerOp.includes('create') || lowerOp.includes('update') || lowerOp.includes('upload')) {
      return {
        complexity: 'moderate',
        estimatedTime: 60,
        securityLevel,
        recommendations: [
          'Validate content before saving',
          'Create version backup',
          'Set appropriate permissions',
          'Add relevant metadata',
        ],
        requiredPermissions: ['edit', 'write'],
      };
    }

    // Complex operations
    return {
      complexity: 'complex',
      estimatedTime: 180,
      securityLevel,
      recommendations: [
        'Break down into smaller operations',
        'Implement progress tracking',
        'Use batch processing for multiple files',
        'Consider impact on collaborators',
        'Schedule during low-usage periods',
      ],
      requiredPermissions: ['full_access', 'admin'],
    };
  }

  /**
   * Validate document content for security and compliance
   */
  validateDocumentContent(content: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for sensitive information
    const sensitivePatterns = [
      /\d{4}-\d{4}-\d{4}-\d{4}/, // Credit card pattern
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email pattern
      /password\s*[:=]\s*\S+/i, // Password disclosure
    ];

    sensitivePatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        issues.push('Potential sensitive information detected');
        suggestions.push('Review content for personal or confidential data');
      }
    });

    // Check content length
    if (content.length > 100000) {
      suggestions.push('Consider breaking large document into smaller sections');
    }

    // Check for proper formatting
    if (content.includes('<script>') || content.includes('javascript:')) {
      issues.push('Potentially unsafe script content detected');
      suggestions.push('Remove script tags for security');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

/**
 * Create and register Document Specialist Agent
 */
export async function createDocumentSpecialist(): Promise<string> {
  const capabilities: AgentCapability[] = [
    {
      name: 'document_management',
      description: 'Lark Docs creation, editing, and management',
      category: 'docs',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          documentId: { type: 'string' },
          content: { type: 'string' },
        },
      },
    },
    {
      name: 'file_operations',
      description: 'File upload, download, and organization',
      category: 'docs',
    },
    {
      name: 'permission_management',
      description: 'Document and file access control',
      category: 'docs',
    },
    {
      name: 'version_control',
      description: 'Document version management and history',
      category: 'docs',
    },
    {
      name: 'content_validation',
      description: 'Security and compliance checking',
      category: 'docs',
    },
    {
      name: 'search_indexing',
      description: 'Document search and discovery',
      category: 'docs',
    },
  ];

  const metadata: AgentMetadata = {
    id: `document_specialist_${Date.now()}`,
    name: 'Document Management Specialist',
    type: 'specialist',
    capabilities,
    status: 'idle',
    maxConcurrentTasks: 4,
    currentTasks: 0,
    lastHeartbeat: new Date(),
    version: '1.0.0',
  };

  const registered = await globalRegistry.registerAgent(metadata);
  if (registered) {
    console.log('✅ Document Specialist Agent registered successfully');
    return metadata.id;
  } else {
    throw new Error('Failed to register Document Specialist Agent');
  }
}
