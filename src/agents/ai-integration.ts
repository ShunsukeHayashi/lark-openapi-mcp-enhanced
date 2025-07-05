/**
 * AI Integration for Multi-Agent System
 * Gemini API integration for enhanced agent intelligence
 */

import { StructuredResponse, RESPONSE_DELIMITERS } from './types';
import { AGENT_COORDINATION_PROMPTS, PromptUtils } from './prompts';

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIAnalysisResult {
  analysis: string;
  confidence: number;
  recommendations: string[];
  structuredData?: any;
}

export class GeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private defaultModel = 'gemini-1.5-flash';

  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
  }

  /**
   * Analyze task complexity and recommend agent assignment
   * Based on AIstudio's task analysis patterns
   */
  async analyzeTaskForAgentAssignment(
    task: string,
    availableAgents: any[],
    context: any = {},
  ): Promise<{
    recommendedAgent: string;
    agentType: string;
    tools: string[];
    reasoning: string;
    confidence: number;
  }> {
    const prompt = PromptUtils.fillTemplate(AGENT_COORDINATION_PROMPTS.TASK_ASSIGNMENT_ANALYZER, {
      TASK_DESCRIPTION: task,
      AVAILABLE_TOOLS_LIST: this.formatAvailableTools(availableAgents),
      CONTEXT: JSON.stringify(context),
    });

    try {
      const response = await this.generateContent(prompt);
      const structuredData = this.parseStructuredResponse(response);

      return {
        recommendedAgent: structuredData?.assignedAgentType || 'specialist',
        agentType: structuredData?.assignedAgentType || 'specialist',
        tools: structuredData?.recommendedTools || [],
        reasoning: structuredData?.reasoning || 'Default assignment',
        confidence: 0.8,
      };
    } catch (error) {
      console.error('AI task analysis failed:', error);
      return {
        recommendedAgent: 'specialist',
        agentType: 'specialist',
        tools: [],
        reasoning: 'Fallback assignment due to AI service error',
        confidence: 0.3,
      };
    }
  }

  /**
   * Generate intelligent workflow coordination plan
   */
  async generateWorkflowPlan(
    tasks: any[],
    availableAgents: any[],
    constraints: any = {},
  ): Promise<{
    executionOrder: string[];
    parallelGroups: string[][];
    criticalPath: string[];
    riskAssessment: any;
    recommendations: string[];
  }> {
    const prompt = PromptUtils.fillTemplate(AGENT_COORDINATION_PROMPTS.AGENT_COORDINATOR, {
      WORKFLOW_STATE: JSON.stringify({ tasks, constraints }),
      AVAILABLE_AGENTS: JSON.stringify(availableAgents),
    });

    try {
      const response = await this.generateContent(prompt);
      const coordination = this.parseCoordinationResponse(response);

      return {
        executionOrder: coordination?.coordinationPlan?.executionOrder || [],
        parallelGroups: coordination?.coordinationPlan?.parallelGroups || [],
        criticalPath: coordination?.coordinationPlan?.criticalPath || [],
        riskAssessment: coordination?.riskAssessment || {},
        recommendations: coordination?.riskAssessment?.mitigationStrategies || [],
      };
    } catch (error) {
      console.error('Workflow planning failed:', error);
      return {
        executionOrder: tasks.map((_, i) => `task_${i}`),
        parallelGroups: [],
        criticalPath: [],
        riskAssessment: {},
        recommendations: ['Unable to generate AI-powered recommendations'],
      };
    }
  }

  /**
   * Analyze task execution results and suggest next actions
   */
  async analyzeTaskResults(
    taskId: string,
    result: any,
    context: any = {},
  ): Promise<{
    status: 'success' | 'partial_success' | 'failure';
    qualityScore: number;
    nextActions: string[];
    improvements: string[];
  }> {
    const prompt = PromptUtils.fillTemplate(AGENT_COORDINATION_PROMPTS.TASK_RESULT_ANALYZER, {
      TASK_RESULT: JSON.stringify(result),
      TASK_DETAILS: JSON.stringify(context),
    });

    try {
      const response = await this.generateContent(prompt);
      const analysis = this.parseStructuredResponse(response);

      return {
        status: analysis?.executionStatus || 'success',
        qualityScore: analysis?.qualityScore || 0.8,
        nextActions: analysis?.nextActions?.map((a: any) => a.action) || [],
        improvements: analysis?.recommendations || [],
      };
    } catch (error) {
      console.error('Result analysis failed:', error);
      return {
        status: 'success',
        qualityScore: 0.7,
        nextActions: [],
        improvements: [],
      };
    }
  }

  /**
   * Generate recovery strategy for failed tasks
   */
  async generateRecoveryStrategy(
    errorDetails: any,
    failedTask: any,
    workflowContext: any = {},
  ): Promise<{
    strategy: 'retry' | 'revert' | 'bypass' | 'manual' | 'abort';
    steps: string[];
    estimatedTime: number;
    successProbability: number;
    preventionMeasures: string[];
  }> {
    const prompt = PromptUtils.fillTemplate(AGENT_COORDINATION_PROMPTS.ERROR_RECOVERY_ANALYZER, {
      ERROR_DETAILS: JSON.stringify(errorDetails),
      FAILED_TASK: JSON.stringify(failedTask),
      WORKFLOW_CONTEXT: JSON.stringify(workflowContext),
    });

    try {
      const response = await this.generateContent(prompt);
      const recovery = this.parseStructuredResponse(response);
      const bestOption = recovery?.recoveryOptions?.[0];

      return {
        strategy: bestOption?.strategy || 'retry',
        steps: [bestOption?.description || 'Retry with same parameters'],
        estimatedTime: bestOption?.estimatedTime || 60,
        successProbability: bestOption?.successProbability || 0.7,
        preventionMeasures: recovery?.preventionMeasures?.map((m: any) => m.measure) || [],
      };
    } catch (error) {
      console.error('Recovery strategy generation failed:', error);
      return {
        strategy: 'retry',
        steps: ['Retry task with original parameters'],
        estimatedTime: 60,
        successProbability: 0.5,
        preventionMeasures: [],
      };
    }
  }

  /**
   * Generate intelligent content based on task context
   */
  async generateSmartContent(
    contentType: 'summary' | 'explanation' | 'documentation' | 'notification',
    data: any,
    options: {
      audience?: 'technical' | 'business' | 'general';
      length?: 'brief' | 'detailed' | 'comprehensive';
      language?: 'en' | 'ja' | 'zh';
    } = {},
  ): Promise<string> {
    const { audience = 'general', length = 'brief', language = 'ja' } = options;

    const prompt = `
あなたは専門的な${contentType}作成エージェントです。
以下の条件で内容を生成してください：

**対象者**: ${audience}
**詳細度**: ${length}
**言語**: ${language}

**データ**:
${JSON.stringify(data, null, 2)}

**要求**:
${this.getContentTypeInstructions(contentType)}

**出力形式**: 明確で読みやすい${language === 'ja' ? '日本語' : language === 'en' ? 'English' : '中文'}で回答してください。
`;

    try {
      const response = await this.generateContent(prompt);
      return response.trim();
    } catch (error) {
      console.error('Content generation failed:', error);
      return `${contentType}の生成中にエラーが発生しました。`;
    }
  }

  /**
   * Make API call to Gemini
   */
  private async generateContent(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/${this.defaultModel}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Parse structured response using delimiters
   */
  private parseStructuredResponse(response: string): any {
    try {
      // Try to parse structured data with delimiters
      const structuredData = PromptUtils.extractStructuredData(
        response,
        RESPONSE_DELIMITERS.STRUCTURED_START,
        RESPONSE_DELIMITERS.STRUCTURED_END,
      );

      if (structuredData) {
        return structuredData;
      }

      // Fallback: try to find JSON in response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return null;
    } catch (error) {
      console.error('Failed to parse structured response:', error);
      return null;
    }
  }

  /**
   * Parse coordination response
   */
  private parseCoordinationResponse(response: string): any {
    return PromptUtils.extractStructuredData(
      response,
      RESPONSE_DELIMITERS.AGENT_COORDINATION_START,
      RESPONSE_DELIMITERS.AGENT_COORDINATION_END,
    );
  }

  /**
   * Format available tools for AI analysis
   */
  private formatAvailableTools(agents: any[]): string {
    return agents
      .map((agent) => {
        const capabilities = agent.capabilities?.map((cap: any) => cap.name).join(', ') || '';
        return `- **${agent.name}**: ${capabilities}`;
      })
      .join('\n');
  }

  /**
   * Get content type specific instructions
   */
  private getContentTypeInstructions(contentType: string): string {
    switch (contentType) {
      case 'summary':
        return '重要なポイントを簡潔にまとめた要約を作成してください。';
      case 'explanation':
        return '技術的な内容を分かりやすく説明してください。';
      case 'documentation':
        return '構造化された技術文書として整理してください。';
      case 'notification':
        return '重要な情報を効果的に伝える通知文を作成してください。';
      default:
        return '適切な形式で内容を整理してください。';
    }
  }
}

// Singleton instance
export let globalAIService: GeminiAIService | null = null;

/**
 * Initialize AI service with API key
 */
export function initializeAIService(apiKey: string): GeminiAIService {
  globalAIService = new GeminiAIService({ apiKey });
  return globalAIService;
}

/**
 * Get initialized AI service
 */
export function getAIService(): GeminiAIService {
  if (!globalAIService) {
    throw new Error('AI service not initialized. Call initializeAIService() first.');
  }
  return globalAIService;
}
