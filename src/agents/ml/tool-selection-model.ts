/**
 * ML-based Tool Selection Model
 * Uses historical performance data to predict optimal tool selection
 */

import { McpTool } from '../../mcp-tool/types';

export interface ToolPerformanceData {
  toolName: string;
  taskType: string;
  successRate: number;
  avgExecutionTime: number;
  totalExecutions: number;
  recentFailures: number;
  contextFeatures: Map<string, number>;
  timestamp: Date;
}

export interface TaskFeatures {
  taskType: string;
  keywords: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedComplexity: number;
  userPreference?: string[];
  contextualFactors: Map<string, number>;
}

export interface ToolPrediction {
  tool: McpTool;
  score: number;
  confidence: number;
  reasoning: string;
  alternativeTools: Array<{ tool: McpTool; score: number }>;
}

/**
 * Simple ML model for tool selection
 * Uses weighted features and historical performance
 */
export class ToolSelectionModel {
  private performanceHistory: Map<string, ToolPerformanceData[]> = new Map();
  private featureWeights: Map<string, number> = new Map();
  private taskPatterns: Map<string, Set<string>> = new Map();
  private readonly learningRate = 0.01;
  private readonly decayFactor = 0.95;

  constructor() {
    this.initializeFeatureWeights();
  }

  private initializeFeatureWeights(): void {
    // Initialize default feature weights
    this.featureWeights.set('success_rate', 0.4);
    this.featureWeights.set('execution_time', 0.2);
    this.featureWeights.set('recent_performance', 0.3);
    this.featureWeights.set('task_similarity', 0.1);
    this.featureWeights.set('keyword_match', 0.15);
    this.featureWeights.set('priority_match', 0.1);
    this.featureWeights.set('user_preference', 0.05);
  }

  /**
   * Train the model with new performance data
   */
  train(performanceData: ToolPerformanceData): void {
    const toolHistory = this.performanceHistory.get(performanceData.toolName) || [];
    toolHistory.push(performanceData);
    
    // Keep only recent history (last 100 entries)
    if (toolHistory.length > 100) {
      toolHistory.shift();
    }
    
    this.performanceHistory.set(performanceData.toolName, toolHistory);
    
    // Update task patterns
    this.updateTaskPatterns(performanceData);
    
    // Adjust weights based on performance
    this.adjustWeights(performanceData);
  }

  /**
   * Predict optimal tools for a given task
   */
  predict(
    taskFeatures: TaskFeatures,
    availableTools: McpTool[],
    topK: number = 5
  ): ToolPrediction[] {
    const predictions: ToolPrediction[] = [];

    for (const tool of availableTools) {
      const score = this.calculateToolScore(tool, taskFeatures);
      const confidence = this.calculateConfidence(tool.name, taskFeatures);
      const reasoning = this.generateReasoning(tool, taskFeatures, score);

      predictions.push({
        tool,
        score,
        confidence,
        reasoning,
        alternativeTools: [],
      });
    }

    // Sort by score descending
    predictions.sort((a, b) => b.score - a.score);

    // Add alternatives to top predictions
    const topPredictions = predictions.slice(0, topK);
    for (const prediction of topPredictions) {
      prediction.alternativeTools = this.findAlternativeTools(
        prediction.tool,
        predictions.filter(p => p.tool.name !== prediction.tool.name)
      );
    }

    return topPredictions;
  }

