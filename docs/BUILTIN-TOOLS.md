# Built-in Tools Documentation

This document provides comprehensive documentation for all custom built-in tools in the Lark OpenAPI MCP Tool.

## Table of Contents

1. [Genesis Tools](#genesis-tools)
2. [Document Tools](#document-tools)
3. [Wiki Tools](#wiki-tools)
4. [Base/Bitable Tools](#basebitable-tools)
5. [Chat Agent Tools](#chat-agent-tools)
6. [System Tools](#system-tools)

## Genesis Tools

AI-powered tools for creating and managing Lark Base applications.

### genesis.builtin.create_base

Create a complete Lark Base application from natural language requirements.

**Parameters:**
```typescript
{
  data: {
    requirements: string;        // Natural language description
    template?: string;          // Optional: 'crm' | 'project' | 'hr' | 'inventory' | 'event' | 'bug_tracking'
    name?: string;              // Base name (auto-generated if not provided)
    options?: {
      createSampleData?: boolean;   // Create sample data (default: false)
      language?: 'en' | 'zh' | 'ja'; // Language for generated content
      workspace?: string;            // Target workspace ID
    }
  }
}
```

**Example:**
```typescript
await client.call('genesis.builtin.create_base', {
  data: {
    requirements: 'I need a CRM system to track customers, deals, and interactions',
    template: 'crm',
    name: 'Sales CRM',
    options: {
      createSampleData: true,
      language: 'en'
    }
  }
});
```

### genesis.builtin.list_templates

List all available Genesis templates with details.

**Parameters:**
```typescript
{
  data: {
    category?: string;  // Filter by category: 'business' | 'project' | 'personal'
    language?: string;  // Language for descriptions
  }
}
```

**Response:**
```typescript
{
  templates: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    tables: string[];
    features: string[];
    estimatedTime: string;
  }>
}
```

### genesis.builtin.analyze_requirements

Analyze natural language requirements and suggest optimal structure.

**Parameters:**
```typescript
{
  data: {
    requirements: string;
    context?: string;        // Additional context
    existingBase?: string;   // Base token if analyzing for extension
  }
}
```

**Response:**
```typescript
{
  analysis: {
    summary: string;
    suggestedTables: Array<{
      name: string;
      purpose: string;
      fields: Array<{
        name: string;
        type: string;
        required: boolean;
      }>;
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: string;
    }>;
    recommendations: string[];
  }
}
```

### genesis.builtin.generate_er_diagram

Generate an Entity-Relationship diagram for a base.

**Parameters:**
```typescript
{
  data: {
    baseToken: string;
    format?: 'mermaid' | 'plantuml' | 'svg';
    includeFields?: boolean;
  }
}
```

### genesis.builtin.optimize_base

Analyze and optimize an existing base with AI recommendations.

**Parameters:**
```typescript
{
  data: {
    baseToken: string;
    aspects?: string[];  // ['performance', 'structure', 'naming', 'relationships']
  }
}
```

## Document Tools

Tools for document operations beyond standard API capabilities.

### docx.builtin.import

Import external documents into Lark.

**Parameters:**
```typescript
{
  data: {
    url?: string;              // External document URL
    content?: string;          // Document content (HTML/Markdown)
    format?: string;           // 'html' | 'markdown' | 'docx'
    folder_token: string;      // Target folder
    title?: string;            // Document title
    permissions?: {
      public?: boolean;
      edit_permission?: string;
    }
  }
}
```

### docx.builtin.search

Advanced document search across workspaces.

**Parameters:**
```typescript
{
  data: {
    query: string;
    search_range?: {
      folder_tokens?: string[];
      space_ids?: string[];
      doc_types?: string[];     // ['doc', 'sheet', 'mindnote', 'bitable']
      time_range?: {
        start: string;          // ISO date
        end: string;
      }
    };
    options?: {
      include_content?: boolean;
      max_results?: number;
      sort_by?: 'relevance' | 'created_time' | 'modified_time';
    }
  }
}
```

### docx.builtin.export

Export Lark documents to various formats.

**Parameters:**
```typescript
{
  data: {
    document_id: string;
    format: 'pdf' | 'word' | 'markdown' | 'html';
    options?: {
      include_comments?: boolean;
      include_history?: boolean;
      version?: number;
    }
  }
}
```

## Wiki Tools

Tools for Wiki space and node management.

### wiki.v2.space.getNode

Retrieve wiki node information including embedded bases.

**Parameters:**
```typescript
{
  params: {
    token: string;  // Wiki node token
  }
}
```

**Response:**
```typescript
{
  node: {
    node_token: string;
    obj_token: string;      // Token for embedded object (e.g., base)
    obj_type: string;       // 'doc' | 'sheet' | 'bitable' | 'mindnote'
    title: string;
    space_id: string;
    parent_node_token?: string;
    has_child: boolean;
    meta?: {
      visibility: string;
      edit_permission: string;
    }
  }
}
```

### wiki.v1.node.search

Search wiki nodes across spaces.

**Parameters:**
```typescript
{
  data: {
    query: string;
    space_id?: string;
    filters?: {
      obj_type?: string[];
      creator?: string[];
      date_range?: {
        start: string;
        end: string;
      }
    };
    page_size?: number;
    page_token?: string;
  }
}
```

## Base/Bitable Tools

Enhanced tools for Lark Base operations.

### bitable.builtin.batch_operations

Perform complex batch operations on Base.

**Parameters:**
```typescript
{
  data: {
    app_token: string;
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      table_id: string;
      records?: any[];
      conditions?: any;
    }>;
    transaction?: boolean;  // Run as transaction
  }
}
```

### bitable.builtin.create_view_preset

Create pre-configured views with filters and sorting.

**Parameters:**
```typescript
{
  data: {
    app_token: string;
    table_id: string;
    preset: 'kanban' | 'calendar' | 'gantt' | 'gallery';
    config: {
      name: string;
      group_by?: string;      // Field name for grouping
      sort_by?: Array<{
        field: string;
        order: 'asc' | 'desc';
      }>;
      filters?: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    }
  }
}
```

## Chat Agent Tools

Tools for AI-powered chat interactions.

### chat.agent.create_session

Create a new chat agent session.

**Parameters:**
```typescript
{
  data: {
    agent_type: 'coordinator' | 'specialist';
    config?: {
      language?: string;
      personality?: string;
      capabilities?: string[];
    };
    context?: {
      chat_id?: string;
      user_id?: string;
      workspace?: string;
    }
  }
}
```

### chat.agent.process_message

Process a message through the agent system.

**Parameters:**
```typescript
{
  data: {
    session_id: string;
    message: string;
    attachments?: Array<{
      type: string;
      content: any;
    }>;
    options?: {
      stream?: boolean;
      max_tokens?: number;
    }
  }
}
```

## System Tools

Utility tools for system management.

### system.builtin.health_check

Check system health and API connectivity.

**Parameters:**
```typescript
{
  data: {
    services?: string[];  // Services to check
    detailed?: boolean;   // Include detailed diagnostics
  }
}
```

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [service: string]: {
      status: string;
      latency: number;
      error?: string;
    }
  };
  timestamp: string;
}
```

### system.builtin.list_permissions

List current app permissions and their status.

**Parameters:**
```typescript
{
  data: {
    check_usage?: boolean;  // Check actual usage vs granted
  }
}
```

### system.builtin.clear_cache

Clear various caches in the system.

**Parameters:**
```typescript
{
  data: {
    types: Array<'token' | 'api' | 'all'>;
    force?: boolean;
  }
}
```

## Error Handling

All built-in tools follow standard error response format:

```typescript
{
  code: number;
  msg: string;
  details?: {
    tool: string;
    reason: string;
    suggestion?: string;
  }
}
```

Common error codes:
- `100001`: Invalid parameters
- `100002`: Resource not found
- `100003`: Permission denied
- `100004`: Rate limited
- `100005`: External service error

## Best Practices

1. **Use templates when available**: Genesis templates are optimized for common use cases
2. **Batch operations**: Use batch tools to reduce API calls
3. **Check permissions**: Ensure your app has required permissions before using tools
4. **Handle pagination**: Many search tools return paginated results
5. **Use appropriate timeouts**: Some operations (like base creation) may take longer

## Examples

### Complete CRM Creation Flow

```typescript
// 1. Analyze requirements
const analysis = await client.call('genesis.builtin.analyze_requirements', {
  data: {
    requirements: 'CRM for B2B sales with pipeline management'
  }
});

// 2. Create base from template
const base = await client.call('genesis.builtin.create_base', {
  data: {
    requirements: analysis.analysis.summary,
    template: 'crm',
    name: 'B2B Sales CRM',
    options: { createSampleData: true }
  }
});

// 3. Create custom view
await client.call('bitable.builtin.create_view_preset', {
  data: {
    app_token: base.app_token,
    table_id: base.tables[0].table_id,
    preset: 'kanban',
    config: {
      name: 'Sales Pipeline',
      group_by: 'Stage'
    }
  }
});

// 4. Generate ER diagram
const diagram = await client.call('genesis.builtin.generate_er_diagram', {
  data: {
    baseToken: base.app_token,
    format: 'mermaid'
  }
});
```

### Document Migration Flow

```typescript
// 1. Search for documents to migrate
const docs = await client.call('docx.builtin.search', {
  data: {
    query: 'project proposal',
    search_range: {
      doc_types: ['doc'],
      time_range: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    }
  }
});

// 2. Export documents
for (const doc of docs.results) {
  const exported = await client.call('docx.builtin.export', {
    data: {
      document_id: doc.document_id,
      format: 'markdown'
    }
  });
  
  // 3. Import to new location
  await client.call('docx.builtin.import', {
    data: {
      content: exported.content,
      format: 'markdown',
      folder_token: 'new_folder_token',
      title: `Migrated: ${doc.title}`
    }
  });
}