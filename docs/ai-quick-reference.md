# AI-Enhanced Multi-Agent System - Quick Reference

## 🚀 Quick Start

```typescript
import { createAIEnhancedCoordinator } from '../agents/ai-enhanced-coordinator';

// 1. Initialize with Gemini API key
const coordinator = await createAIEnhancedCoordinator('YOUR_GEMINI_API_KEY');

// 2. AI-powered task analysis
const result = await coordinator.enhancedTaskDecomposition(
  '顧客データを分析してレポートを作成し、チームに送信する'
);

// 3. Monitor with AI insights
const monitoring = await coordinator.enhancedWorkflowMonitoring(workflowId, results);
```

## 🧠 AI Features at a Glance

| Feature | Method | AI Capability |
|---------|--------|---------------|
| **Task Analysis** | `enhancedTaskDecomposition()` | Complexity assessment, subtask generation |
| **Agent Assignment** | `optimizeAgentAssignment()` | Load balancing, capability matching |
| **Monitoring** | `enhancedWorkflowMonitoring()` | Quality prediction, risk assessment |
| **Error Recovery** | `intelligentErrorRecovery()` | Recovery strategy, success probability |
| **Content Generation** | `generateIntelligentSummary()` | Smart summaries, explanations |

## 🎯 Common Use Cases

### 1. Customer Onboarding
```typescript
const onboarding = await coordinator.enhancedTaskDecomposition(
  '新規顧客のオンボーディング：登録、ドキュメント作成、ミーティング設定',
  { priority: 'high', customerType: 'enterprise' }
);
```

### 2. Monthly Reporting
```typescript
const report = await coordinator.enhancedTaskDecomposition(
  '月次レポート生成：データ抽出、分析、配布',
  { format: 'executive_summary', departments: ['sales'] }
);
```

### 3. Project Kickoff
```typescript
const project = await coordinator.enhancedTaskDecomposition(
  'プロジェクト開始：Base作成、チーム追加、キックオフ会議',
  { projectType: 'development', teamSize: 5 }
);
```

## 🔧 Configuration Options

### Basic Setup
```typescript
const coordinator = new AIEnhancedCoordinator({
  geminiApiKey: 'YOUR_API_KEY',
  name: 'Custom Coordinator',
  temperature: 0.3,      // AI creativity (0.0-1.0)
  maxTokens: 4000,      // Response length
  language: 'ja'        // Japanese optimization
});
```

### Advanced Configuration
```typescript
const config = {
  aiService: {
    model: 'gemini-1.5-flash',
    temperature: 0.3,
    safetySettings: 'medium'
  },
  execution: {
    maxConcurrentTasks: 5,
    retryDelay: 5000,
    enableAdaptiveConcurrency: true
  },
  monitoring: {
    qualityThreshold: 0.7,
    riskAssessment: true,
    predictiveAnalysis: true
  }
};
```

## 📊 Response Formats

### Task Decomposition Response
```typescript
{
  subtasks: Task[],           // AI-optimized subtasks
  aiAnalysis: {
    agentRecommendation: {
      agentType: string,
      confidence: number,     // 0.0-1.0
      reasoning: string
    },
    workflowPlan: {
      executionOrder: string[],
      parallelGroups: string[][],
      criticalPath: string[]
    }
  },
  complexity: 'simple' | 'moderate' | 'complex',
  recommendations: string[]   // Strategic advice
}
```

### Monitoring Response
```typescript
{
  status: {
    progress: number,         // 0-100%
    qualityMetrics: {
      averageQuality: number, // 0.0-1.0
      successRate: number,    // 0.0-1.0
      riskLevel: 'low' | 'medium' | 'high'
    }
  },
  insights: string[],         // AI observations
  predictions: {
    likelyOutcome: 'success' | 'partial_success' | 'needs_attention',
    estimatedCompletion: number, // seconds
    qualityForecast: number     // 0.0-1.0
  },
  adjustments: string[]       // Recommended actions
}
```

## 🛠️ Error Handling

### Basic Error Handling
```typescript
try {
  const result = await coordinator.enhancedTaskDecomposition(task);
} catch (error) {
  if (error.message.includes('API key')) {
    // Handle authentication error
  } else if (error.message.includes('quota')) {
    // Handle rate limiting
  } else {
    // Fallback to basic coordination
    const basicResult = await basicTaskCoordination(task);
  }
}
```

