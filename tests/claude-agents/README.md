# 🧪 Claude Code Sub-Agent Testing Suite

Comprehensive testing framework for validating Claude Code sub-agent integration with the Lark Multi-Agent System (MAS).

## 📁 Test Structure

```
tests/claude-agents/
├── README.md                    # This documentation
├── agent-integration.test.ts    # Main integration test suite
├── agent-performance.test.ts    # Performance and load testing
├── agent-security.test.ts       # Security and access control tests
└── mocks/                       # Mock implementations
    ├── lark-mcp-client.mock.ts
    ├── external-systems.mock.ts
    └── test-data.ts
```

## 🎯 Testing Objectives

### Integration Validation
- **Tool Interaction**: Verify correct MCP tool invocation
- **Workflow Orchestration**: Validate multi-step process execution
- **Error Handling**: Ensure graceful failure recovery
- **Response Format**: Confirm user-friendly output generation

### Performance Assessment
- **Response Time**: Measure end-to-end execution latency
- **Concurrent Operations**: Test parallel request handling
- **Resource Utilization**: Monitor memory and CPU usage
- **Rate Limit Compliance**: Verify API quota management

### Security & Compliance
- **Access Control**: Validate permission enforcement
- **Data Privacy**: Ensure sensitive information protection
- **Audit Logging**: Verify comprehensive operation tracking
- **Error Sanitization**: Check secure error message handling

## 🚀 Running Tests

### Complete Test Suite
```bash
# Run all Claude agent tests
yarn test tests/claude-agents/

# Run with coverage reporting
yarn test:coverage tests/claude-agents/

# Run in watch mode for development
yarn test:watch tests/claude-agents/
```

### Specific Test Categories
```bash
# Integration tests only
yarn test tests/claude-agents/agent-integration.test.ts

# Performance tests only
yarn test tests/claude-agents/agent-performance.test.ts

# Security tests only
yarn test tests/claude-agents/agent-security.test.ts
```

### Test Environment Setup
```bash
# Set up test environment variables
export TEST_MODE=true
export LARK_APP_ID=test_app_id
export LARK_APP_SECRET=test_app_secret

# Run tests with specific configuration
yarn test tests/claude-agents/ --testTimeout=30000
```

## 🔧 Test Configuration

### Mock System Setup
The test suite uses comprehensive mocks to simulate:

**Lark MCP Tools:**
- `bitable_*` operations (Base management)
- `im_*` operations (Messaging)
- `docx_*` operations (Document management)
- `calendar_*` operations (Calendar management)

**External Systems:**
- YouTube Analytics API
- Google Apps Script Interpreter
- Context Engineering Service
- Dify Workflow Engine

### Test Data Management
```typescript
// Example test data structure
interface TestScenario {
  name: string;
  agent: 'orchestrator' | 'analytics' | 'integration';
  input: string;
  expectedTools: string[];
  expectedOutcome: TestOutcome;
  setupData?: any;
  cleanup?: () => Promise<void>;
}
```

## 📊 Test Categories

### 1. Agent Selection Tests
Verify Claude Code's intelligent agent selection based on user intent:

```typescript
describe('Agent Selection Logic', () => {
  test('should select orchestrator for multi-domain tasks', () => {
    const input = "Set up customer onboarding with Base, Docs, and Calendar";
    const selectedAgent = determineOptimalAgent(input);
    expect(selectedAgent).toBe('lark-enterprise-orchestrator');
  });

  test('should select analytics for data analysis requests', () => {
    const input = "Analyze our Q4 sales performance trends";
    const selectedAgent = determineOptimalAgent(input);
    expect(selectedAgent).toBe('lark-analytics-specialist');
  });
});
```

### 2. Workflow Orchestration Tests
Validate complex multi-step workflow execution:

```typescript
describe('Workflow Orchestration', () => {
  test('should execute customer onboarding workflow', async () => {
    const workflow = new CustomerOnboardingWorkflow();
    const result = await workflow.execute({
      clientName: 'ABC Corp',
      contactEmail: 'contact@abc.com'
    });
    
    expect(result.success).toBe(true);
    expect(result.steps.length).toBe(4);
    expect(result.allStepsCompleted).toBe(true);
  });
});
```

### 3. Tool Integration Tests
Ensure proper MCP tool invocation and parameter handling:

```typescript
describe('Tool Integration', () => {
  test('should invoke correct Base operations', async () => {
    const agent = new AnalyticsSpecialistAgent();
    const result = await agent.processRequest("Analyze customer data");
    
    expect(mockClient.getInvokedTools()).toContain('bitable_v1_appTableRecord_search');
    expect(result.dataPoints).toBeGreaterThan(0);
  });
});
```

### 4. Error Handling Tests
Verify robust error recovery and user communication:

```typescript
describe('Error Handling', () => {
  test('should handle API failures gracefully', async () => {
    mockClient.simulateFailure('bitable_v1_app_list', 'Rate limit exceeded');
    
    const agent = new EnterpriseOrchestratorAgent();
    const result = await agent.processRequest("List all applications");
    
    expect(result.success).toBe(false);
    expect(result.userMessage).toContain('temporarily unavailable');
    expect(result.suggestions).toBeInstanceOf(Array);
  });
});
```

### 5. Performance Tests
Measure and validate performance characteristics:

