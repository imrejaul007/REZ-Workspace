import { createModuleLogger } from 'utils/logger.js';
import { Sentiment } from '../types';

const logger = createModuleLogger('SentimentService');

interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;
  keywords: string[];
}

export class SentimentService {
  // Simple keyword-based sentiment analysis
  private readonly positiveKeywords = [
    'thank', 'thanks', 'great', 'good', 'excellent', 'amazing', 'love', 'awesome',
    'helpful', 'perfect', 'wonderful', 'fantastic', 'best', 'happy', 'pleased',
    'appreciate', 'impressed', 'brilliant', 'superb', 'outstanding', 'cool',
    'nice', 'beautiful', 'enjoy', 'satisfied', 'recommend', 'favorite', 'win',
    'won', 'success', 'successful', 'resolved', 'fixed', 'working', 'works',
    'quick', 'fast', 'efficient', 'professional', 'friendly', 'recommend',
  ];

  private readonly negativeKeywords = [
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'angry', 'frustrated',
    'disappointed', 'poor', 'useless', 'broken', 'bug', 'error', 'fail', 'failed',
    'problem', 'issue', 'trouble', 'annoying', 'slow', 'rude', 'unhappy', 'upset',
    'complaint', 'refund', 'cancel', 'scam', 'fraud', 'waste', 'junk', 'garbage',
    'never', 'wrong', 'mistake', 'sorry', 'apologize', 'regret', 'disappointed',
    'unacceptable', 'ridiculous', 'pathetic', 'incompetent', 'worse',
  ];

  /**
   * Analyze sentiment of text
   */
  analyze(text: string): SentimentResult {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];

    // Count keyword occurrences
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (this.positiveKeywords.some(kw => cleanWord.includes(kw) || kw.includes(cleanWord))) {
        positiveCount++;
        const matched = this.positiveKeywords.find(kw => cleanWord.includes(kw) || kw.includes(cleanWord));
        if (matched) foundKeywords.push(matched);
      }
      if (this.negativeKeywords.some(kw => cleanWord.includes(kw) || kw.includes(cleanWord))) {
        negativeCount++;
        const matched = this.negativeKeywords.find(kw => cleanWord.includes(kw) || kw.includes(cleanWord));
        if (matched && !foundKeywords.includes(matched)) foundKeywords.push(matched);
      }
    }

    // Check for exclamation marks and caps (intensity indicators)
    const hasExclamation = /!/.test(text);
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    const hasEmphasis = hasExclamation || capsRatio > 0.2;

    // Calculate sentiment
    let sentiment: Sentiment;
    let confidence: number;

    const total = positiveCount + negativeCount;
    if (total === 0) {
      sentiment = 'neutral';
      confidence = 0.5;
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = hasEmphasis ? 0.9 : 0.7;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = hasEmphasis ? 0.9 : 0.7;
    } else {
      sentiment = hasEmphasis ? 'negative' : 'neutral';
      confidence = 0.5;
    }

    logger.debug('Sentiment analyzed', { text: text.substring(0, 50), sentiment, confidence });
    return { sentiment, confidence, keywords: foundKeywords };
  }

  /**
   * Batch analyze sentiment
   */
  analyzeBatch(texts: string[]): SentimentResult[] {
    return texts.map(text => this.analyze(text));
  }

  /**
   * Detect priority based on keywords
   */
  detectPriority(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();

    const urgentKeywords = [
      'urgent', 'emergency', 'immediately', 'asap', 'critical', 'crisis',
      'deadline', 'important', 'serious', 'problem', 'issue', 'broken',
      'not working', 'down', 'outage', 'security', 'breach', 'hacked',
      'lost', 'stolen', 'refund', 'lawsuit', 'legal',
    ];

    const mediumKeywords = [
      'question', 'help', 'need', 'want', 'please', 'when', 'how',
      'status', 'update', 'information', 'details', 'wondering',
    ];

    for (const keyword of urgentKeywords) {
      if (lowerText.includes(keyword)) return 'high';
    }

    for (const keyword of mediumKeywords) {
      if (lowerText.includes(keyword)) return 'medium';
    }

    return 'low';
  }

  /**
   * Extract intent from message
   */
  extractIntent(text: string): string {
    const lowerText = text.toLowerCase();

    const intents = [
      { name: 'complaint', patterns: ['complaint', 'problem', 'issue', 'wrong', 'bad', 'hate', 'disappointed'] },
      { name: 'inquiry', patterns: ['how', 'what', 'when', 'where', 'why', 'question', 'wondering'] },
      { name: 'request', patterns: ['please', 'can you', 'need', 'want', 'would like', 'request'] },
      { name: 'feedback', patterns: ['feedback', 'suggestion', 'idea', 'recommend', 'think'] },
      { name: 'cancellation', patterns: ['cancel', 'refund', 'return', 'undo'] },
      { name: 'support', patterns: ['help', 'support', 'assist', 'service', 'contact'] },
      { name: 'purchase', patterns: ['buy', 'order', 'purchase', 'checkout', 'cart'] },
      { name: 'greeting', patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon'] },
      { name: 'thanks', patterns: ['thank', 'thanks', 'appreciate', 'grateful'] },
      { name: 'escalation', patterns: ['manager', 'supervisor', 'escalate', 'speak to', 'talk to'] },
    ];

    for (const intent of intents) {
      for (const pattern of intent.patterns) {
        if (lowerText.includes(pattern)) {
          return intent.name;
        }
      }
    }

    return 'general';
  }

  /**
   * Extract tags from message
   */
  extractTags(text: string): string[] {
    const lowerText = text.toLowerCase();
    const tags: string[] = [];

    // Product-related tags
    const products = ['app', 'website', 'mobile', 'desktop', 'ios', 'android', 'web'];
    for (const product of products) {
      if (lowerText.includes(product)) tags.push(product);
    }

    // Topic-related tags
    const topics = [
      { tag: 'billing', patterns: ['bill', 'payment', 'charge', 'invoice', 'subscription', 'price', 'cost'] },
      { tag: 'technical', patterns: ['bug', 'error', 'crash', 'slow', 'loading', 'not working'] },
      { tag: 'account', patterns: ['account', 'login', 'password', 'profile', 'settings'] },
      { tag: 'shipping', patterns: ['shipping', 'delivery', 'order', 'package', 'tracking'] },
      { tag: 'refund', patterns: ['refund', 'return', 'money back', 'cancel'] },
    ];

    for (const topic of topics) {
      for (const pattern of topic.patterns) {
        if (lowerText.includes(pattern)) {
          tags.push(topic.tag);
          break;
        }
      }
    }

    return [...new Set(tags)];
  }
}
