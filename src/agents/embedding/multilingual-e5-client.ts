/**
 * Multilingual E5 Embedding Client
 * Supports multilingual-e5-small (116MB, 384D) and multilingual-e5-base (279MB, 768D)
 */

import axios from 'axios';

export interface EmbeddingModel {
  name: 'multilingual-e5-small' | 'multilingual-e5-base';
  size: string;
  dimensions: number;
  description: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    totalTokens: number;
    promptTokens: number;
  };
}

export class MultilingualE5Client {
  private readonly models: Record<string, EmbeddingModel> = {
    'multilingual-e5-small': {
      name: 'multilingual-e5-small',
      size: '116MB',
      dimensions: 384,
      description: '軽量級多語言模型 - excellent for fast processing',
    },
    'multilingual-e5-base': {
      name: 'multilingual-e5-base',
      size: '279MB',
      dimensions: 768,
      description: 'より大きなモデル、より良い効果 - excellent for accuracy',
    },
  };

  private baseURL: string;
  private apiKey?: string;
  private defaultModel: EmbeddingModel;

  constructor(
    config: {
      baseURL?: string;
      apiKey?: string;
      defaultModel?: 'multilingual-e5-small' | 'multilingual-e5-base';
    } = {},
  ) {
    this.baseURL = config.baseURL || 'http://localhost:8080/v1';
    this.apiKey = config.apiKey;
    this.defaultModel = this.models[config.defaultModel || 'multilingual-e5-small'];
  }

  /**
   * Generate embeddings for text(s)
   */
  async createEmbeddings(
    texts: string | string[],
    options: {
      model?: 'multilingual-e5-small' | 'multilingual-e5-base';
      normalize?: boolean;
      batchSize?: number;
    } = {},
  ): Promise<EmbeddingResponse> {
    const model = this.models[options.model || this.defaultModel.name];
    const textsArray = Array.isArray(texts) ? texts : [texts];

    // Process in batches for better performance
    const batchSize = options.batchSize || 32;
    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    for (let i = 0; i < textsArray.length; i += batchSize) {
      const batch = textsArray.slice(i, i + batchSize);
      const response = await this.processBatch(batch, model, options.normalize);

      allEmbeddings.push(...response.embeddings);
      totalTokens += response.usage.totalTokens;
    }

    return {
      embeddings: allEmbeddings,
      model: model.name,
      usage: {
        totalTokens,
        promptTokens: totalTokens, // For E5 models, input tokens = total tokens
      },
    };
  }

  /**
   * Process a batch of texts
   */
  private async processBatch(
    texts: string[],
    model: EmbeddingModel,
    normalize: boolean = true,
  ): Promise<EmbeddingResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model: model.name,
          input: texts,
          encoding_format: 'float',
          normalize: normalize,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          timeout: 30000,
        },
      );

      return {
        embeddings: response.data.data.map((item: any) => item.embedding),
        model: model.name,
        usage: {
          totalTokens: response.data.usage?.total_tokens || texts.join(' ').length,
          promptTokens: response.data.usage?.prompt_tokens || texts.join(' ').length,
        },
      };
    } catch (error: any) {
      console.error('Embedding generation error:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate semantic similarity between two texts
   */
  async calculateSimilarity(
    text1: string,
    text2: string,
    options: {
      model?: 'multilingual-e5-small' | 'multilingual-e5-base';
    } = {},
  ): Promise<number> {
    const response = await this.createEmbeddings([text1, text2], options);
    const [embedding1, embedding2] = response.embeddings;

    return this.cosineSimilarity(embedding1, embedding2);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find most similar texts from a collection
   */
  async findSimilar(
    queryText: string,
    candidateTexts: string[],
    options: {
      model?: 'multilingual-e5-small' | 'multilingual-e5-base';
      topK?: number;
      threshold?: number;
    } = {},
  ): Promise<Array<{ text: string; similarity: number; index: number }>> {
    const allTexts = [queryText, ...candidateTexts];
    const response = await this.createEmbeddings(allTexts, options);

    const queryEmbedding = response.embeddings[0];
    const candidateEmbeddings = response.embeddings.slice(1);

    const similarities = candidateEmbeddings.map((embedding, index) => ({
      text: candidateTexts[index],
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
      index,
    }));

    // Filter by threshold and sort by similarity
    const threshold = options.threshold || 0.0;
    const filtered = similarities.filter((item) => item.similarity >= threshold);
    const sorted = filtered.sort((a, b) => b.similarity - a.similarity);

    // Return top K results
    const topK = options.topK || sorted.length;
    return sorted.slice(0, topK);
  }

  /**
   * Cluster texts by semantic similarity
   */
  async clusterTexts(
    texts: string[],
    options: {
      model?: 'multilingual-e5-small' | 'multilingual-e5-base';
      numClusters?: number;
      threshold?: number;
    } = {},
  ): Promise<Array<{ cluster: number; texts: string[]; centroid?: number[] }>> {
    const response = await this.createEmbeddings(texts, options);
    const embeddings = response.embeddings;

    // Simple k-means clustering implementation
    const numClusters = options.numClusters || Math.min(5, Math.ceil(texts.length / 10));
    const maxIterations = 100;
    const threshold = options.threshold || 0.01;

    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < numClusters; i++) {
      const randomIndex = Math.floor(Math.random() * embeddings.length);
      centroids.push([...embeddings[randomIndex]]);
    }

    let assignments: number[] = new Array(texts.length).fill(0);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign points to nearest centroid
      const newAssignments: number[] = [];
      for (let i = 0; i < embeddings.length; i++) {
        let bestCluster = 0;
        let bestSimilarity = -1;

        for (let j = 0; j < centroids.length; j++) {
          const similarity = this.cosineSimilarity(embeddings[i], centroids[j]);
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestCluster = j;
          }
        }
        newAssignments.push(bestCluster);
      }

      // Check for convergence
      const changed = newAssignments.some((cluster, i) => cluster !== assignments[i]);
      if (!changed) break;

      assignments = newAssignments;

      // Update centroids
      for (let cluster = 0; cluster < numClusters; cluster++) {
        const clusterPoints = embeddings.filter((_, i) => assignments[i] === cluster);
        if (clusterPoints.length > 0) {
          const dimensions = clusterPoints[0].length;
          const newCentroid = new Array(dimensions).fill(0);

          for (const point of clusterPoints) {
            for (let i = 0; i < dimensions; i++) {
              newCentroid[i] += point[i];
            }
          }

          for (let i = 0; i < dimensions; i++) {
            newCentroid[i] /= clusterPoints.length;
          }

          centroids[cluster] = newCentroid;
        }
      }
    }

    // Group results by cluster
    const clusters: Array<{ cluster: number; texts: string[]; centroid: number[] }> = [];
    for (let cluster = 0; cluster < numClusters; cluster++) {
      const clusterTexts = texts.filter((_, i) => assignments[i] === cluster);
      if (clusterTexts.length > 0) {
        clusters.push({
          cluster,
          texts: clusterTexts,
          centroid: centroids[cluster],
        });
      }
    }

    return clusters;
  }

  /**
   * Get model information
   */
  getModelInfo(modelName?: 'multilingual-e5-small' | 'multilingual-e5-base'): EmbeddingModel {
    return this.models[modelName || this.defaultModel.name];
  }

  /**
   * Get all available models
   */
  getAvailableModels(): EmbeddingModel[] {
    return Object.values(this.models);
  }

  /**
   * Set default model
   */
  setDefaultModel(modelName: 'multilingual-e5-small' | 'multilingual-e5-base'): void {
    this.defaultModel = this.models[modelName];
  }
}
