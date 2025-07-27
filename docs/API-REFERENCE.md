# Lark OpenAPI MCP Tool API Reference

## Table of Contents

1. [Overview](#overview)
2. [LarkMcpTool Class](#larkmcptool-class)
3. [Authentication](#authentication)
4. [Tool Execution](#tool-execution)
5. [Built-in Tools](#built-in-tools)
6. [Rate Limiting](#rate-limiting)
7. [Error Handling](#error-handling)
8. [Response Formats](#response-formats)

## Overview

The Lark OpenAPI MCP Tool provides a TypeScript/JavaScript interface for interacting with Feishu/Lark APIs through the Model Context Protocol (MCP). It supports both auto-generated tools from OpenAPI specifications and custom built-in tools.

## LarkMcpTool Class

The main entry point for using the MCP tools programmatically.

### Constructor

```typescript
new LarkMcpTool(config: LarkMcpToolConfig)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `LarkMcpToolConfig` | Yes | Configuration object |

#### LarkMcpToolConfig

```typescript
interface LarkMcpToolConfig {
  appId: string;                    // Feishu/Lark App ID
  appSecret: string;                // Feishu/Lark App Secret
  domain?: string;                  // API domain (default: https://open.feishu.cn)
  userAccessToken?: string;         // Optional user access token
  rateLimiting?: RateLimitConfig;   // Rate limiting configuration
}
```

### Example

```typescript
import { LarkMcpTool } from '@larksuiteoapi/lark-mcp';

const client = new LarkMcpTool({
  appId: 'cli_xxxxx',
  appSecret: 'secret_xxxxx',
  domain: 'https://open.larksuite.com',
  rateLimiting: {
    enabled: true,
    rateLimits: {
      default: { capacity: 100, tokensPerInterval: 50, intervalMs: 60000 }
    }
  }
});
```

## Authentication

### Tenant Access Token (App-level)

Default authentication mode using app credentials:

```typescript
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret'
});
```

### User Access Token (User-level)

For operations requiring user context:

```typescript
const client = new LarkMcpTool({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  userAccessToken: 'u-xxxxx'
});
```

### Token Mode Selection

Control which token type to use:

```typescript
// Force user token for all requests
await client.call('im.v1.message.create', {
  data: { /* ... */ }
}, { tokenMode: 'user_access_token' });

// Force tenant token
await client.call('bitable.v1.app.create', {
  data: { /* ... */ }
}, { tokenMode: 'tenant_access_token' });
```

## Tool Execution

### call Method

Execute any MCP tool by name:

```typescript
async call(toolName: string, params: any, options?: CallOptions): Promise<any>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolName` | `string` | Yes | Tool name (e.g., 'im.v1.message.create') |
| `params` | `any` | Yes | Tool-specific parameters |
| `options` | `CallOptions` | No | Execution options |

#### CallOptions

```typescript
interface CallOptions {
  tokenMode?: 'auto' | 'tenant_access_token' | 'user_access_token';
  timeout?: number;  // Request timeout in milliseconds
}
```

### Examples

#### Send a Message

```typescript
const result = await client.call('im.v1.message.create', {
  data: {
    receive_id: 'oc_xxxxx',
    msg_type: 'text',
    content: JSON.stringify({ text: 'Hello from MCP!' })
  },
  params: {
    receive_id_type: 'open_id'
  }
});
```

#### Create a Base Table

```typescript
const result = await client.call('bitable.v1.appTable.create', {
  path: {
    app_token: 'bascnxxxxx'
  },
  data: {
    table: {
      name: 'Sales Data',
      default_view_name: 'Grid View',
      fields: [
        {
          field_name: 'Product',
          type: 1  // Text
        },
        {
          field_name: 'Revenue',
          type: 2  // Number
        }
      ]
    }
  }
});
```

## Built-in Tools

### Genesis Tools

AI-powered tools for creating Lark Base applications:

#### genesis.builtin.create_base

Create a complete Lark Base from natural language requirements:

```typescript
const result = await client.call('genesis.builtin.create_base', {
  data: {
    requirements: 'Create a CRM system for tracking customers and sales',
    template: 'crm',  // Optional: use predefined template
    options: {
      createSampleData: true,
      language: 'en'
    }
  }
});
```

#### genesis.builtin.analyze_requirements

Analyze requirements and suggest optimal structure:

```typescript
const analysis = await client.call('genesis.builtin.analyze_requirements', {
  data: {
    requirements: 'I need to track inventory and orders',
    context: 'E-commerce business'
  }
});
```

### Document Tools

#### docx.builtin.import

Import external documents:

```typescript
const result = await client.call('docx.builtin.import', {
  data: {
    url: 'https://example.com/document.docx',
    folder_token: 'fldcnxxxxx'
  }
});
```

#### docx.builtin.search

Search across documents:

```typescript
const results = await client.call('docx.builtin.search', {
  data: {
    query: 'quarterly report',
    search_range: {
      folder_tokens: ['fldcnxxxxx'],
      doc_types: ['doc', 'docx', 'sheet']
    }
  }
});
```

### Wiki Tools

#### wiki.v2.space.getNode

Get wiki node information:

```typescript
const node = await client.call('wiki.v2.space.getNode', {
  params: {
    token: 'wikcnxxxxx'
  }
});
```

## Rate Limiting

### Configuration

```typescript
interface RateLimitConfig {
  enabled: boolean;
  rateLimits: {
    default: RateLimitSettings;
    read?: RateLimitSettings;
    write?: RateLimitSettings;
    admin?: RateLimitSettings;
  };
}

interface RateLimitSettings {
  capacity: number;          // Maximum tokens in bucket
  tokensPerInterval: number; // Tokens added per interval
  intervalMs: number;        // Interval in milliseconds
}
```

### Default Limits

```typescript
const defaultRateLimits = {
  default: { capacity: 100, tokensPerInterval: 50, intervalMs: 60000 },
  read: { capacity: 200, tokensPerInterval: 100, intervalMs: 60000 },
  write: { capacity: 20, tokensPerInterval: 10, intervalMs: 60000 },
  admin: { capacity: 5, tokensPerInterval: 2, intervalMs: 60000 }
};
```

### Runtime Control

```typescript
// Disable rate limiting
client.setRateLimitEnabled(false);

// Get metrics
const metrics = client.getRateLimitMetrics();
console.log(metrics);
// Output: { requestCount: 150, throttledCount: 5, ... }

// Reset rate limiters
client.resetRateLimiters();
```

## Error Handling

### Error Types

```typescript
interface LarkAPIError {
  code: number;        // Lark error code
  msg: string;         // Error message
  request_id: string;  // Request ID for debugging
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 99991400 | Invalid request | Check request parameters |
| 99991401 | Unauthorized | Verify app credentials |
| 99991403 | Forbidden | Check app permissions |
| 99991429 | Rate limited | Implement retry logic |
| 99991500 | Server error | Retry with backoff |

### Error Handling Example

```typescript
try {
  const result = await client.call('im.v1.message.create', params);
} catch (error) {
  if (error.code === 99991429) {
    // Rate limited, wait and retry
    await new Promise(resolve => setTimeout(resolve, 5000));
    const result = await client.call('im.v1.message.create', params);
  } else if (error.code === 99991403) {
    console.error('Permission denied. Check app permissions.');
  } else {
    throw error;
  }
}
```

## Response Formats

### Success Response

```typescript
interface SuccessResponse<T> {
  code: 0;
  msg: 'success';
  data: T;
  request_id?: string;
}
```

### Paginated Response

```typescript
interface PagedResponse<T> {
  code: 0;
  msg: 'success';
  data: {
    items: T[];
    has_more: boolean;
    page_token?: string;
    total?: number;
  };
}
```

### Example: List Messages

```typescript
const response = await client.call('im.v1.message.list', {
  params: {
    container_id_type: 'chat',
    container_id: 'oc_xxxxx',
    page_size: 20
  }
});

// Response structure
{
  code: 0,
  msg: 'success',
  data: {
    items: [
      {
        message_id: 'om_xxxxx',
        content: '{"text":"Hello"}',
        msg_type: 'text',
        create_time: '1634567890'
      }
    ],
    has_more: true,
    page_token: 'xxxxx'
  }
}
```

## Tool Presets

Use predefined tool collections:

```typescript
// Minimal tools
const lightClient = new LarkMcpTool({
  appId: 'xxx',
  appSecret: 'xxx',
  tools: ['preset.light']
});

// IM-focused tools
const imClient = new LarkMcpTool({
  appId: 'xxx',
  appSecret: 'xxx',
  tools: ['preset.im.default']
});

// Base operations
const baseClient = new LarkMcpTool({
  appId: 'xxx',
  appSecret: 'xxx',
  tools: ['preset.base.default', 'preset.base.batch']
});
```

## Advanced Usage

### Batch Operations

```typescript
// Batch create records
const result = await client.call('bitable.v1.appTableRecord.batchCreate', {
  path: {
    app_token: 'bascnxxxxx',
    table_id: 'tblxxxxx'
  },
  data: {
    records: [
      { fields: { Name: 'Product A', Price: 100 } },
      { fields: { Name: 'Product B', Price: 200 } }
    ]
  }
});
```

### Streaming Responses

For tools that support streaming:

```typescript
const stream = await client.call('docx.v1.document.rawContent', {
  path: { document_id: 'doccnxxxxx' },
  params: { mode: 'stream' }
});

stream.on('data', (chunk) => {
  console.log('Received chunk:', chunk);
});
```

### Custom Headers

Add custom headers to requests:

```typescript
const result = await client.call('im.v1.message.create', params, {
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Best Practices

1. **Always handle errors**: Implement proper error handling with retry logic
2. **Use rate limiting**: Keep rate limiting enabled in production
3. **Batch when possible**: Use batch APIs to reduce request count
4. **Cache tokens**: Reuse client instances to benefit from token caching
5. **Set appropriate timeouts**: Configure timeouts based on operation type
6. **Log request IDs**: Store request_id for debugging with Lark support

## See Also

- [Tool List Documentation](./tools-en.md)
- [Built-in Tools Guide](./BUILTIN-TOOLS.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Rate Limiting Guide](./RATE-LIMITING.md)