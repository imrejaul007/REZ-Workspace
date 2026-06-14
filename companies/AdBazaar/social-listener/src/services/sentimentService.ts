import { Sentiment, ISentiment, Mention } from '../models';
import { createChildLogger } from 'utils/logger.js';
import { sentimentAnalysisTotal } from '../utils/metrics';

const logger = createChildLogger('SentimentService');

// Simple sentiment analysis based on keywords
const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic',
  'wonderful', 'perfect', 'happy', 'excited', 'beautiful', 'brilliant', 'outstanding',
  'superb', 'incredible', 'fabulous', 'terrific', 'magnificent', 'delighted', 'pleased'
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor',
  'disgusting', 'annoying', 'frustrating', 'useless', 'broken', 'failed', 'problem',
  'issue', 'complaint', 'angry', 'sad', 'pathetic', 'waste', 'scam', 'fraud'
];

export class SentimentService {
  async analyze(text: string): Promise<{
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    keywords: { positive: string[]; negative: string[]; neutral: string[] };
  }> {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    const positiveMatches = words.filter(w => POSITIVE_WORDS.some(pw => w.includes(pw)));
    const negativeMatches = words.filter(w => NEGATIVE_WORDS.some(nw => w.includes(nw)));

    const positiveCount = positiveMatches.length;
    const negativeCount = negativeMatches.length;
    const total = positiveCount + negativeCount;

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0;
    let confidence = 0.5;

    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      confidence = Math.min(total / 5, 1); // More matches = higher confidence

      if (score > 0.2) {
        label = 'positive';
      } else if (score < -0.2) {
        label = 'negative';
      }
    }

    sentimentAnalysisTotal.inc({ sentiment: label });

    return {
      label,
      score,
      confidence,
      keywords: {
        positive: [...new Set(positiveMatches)],
        negative: [...new Set(negativeMatches)],
        neutral: []
      }
    };
  }

  async recordSentiment(data: {
    userId: string;
    keywordId?: string;
    mentionId?: string;
    platform: string;
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    keywords: { positive: string[]; negative: string[]; neutral: string[] };
  }): Promise<ISentiment> {
    const sentiment = new Sentiment({
      ...data,
      analyzedAt: new Date()
    });

    await sentiment.save();
    return sentiment;
  }

  async analyzeAndRecord(data: {
    userId: string;
    keywordId?: string;
    mentionId?: string;
    platform: string;
    content: string;
  }): Promise<ISentiment> {
    const analysis = await this.analyze(data.content);

    const sentiment = await this.recordSentiment({
      userId: data.userId,
      keywordId: data.keywordId,
      mentionId: data.mentionId,
      platform: data.platform,
      ...analysis
    });

    // Update mention with sentiment if mentionId provided
    if (data.mentionId) {
      await Mention.findByIdAndUpdate(data.mentionId, {
        sentiment: analysis.label,
        sentimentScore: analysis.score
      });
    }

    return sentiment;
  }

  async getSentimentTrends(
    userId: string,
    options?: { keywordId?: string; startDate?: Date; endDate?: Date }
  ): Promise<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }[]> {
    const query: Record<string, unknown> = { userId };
    if (options?.keywordId) query.keywordId = options.keywordId;
    if (options?.startDate || options?.endDate) {
      query.analyzedAt = {};
      if (options.startDate) (query.analyzedAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (query.analyzedAt as Record<string, Date>).$lte = options.endDate;
    }

    const sentiments = await Sentiment.find(query).sort({ analyzedAt: 1 });

    const grouped: Record<string, { positive: number; negative: number; neutral: number }> = {};

    sentiments.forEach(s => {
      const dateKey = new Date(s.analyzedAt).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = { positive: 0, negative: 0, neutral: 0 };
      }
      grouped[dateKey][s.label]++;
    });

    return Object.entries(grouped).map(([date, counts]) => ({ date, ...counts }));
  }

  async getSentimentSummary(userId: string, keywordId?: string): Promise<{
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    avgScore: number;
    avgConfidence: number;
  }> {
    const query: Record<string, unknown> = { userId };
    if (keywordId) query.keywordId = keywordId;

    const sentiments = await Sentiment.find(query);

    if (sentiments.length === 0) {
      return {
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        avgScore: 0,
        avgConfidence: 0
      };
    }

    const counts = sentiments.reduce(
      (acc, s) => {
        acc[s.label]++;
        acc.scoreSum += s.score;
        acc.confidenceSum += s.confidence;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0, scoreSum: 0, confidenceSum: 0 }
    );

    return {
      total: sentiments.length,
      ...counts,
      avgScore: counts.scoreSum / sentiments.length,
      avgConfidence: counts.confidenceSum / sentiments.length
    };
  }
}

export const sentimentService = new SentimentService();