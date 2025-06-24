# Chat Agent System - API Reference

**Version**: 1.0.0  
**Target Audience**: Developers  
**Last Updated**: 2025-06-24

## 📋 Table of Contents

1. [Core Classes](#core-classes)
2. [MCP Tools](#mcp-tools)
3. [Interfaces & Types](#interfaces--types)
4. [HTTP Endpoints](#http-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Error Codes](#error-codes)
7. [Examples](#examples)

## 🏗️ Core Classes

### Agent

The main agent class that handles conversation processing and tool orchestration.

#### Constructor
```typescript
constructor(config: AgentConfig)
```

**Parameters:**
- `config: AgentConfig` - Agent configuration object

**Example:**
```typescript
const agent = new Agent({
  name: 'MyAgent',
  instructions: 'You are a helpful assistant',
  language: 'ja',
  temperature: 0.7
});
```

#### Methods

##### `processMessage(userMessage, context)`
Process a user message and return an agent response.

```typescript
async processMessage(
  userMessage: string,
  context: Partial<RunContext>
): Promise<AgentResult>
```

**Parameters:**
- `userMessage: string` - The user's input message
- `context: Partial<RunContext>` - Conversation context

**Returns:** `Promise<AgentResult>`

**Example:**
```typescript
const result = await agent.processMessage("Hello!", {
  chatId: "chat_123",
  userId: "user_456"
});

console.log(result.response); // "こんにちは！..."
console.log(result.success);  // true
```

##### `tools`
Access the agent's available tools.

```typescript
readonly tools: Map<string, AgentTool>
```

**Example:**
```typescript
// Check if tool is available
if (agent.tools.has('search_base_records')) {
  console.log('Base search tool is available');
}

// Get all tool names
const toolNames = Array.from(agent.tools.keys());
console.log('Available tools:', toolNames);
```

### AgentRunner

Static utility class for executing agents with different contexts.

#### Methods

##### `run(agent, userMessage, context)`
Execute an agent with basic context.

```typescript
static async run(
  agent: Agent,
  userMessage: string,
  context: Partial<RunContext> = {}
): Promise<AgentResult>
```

**Parameters:**
- `agent: Agent` - The agent instance to run
- `userMessage: string` - User's message
- `context: Partial<RunContext>` - Optional context

**Returns:** `Promise<AgentResult>`

**Example:**
```typescript
const result = await AgentRunner.run(
  agent, 
  "顧客データを検索して",
  { chatId: "chat_123" }
);
```

##### `runWithLarkClient(agent, userMessage, chatId, larkClient, userId?)`
Execute an agent with Lark client integration.

```typescript
static async runWithLarkClient(
  agent: Agent,
  userMessage: string,
  chatId: string,
  larkClient: any,
  userId?: string
): Promise<AgentResult>
```

**Parameters:**
- `agent: Agent` - The agent instance
- `userMessage: string` - User's message
- `chatId: string` - Lark chat ID
- `larkClient: any` - Lark API client
- `userId?: string` - Optional user ID

**Returns:** `Promise<AgentResult>`

**Example:**
```typescript
const result = await AgentRunner.runWithLarkClient(
  agent,
  "Send a message to the team",
  "oc_12345",
  larkClient,
  "ou_67890"
);
```

## 🛠️ MCP Tools

### system.agent.chat

Main conversational AI interface for Lark users.

#### Schema
```typescript
{
  user_message: string;        // User message to process
  chat_id: string;            // Lark chat ID
  user_id?: string;           // User ID for personalization
  conversation_id?: string;   // Conversation ID for context
  agent_name?: string;        // Specific agent to use (default: LarkAssistant)
  language?: 'en'|'ja'|'zh'; // Response language
  context?: Record<string, any>; // Additional context
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: string // Confirmation message
    }
  ]
}
```

#### Example
```json
{
  "user_message": "顧客テーブルから案件を検索して",
  "chat_id": "oc_12345",
  "user_id": "ou_67890",
  "language": "ja"
}
```

### system.agent.create

Create custom agent with specific instructions.

#### Schema
```typescript
{
  agent_name: string;         // Name for the new agent
  instructions: string;       // Agent instructions and behavior
  chat_id: string;           // Chat ID to send confirmation
  language?: 'en'|'ja'|'zh'; // Agent language
  tools?: string[];          // Tool names to include
  temperature?: number;      // Response creativity (0-2)
  system_prompt?: string;    // Custom system prompt
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: string // Agent creation confirmation
    }
  ]
}
```

#### Example
```json
{
  "agent_name": "SalesBot",
  "instructions": "営業専門のアシスタントとして動作してください",
  "chat_id": "oc_12345",
  "language": "ja",
  "temperature": 0.5
}
```

### system.agent.status

Check agent system status and available agents.

#### Schema
```typescript
{
  chat_id: string;           // Chat ID to send status to
  detailed?: boolean;        // Include detailed status information
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: string // Status report
    }
  ]
}
```

#### Example
```json
{
  "chat_id": "oc_12345",
  "detailed": true
}
```

### system.chat.message

Process user messages and generate intelligent responses (legacy).

#### Schema
```typescript
{
  user_message: string;                    // User message content
  chat_id: string;                        // Chat ID to send response to
  user_id?: string;                       // User ID for personalization
  message_type?: 'text'|'command'|'question'|'request'; // Message type
  context?: Record<string, any>;          // Additional context
}
```

### system.chat.command

Process and execute user commands.

#### Schema
```typescript
{
  command: string;           // Command to execute
  args?: string[];          // Command arguments
  chat_id: string;          // Chat ID to send response to
  user_id?: string;         // User ID for authorization
}
```

### system.chat.context

Manage conversation context and history.

#### Schema
```typescript
{
  action: 'save'|'retrieve'|'clear'; // Context action
  chat_id: string;                   // Chat ID
  user_id?: string;                  // User ID
  context_data?: Record<string, any>; // Context data to save
  key?: string;                      // Specific context key to retrieve
}
```

## 📄 Interfaces & Types

### AgentConfig
```typescript
interface AgentConfig {
  name: string;                    // Agent name
  instructions: string;            // Agent behavior instructions
  tools?: AgentTool[];            // Available tools
  model?: string;                 // AI model to use
  temperature?: number;           // Response creativity (0-2)
  maxTokens?: number;            // Maximum response tokens
  systemPrompt?: string;         // System prompt override
  language?: 'en' | 'ja' | 'zh'; // Primary language
}
```

### AgentTool
```typescript
interface AgentTool {
  name: string;                           // Tool identifier
  description: string;                    // Tool description
  execute: (params: any) => Promise<any>; // Execution function
  schema?: any;                          // Parameter schema
}
```

### RunContext
```typescript
interface RunContext {
  agent: Agent;                          // Agent instance
  conversationId: string;                // Conversation identifier
  userId?: string;                       // User identifier
  chatId: string;                        // Chat identifier
  history: ConversationMessage[];        // Message history
  metadata: Record<string, any>;         // Additional metadata
}
```

### ConversationMessage
```typescript
interface ConversationMessage {
  id: string;                           // Message identifier
  role: 'user' | 'assistant' | 'system' | 'tool'; // Message role
  content: string;                      // Message content
  timestamp: Date;                      // Message timestamp
  toolCalls?: ToolCall[];              // Associated tool calls
  metadata?: Record<string, any>;      // Message metadata
}
```

### ToolCall
```typescript
interface ToolCall {
  id: string;        // Call identifier
  name: string;      // Tool name
  arguments: any;    // Tool arguments
  result?: any;      // Tool result
  error?: string;    // Error message if failed
}
```

### AgentResult
```typescript
interface AgentResult {
  success: boolean;        // Whether the operation succeeded
  response: string;        // Generated response text
  toolCalls?: ToolCall[];  // Tools that were called
  context: RunContext;     // Updated context
  usage?: {               // Token usage information
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;         // Error message if failed
}
```

### ResponseStrategy
```typescript
interface ResponseStrategy {
  type: 'command' | 'task' | 'question' | 'conversation'; // Strategy type
  intent: string;           // Detected intent
  confidence: number;       // Confidence score (0-1)
  toolsRequired: string[];  // Required tools
}
```

## 🌐 HTTP Endpoints

### POST /chat
Process a chat message through the agent system.

#### Request
```typescript
{
  message: string;           // User message
  chatId: string;           // Chat identifier
  userId?: string;          // User identifier
  agentName?: string;       // Specific agent to use
  language?: string;        // Response language
  context?: any;           // Additional context
}
```

#### Response
```typescript
{
  success: boolean;         // Operation success
  response: string;         // Agent response
  conversationId: string;   // Conversation identifier
  toolCalls?: ToolCall[];   // Tools that were executed
  usage?: TokenUsage;       // Token usage information
  error?: string;          // Error message if failed
}
```

#### Example
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "顧客データを検索して",
    "chatId": "chat_123",
    "userId": "user_456",
    "language": "ja"
  }'
```

### GET /agents
List available agents.

#### Response
```typescript
{
  agents: {
    name: string;
    instructions: string;
    language: string;
    toolCount: number;
    conversationCount: number;
  }[]
}
```

### POST /agents
Create a new agent.

#### Request
```typescript
{
  name: string;             // Agent name
  instructions: string;     // Agent instructions
  language?: string;        // Primary language
  temperature?: number;     // Response creativity
  tools?: string[];        // Available tools
}
```

#### Response
```typescript
{
  success: boolean;
  agent: {
    name: string;
    instructions: string;
    language: string;
    toolCount: number;
  };
  error?: string;
}
```

### GET /agents/:name/status
Get status of a specific agent.

#### Response
```typescript
{
  name: string;
  status: 'active' | 'idle';
  conversationCount: number;
  lastActivity: string;     // ISO timestamp
  toolCount: number;
  tools: string[];
}
```

## ⚡ WebSocket Events

### Connection
```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_auth_token'
}));
```

### Events

#### `message`
Real-time chat message processing.

```typescript
// Send message
ws.send(JSON.stringify({
  type: 'message',
  data: {
    message: 'Hello',
    chatId: 'chat_123',
    userId: 'user_456'
  }
}));

// Receive response
{
  type: 'response',
  data: {
    response: 'こんにちは！',
    conversationId: 'conv_789',
    toolCalls: []
  }
}
```

#### `typing`
Typing indicators during processing.

```typescript
// Receive typing indicator
{
  type: 'typing',
  data: {
    chatId: 'chat_123',
    isTyping: true
  }
}
```

#### `tool_execution`
Real-time tool execution updates.

```typescript
{
  type: 'tool_execution',
  data: {
    toolName: 'search_base_records',
    status: 'executing' | 'completed' | 'failed',
    result?: any,
    error?: string
  }
}
```

## 🚨 Error Codes

### Agent Errors
- `AGENT_001`: Agent not found
- `AGENT_002`: Invalid agent configuration
- `AGENT_003`: Agent initialization failed
- `AGENT_004`: Tool execution timeout

### Authentication Errors
- `AUTH_001`: Invalid authentication token
- `AUTH_002`: Insufficient permissions
- `AUTH_003`: Token expired

### Tool Errors
- `TOOL_001`: Tool not available
- `TOOL_002`: Invalid tool parameters
- `TOOL_003`: Tool execution failed
- `TOOL_004`: Tool timeout

### Lark API Errors
- `LARK_001`: Invalid app credentials
- `LARK_002`: API rate limit exceeded
- `LARK_003`: Chat not found
- `LARK_004`: User not found

### System Errors
- `SYS_001`: Internal server error
- `SYS_002`: Database connection failed
- `SYS_003`: Memory limit exceeded

## 📝 Examples

### Basic Agent Usage
```typescript
import { Agent, AgentRunner } from '@larksuiteoapi/lark-mcp';

// Create agent
const agent = new Agent({
  name: 'MyBot',
  instructions: 'You are a helpful assistant',
  language: 'ja'
});

// Process message
const result = await AgentRunner.run(agent, '顧客データを検索', {
  chatId: 'chat_123'
});

console.log(result.response); // Formatted response
```

### Custom Tool Integration
```typescript
// Add custom tool to agent
agent.tools.set('custom_tool', {
  name: 'custom_tool',
  description: 'Custom business logic tool',
  execute: async (params) => {
    // Custom implementation
    return { result: 'success' };
  }
});
```

### Error Handling
```typescript
try {
  const result = await AgentRunner.run(agent, message, context);
  
  if (result.success) {
    console.log('Response:', result.response);
  } else {
    console.error('Agent error:', result.error);
  }
} catch (error) {
  console.error('System error:', error.message);
}
```

### Multiple Tool Execution
```typescript
// Message that triggers multiple tools
const result = await AgentRunner.run(agent, 
  '田中さんに会議の件でメッセージを送って', 
  context
);

// Check which tools were called
result.toolCalls?.forEach(call => {
  console.log(`Tool: ${call.name}, Status: ${call.error ? 'Failed' : 'Success'}`);
});
```

### Conversation Context Management
```typescript
// Start conversation
let context = { chatId: 'chat_123', conversationId: 'conv_456' };

// First message
const result1 = await AgentRunner.run(agent, '顧客データを検索', context);

// Continue conversation with updated context
context = result1.context;
const result2 = await AgentRunner.run(agent, 'もっと詳しく教えて', context);
```

### Agent Configuration
```typescript
// Production agent with specific settings
const productionAgent = new Agent({
  name: 'ProductionBot',
  instructions: '丁寧で正確な回答を提供してください',
  language: 'ja',
  temperature: 0.3,      // More conservative
  maxTokens: 1000,       // Limit response length
  systemPrompt: 'システムプロンプト'
});
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-06-24  
**Next**: See `docs/DEPLOYMENT_GUIDE.md` for deployment instructions.