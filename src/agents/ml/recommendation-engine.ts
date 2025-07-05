/**
 * Tool Recommendation Engine
 * Analyzes task patterns and recommends tools based on historical usage
 */

import { McpTool } from '../../mcp-tool/types';

export interface TaskPattern {
  id: string;
  pattern: string;
  description: string;
  category: string;
  keywords: string[];
  commonTools: Array<{
    toolName: string;
    frequency: number;
    avgSuccessRate: number;
  }>;
  examples: string[];
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
}

export interface ToolRecommendation {
  tool: McpTool;
  confidence: number;
  reason: string;
  similarPatterns: TaskPattern[];
  alternativeTools: Array<{
    tool: McpTool;
    confidence: number;
  }>;
  usageStats?: {
    timesUsedForSimilarTasks: number;
    averageSuccessRate: number;
    commonlyUsedWith: string[];
  };
}

export interface RecommendationContext {
  currentTask: string;
  recentTasks: string[];
  userRole?: string;
  timeOfDay?: number;
  previousTools?: string[];
  taskCategory?: string;
}

export class RecommendationEngine {
  private taskPatterns: Map<string, TaskPattern> = new Map();
  private toolUsageMatrix: Map<string, Map<string, number>> = new Map(); // tool -> pattern -> count
  private toolCooccurrence: Map<string, Map<string, number>> = new Map(); // tool -> tool -> count
  private patternSimilarityCache: Map<string, number> = new Map();
  private minPatternConfidence: number = 0.6;

  constructor() {
    this.initializeCommonPatterns();
  }

