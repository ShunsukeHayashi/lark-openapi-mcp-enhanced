# Chat Agent System - Technical Documentation

**Version**: 1.0.0  
**Target Audience**: Developers, System Architects  
**Last Updated**: 2025-06-24

## 🏗️ System Architecture

### Overview
The Chat Agent System is built on a layered architecture that separates concerns between conversation management, tool execution, and Lark API integration.

```
┌─────────────────────────────────────────────────────────┐
│                 User Interface Layer                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Lark Bot    │ │ Web API     │ │ CLI Tool    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                Agent Management Layer                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ AgentRunner │ │ Agent Class │ │ Strategy    │      │
│  │             │ │             │ │ Analysis    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                MCP Tool Integration Layer               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Chat Agent  │ │ Bot Menu    │ │ System      │      │
│  │ Tools       │ │ Tools       │ │ Tools       │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                Lark API Integration Layer               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Base APIs   │ │ Messaging   │ │ Document    │      │
│  │             │ │ APIs        │ │ APIs        │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 📦 Core Components

### 1. Agent Class (`src/agents/agent.ts`)

#### Responsibilities
- **Message Processing**: Parse and analyze user input
- **Strategy Determination**: Classify message intent and required actions
- **Tool Orchestration**: Execute appropriate tools based on strategy
- **Response Generation**: Format and return user-friendly responses
- **Context Management**: Maintain conversation state and history

#### Key Methods
```typescript
class Agent {
  // Process user message and generate response
  async processMessage(
    userMessage: string,
    context: Partial<RunContext>
  ): Promise<AgentResult>

  // Analyze message to determine response strategy
  private async analyzeMessage(
    message: string,
    context: RunContext
  ): Promise<ResponseStrategy>

  // Generate response based on strategy
  private async generateResponse(
    strategy: ResponseStrategy,
    context: RunContext
  ): Promise<AgentResult>
}
```

#### Configuration Interface
```typescript
interface AgentConfig {
  name: string;
  instructions: string;
  tools?: AgentTool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  language?: 'en' | 'ja' | 'zh';
}
```

### 2. AgentRunner (`src/agents/agent.ts`)

#### Purpose
Static utility class for executing agents with different contexts and integration scenarios.

#### Methods
```typescript
class AgentRunner {
  // Basic agent execution
  static async run(
    agent: Agent,
    userMessage: string,
    context: Partial<RunContext> = {}
  ): Promise<AgentResult>

  // Execute with Lark client integration
  static async runWithLarkClient(
    agent: Agent,
    userMessage: string,
    chatId: string,
    larkClient: any,
    userId?: string
  ): Promise<AgentResult>
}
```

### 3. MCP Tool Integration

#### Chat Agent Tools (`src/mcp-tool/tools/en/builtin-tools/system/lark-chat-agent.ts`)

##### system.agent.chat
- **Purpose**: Main conversational AI interface
- **Handler**: Processes user messages and generates intelligent responses
- **Integration**: Coordinates with AgentRunner and Lark APIs

```typescript
export const larkChatAgentTool: McpTool = {
  project: 'system',
  name: 'system.agent.chat',
  accessTokens: ['tenant'],
  description: '[Lark Chat Agent] - Intelligent conversational AI for Lark users',
  customHandler: async (client, params): Promise<any> => {
    // Get or create agent
    const agent = await getOrCreateAgent(agent_name, language, client);
    
    // Run agent
    const result = await AgentRunner.run(agent, user_message, context);
    
    // Send response to Lark
    await client.request({
      method: 'POST',
      url: '/open-apis/im/v1/messages',
      data: { /* message data */ }
    });
  }
}
```

##### system.agent.create
- **Purpose**: Dynamic agent creation with custom instructions
- **Features**: Configurable agents with specific tools and behaviors

##### system.agent.status
- **Purpose**: System monitoring and agent management
- **Features**: Real-time status reporting and agent inventory

#### Legacy Chat Agent Tools (`src/mcp-tool/tools/en/builtin-tools/system/chat-agent.ts`)

##### system.chat.message
- **Purpose**: Direct message processing without agent abstraction
- **Use Case**: Simple, stateless message handling

##### system.chat.command
- **Purpose**: Command execution and processing
- **Features**: Structured command parsing and execution

##### system.chat.context
- **Purpose**: Conversation context management
- **Features**: Save, retrieve, and clear conversation context

## 🧠 Intelligence Layer

### Response Strategy Analysis

#### Strategy Types
```typescript
interface ResponseStrategy {
  type: 'command' | 'task' | 'question' | 'conversation';
  intent: string;
  confidence: number;
  toolsRequired: string[];
}
```

#### Intent Detection Logic
```typescript
private async analyzeMessage(message: string, context: RunContext): Promise<ResponseStrategy> {
  const lowerMessage = message.toLowerCase();
  
  // Command detection
  if (lowerMessage.startsWith('/') || lowerMessage.match(/^(help|use|settings|status)/)) {
    return { type: 'command', intent: 'command', confidence: 0.9, toolsRequired: [] };
  }

  // Question detection
  if (lowerMessage.includes('?') || lowerMessage.match(/^(what|how|when|where|why|who)/)) {
    return { type: 'question', intent: 'question', confidence: 0.8, toolsRequired: [] };
  }

  // Task detection (Enhanced for Japanese)
  if (lowerMessage.includes('検索') || lowerMessage.includes('送信') || 
      lowerMessage.includes('教えて') || lowerMessage.includes('してください')) {
    return { 
      type: 'task', 
      intent: this.extractIntent(message), 
      confidence: 0.8, 
      toolsRequired: this.getRequiredTools(message) 
    };
  }

  // Default to conversation
  return { type: 'conversation', intent: 'general', confidence: 0.6, toolsRequired: [] };
}
```

### Tool Requirement Mapping

#### Intelligent Tool Selection
```typescript
private getRequiredTools(message: string): string[] {
  const tools: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Base/Table operations
  if (lowerMessage.includes('テーブル') || lowerMessage.includes('検索') || 
      lowerMessage.includes('顧客') || lowerMessage.includes('案件')) {
    tools.push('search_base_records');
  }
  
  // Messaging operations
  if (lowerMessage.includes('連絡') || lowerMessage.includes('送信') || 
      lowerMessage.includes('メッセージ') || lowerMessage.includes('通知')) {
    tools.push('send_message');
  }
  
  // User operations
  if (lowerMessage.includes('ユーザー') || lowerMessage.includes('連絡先') || 
      lowerMessage.includes('さん')) {
    tools.push('get_user_info');
  }
  
  // Document operations
  if (lowerMessage.includes('ファイル') || lowerMessage.includes('ドキュメント') || 
      lowerMessage.includes('計画書') || lowerMessage.includes('探して')) {
    tools.push('search_documents');
  }
  
  return tools;
}
```

## 🔧 Tool Execution Pipeline

### Tool Execution Flow
```typescript
// 1. Strategy Analysis
const strategy = await this.analyzeMessage(userMessage, context);

