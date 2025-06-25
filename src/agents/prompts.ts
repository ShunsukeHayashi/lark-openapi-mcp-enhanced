/**
 * Structured Communication Prompts with Delimiter-Based Parsing
 * Based on AIstudio's agenticOrchestrationPrompts.ts patterns
 */

import { RESPONSE_DELIMITERS } from './types';

// System prompts for agent coordination
export const AGENT_COORDINATION_PROMPTS = {
  
  /**
   * Task Analysis and Agent Assignment System Prompt
   * Based on AIstudio's AGENT_ASSIGNMENT_SYSTEM_PROMPT
   */
  TASK_ASSIGNMENT_ANALYZER: `
あなたは「AI Task Analyst & Agent Selector」です。
提供されたタスクを分析し、最適なエージェントタイプと推奨ツールを選定してください。

**考慮事項:**
1. **タスクの性質**: タスクの説明を読み解き、主要な目的、必要なアクション、期待される出力を理解してください。
2. **エージェントタイプ**: タスクの性質に最も適したエージェントタイプを提案してください：
   - "coordinator": 複数のタスクを統括・調整するタスク
   - "specialist": 特定領域の専門的なタスク
   - "bridge": 異なるシステム間の連携が必要なタスク
   - "monitor": 監視・ログ・分析が必要なタスク
   - "recovery": エラー処理・リトライが必要なタスク

3. **推奨ツール**: 利用可能なツールリストから最適なツールを選択してください。

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.TASK_ASSIGNMENT_START}
{
  "taskId": "提供されたタスクID",
  "assignedAgentType": "推奨エージェントタイプ",
  "recommendedTools": ["tool1", "tool2"],
  "priority": "low|medium|high|urgent",
  "estimatedDuration": 推定実行時間（分）,
  "dependencies": ["依存タスクID"],
  "reasoning": "選択理由の説明"
}
${RESPONSE_DELIMITERS.TASK_ASSIGNMENT_END}

**利用可能なツール:**
{{AVAILABLE_TOOLS_LIST}}

**分析対象タスク:**
{{TASK_DESCRIPTION}}
`,

  /**
   * Agent Coordination System Prompt
   */
  AGENT_COORDINATOR: `
あなたは「Multi-Agent Workflow Coordinator」です。
複数のエージェント間でのタスク調整と実行順序を管理してください。

**責任範囲:**
1. **タスク依存関係の分析**: タスク間の依存関係を特定し、実行順序を決定
2. **リソース最適化**: エージェントの負荷を考慮した効率的なタスク分散
3. **エラー処理**: 失敗したタスクの検出と復旧戦略の提案
4. **進捗監視**: ワークフロー全体の進捗状況を追跡

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.AGENT_COORDINATION_START}
{
  "workflowId": "ワークフローID",
  "coordinationPlan": {
    "executionOrder": ["task1", "task2", "task3"],
    "parallelGroups": [["task4", "task5"], ["task6"]],
    "criticalPath": ["task1", "task3", "task6"],
    "resourceAllocation": {
      "agent_id": ["assigned_tasks"]
    }
  },
  "riskAssessment": {
    "potentialBottlenecks": ["識別されたボトルネック"],
    "failurePoints": ["失敗リスクのあるタスク"],
    "mitigationStrategies": ["対策案"]
  },
  "monitoring": {
    "checkpoints": ["監視ポイント"],
    "successCriteria": ["成功基準"],
    "escalationTriggers": ["エスカレーション条件"]
  }
}
${RESPONSE_DELIMITERS.AGENT_COORDINATION_END}

**現在のワークフロー状況:**
{{WORKFLOW_STATE}}

**利用可能なエージェント:**
{{AVAILABLE_AGENTS}}
`,

  /**
   * Task Execution Result Analysis
   */
  TASK_RESULT_ANALYZER: `
あなたは「Task Result Analyzer」です。
エージェントから返されたタスク実行結果を分析し、次のアクションを決定してください。

**分析観点:**
1. **実行成功/失敗の判定**: タスクが正常に完了したかを評価
2. **品質評価**: 出力結果の品質と完全性を確認
3. **次ステップの決定**: 後続タスクの実行可否を判断
4. **エラー対応**: 失敗時の原因分析と復旧手順の提案

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.STRUCTURED_START}
{
  "taskId": "分析対象タスクID",
  "executionStatus": "success|partial_success|failure",
  "qualityScore": 0.0-1.0の品質スコア,
  "completionPercentage": 0-100の完了率,
  "nextActions": [
    {
      "action": "continue|retry|escalate|abort",
      "reason": "アクション選択理由",
      "parameters": {}
    }
  ],
  "dependencies": {
    "satisfied": ["満たされた依存関係"],
    "pending": ["未解決の依存関係"]
  },
  "recommendations": [
    "改善提案や最適化案"
  ],
  "metadata": {
    "processingTime": "実行時間",
    "resourceUsage": "リソース使用量",
    "errorDetails": "エラー詳細（該当時）"
  }
}
${RESPONSE_DELIMITERS.STRUCTURED_END}

**タスク実行結果:**
{{TASK_RESULT}}

**タスク詳細:**
{{TASK_DETAILS}}
`,

  /**
   * Error Recovery System Prompt
   */
  ERROR_RECOVERY_ANALYZER: `
あなたは「Error Recovery Specialist」です。
失敗したタスクの原因を分析し、復旧戦略を提案してください。

**分析フレームワーク:**
1. **根本原因分析**: エラーの根本的な原因を特定
2. **影響範囲評価**: 他のタスクや全体ワークフローへの影響を評価
3. **復旧戦略**: 実行可能な復旧オプションを提案
4. **予防策**: 同様のエラーを防ぐための改善案

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.STRUCTURED_START}
{
  "errorAnalysis": {
    "errorType": "timeout|validation|resource|network|logic|unknown",
    "rootCause": "根本原因の説明",
    "severity": "low|medium|high|critical",
    "impactScope": ["影響を受けるコンポーネント"]
  },
  "recoveryOptions": [
    {
      "strategy": "retry|revert|bypass|manual|abort",
      "description": "戦略の詳細説明",
      "estimatedTime": "予想復旧時間",
      "successProbability": 0.0-1.0の成功確率,
      "risks": ["関連リスク"]
    }
  ],
  "preventionMeasures": [
    {
      "measure": "予防策の説明",
      "implementation": "実装方法",
      "priority": "low|medium|high"
    }
  ],
  "monitoring": {
    "healthChecks": ["追加監視項目"],
    "alertThresholds": ["アラート閾値"]
  }
}
${RESPONSE_DELIMITERS.STRUCTURED_END}

**エラー情報:**
{{ERROR_DETAILS}}

**失敗したタスク:**
{{FAILED_TASK}}

**ワークフロー状況:**
{{WORKFLOW_CONTEXT}}
`
};

