/**
 * AI Email Analyzer
 * Analyzes email content for sentiment, urgency, topics, and action items
 */

const { OpenAI } = require('openai');
const natural = require('natural');

class AIAnalyzer {
  constructor(config) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('Japanese', natural.PorterStemmer, 'afinn');
  }

  /**
   * Analyze email content using AI
   */
  async analyzeEmail(emailData) {
    try {
      const content = emailData.text || emailData.html || '';
      
      // Perform multiple analyses in parallel
      const [
        sentiment,
        urgency,
        topics,
        actionItems,
        dealReferences,
        youtubeReferences
      ] = await Promise.all([
        this.analyzeSentiment(content),
        this.analyzeUrgency(content, emailData.subject),
        this.extractTopics(content),
        this.extractActionItems(content),
        this.findDealReferences(content),
        this.findYouTubeReferences(content)
      ]);

      return {
        sentiment,
        urgency,
        topics,
        actionItems,
        dealReferences,
        youtubeReferences,
        summary: await this.generateSummary(content),
        language: this.detectLanguage(content),
        keyPhrases: await this.extractKeyPhrases(content)
      };
    } catch (error) {
      console.error('Error analyzing email:', error);
      // Return default analysis on error
      return {
        sentiment: 'neutral',
        urgency: 'normal',
        topics: [],
        actionItems: [],
        dealReferences: [],
        youtubeReferences: [],
        summary: '',
        language: 'ja',
        keyPhrases: []
      };
    }
  }

  /**
   * Analyze sentiment of email content
   */
  async analyzeSentiment(content) {
    try {
      // Use OpenAI for more accurate sentiment analysis
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analyzer. Analyze the sentiment of the email and respond with only one word: positive, negative, or neutral.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      const sentiment = response.choices[0].message.content.toLowerCase().trim();
      return ['positive', 'negative', 'neutral'].includes(sentiment) ? sentiment : 'neutral';
    } catch (error) {
      // Fallback to local sentiment analysis
      const tokens = this.tokenizer.tokenize(content);
      const score = this.sentimentAnalyzer.getSentiment(tokens);
      
      if (score > 0.1) return 'positive';
      if (score < -0.1) return 'negative';
      return 'neutral';
    }
  }

  /**
   * Analyze urgency of email
   */
  async analyzeUrgency(content, subject) {
    const urgentKeywords = [
      '緊急', '至急', '急ぎ', '即座', '今すぐ', 'ASAP', 'urgent', 
      '締切', '期限', 'deadline', '本日中', '今日中', '明日まで'
    ];

    const highPriorityIndicators = [
      '重要', 'important', '優先', 'priority', 'critical', 
      'クリティカル', '深刻', '問題', 'issue', 'problem'
    ];

    const combinedText = `${subject} ${content}`.toLowerCase();

    // Check for urgent keywords
    const hasUrgentKeyword = urgentKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );

    // Check for high priority indicators
    const hasPriorityIndicator = highPriorityIndicators.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );

    // Use AI for nuanced analysis
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze the urgency level of this email. Respond with only one word: high, medium, or low.'
          },
          {
            role: 'user',
            content: `Subject: ${subject}\n\nContent: ${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      const urgency = response.choices[0].message.content.toLowerCase().trim();
      return ['high', 'medium', 'low'].includes(urgency) ? urgency : 'medium';
    } catch (error) {
      // Fallback logic
      if (hasUrgentKeyword) return 'high';
      if (hasPriorityIndicator) return 'medium';
      return 'low';
    }
  }

  /**
   * Extract main topics from email
   */
  async extractTopics(content) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Extract the main topics from this email. Return as a JSON array of strings (maximum 5 topics). Focus on business-relevant topics.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.5,
        max_tokens: 100
      });

      const topics = JSON.parse(response.choices[0].message.content);
      return Array.isArray(topics) ? topics.slice(0, 5) : [];
    } catch (error) {
      // Fallback to keyword extraction
      return this.extractKeywordsLocally(content);
    }
  }

  /**
   * Extract action items from email
   */
  async extractActionItems(content) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract action items from this email. Return as a JSON array of objects with:
              - title: brief description
              - description: detailed description
              - priority: high/medium/low
              - dueDate: ISO date string if mentioned, null otherwise`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const actionItems = JSON.parse(response.choices[0].message.content);
      return Array.isArray(actionItems) ? actionItems : [];
    } catch (error) {
      console.error('Error extracting action items:', error);
      return [];
    }
  }

  /**
   * Find references to deals or projects
   */
  async findDealReferences(content) {
    const dealPatterns = [
      /案件[#\s]*([\w\-]+)/g,
      /deal\s*#?\s*([\w\-]+)/gi,
      /project\s*#?\s*([\w\-]+)/gi,
      /プロジェクト[#\s]*([\w\-]+)/g,
      /見積[#\s]*([\w\-]+)/g,
      /quote\s*#?\s*([\w\-]+)/gi
    ];

    const references = new Set();

    for (const pattern of dealPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          references.add(match[1]);
        }
      }
    }

    return Array.from(references);
  }

  /**
   * Find YouTube video references
   */
  async findYouTubeReferences(content) {
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]+)/gi,
      /youtube\.com\/embed\/([\w\-]+)/gi,
      /動画ID[:\s]*([\w\-]+)/g,
      /video\s*id[:\s]*([\w\-]+)/gi
    ];

    const videos = [];

    for (const pattern of youtubePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          videos.push({
            videoId: match[1],
            url: `https://www.youtube.com/watch?v=${match[1]}`,
            context: this.extractContext(content, match.index, 50)
          });
        }
      }
    }

    return videos;
  }

  /**
   * Generate email summary
   */
  async generateSummary(content) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Summarize this email in 2-3 sentences. Focus on the main points and any requests or important information.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.5,
        max_tokens: 150
      });

      return response.choices[0].message.content;
    } catch (error) {
      return content.substring(0, 200) + '...';
    }
  }

  /**
   * Detect language of content
   */
  detectLanguage(content) {
    // Simple language detection based on character sets
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const hasJapanese = japaneseRegex.test(content);
    
    return hasJapanese ? 'ja' : 'en';
  }

  /**
   * Extract key phrases from content
   */
  async extractKeyPhrases(content) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Extract 3-5 key phrases from this email that capture the main concepts. Return as a JSON array of strings.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.5,
        max_tokens: 100
      });

      const phrases = JSON.parse(response.choices[0].message.content);
      return Array.isArray(phrases) ? phrases : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Extract context around a match
   */
  extractContext(content, index, contextLength = 50) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return content.substring(start, end).trim();
  }

  /**
   * Local keyword extraction fallback
   */
  extractKeywordsLocally(content) {
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(content);
    
    const keywords = [];
    tfidf.listTerms(0).forEach((item, index) => {
      if (index < 5 && item.tfidf > 0.1) {
        keywords.push(item.term);
      }
    });
    
    return keywords;
  }
}

module.exports = { AIAnalyzer };