  /**
   * Initialize with common task patterns
   */
  private initializeCommonPatterns(): void {
    const patterns: TaskPattern[] = [
      {
        id: 'search_records',
        pattern: 'search.*record.*table|find.*data.*base',
        description: 'Search for records in database tables',
        category: 'data_retrieval',
        keywords: ['search', 'find', 'query', 'record', 'table', 'base'],
        commonTools: [
          { toolName: 'bitable.v1.appTableRecord.search', frequency: 0.8, avgSuccessRate: 0.9 },
          { toolName: 'bitable.v1.appTableRecord.list', frequency: 0.6, avgSuccessRate: 0.85 },
        ],
        examples: [
          'Search for customer records in CRM base',
          'Find all records matching criteria',
          'Query table for specific data',
        ],
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: 0,
      },
      {
        id: 'send_message',
        pattern: 'send.*message|notify.*team|message.*user',
        description: 'Send messages or notifications',
        category: 'communication',
        keywords: ['send', 'message', 'notify', 'chat', 'communication', 'team'],
        commonTools: [
          { toolName: 'im.v1.message.create', frequency: 0.9, avgSuccessRate: 0.95 },
          { toolName: 'im.v1.message.reply', frequency: 0.4, avgSuccessRate: 0.9 },
        ],
        examples: [
          'Send message to team channel',
          'Notify users about update',
          'Message team members',
        ],
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: 0,
      },
      {
        id: 'create_document',
        pattern: 'create.*document|new.*doc|generate.*report',
        description: 'Create documents or reports',
        category: 'document_management',
        keywords: ['create', 'document', 'new', 'generate', 'report', 'file'],
        commonTools: [
          { toolName: 'docx.v1.document.create', frequency: 0.7, avgSuccessRate: 0.88 },
          { toolName: 'wiki.v2.space.node.create', frequency: 0.5, avgSuccessRate: 0.85 },
        ],
        examples: [
          'Create new project document',
          'Generate monthly report',
          'New documentation file',
        ],
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: 0,
      },
      {
        id: 'schedule_event',
        pattern: 'schedule.*meeting|create.*event|book.*calendar',
        description: 'Schedule meetings or calendar events',
        category: 'scheduling',
        keywords: ['schedule', 'meeting', 'event', 'calendar', 'book', 'appointment'],
        commonTools: [
          { toolName: 'calendar.v4.calendar.event.create', frequency: 0.85, avgSuccessRate: 0.92 },
          { toolName: 'calendar.v4.calendar.event.patch', frequency: 0.3, avgSuccessRate: 0.9 },
        ],
        examples: [
          'Schedule team meeting',
          'Create calendar event',
          'Book appointment slot',
        ],
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: 0,
      },
      {
        id: 'update_data',
        pattern: 'update.*record|modify.*data|edit.*table',
        description: 'Update or modify existing data',
        category: 'data_modification',
        keywords: ['update', 'modify', 'edit', 'change', 'patch', 'record'],
        commonTools: [
          { toolName: 'bitable.v1.appTableRecord.update', frequency: 0.75, avgSuccessRate: 0.88 },
          { toolName: 'bitable.v1.appTableRecord.batchUpdate', frequency: 0.4, avgSuccessRate: 0.85 },
        ],
        examples: [
          'Update customer information',
          'Modify record status',
          'Edit table data',
        ],
        createdAt: new Date(),
        lastUsed: new Date(),
        usageCount: 0,
      },
    ];

    patterns.forEach(pattern => {
      this.taskPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Learn from task execution
   */
  learnFromExecution(
    task: string,
    toolsUsed: string[],
    success: boolean,
    executionTime: number
  ): void {
    // Find matching patterns
    const matchedPatterns = this.findMatchingPatterns(task);
    
    // Update pattern usage
    matchedPatterns.forEach(pattern => {
      pattern.usageCount++;
      pattern.lastUsed = new Date();
      
      // Update tool frequency for this pattern
      toolsUsed.forEach(toolName => {
        const existingTool = pattern.commonTools.find(t => t.toolName === toolName);
        if (existingTool) {
          existingTool.frequency = (existingTool.frequency * 0.9) + (success ? 0.1 : 0);
          existingTool.avgSuccessRate = (existingTool.avgSuccessRate * 0.9) + (success ? 0.1 : 0);
        } else {
          pattern.commonTools.push({
            toolName,
            frequency: 0.1,
            avgSuccessRate: success ? 1 : 0,
          });
        }
      });
      
      // Sort tools by frequency
      pattern.commonTools.sort((a, b) => b.frequency - a.frequency);
      
      // Keep only top 5 tools per pattern
      pattern.commonTools = pattern.commonTools.slice(0, 5);
    });
    
    // Update tool usage matrix
    toolsUsed.forEach(toolName => {
      if (!this.toolUsageMatrix.has(toolName)) {
        this.toolUsageMatrix.set(toolName, new Map());
      }
      
      matchedPatterns.forEach(pattern => {
        const patternMap = this.toolUsageMatrix.get(toolName)!;
        patternMap.set(pattern.id, (patternMap.get(pattern.id) || 0) + 1);
      });
    });
    
    // Update tool co-occurrence
    for (let i = 0; i < toolsUsed.length; i++) {
      for (let j = i + 1; j < toolsUsed.length; j++) {
        this.updateCooccurrence(toolsUsed[i], toolsUsed[j]);
      }
    }
    
    // Create new pattern if no strong match
    if (matchedPatterns.length === 0 || 
        matchedPatterns.every(p => this.calculatePatternSimilarity(task, p.pattern) < 0.7)) {
      this.createNewPattern(task, toolsUsed, success);
    }
  }

  /**
   * Get tool recommendations for a task
   */
  recommendTools(
    context: RecommendationContext,
    availableTools: McpTool[],
    topK: number = 5
  ): ToolRecommendation[] {
    const { currentTask } = context;
    const recommendations: ToolRecommendation[] = [];
    
    // Find matching patterns
    const matchedPatterns = this.findMatchingPatterns(currentTask);
    
    // Score each available tool
    const toolScores = new Map<string, {
      score: number;
      reasons: string[];
      patterns: TaskPattern[];
    }>();
    
    availableTools.forEach(tool => {
      let score = 0;
      const reasons: string[] = [];
      const relevantPatterns: TaskPattern[] = [];
      
      // Pattern-based scoring
      matchedPatterns.forEach(pattern => {
        const toolInPattern = pattern.commonTools.find(t => t.toolName === tool.name);
        if (toolInPattern) {
          const patternScore = toolInPattern.frequency * toolInPattern.avgSuccessRate;
          score += patternScore * 0.5;
          reasons.push(`Commonly used for ${pattern.description}`);
          relevantPatterns.push(pattern);
        }
      });
      
      // Co-occurrence scoring
      if (context.previousTools) {
        const cooccurrenceScore = this.calculateCooccurrenceScore(tool.name, context.previousTools);
        score += cooccurrenceScore * 0.3;
        if (cooccurrenceScore > 0.5) {
          reasons.push('Often used with previous tools');
        }
      }
      
      // Keyword matching
      const keywordScore = this.calculateKeywordScore(tool, currentTask);
      score += keywordScore * 0.2;
      if (keywordScore > 0.5) {
        reasons.push('Strong keyword match');
      }
      
      // Time-based scoring (if provided)
      if (context.timeOfDay !== undefined) {
        const timeScore = this.calculateTimeBasedScore(tool.name, context.timeOfDay);
        score += timeScore * 0.1;
      }
      
      if (score > 0) {
        toolScores.set(tool.name, { score, reasons, patterns: relevantPatterns });
      }
    });
    
    // Convert to recommendations
    availableTools.forEach(tool => {
      const scoreData = toolScores.get(tool.name);
      if (scoreData && scoreData.score > this.minPatternConfidence * 0.5) {
        const recommendation: ToolRecommendation = {
          tool,
          confidence: Math.min(1, scoreData.score),
          reason: scoreData.reasons.join('; '),
          similarPatterns: scoreData.patterns,
          alternativeTools: [],
          usageStats: this.getToolUsageStats(tool.name, matchedPatterns),
        };
        
        recommendations.push(recommendation);
      }
    });
    
    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);
    
    // Add alternatives
    const topRecommendations = recommendations.slice(0, topK);
    topRecommendations.forEach(rec => {
      rec.alternativeTools = this.findAlternativeTools(
        rec.tool,
        recommendations.filter(r => r.tool.name !== rec.tool.name),
        3
      );
    });
    
    return topRecommendations;
  }

  /**
   * Find patterns matching a task description
   */
  private findMatchingPatterns(task: string): TaskPattern[] {
    const matches: Array<{ pattern: TaskPattern; score: number }> = [];
    
    this.taskPatterns.forEach(pattern => {
      // Regex pattern matching
      try {
        const regex = new RegExp(pattern.pattern, 'i');
        if (regex.test(task)) {
          matches.push({ pattern, score: 1.0 });
          return;
        }
      } catch (e) {
        // Invalid regex, skip
      }
      
      // Keyword matching
      const keywordScore = this.calculateKeywordMatchScore(task, pattern.keywords);
      if (keywordScore > 0.5) {
        matches.push({ pattern, score: keywordScore });
      }
      
      // Similarity to examples
      const exampleScore = this.calculateExampleSimilarity(task, pattern.examples);
      if (exampleScore > 0.6) {
        matches.push({ pattern, score: exampleScore });
      }
    });
    
    // Sort by score and return unique patterns
    const uniquePatterns = new Map<string, TaskPattern>();
    matches
      .sort((a, b) => b.score - a.score)
      .forEach(match => {
        if (!uniquePatterns.has(match.pattern.id)) {
          uniquePatterns.set(match.pattern.id, match.pattern);
        }
      });
    
    return Array.from(uniquePatterns.values());
  }

  /**
   * Calculate pattern similarity
   */
  private calculatePatternSimilarity(task: string, pattern: string): number {
    const cacheKey = `${task}:${pattern}`;
    if (this.patternSimilarityCache.has(cacheKey)) {
      return this.patternSimilarityCache.get(cacheKey)!;
    }
    
    // Simple word overlap similarity
    const taskWords = new Set(task.toLowerCase().split(/\s+/));
    const patternWords = new Set(pattern.toLowerCase().split(/[.*|]/));
    
    let overlap = 0;
    taskWords.forEach(word => {
      if (patternWords.has(word)) {
        overlap++;
      }
    });
    
    const similarity = overlap / Math.max(taskWords.size, patternWords.size);
    this.patternSimilarityCache.set(cacheKey, similarity);
    
    return similarity;
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatchScore(task: string, keywords: string[]): number {
    const taskLower = task.toLowerCase();
    let matches = 0;
    
    keywords.forEach(keyword => {
      if (taskLower.includes(keyword.toLowerCase())) {
        matches++;
      }
    });
    
    return matches / keywords.length;
  }

  /**
   * Calculate similarity to example tasks
   */
  private calculateExampleSimilarity(task: string, examples: string[]): number {
    if (examples.length === 0) return 0;
    
    const taskWords = new Set(task.toLowerCase().split(/\s+/));
    let maxSimilarity = 0;
    
    examples.forEach(example => {
      const exampleWords = new Set(example.toLowerCase().split(/\s+/));
      let overlap = 0;
      
      taskWords.forEach(word => {
        if (exampleWords.has(word)) {
          overlap++;
        }
      });
      
      const similarity = (overlap * 2) / (taskWords.size + exampleWords.size);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });
    
    return maxSimilarity;
  }

  /**
   * Update tool co-occurrence data
   */
  private updateCooccurrence(tool1: string, tool2: string): void {
    // Ensure bidirectional update
    [tool1, tool2].forEach((t1, i) => {
      const t2 = i === 0 ? tool2 : tool1;
      
      if (!this.toolCooccurrence.has(t1)) {
        this.toolCooccurrence.set(t1, new Map());
      }
      
      const coMap = this.toolCooccurrence.get(t1)!;
      coMap.set(t2, (coMap.get(t2) || 0) + 1);
    });
  }

  /**
   * Calculate co-occurrence score
   */
  private calculateCooccurrenceScore(toolName: string, previousTools: string[]): number {
    const coMap = this.toolCooccurrence.get(toolName);
    if (!coMap) return 0;
    
    let totalScore = 0;
    let totalCount = 0;
    
    previousTools.forEach(prevTool => {
      const count = coMap.get(prevTool) || 0;
      if (count > 0) {
        totalScore += Math.min(1, count / 10); // Normalize to max 1
        totalCount++;
      }
    });
    
    return totalCount > 0 ? totalScore / totalCount : 0;
  }

  /**
   * Calculate keyword score for a tool
   */
  private calculateKeywordScore(tool: McpTool, task: string): number {
    const taskLower = task.toLowerCase();
    const toolText = `${tool.name} ${tool.description || ''}`.toLowerCase();
    
    const taskWords = taskLower.split(/\s+/).filter(w => w.length > 2);
    let matches = 0;
    
    taskWords.forEach(word => {
      if (toolText.includes(word)) {
        matches++;
      }
    });
    
    return taskWords.length > 0 ? matches / taskWords.length : 0;
  }

  /**
   * Calculate time-based score (placeholder for time patterns)
   */
  private calculateTimeBasedScore(toolName: string, timeOfDay: number): number {
    // Simple implementation - could be enhanced with actual time patterns
    // Morning hours (6-12) might favor reporting tools
    // Afternoon (12-18) might favor collaboration tools
    // Evening (18-24) might favor summary/cleanup tools
    
    return 0.5; // Neutral score for now
  }

  /**
   * Get tool usage statistics
   */
  private getToolUsageStats(toolName: string, patterns: TaskPattern[]): any {
    const stats = {
      timesUsedForSimilarTasks: 0,
      averageSuccessRate: 0,
      commonlyUsedWith: [] as string[],
    };
    
    // Calculate times used
    patterns.forEach(pattern => {
      const toolData = pattern.commonTools.find(t => t.toolName === toolName);
      if (toolData) {
        stats.timesUsedForSimilarTasks += pattern.usageCount * toolData.frequency;
        stats.averageSuccessRate += toolData.avgSuccessRate;
      }
    });
    
    if (patterns.length > 0) {
      stats.averageSuccessRate /= patterns.length;
    }
    
    // Get commonly used with
    const coMap = this.toolCooccurrence.get(toolName);
    if (coMap) {
      const coTools = Array.from(coMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tool]) => tool);
      stats.commonlyUsedWith = coTools;
    }
    
    return stats;
  }

  /**
   * Find alternative tools
   */
  private findAlternativeTools(
    primaryTool: McpTool,
    otherRecommendations: ToolRecommendation[],
    count: number
  ): Array<{ tool: McpTool; confidence: number }> {
    return otherRecommendations
      .filter(rec => 
        rec.tool.project === primaryTool.project ||
        rec.similarPatterns.some(p => 
          primaryTool.name.toLowerCase().includes(p.category.split('_')[0])
        )
      )
      .slice(0, count)
      .map(rec => ({
        tool: rec.tool,
        confidence: rec.confidence,
      }));
  }

  /**
   * Create a new pattern from task
   */
  private createNewPattern(task: string, toolsUsed: string[], success: boolean): void {
    const id = `custom_${Date.now()}`;
    const keywords = task.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const pattern: TaskPattern = {
      id,
      pattern: task.toLowerCase().replace(/\s+/g, '.*'),
      description: `Custom pattern: ${task.substring(0, 50)}...`,
      category: 'custom',
      keywords,
      commonTools: toolsUsed.map(toolName => ({
        toolName,
        frequency: 1.0,
        avgSuccessRate: success ? 1.0 : 0.0,
      })),
      examples: [task],
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 1,
    };
    
    this.taskPatterns.set(id, pattern);
  }

  /**
   * Export patterns for persistence
   */
  exportPatterns(): string {
    const data = {
      patterns: Array.from(this.taskPatterns.entries()),
      toolUsageMatrix: Array.from(this.toolUsageMatrix.entries()).map(([tool, patterns]) => [
        tool,
        Array.from(patterns.entries()),
      ]),
      toolCooccurrence: Array.from(this.toolCooccurrence.entries()).map(([tool, coTools]) => [
        tool,
        Array.from(coTools.entries()),
      ]),
    };
    
    return JSON.stringify(data);
  }

  /**
   * Import patterns
   */
  importPatterns(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      // Import patterns
      this.taskPatterns = new Map(parsed.patterns);
      
      // Import usage matrix
      this.toolUsageMatrix = new Map(
        parsed.toolUsageMatrix.map(([tool, patterns]: [string, Array<[string, number]>]) => [
          tool,
          new Map(patterns),
        ])
      );
      
      // Import co-occurrence
      this.toolCooccurrence = new Map(
        parsed.toolCooccurrence.map(([tool, coTools]: [string, Array<[string, number]>]) => [
          tool,
          new Map(coTools),
        ])
      );
    } catch (error) {
      console.error('Failed to import patterns:', error);
      throw error;
    }
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): TaskPattern[] {
    return Array.from(this.taskPatterns.values());
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): TaskPattern | undefined {
    return this.taskPatterns.get(id);
  }
}