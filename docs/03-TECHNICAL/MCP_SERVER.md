# MCP Server Technical Documentation / MCPサーバー技術ドキュメント

## 🌐 Language / 言語

[English](#english) | [日本語](#japanese)

---

## English

### MCP Server Overview

The Model Context Protocol (MCP) server is a critical component that enables Claude Desktop to interact with the Lark OpenAPI system. It provides a standardized interface for tool registration, execution, and context management.

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Claude Desktop                      │
├─────────────────────────────────────────────────┤
│  MCP Client (Built-in)                          │
│  • JSON-RPC 2.0 Protocol                        │
│  • Tool Discovery                               │
│  • Context Management                           │
└────────────────┬───────────────────────────────┘
                 │ stdio/SSE
                 ▼
┌─────────────────────────────────────────────────┐
│              MCP Server                          │
├─────────────────────────────────────────────────┤
│  Transport Layer                                │
│  ├─ STDIO Server (stdio.ts)                    │
│  └─ SSE Server (sse.ts)                        │
├─────────────────────────────────────────────────┤
│  Core Services                                  │
│  ├─ Tool Registry                              │
│  ├─ Request Handler                            │
│  └─ Response Formatter                         │
├─────────────────────────────────────────────────┤
│  Tool Implementations                           │
│  ├─ Lark API Tools (200+ endpoints)            │
│  ├─ Document Tools                             │
│  └─ System Tools                               │
└─────────────────────────────────────────────────┘
```

### Communication Protocol

#### 1. JSON-RPC 2.0 over STDIO

```typescript
// Request Structure
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

// Response Structure
interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

#### 2. Method Types

**Core Methods:**
- `initialize`: Server initialization
- `tools/list`: List available tools
- `tools/call`: Execute a tool
- `completion/complete`: Autocomplete support

**Example Tool Registration:**
```typescript
{
  "name": "bitable__createBase",
  "description": "Create a new Lark Base",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Base name"
      },
      "folder_token": {
        "type": "string",
        "description": "Parent folder token"
      }
    },
    "required": ["name"]
  }
}
```

### Server Implementation

#### 1. STDIO Server (`stdio.ts`)

```typescript
export class StdioServer {
  private tools: Map<string, Tool>;
  private transport: StdioTransport;

  async start() {
    // Initialize transport
    this.transport = new StdioTransport();
    
    // Register handlers
    this.transport.on('request', this.handleRequest);
    
    // Start listening
    await this.transport.listen();
  }

  private async handleRequest(request: MCPRequest) {
    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'tools/list':
        return this.handleToolsList(request);
      case 'tools/call':
        return this.handleToolCall(request);
      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
  }
}
```

#### 2. SSE Server (`sse.ts`)

```typescript
export class SSEServer {
  private app: Express;
  private clients: Map<string, Response>;

  async start(port: number) {
    this.app = express();
    
    // SSE endpoint
    this.app.get('/events', (req, res) => {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // Register client
      const clientId = generateId();
      this.clients.set(clientId, res);
      
      // Send initial data
      this.sendEvent(clientId, 'connected', { id: clientId });
    });
    
    this.app.listen(port);
  }

  sendEvent(clientId: string, event: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
}
```

### Tool Management

#### 1. Tool Registration Process

```typescript
// Tool Definition
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
}

// Registration
class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    // Validate tool definition
    this.validateTool(tool);
    
    // Register in map
    this.tools.set(tool.name, tool);
    
    // Log registration
    logger.info(`Registered tool: ${tool.name}`);
  }

  async execute(name: string, params: any) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    // Validate parameters
    await this.validateParams(tool.inputSchema, params);
    
    // Execute handler
    return await tool.handler(params);
  }
}
```

#### 2. Tool Categories

**Lark API Tools:**
- Base/Bitable operations
- Document management
- Chat and messaging
- Calendar integration
- Approval workflows

**System Tools:**
- File operations
- Database queries
- Cache management
- Configuration updates

**Utility Tools:**
- Data transformation
- Validation helpers
- Format converters
- Search functions

### Error Handling

```typescript
class MCPError extends Error {
  code: number;
  data?: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// Error Codes
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // Custom codes
  TOOL_NOT_FOUND: -32001,
  VALIDATION_ERROR: -32002,
  EXECUTION_ERROR: -32003,
  RATE_LIMIT_ERROR: -32004
};
```

### Performance Optimization

#### 1. Connection Pooling
```typescript
class ConnectionPool {
  private pool: Connection[] = [];
  private maxSize = 10;
  
  async getConnection(): Promise<Connection> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createConnection();
  }
  
  releaseConnection(conn: Connection) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(conn);
    } else {
      conn.close();
    }
  }
}
```

#### 2. Request Batching
```typescript
class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timeout: NodeJS.Timeout;
  
  add(request: BatchRequest) {
    this.queue.push(request);
    this.scheduleBatch();
  }
  
  private scheduleBatch() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.processBatch();
    }, 50); // 50ms delay
  }
  
  private async processBatch() {
    const batch = this.queue.splice(0);
    const results = await this.executeBatch(batch);
    batch.forEach((req, i) => {
      req.resolve(results[i]);
    });
  }
}
```

### Security Considerations

1. **Input Validation**
   - Schema validation for all inputs
   - Parameter sanitization
   - Type checking

2. **Authentication**
   - Token validation
   - Permission checking
   - Rate limiting per client

3. **Error Handling**
   - No sensitive data in errors
   - Proper error codes
   - Logging without secrets

---

## Japanese

### MCPサーバー概要

Model Context Protocol（MCP）サーバーは、Claude DesktopがLark OpenAPIシステムと対話できるようにする重要なコンポーネントです。ツールの登録、実行、コンテキスト管理のための標準化されたインターフェースを提供します。

### アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│              Claude Desktop                      │
├─────────────────────────────────────────────────┤
│  MCPクライアント（組み込み）                      │
│  • JSON-RPC 2.0 プロトコル                      │
│  • ツール検出                                   │
│  • コンテキスト管理                             │
└────────────────┬───────────────────────────────┘
                 │ stdio/SSE
                 ▼
┌─────────────────────────────────────────────────┐
│              MCPサーバー                         │
├─────────────────────────────────────────────────┤
│  トランスポート層                                │
│  ├─ STDIOサーバー (stdio.ts)                   │
│  └─ SSEサーバー (sse.ts)                       │
├─────────────────────────────────────────────────┤
│  コアサービス                                   │
│  ├─ ツールレジストリ                           │
│  ├─ リクエストハンドラー                       │
│  └─ レスポンスフォーマッター                   │
├─────────────────────────────────────────────────┤
│  ツール実装                                     │
│  ├─ Lark APIツール（200以上のエンドポイント）    │
│  ├─ ドキュメントツール                         │
│  └─ システムツール                             │
└─────────────────────────────────────────────────┘
```

### 通信プロトコル

#### 1. STDIO経由のJSON-RPC 2.0

```typescript
// リクエスト構造
interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

// レスポンス構造
interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

#### 2. メソッドタイプ

**コアメソッド:**
- `initialize`: サーバー初期化
- `tools/list`: 利用可能なツールのリスト
- `tools/call`: ツールの実行
- `completion/complete`: オートコンプリートサポート

**ツール登録例:**
```typescript
{
  "name": "bitable__createBase",
  "description": "新しいLark Baseを作成",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Base名"
      },
      "folder_token": {
        "type": "string",
        "description": "親フォルダトークン"
      }
    },
    "required": ["name"]
  }
}
```

### サーバー実装

#### 1. STDIOサーバー (`stdio.ts`)

```typescript
export class StdioServer {
  private tools: Map<string, Tool>;
  private transport: StdioTransport;

  async start() {
    // トランスポート初期化
    this.transport = new StdioTransport();
    
    // ハンドラー登録
    this.transport.on('request', this.handleRequest);
    
    // リスニング開始
    await this.transport.listen();
  }

  private async handleRequest(request: MCPRequest) {
    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'tools/list':
        return this.handleToolsList(request);
      case 'tools/call':
        return this.handleToolCall(request);
      default:
        throw new Error(`不明なメソッド: ${request.method}`);
    }
  }
}
```

#### 2. SSEサーバー (`sse.ts`)

```typescript
export class SSEServer {
  private app: Express;
  private clients: Map<string, Response>;

  async start(port: number) {
    this.app = express();
    
    // SSEエンドポイント
    this.app.get('/events', (req, res) => {
      // SSEヘッダー設定
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // クライアント登録
      const clientId = generateId();
      this.clients.set(clientId, res);
      
      // 初期データ送信
      this.sendEvent(clientId, 'connected', { id: clientId });
    });
    
    this.app.listen(port);
  }

  sendEvent(clientId: string, event: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
}
```

### ツール管理

#### 1. ツール登録プロセス

```typescript
// ツール定義
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: ToolHandler;
}

// 登録
class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    // ツール定義の検証
    this.validateTool(tool);
    
    // マップに登録
    this.tools.set(tool.name, tool);
    
    // 登録をログ
    logger.info(`ツール登録: ${tool.name}`);
  }

  async execute(name: string, params: any) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`ツールが見つかりません: ${name}`);
    }
    
    // パラメータ検証
    await this.validateParams(tool.inputSchema, params);
    
    // ハンドラー実行
    return await tool.handler(params);
  }
}
```

#### 2. ツールカテゴリ

**Lark APIツール:**
- Base/Bitable操作
- ドキュメント管理
- チャットとメッセージング
- カレンダー統合
- 承認ワークフロー

**システムツール:**
- ファイル操作
- データベースクエリ
- キャッシュ管理
- 設定更新

**ユーティリティツール:**
- データ変換
- 検証ヘルパー
- フォーマット変換
- 検索機能

### エラー処理

```typescript
class MCPError extends Error {
  code: number;
  data?: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// エラーコード
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // カスタムコード
  TOOL_NOT_FOUND: -32001,
  VALIDATION_ERROR: -32002,
  EXECUTION_ERROR: -32003,
  RATE_LIMIT_ERROR: -32004
};
```

### パフォーマンス最適化

#### 1. コネクションプーリング
```typescript
class ConnectionPool {
  private pool: Connection[] = [];
  private maxSize = 10;
  
  async getConnection(): Promise<Connection> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createConnection();
  }
  
  releaseConnection(conn: Connection) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(conn);
    } else {
      conn.close();
    }
  }
}
```

#### 2. リクエストバッチング
```typescript
class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timeout: NodeJS.Timeout;
  
  add(request: BatchRequest) {
    this.queue.push(request);
    this.scheduleBatch();
  }
  
  private scheduleBatch() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.processBatch();
    }, 50); // 50ms遅延
  }
  
  private async processBatch() {
    const batch = this.queue.splice(0);
    const results = await this.executeBatch(batch);
    batch.forEach((req, i) => {
      req.resolve(results[i]);
    });
  }
}
```

### セキュリティ考慮事項

1. **入力検証**
   - すべての入力のスキーマ検証
   - パラメータのサニタイズ
   - 型チェック

2. **認証**
   - トークン検証
   - 権限チェック
   - クライアント毎のレート制限

3. **エラー処理**
   - エラーに機密データを含めない
   - 適切なエラーコード
   - シークレットを含まないログ

---

## 🔗 Related Documentation / 関連ドキュメント

- [Architecture](../01-OVERVIEW/ARCHITECTURE.md) - System architecture
- [API Reference](API_REFERENCE.md) - API documentation
- [Chat Agent Technical](CHAT_AGENT_TECHNICAL.md) - Chat agent details

---

Last Updated: 2025-01-24