### AI-Powered Recovery
```typescript
const recovery = await coordinator.intelligentErrorRecovery(
  workflowId,
  { error: errorDetails, severity: 'medium' },
  failedTasks
);

console.log(`Strategy: ${recovery.strategy}`);
console.log(`Success probability: ${recovery.successProbability}`);
recovery.actions.forEach(action => console.log(`- ${action}`));
```

## 📈 Performance Tips

### 1. Optimize AI Calls
```typescript
// Batch multiple tasks for analysis
const batchResult = await coordinator.enhancedTaskDecomposition(
  'タスク1とタスク2とタスク3を実行する',  // Multiple tasks in one call
  { batchMode: true }
);

// Use caching for repeated patterns
const cachedAnalysis = await coordinator.getCachedAnalysis(taskPattern);
```

### 2. Load Balancing
```typescript
// Monitor agent loads
const stats = globalRegistry.getStatistics();
if (stats.busyAgents / stats.totalAgents > 0.8) {
  // Reduce concurrent tasks
  coordinator.setMaxConcurrentTasks(2);
}
```

### 3. Quality Thresholds
```typescript
// Set quality requirements
const optimization = await coordinator.optimizeAgentAssignment(tasks, {
  minQualityThreshold: 0.8,
  preferQualityOverSpeed: true
});
```

## 🔍 Debugging

### Enable Debug Mode
```typescript
process.env.DEBUG = 'ai-coordinator:*';

const coordinator = new AIEnhancedCoordinator({
  debugMode: true,
  logLevel: 'verbose'
});
```

### Monitor AI Responses
```typescript
coordinator.on('ai_analysis_complete', (analysis) => {
  console.log('AI Confidence:', analysis.confidence);
  console.log('Reasoning:', analysis.reasoning);
});

coordinator.on('workflow_optimized', (optimization) => {
  console.log('Efficiency:', optimization.efficiency);
});
```

## 🌟 Best Practices

### 1. Task Descriptions
```typescript
// ❌ Vague
'データ処理'

// ✅ Specific  
'顧客データベースから今月の新規登録者を抽出し、ウェルカムメールテンプレートで送信する'

// ✅ With context
{
  task: '顧客データベースから今月の新規登録者を抽出し、ウェルカムメールを送信',
  requirements: { timeframe: '今月', template: 'welcome_v2' },
  context: { database: 'customers_2024', sender: 'sales@company.com' }
}
```

### 2. Error Prevention
```typescript
// Validate inputs
if (!task || task.length < 10) {
  throw new Error('Task description too short for AI analysis');
}

// Check AI service availability
if (!coordinator.isAIServiceAvailable()) {
  return await fallbackCoordination(task);
}

// Set realistic expectations
const analysis = await coordinator.enhancedTaskDecomposition(task);
if (analysis.aiAnalysis.agentRecommendation.confidence < 0.6) {
  // Request human validation
  await requestHumanApproval(analysis);
}
```

### 3. Resource Management
```typescript
// Monitor system resources
const systemLoad = await getSystemLoad();
if (systemLoad.cpu > 80 || systemLoad.memory > 85) {
  // Reduce AI processing intensity
  coordinator.setAIProcessingMode('lightweight');
}

// Cleanup completed workflows
setInterval(() => {
  coordinator.cleanupCompletedWorkflows();
}, 3600000); // Every hour
```

## 🚨 Troubleshooting

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Low Confidence** | AI confidence < 0.6 | Add more context, use specific task descriptions |
| **API Errors** | Authentication/quota failures | Check API key, implement retry logic |
| **Poor Assignment** | Efficiency < 0.5 | Reduce concurrent tasks, check agent availability |
| **Slow Response** | High latency | Enable caching, use batch processing |
| **Quality Issues** | Low quality scores | Set quality thresholds, implement validation |

## 📚 Related Documentation

- [Full Documentation](./ai-enhanced-multi-agent-system.md)
- [Agent System README](../src/agents/README.md)
- [Usage Examples](../src/agents/examples/ai-coordinator-example.ts)
- [Main Project README](../README.md)

---

**Quick Reference Version**: 1.0.0  
**Compatible with**: AI-Enhanced Multi-Agent System v1.0.0