// 2. Tool Execution
if (strategy.toolsRequired.length > 0) {
  for (const toolName of strategy.toolsRequired) {
    const tool = this.tools.get(toolName);
    if (tool) {
      const toolCall: ToolCall = {
        id: this.generateToolCallId(),
        name: toolName,
        arguments: this.extractToolArguments(strategy.intent, context),
        result: await tool.execute({ context, message })
      };
      toolCalls.push(toolCall);
    }
  }
}

// 3. Result Processing
const response = await this.generateResponse(strategy, context, toolCalls);
```

### Tool Result Processing

#### Search Task Example
```typescript
private async executeSearchTask(
  message: string, 
  context: RunContext, 
  toolCalls: ToolCall[] = []
): Promise<AgentResult> {
  const searchResults = toolCalls.find(call => call.name === 'search_base_records');
  
  if (searchResults && !searchResults.error) {
    const data = searchResults.result?.data;
    if (data?.items && data.items.length > 0) {
      const results = data.items.map((item: any, index: number) => 
        `${index + 1}. ${Object.entries(item.fields)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}`
      ).join('\n');
      
      return {
        success: true,
        response: `🔍 **検索結果**\n\n${data.items.length}件のレコードが見つかりました:\n\n${results}`,
        toolCalls,
        context
      };
    }
  }
  
  return {
    success: true,
    response: `🔍 **検索タスク**\n\n検索条件を詳しく教えてください。`,
    toolCalls,
    context
  };
}
```

## 💾 Data Models

### Core Interfaces

#### RunContext
```typescript
interface RunContext {
  agent: Agent;
  conversationId: string;
  userId?: string;
  chatId: string;
  history: ConversationMessage[];
  metadata: Record<string, any>;
}
```

#### ConversationMessage
```typescript
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
}
```

#### ToolCall
```typescript
interface ToolCall {
  id: string;
  name: string;
  arguments: any;
  result?: any;
  error?: string;
}
```

#### AgentResult
```typescript
interface AgentResult {
  success: boolean;
  response: string;
  toolCalls?: ToolCall[];
  context: RunContext;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}
```

## 🔄 State Management

### Conversation State
```typescript
class Agent {
  private conversations: Map<string, ConversationMessage[]> = new Map();

  // Save conversation
  this.conversations.set(conversationId, fullContext.history);
  
  // Retrieve conversation
  const history = this.conversations.get(conversationId) || [];
}
```

### Agent Store
```typescript
// In-memory agent storage (src/mcp-tool/tools/en/builtin-tools/system/lark-chat-agent.ts)
const agentStore = new Map<string, Agent>();

