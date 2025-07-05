# Tool Priority Configuration System

This directory contains the configuration management system for MCP tool priorities and fallback mechanisms in the Coordinator Agent.

## Overview

The configuration system allows external management of:
- Tool priorities (which tools to prefer over others)
- Fallback mappings (alternative tools when primary tools fail)
- Retry policies (how many times and how long to retry failed operations)

## Configuration Files

### `tool-priorities.json`
Main configuration file containing:
- **priorities**: Tool priority groups with patterns and priority levels (1=highest, 10=lowest)
- **fallbacks**: Fallback tool mappings for resilience
- **retryPolicy**: Retry configuration with exponential backoff

### `tool-priorities.schema.json`
JSON Schema for validating the configuration file structure.

## Configuration Structure

```json
{
  "version": "1.0.0",
  "priorities": {
    "larkTools": {
      "patterns": [
        {
          "pattern": "lark.mcp.base",
          "priority": 1,
          "description": "Base operations - highest priority"
        }
      ]
    }
  },
  "fallbacks": {
    "mappings": [
      {
        "primary": "tool.name",
        "fallbacks": ["fallback1", "fallback2"],
        "description": "Fallback chain description"
      }
    ]
  },
  "retryPolicy": {
    "maxAttempts": 3,
    "baseDelay": 1000,
    "backoffMultiplier": 2
  }
}
```

## Usage

### Programmatic API

```typescript
// Update tool priority
await coordinator.tools.get('update_tool_priority').execute({
  pattern: 'my.custom.tool',
  priority: 5,
  group: 'customTools'
});

// Add fallback mapping
await coordinator.tools.get('add_tool_fallback').execute({
  primaryTool: 'primary.tool',
  fallbackTools: ['fallback1', 'fallback2'],
  description: 'Custom fallback'
});

// Reload configuration
await coordinator.tools.get('reload_configuration').execute({});

// Toggle auto-reload
await coordinator.tools.get('toggle_config_auto_reload').execute({
  enabled: true
});
```

### Manual Configuration

1. Edit `tool-priorities.json` directly
2. The coordinator will automatically reload if auto-reload is enabled
3. Or manually trigger reload using the `reload_configuration` tool

## Priority Levels

1. **Level 1-3**: Lark MCP tools (highest priority)
   - Level 1: Critical operations (Base, IM)
   - Level 2: Important operations (Docs, Calendar)
   - Level 3: Standard operations (Contact)

2. **Level 4-6**: Chrome MCP tools (medium priority)
   - Level 4: Search operations
   - Level 5: Automation
   - Level 6: General operations

3. **Level 7-10**: Custom tools (lower priority)
   - Configurable based on needs

## Fallback Mechanism

When a primary tool fails:
1. System attempts retry with exponential backoff
2. If all retries fail, tries fallback tools in order
3. Each fallback tool gets 2 retry attempts
4. Returns success if any tool in the chain succeeds

## Best Practices

1. **Priority Assignment**:
   - Assign lower numbers (1-3) to critical, frequently-used tools
   - Use higher numbers (7-10) for experimental or less reliable tools

2. **Fallback Chains**:
   - Order fallbacks from most to least similar functionality
   - Keep chains short (2-3 fallbacks max) for performance
   - Test fallback chains regularly

3. **Retry Policy**:
   - Default 3 attempts with 1s base delay works for most cases
   - Increase for critical operations that may have transient failures
   - Decrease for time-sensitive operations

4. **Configuration Updates**:
   - Test configuration changes in development first
   - Use version control for configuration files
   - Document significant changes in comments