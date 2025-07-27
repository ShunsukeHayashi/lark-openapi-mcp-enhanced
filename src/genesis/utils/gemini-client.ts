/**
 * Gemini API Client
 * Google Gemini APIとの連携クライアント
 */

import axios, { AxiosInstance } from 'axios';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Gemini APIクライアント
 */
export class GeminiClient {
  private config: Required<GeminiConfig>;
  private httpClient: AxiosInstance;

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-1.5-flash',
      baseURL: 'https://generativelanguage.googleapis.com',
      maxRetries: 5, // Increased retries for rate limiting
      timeoutMs: 60000, // Increased timeout for rate limited requests
      ...config,
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * テキスト生成リクエスト
   */
  async generateContent(
    prompt: string,
    options: {
      temperature?: number;
      maxOutputTokens?: number;
      responseFormat?: 'text' | 'json';
    } = {},
  ): Promise<string> {
    const request: GeminiRequest = {
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
        temperature: options.temperature || 0.1,
        maxOutputTokens: options.maxOutputTokens || 8192,
        responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain',
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

    const url = `/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post<GeminiResponse>(url, request);

        if (!response.data.candidates || response.data.candidates.length === 0) {
          throw new Error('No candidates returned from Gemini API');
        }

        const candidate = response.data.candidates[0];

        if (candidate.finishReason !== 'STOP') {
          throw new Error(`Generation failed with reason: ${candidate.finishReason}`);
        }

        const content = candidate.content.parts[0]?.text;
        if (!content) {
          throw new Error('No text content in response');
        }

        return content;
      } catch (error: any) {
        lastError = error;

        // Handle authentication errors - don't retry
        if (error.response?.status === 401) {
          throw new Error(`Authentication failed: ${error.response?.data?.error?.message || 'Invalid API key'}`);
        }

        // Handle API logic errors - don't retry
        if (
          error.message &&
          (error.message.includes('No candidates returned') ||
            error.message.includes('Generation failed with reason') ||
            error.message.includes('No text content in response'))
        ) {
          throw error;
        }

        // Handle rate limit errors with longer backoff
        if (error.response?.status === 429 || error.message?.includes('rate limit')) {
          if (attempt < this.config.maxRetries - 1) {
            const delay = Math.pow(2, attempt + 2) * 2000; // Longer exponential backoff for rate limits
            console.log(`Rate limit hit, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw new Error('Gemini API rate limit exceeded');
          }
        } else if (attempt < this.config.maxRetries - 1) {
          const delay = Math.pow(2, attempt + 1) * 1000; // Standard exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * 構造化データ生成（JSONレスポンス）
   */
  async generateStructuredContent(
    prompt: string,
    schema: any,
    options: {
      temperature?: number;
      maxOutputTokens?: number;
    } = {},
  ): Promise<any> {
    // スキーマ情報をプロンプトに追加
    const enhancedPrompt = `
${prompt}

重要：レスポンスは必ず有効なJSONフォーマットで返してください。以下のスキーマに従ってください：

スキーマ：
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

JSONレスポンス：
`;

    const content = await this.generateContent(enhancedPrompt, {
      ...options,
      responseFormat: 'json',
    });

    try {
      // JSONパース
      const parsed = JSON.parse(content);

      // 基本的なスキーマ検証
      this.validateSchema(parsed, schema);

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }

  /**
   * バッチ処理用のマルチプロンプト生成
   */
  async generateBatch(
    prompts: Array<{
      id: string;
      prompt: string;
      options?: any;
    }>,
  ): Promise<
    Array<{
      id: string;
      result: string;
      error?: string;
    }>
  > {
    const results = await Promise.allSettled(
      prompts.map(async ({ id, prompt, options }) => {
        try {
          const result = await this.generateContent(prompt, options);
          return { id, result };
        } catch (error: any) {
          return { id, result: '', error: error.message };
        }
      }),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: prompts[index].id,
          result: '',
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * 基本的なスキーマ検証
   */
  private validateSchema(data: any, schema: any): void {
    // 必須フィールドの検証
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new Error(`Required field '${field}' is missing`);
        }
      }
    }

    // プロパティの型検証（基本的なもの）
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as any)) {
        if (key in data) {
          const value = data[key];
          const expectedType = (propSchema as any).type;

          if (expectedType && !this.isValidType(value, expectedType)) {
            throw new Error(`Field '${key}' has invalid type. Expected: ${expectedType}`);
          }
        }
      }
    }
  }

  /**
   * 型検証ヘルパー
   */
  private isValidType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * API使用量統計の取得
   */
  getUsageStats(): {
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
  } {
    // 実装予定：使用量統計の追跡
    return {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.generateContent('Hello', { maxOutputTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}