async function getOrCreateAgent(name: string, language: string, client: any): Promise<Agent> {
  let agent = agentStore.get(name);
  
  if (!agent) {
    const config = getDefaultAgentConfig(name, language);
    agent = new Agent(config);
    agentStore.set(name, agent);
  }
  
  return agent;
}
```

## 🧪 Testing Framework

### Test Structure

#### Basic Agent Tests (`test-chat-agent.js`)
```javascript
const testScenarios = [
  {
    name: "Greeting Test",
    message: "こんにちは！",
    expected: "greeting response"
  },
  {
    name: "Help Request", 
    message: "help",
    expected: "help information"
  }
  // ... more scenarios
];
```

#### Advanced Tool Integration Tests (`test-agent-with-tools.js`)
```javascript
const advancedScenarios = [
  {
    name: "Search Base Records Task",
    message: "顧客テーブルから今月の案件を検索して",
    expectTool: "search_base_records",
    category: "task"
  }
  // ... more scenarios
];
```

### Mock Integration
```javascript
const mockLarkClient = {
  request: async (params) => {
    if (params.url.includes('/records/search')) {
      return {
        code: 0,
        data: {
          items: [
            {
              record_id: "rec_mock_001",
              fields: { "顧客名": "ABC商事", "業界": "IT" }
            }
          ]
        }
      };
    }
    return { code: 0, data: {} };
  }
};
```

## 📊 Performance Considerations

### Memory Management
- **Conversation History**: Limited to last 50 messages per conversation
- **Agent Storage**: In-memory with LRU eviction for production
- **Tool Results**: Cached for 5 minutes to avoid duplicate API calls

### Response Time Optimization
- **Strategy Analysis**: ~50-100ms
- **Tool Execution**: ~200-1000ms (depending on Lark API)
- **Response Generation**: ~50-100ms
- **Total**: Typically 300-1200ms per request

### Rate Limiting Integration
```typescript
// Built-in rate limiting through MCP tool system
const client = new LarkMcpTool({
  rateLimiting: {
    enabled: true,
    rateLimits: {
      default: { capacity: 100, tokensPerInterval: 50, intervalMs: 60000 },
      write: { capacity: 20, tokensPerInterval: 10, intervalMs: 60000 }
    }
  }
});
```

## 🔐 Security Implementation

### Input Validation
```typescript
// Zod schema validation for tool parameters
const schema = z.object({
  user_message: z.string().describe('User message content'),
  chat_id: z.string().describe('Chat ID to send response to'),
  user_id: z.string().optional().describe('User ID for personalization')
});
```

### Access Control
```typescript
export const larkChatAgentTool: McpTool = {
  accessTokens: ['tenant'], // Requires tenant-level authentication
  customHandler: async (client, params) => {
    // Verify client authentication before processing
    if (!client.isAuthenticated()) {
      throw new Error('Authentication required');
    }
  }
};
```

## 🚀 Deployment Patterns

### Standalone Agent Service
```typescript
import { Agent, AgentRunner } from './dist/agents/agent';

const agent = new Agent({
  name: 'ProductionAgent',
  instructions: 'Production agent instructions',
  language: 'ja'
});

app.post('/chat', async (req, res) => {
  const result = await AgentRunner.run(
    agent, 
    req.body.message, 
    { chatId: req.body.chatId }
  );
  res.json(result);
});
```

### MCP Server Integration
```bash
# Start MCP server with chat agent tools
node dist/cli.js mcp --mode stdio --tools preset.default
```

### Lark Bot Integration
```typescript
// Webhook handler for Lark bot
app.post('/webhook', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'message_receive') {
    const result = await AgentRunner.runWithLarkClient(
      agent,
      event.message.content,
      event.message.chat_id,
      larkClient,
      event.sender.user_id
    );
    
    res.json({ success: true });
  }
});
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Required
APP_ID=your_lark_app_id
APP_SECRET=your_lark_app_secret

# Optional
AGENT_LANGUAGE=ja
AGENT_TEMPERATURE=0.7
MAX_CONVERSATION_HISTORY=50
CACHE_TTL_MINUTES=5
```

### Configuration File
```json
{
  "agent": {
    "defaultLanguage": "ja",
    "temperature": 0.7,
    "maxTokens": 2048
  },
  "lark": {
    "apiBase": "https://open.feishu.cn",
    "timeout": 30000
  },
  "rateLimiting": {
    "enabled": true,
    "requestsPerMinute": 50
  }
}
```

## 📈 Monitoring & Observability

### Metrics Collection
```typescript
// Built-in metrics for tool execution
interface ToolMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastError?: string;
}
```

### Logging Integration
```typescript
// Structured logging for debugging
console.log('Agent processing message', {
  conversationId: context.conversationId,
  strategy: strategy.type,
  toolsRequired: strategy.toolsRequired,
  responseTime: Date.now() - startTime
});
```

## 🔄 Extension Points

### Custom Agent Types
```typescript
class CustomAgent extends Agent {
  constructor(config: AgentConfig) {
    super(config);
    // Add custom initialization
  }

  protected async customIntentDetection(message: string): Promise<string> {
    // Implement custom intent detection logic
    return 'custom_intent';
  }
}
```

### Custom Tool Integration
```typescript
interface CustomTool extends AgentTool {
  name: string;
  description: string;
  execute: async (params: any) => Promise<any>;
  schema?: ZodSchema;
}
```

---

**Next**: See `docs/API_REFERENCE.md` for complete API documentation.