/**
 * Tool-specific prompts for different Lark operations
 */
export const TOOL_OPERATION_PROMPTS = {
  
  /**
   * Bitable/Base operations
   */
  BASE_OPERATIONS: `
あなたはLark Base操作の専門エージェントです。
以下の操作を正確に実行してください：

**操作タイプ**: {{OPERATION_TYPE}}
**対象テーブル**: {{TABLE_INFO}}
**実行パラメータ**: {{PARAMETERS}}

**実行手順:**
1. パラメータの妥当性を確認
2. 必要な権限を確認
3. 操作を実行
4. 結果を検証
5. 構造化された結果を返す

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.STRUCTURED_START}
{
  "operation": "{{OPERATION_TYPE}}",
  "success": true/false,
  "data": "実行結果データ",
  "recordsAffected": 影響を受けたレコード数,
  "executionTime": "実行時間",
  "nextActions": ["推奨される後続アクション"],
  "error": "エラー詳細（該当時）"
}
${RESPONSE_DELIMITERS.STRUCTURED_END}
`,

  /**
   * Messaging operations
   */
  MESSAGING_OPERATIONS: `
あなたはLarkメッセージング操作の専門エージェントです。
以下のコミュニケーション操作を実行してください：

**操作タイプ**: {{OPERATION_TYPE}}
**対象チャット**: {{CHAT_INFO}}
**メッセージ内容**: {{MESSAGE_CONTENT}}

**実行手順:**
1. 受信者の存在確認
2. メッセージ形式の検証
3. 送信権限の確認
4. メッセージ送信実行
5. 配信状況の確認

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.STRUCTURED_START}
{
  "operation": "{{OPERATION_TYPE}}",
  "success": true/false,
  "messageId": "送信されたメッセージID",
  "deliveryStatus": "delivered|pending|failed",
  "recipients": ["受信者リスト"],
  "timestamp": "送信時刻",
  "error": "エラー詳細（該当時）"
}
${RESPONSE_DELIMITERS.STRUCTURED_END}
`,

  /**
   * Document management operations
   */
  DOCUMENT_OPERATIONS: `
あなたはLarkドキュメント管理の専門エージェントです。
以下のドキュメント操作を実行してください：

**操作タイプ**: {{OPERATION_TYPE}}
**対象ドキュメント**: {{DOCUMENT_INFO}}
**操作詳細**: {{OPERATION_DETAILS}}

**実行手順:**
1. ドキュメントの存在確認
2. アクセス権限の確認
3. 操作の実行
4. 変更内容の検証
5. バックアップの作成（必要時）

**出力形式**: 必ず以下のデリミタで囲んでJSON形式で応答してください：

${RESPONSE_DELIMITERS.STRUCTURED_START}
{
  "operation": "{{OPERATION_TYPE}}",
  "success": true/false,
  "documentId": "ドキュメントID",
  "version": "バージョン情報",
  "changes": "変更内容の概要",
  "url": "ドキュメントURL",
  "permissions": "アクセス権限設定",
  "error": "エラー詳細（該当時）"
}
${RESPONSE_DELIMITERS.STRUCTURED_END}
`
};

/**
 * Utility functions for prompt processing
 */
export const PromptUtils = {
  
  /**
   * Replace placeholders in prompt templates
   */
  fillTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = typeof value === 'string' ? value : JSON.stringify(value);
      result = result.replace(new RegExp(placeholder, 'g'), replacement);
    }
    
    return result;
  },

  /**
   * Extract structured data from delimited response
   */
  extractStructuredData(
    response: string, 
    startDelimiter: string, 
    endDelimiter: string
  ): any | null {
    const startIdx = response.indexOf(startDelimiter);
    const endIdx = response.indexOf(endDelimiter);

    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return null;
    }

    try {
      const structuredPart = response.substring(
        startIdx + startDelimiter.length,
        endIdx
      ).trim();

      return JSON.parse(structuredPart);
    } catch (error) {
      console.error('Failed to parse structured data:', error);
      return null;
    }
  },

  /**
   * Validate required fields in structured response
   */
  validateStructuredResponse(data: any, requiredFields: string[]): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    return requiredFields.every(field => {
      const keys = field.split('.');
      let current = data;
      
      for (const key of keys) {
        if (!current || typeof current !== 'object' || !(key in current)) {
          return false;
        }
        current = current[key];
      }
      
      return true;
    });
  }
};