```typescript
describe('Performance Tests', () => {
  test('should complete simple requests within 2 seconds', async () => {
    const startTime = Date.now();
    const result = await agent.processRequest("Send message to team");
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(2000);
    expect(result.success).toBe(true);
  });

  test('should handle concurrent requests efficiently', async () => {
    const requests = Array.from({ length: 10 }, (_, i) => 
      agent.processRequest(`Analyze dataset ${i}`)
    );
    
    const results = await Promise.all(requests);
    const successfulResults = results.filter(r => r.success);
    
    expect(successfulResults.length).toBe(10);
  });
});
```

## 🛡️ Security Testing

### Access Control Validation
```typescript
describe('Security Tests', () => {
  test('should enforce tool access permissions', async () => {
    const restrictedAgent = new RestrictedTestAgent(['read-only']);
    
    await expect(
      restrictedAgent.processRequest("Delete all customer records")
    ).rejects.toThrow('Insufficient permissions');
  });

  test('should sanitize error messages', async () => {
    mockClient.simulateFailure('bitable_v1_app_list', 'Internal server error: database connection failed at host 192.168.1.100');
    
    const result = await agent.processRequest("List applications");
    
    expect(result.userMessage).not.toContain('192.168.1.100');
    expect(result.userMessage).toContain('service temporarily unavailable');
  });
});
```

### Data Privacy Tests
```typescript
describe('Data Privacy', () => {
  test('should not expose sensitive data in logs', async () => {
    const sensitiveRequest = "Process customer data including SSN 123-45-6789";
    
    await agent.processRequest(sensitiveRequest);
    
    const logs = getTestLogs();
    expect(logs.join('')).not.toContain('123-45-6789');
  });
});
```

## 📈 Performance Benchmarks

### Target Performance Metrics
- **Simple Requests**: < 2 seconds end-to-end
- **Complex Workflows**: < 30 seconds for multi-step processes
- **Concurrent Requests**: Support 10+ parallel operations
- **Memory Usage**: < 100MB per active agent session
- **Error Rate**: < 1% under normal conditions

### Load Testing Scenarios
```typescript
describe('Load Testing', () => {
  test('should maintain performance under high load', async () => {
    const loadTest = new LoadTestRunner({
      concurrent: 50,
      duration: '60s',
      requestTypes: ['simple', 'complex', 'analytics']
    });
    
    const results = await loadTest.run();
    
    expect(results.averageResponseTime).toBeLessThan(5000);
    expect(results.errorRate).toBeLessThan(0.05);
    expect(results.throughput).toBeGreaterThan(10); // requests/second
  });
});
```

## 🔍 Test Utilities

### Mock Client Implementation
```typescript
class MockLarkMcpClient {
  private tools = new Map();
  private invocations: ToolInvocation[] = [];
  private failures = new Map();

  registerTool(name: string, handler: Function) {
    this.tools.set(name, handler);
  }

  simulateFailure(toolName: string, error: string) {
    this.failures.set(toolName, error);
  }

  async invokeTool(name: string, params: any) {
    if (this.failures.has(name)) {
      throw new Error(this.failures.get(name));
    }

    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool ${name} not found`);
    }

    const invocation = {
      toolName: name,
      parameters: params,
      timestamp: new Date()
    };
    this.invocations.push(invocation);

    return await handler(params);
  }

  getInvokedTools(): string[] {
    return this.invocations.map(inv => inv.toolName);
  }

  getInvocationHistory(): ToolInvocation[] {
    return [...this.invocations];
  }

  reset() {
    this.invocations = [];
    this.failures.clear();
  }
}
```

### Test Data Factories
```typescript
class TestDataFactory {
  static createCustomerData(count: number = 10) {
    return Array.from({ length: count }, (_, i) => ({
      record_id: `rec_${i}`,
      fields: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        revenue: Math.floor(Math.random() * 100000),
        status: ['active', 'inactive', 'pending'][i % 3]
      }
    }));
  }

  static createAnalyticsData(timeRange: string = '30d') {
    return {
      metrics: {
        total_revenue: 250000,
        customer_count: 150,
        conversion_rate: 0.12,
        growth_rate: 0.08
      },
      timeRange,
      generatedAt: new Date()
    };
  }
}
```

## 🚨 Common Test Issues & Solutions

### Issue: Test Timeouts
**Solution**: Increase timeout for complex workflows
```typescript
test('complex workflow', async () => {
  // Complex test logic
}, 30000); // 30 second timeout
```

### Issue: Mock Data Inconsistency
**Solution**: Use data factories and reset between tests
```typescript
beforeEach(() => {
  mockClient.reset();
  TestDataFactory.resetState();
});
```

### Issue: Async Operation Conflicts
**Solution**: Proper test isolation and cleanup
```typescript
afterEach(async () => {
  await cleanupTestData();
  await mockClient.disconnect();
});
```

## 🔄 Continuous Testing

### GitHub Actions Integration
```yaml
name: Claude Agent Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test tests/claude-agents/
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```bash
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: claude-agent-tests
        name: Claude Agent Tests
        entry: yarn test tests/claude-agents/
        language: system
        pass_filenames: false
```

---

**This testing framework ensures that Claude Code sub-agents maintain high quality, performance, and reliability while integrating seamlessly with the Lark Multi-Agent System.**