  /**
   * Calculate tool score based on features
   */
  private calculateToolScore(tool: McpTool, taskFeatures: TaskFeatures): number {
    let score = 0;
    const history = this.performanceHistory.get(tool.name) || [];

    // Success rate feature
    const successRate = this.calculateSuccessRate(history);
    score += successRate * (this.featureWeights.get('success_rate') || 0);

    // Execution time feature (normalized)
    const avgTime = this.calculateAverageExecutionTime(history);
    const timeScore = avgTime > 0 ? Math.min(1, 1000 / avgTime) : 0.5;
    score += timeScore * (this.featureWeights.get('execution_time') || 0);

    // Recent performance feature
    const recentPerformance = this.calculateRecentPerformance(history);
    score += recentPerformance * (this.featureWeights.get('recent_performance') || 0);

    // Task similarity feature
    const taskSimilarity = this.calculateTaskSimilarity(tool.name, taskFeatures.taskType);
    score += taskSimilarity * (this.featureWeights.get('task_similarity') || 0);

    // Keyword matching feature
    const keywordMatch = this.calculateKeywordMatch(tool, taskFeatures.keywords);
    score += keywordMatch * (this.featureWeights.get('keyword_match') || 0);

    // Priority matching feature
    const priorityMatch = this.calculatePriorityMatch(tool, taskFeatures.priority);
    score += priorityMatch * (this.featureWeights.get('priority_match') || 0);

    // User preference feature
    const userPreference = this.calculateUserPreference(tool, taskFeatures.userPreference);
    score += userPreference * (this.featureWeights.get('user_preference') || 0);

    // Apply contextual factors
    for (const [factor, value] of taskFeatures.contextualFactors) {
      const weight = this.featureWeights.get(`context_${factor}`) || 0;
      score += value * weight;
    }

    return Math.max(0, Math.min(1, score)); // Normalize to [0, 1]
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(toolName: string, taskFeatures: TaskFeatures): number {
    const history = this.performanceHistory.get(toolName) || [];
    
    if (history.length === 0) return 0.1; // Low confidence for new tools
    
    // Base confidence on amount of historical data
    const dataConfidence = Math.min(1, history.length / 20);
    
    // Adjust based on task similarity
    const similarTasks = history.filter(h => h.taskType === taskFeatures.taskType).length;
    const taskConfidence = similarTasks > 0 ? Math.min(1, similarTasks / 5) : 0.5;
    
    // Combine confidences
    return dataConfidence * 0.7 + taskConfidence * 0.3;
  }

  /**
   * Calculate success rate from history
   */
  private calculateSuccessRate(history: ToolPerformanceData[]): number {
    if (history.length === 0) return 0.5; // Default for new tools
    
    const recentHistory = history.slice(-20); // Last 20 executions
    const totalSuccess = recentHistory.reduce((sum, h) => sum + h.successRate, 0);
    
    return totalSuccess / recentHistory.length;
  }

  /**
   * Calculate average execution time
   */
  private calculateAverageExecutionTime(history: ToolPerformanceData[]): number {
    if (history.length === 0) return 1000; // Default 1 second
    
    const recentHistory = history.slice(-10);
    const totalTime = recentHistory.reduce((sum, h) => sum + h.avgExecutionTime, 0);
    
    return totalTime / recentHistory.length;
  }

  /**
   * Calculate recent performance with time decay
   */
  private calculateRecentPerformance(history: ToolPerformanceData[]): number {
    if (history.length === 0) return 0.5;
    
    const now = new Date();
    let weightedSum = 0;
    let totalWeight = 0;
    
    // Apply exponential decay based on age
    for (const data of history.slice(-10)) {
      const ageInHours = (now.getTime() - data.timestamp.getTime()) / (1000 * 60 * 60);
      const weight = Math.pow(this.decayFactor, ageInHours / 24); // Daily decay
      
      weightedSum += data.successRate * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  /**
   * Calculate task similarity based on patterns
   */
  private calculateTaskSimilarity(toolName: string, taskType: string): number {
    const patterns = this.taskPatterns.get(toolName);
    if (!patterns) return 0.3;
    
    if (patterns.has(taskType)) return 1.0;
    
    // Check for partial matches
    for (const pattern of patterns) {
      if (taskType.includes(pattern) || pattern.includes(taskType)) {
        return 0.7;
      }
    }
    
    return 0.3;
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordMatch(tool: McpTool, keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0.5;
    
    const toolText = `${tool.name} ${tool.description || ''}`.toLowerCase();
    let matches = 0;
    
    for (const keyword of keywords) {
      if (keyword && toolText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    return matches / keywords.length;
  }

  /**
   * Calculate priority matching score
   */
  private calculatePriorityMatch(tool: McpTool, priority: string): number {
    // High priority tasks prefer reliable tools
    if (priority === 'urgent' || priority === 'high') {
      const history = this.performanceHistory.get(tool.name) || [];
      return this.calculateSuccessRate(history);
    }
    
    return 0.7; // Neutral for lower priorities
  }

  /**
   * Calculate user preference score
   */
  private calculateUserPreference(tool: McpTool, preferences?: string[]): number {
    if (!preferences || preferences.length === 0) return 0.5;
    
    for (const pref of preferences) {
      if (tool.name.includes(pref) || tool.project.includes(pref)) {
        return 1.0;
      }
    }
    
    return 0.3;
  }

  /**
   * Update task patterns based on successful executions
   */
  private updateTaskPatterns(data: ToolPerformanceData): void {
    if (data.successRate > 0.7) {
      const patterns = this.taskPatterns.get(data.toolName) || new Set();
      patterns.add(data.taskType);
      this.taskPatterns.set(data.toolName, patterns);
    }
  }

  /**
   * Adjust feature weights based on performance
   */
  private adjustWeights(data: ToolPerformanceData): void {
    // Simple gradient descent update
    const mockTool: McpTool = {
      name: data.toolName,
      description: '',
      project: '',
      accessTokens: ['tenant'],
      schema: { data: {} },
    };
    
    const mockFeatures: TaskFeatures = {
      taskType: data.taskType,
      keywords: [],
      priority: 'medium',
      estimatedComplexity: 0.5,
      contextualFactors: new Map(),
    };
    
    const prediction = this.calculateToolScore(mockTool, mockFeatures);
    const error = data.successRate - prediction;
    
    // Update weights based on error
    for (const [feature, weight] of this.featureWeights) {
      const adjustment = this.learningRate * error * Math.random(); // Simplified
      this.featureWeights.set(feature, Math.max(0, Math.min(1, weight + adjustment)));
    }
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(tool: McpTool, features: TaskFeatures, score: number): string {
    const reasons: string[] = [];
    const history = this.performanceHistory.get(tool.name) || [];
    
    if (history.length > 0) {
      const successRate = this.calculateSuccessRate(history);
      reasons.push(`${(successRate * 100).toFixed(0)}% success rate`);
      
      const avgTime = this.calculateAverageExecutionTime(history);
      reasons.push(`~${avgTime.toFixed(0)}ms avg execution`);
    } else {
      reasons.push('New tool with no history');
    }
    
    const taskSimilarity = this.calculateTaskSimilarity(tool.name, features.taskType);
    if (taskSimilarity > 0.7) {
      reasons.push('High task similarity');
    }
    
    if (features.priority === 'urgent' || features.priority === 'high') {
      reasons.push(`Suitable for ${features.priority} priority`);
    }
    
    return reasons.join(', ');
  }

  /**
   * Find alternative tools
   */
  private findAlternativeTools(
    primaryTool: McpTool,
    otherPredictions: ToolPrediction[]
  ): Array<{ tool: McpTool; score: number }> {
    // Find tools with similar project or functionality
    return otherPredictions
      .filter(p => 
        p.tool.project === primaryTool.project ||
        this.calculateKeywordMatch(p.tool, primaryTool.name.split('.')) > 0.5
      )
      .slice(0, 3)
      .map(p => ({ tool: p.tool, score: p.score }));
  }

  /**
   * Export model state for persistence
   */
  exportModel(): string {
    return JSON.stringify({
      performanceHistory: Array.from(this.performanceHistory.entries()),
      featureWeights: Array.from(this.featureWeights.entries()),
      taskPatterns: Array.from(this.taskPatterns.entries()).map(([k, v]) => [k, Array.from(v)]),
    });
  }

  /**
   * Import model state
   */
  importModel(modelData: string): void {
    try {
      const data = JSON.parse(modelData);
      
      this.performanceHistory = new Map(data.performanceHistory);
      this.featureWeights = new Map(data.featureWeights);
      this.taskPatterns = new Map(data.taskPatterns.map(([k, v]: [string, string[]]) => [k, new Set(v)]));
    } catch (error) {
      console.error('Failed to import model:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }
}