/**
 * Sentiment Analysis Service
 * Text sentiment analysis, trends, and alerts for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3022;
const SERVICE_NAME = 'sentiment-analysis-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type SentimentLabel = 'positive' | 'negative' | 'neutral';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SentimentResult {
  id: string;
  customerId?: string;
  text: string;
  label: SentimentLabel;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  aspects: AspectSentiment[];
  language?: string;
  analyzedAt: Date;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: SentimentLabel;
  score: number;
  mentions: number;
}

export interface SentimentTrend {
  customerId?: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
  dataPoints: TrendDataPoint[];
}

export interface TrendDataPoint {
  timestamp: Date;
  score: number;
  volume: number;
}

export interface SentimentAlert {
  id: string;
  customerId?: string;
  type: 'negative_trend' | 'sharp_decline' | 'positive_spike' | 'mention_threshold';
  severity: AlertSeverity;
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'negative_trend' | 'sharp_decline' | 'positive_spike' | 'mention_threshold';
  condition: AlertCondition;
  severity: AlertSeverity;
  active: boolean;
  createdAt: Date;
}

export interface AlertCondition {
  threshold?: number;
  timeframe?: string;
  mentions?: number;
  declinePercent?: number;
}

export interface CustomerSentimentProfile {
  customerId: string;
  overallScore: number;
  overallLabel: SentimentLabel;
  totalAnalyses: number;
  lastAnalyzedAt: Date;
  topPositiveAspects: string[];
  topNegativeAspects: string[];
  alerts: SentimentAlert[];
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const sentimentResults: Map<string, SentimentResult> = new Map();
const alerts: Map<string, SentimentAlert> = new Map();
const alertRules: Map<string, AlertRule> = new Map();
const customerProfiles: Map<string, CustomerSentimentProfile> = new Map();

// ============================================================================
// Sentiment Lexicons (Simplified)
// ============================================================================

const positiveWords = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'loved',
  'best', 'perfect', 'awesome', 'happy', 'pleased', 'satisfied', 'recommend', 'helpful',
  'friendly', 'professional', 'quick', 'easy', 'fast', 'smooth', 'efficient', 'quality',
  'beautiful', 'clean', 'fresh', 'delicious', 'outstanding', 'exceptional', 'brilliant',
  'incredible', 'superb', 'terrific', 'magnificent', 'delightful', 'pleasant', 'impressive',
  'thank', 'thanks', 'grateful', 'appreciate', 'appreciated', 'nice', 'lovely', 'sweet'
]);

const negativeWords = new Set([
  'bad', 'terrible', 'horrible', 'awful', 'worst', 'hate', 'hated', 'poor', 'disappointed',
  'disappointing', 'frustrating', 'frustrated', 'angry', 'annoyed', 'annoying', 'slow',
  'rude', 'unprofessional', 'broken', 'damaged', 'useless', 'waste', 'overpriced', 'expensive',
  'never', 'problem', 'problems', 'issue', 'issues', 'complaint', 'complain', 'refund',
  'cancel', 'cancelled', 'scam', 'fraud', 'fake', 'lies', 'lying', 'misleading', 'terrible',
  'dreadful', 'appalling', 'atrocious', 'abysmal', 'inferior', 'defective', 'faulty'
]);

const aspectKeywords: Record<string, string[]> = {
  service: ['service', 'staff', 'employee', 'representative', 'support', 'help', 'assistance'],
  quality: ['quality', 'product', 'item', 'materials', 'craftsmanship', 'build'],
  price: ['price', 'cost', 'value', 'money', 'worth', 'affordable', 'expensive', 'cheap'],
  delivery: ['delivery', 'shipping', 'arrived', 'packaging', 'wait', 'time', 'fast', 'slow'],
  cleanliness: ['clean', 'dirty', 'hygiene', 'sanitary', 'tidy', 'neat', 'messy'],
  food: ['food', 'meal', 'eat', 'taste', 'flavor', 'dish', 'restaurant', 'menu'],
  ambiance: ['ambiance', 'atmosphere', 'music', 'decor', 'setting', 'environment', 'vibe'],
  communication: ['communication', 'response', 'reply', 'email', 'call', 'contact', 'inform']
};

// ============================================================================
// Sentiment Analysis Functions
// ============================================================================

function analyzeText(text: string): { label: SentimentLabel; score: number; confidence: number } {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  let negations = 0;

  const negationWords = ['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere'];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';

    if (positiveWords.has(word)) {
      if (negationWords.includes(prevWord)) {
        negativeCount++;
      } else {
        positiveCount++;
      }
    }
    if (negativeWords.has(word)) {
      if (negationWords.includes(prevWord)) {
        positiveCount++;
      } else {
        negativeCount++;
      }
    }
    if (negationWords.includes(word)) {
      negations++;
    }
  }

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { label: 'neutral', score: 0, confidence: 0.5 };
  }

  const rawScore = (positiveCount - negativeCount) / total;
  const confidence = Math.min(0.5 + (total / words.length) * 2, 1);

  let label: SentimentLabel;
  if (rawScore > 0.1) label = 'positive';
  else if (rawScore < -0.1) label = 'negative';
  else label = 'neutral';

  return { label, score: Math.max(-1, Math.min(1, rawScore)), confidence };
}

function extractAspectSentiments(text: string): AspectSentiment[] {
  const textLower = text.toLowerCase();
  const aspects: AspectSentiment[] = [];

  for (const [aspect, keywords] of Object.entries(aspectKeywords)) {
    const matchingKeywords = keywords.filter(kw => textLower.includes(kw));
    if (matchingKeywords.length > 0) {
      const surroundingText = matchingKeywords
        .map(kw => {
          const index = textLower.indexOf(kw);
          return text.substring(Math.max(0, index - 50), Math.min(text.length, index + 100));
        })
        .join(' ');

      const { label, score } = analyzeText(surroundingText);

      aspects.push({
        aspect,
        sentiment: label,
        score,
        mentions: matchingKeywords.length
      });
    }
  }

  return aspects;
}

function detectLanguage(text: string): string {
  const hindiIndicators = ['hai', 'ke', 'ka', 'ki', 'ko', 'se', 'meri', 'apka', 'aap', 'kya', 'nahi', 'haan'];
  const spanishIndicators = ['el', 'la', 'los', 'las', 'de', 'que', 'es', 'en', 'un', 'una', 'por', 'con'];

  const words = text.toLowerCase().split(/\s+/);
  let hindiScore = 0;
  let spanishScore = 0;

  for (const word of words) {
    if (hindiIndicators.includes(word)) hindiScore++;
    if (spanishIndicators.includes(word)) spanishScore++;
  }

  if (hindiScore > 2) return 'hi';
  if (spanishScore > 3) return 'es';
  return 'en';
}

async function checkAlertRules(result: SentimentResult): Promise<void> {
  for (const rule of alertRules.values()) {
    if (!rule.active) continue;

    let triggered = false;

    if (rule.type === 'negative_trend' && result.label === 'negative') {
      triggered = Math.random() < 0.1;
    } else if (rule.type === 'sharp_decline' && result.score < -0.5) {
      triggered = true;
    } else if (rule.type === 'positive_spike' && result.score > 0.7) {
      triggered = true;
    }

    if (triggered) {
      const alert: SentimentAlert = {
        id: uuidv4(),
        customerId: result.customerId,
        type: rule.type,
        severity: rule.severity,
        message: `Sentiment alert triggered: ${rule.name}`,
        triggeredAt: new Date(),
        acknowledged: false
      };
      alerts.set(alert.id, alert);
      logger.info(`Alert triggered: ${alert.id} - ${alert.message}`);
    }
  }
}

function calculateTrend(customerId: string, period: 'hour' | 'day' | 'week' | 'month'): SentimentTrend {
  const results = Array.from(sentimentResults.values())
    .filter(r => r.customerId === customerId)
    .sort((a, b) => a.analyzedAt.getTime() - b.analyzedAt.getTime());

  if (results.length < 2) {
    return {
      customerId,
      period,
      startDate: new Date(),
      endDate: new Date(),
      averageScore: results[0]?.score || 0,
      trend: 'stable',
      changePercent: 0,
      dataPoints: []
    };
  }

  const now = new Date();
  const periodMs: Record<string, number> = {
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000
  };

  const startDate = new Date(now.getTime() - periodMs[period] * 10);
  const filteredResults = results.filter(r => r.analyzedAt >= startDate);

  const scores = filteredResults.map(r => r.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const recentHalf = scores.slice(Math.floor(scores.length / 2));
  const olderHalf = scores.slice(0, Math.floor(scores.length / 2));

  const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / (recentHalf.length || 1);
  const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / (olderHalf.length || 1);

  const changePercent = olderAvg !== 0 ? ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100 : 0;

  let trend: 'improving' | 'stable' | 'declining';
  if (changePercent > 10) trend = 'improving';
  else if (changePercent < -10) trend = 'declining';
  else trend = 'stable';

  return {
    customerId,
    period,
    startDate,
    endDate: now,
    averageScore,
    trend,
    changePercent,
    dataPoints: filteredResults.map(r => ({
      timestamp: r.analyzedAt,
      score: r.score,
      volume: 1
    }))
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * Analyze text sentiment
 */
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { text, customerId, metadata } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for analysis' });
      return;
    }

    const { label, score, confidence } = analyzeText(text);
    const aspects = extractAspectSentiments(text);
    const language = detectLanguage(text);

    const result: SentimentResult = {
      id: uuidv4(),
      customerId,
      text: text.substring(0, 5000),
      label,
      score,
      confidence,
      aspects,
      language,
      analyzedAt: new Date()
    };

    sentimentResults.set(result.id, result);
    await checkAlertRules(result);

    if (customerId) {
      updateCustomerProfile(customerId, result);
    }

    logger.info(`Analyzed sentiment: ${result.id} - ${label} (${score.toFixed(2)})`);
    res.json(result);
  } catch (error) {
    logger.error(`Analysis error: ${error}`);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

/**
 * Batch analyze multiple texts
 */
app.post('/api/analyze/batch', async (req: Request, res: Response) => {
  const { texts, customerId } = req.body;

  if (!texts || !Array.isArray(texts)) {
    res.status(400).json({ error: 'Texts array is required' });
    return;
  }

  const results: SentimentResult[] = [];

  for (const text of texts) {
    const { label, score, confidence } = analyzeText(text);
    const aspects = extractAspectSentiments(text);

    const result: SentimentResult = {
      id: uuidv4(),
      customerId,
      text: text.substring(0, 5000),
      label,
      score,
      confidence,
      aspects,
      language: detectLanguage(text),
      analyzedAt: new Date()
    };

    sentimentResults.set(result.id, result);
    results.push(result);
  }

  res.json(results);
});

/**
 * Get analysis results
 */
app.get('/api/results', (req: Request, res: Response) => {
  const { customerId, label, startDate, endDate, limit } = req.query;

  let filtered = Array.from(sentimentResults.values());

  if (customerId) {
    filtered = filtered.filter(r => r.customerId === customerId);
  }
  if (label) {
    filtered = filtered.filter(r => r.label === label);
  }
  if (startDate) {
    filtered = filtered.filter(r => r.analyzedAt >= new Date(startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter(r => r.analyzedAt <= new Date(endDate as string));
  }

  filtered.sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime());

  const limitNum = limit ? parseInt(limit as string) : 100;
  res.json(filtered.slice(0, limitNum));
});

/**
 * Get trend for customer or overall
 */
app.get('/api/trends', (req: Request, res: Response) => {
  const { customerId, period } = req.query;
  const p = (period as 'hour' | 'day' | 'week' | 'month') || 'day';

  if (customerId) {
    res.json(calculateTrend(customerId as string, p));
  } else {
    const results = Array.from(sentimentResults.values());
    const avgScore = results.length > 0
      ? results.reduce((a, b) => a + b.score, 0) / results.length
      : 0;

    const recent = results.slice(0, Math.floor(results.length / 2));
    const older = results.slice(Math.floor(results.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b.score, 0) / (recent.length || 1);
    const olderAvg = older.reduce((a, b) => a + b.score, 0) / (older.length || 1);
    const changePercent = olderAvg !== 0 ? ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100 : 0;

    res.json({
      period: p,
      averageScore: avgScore,
      trend: changePercent > 10 ? 'improving' : changePercent < -10 ? 'declining' : 'stable',
      changePercent,
      totalAnalyses: results.length
    });
  }
});

/**
 * Create alert rule
 */
app.post('/api/alerts/rules', (req: Request, res: Response) => {
  const { name, type, condition, severity } = req.body;

  if (!name || !type || !severity) {
    res.status(400).json({ error: 'Missing required fields: name, type, severity' });
    return;
  }

  const rule: AlertRule = {
    id: uuidv4(),
    name,
    type,
    condition: condition || {},
    severity,
    active: true,
    createdAt: new Date()
  };

  alertRules.set(rule.id, rule);
  res.status(201).json(rule);
});

/**
 * Get all alerts
 */
app.get('/api/alerts', (req: Request, res: Response) => {
  const { acknowledged, severity, customerId } = req.query;

  let filtered = Array.from(alerts.values());

  if (acknowledged !== undefined) {
    filtered = filtered.filter(a => a.acknowledged === (acknowledged === 'true'));
  }
  if (severity) {
    filtered = filtered.filter(a => a.severity === severity);
  }
  if (customerId) {
    filtered = filtered.filter(a => a.customerId === customerId);
  }

  res.json(filtered.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()));
});

/**
 * Acknowledge alert
 */
app.patch('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const alert = alerts.get(req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  alert.acknowledged = true;
  alert.acknowledgedBy = req.body.userId || 'system';
  alert.acknowledgedAt = new Date();

  res.json(alert);
});

/**
 * Get customer sentiment profile
 */
app.get('/api/profiles/:customerId', (req: Request, res: Response) => {
  const profile = customerProfiles.get(req.params.customerId);
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  res.json(profile);
});

/**
 * Get analytics summary
 */
app.get('/api/analytics', (req: Request, res: Response) => {
  const results = Array.from(sentimentResults.values());
  const allAlerts = Array.from(alerts.values());

  const byLabel = {
    positive: results.filter(r => r.label === 'positive').length,
    negative: results.filter(r => r.label === 'negative').length,
    neutral: results.filter(r => r.label === 'neutral').length
  };

  const avgScore = results.length > 0
    ? results.reduce((a, b) => a + b.score, 0) / results.length
    : 0;

  const unacknowledgedAlerts = allAlerts.filter(a => !a.acknowledged).length;

  res.json({
    totalAnalyses: results.length,
    byLabel,
    averageScore: avgScore,
    totalAlerts: allAlerts.length,
    unacknowledgedAlerts,
    topAspects: getTopAspects(results)
  });
});

function updateCustomerProfile(customerId: string, result: SentimentResult): void {
  let profile = customerProfiles.get(customerId);

  if (!profile) {
    profile = {
      customerId,
      overallScore: 0,
      overallLabel: 'neutral',
      totalAnalyses: 0,
      lastAnalyzedAt: new Date(),
      topPositiveAspects: [],
      topNegativeAspects: [],
      alerts: [],
      trend: 'stable'
    };
  }

  profile.overallScore = (profile.overallScore * profile.totalAnalyses + result.score) / (profile.totalAnalyses + 1);
  profile.overallLabel = profile.overallScore > 0.1 ? 'positive' : profile.overallScore < -0.1 ? 'negative' : 'neutral';
  profile.totalAnalyses++;
  profile.lastAnalyzedAt = new Date();

  const newAlerts = Array.from(alerts.values())
    .filter(a => a.customerId === customerId && !a.acknowledged);
  profile.alerts = newAlerts;

  const positiveAspects = result.aspects
    .filter(a => a.sentiment === 'positive')
    .map(a => a.aspect);
  const negativeAspects = result.aspects
    .filter(a => a.sentiment === 'negative')
    .map(a => a.aspect);

  profile.topPositiveAspects = [...new Set([...profile.topPositiveAspects, ...positiveAspects])].slice(0, 5);
  profile.topNegativeAspects = [...new Set([...profile.topNegativeAspects, ...negativeAspects])].slice(0, 5);

  profile.trend = calculateTrend(customerId, 'day').trend;

  customerProfiles.set(customerId, profile);
}

function getTopAspects(results: SentimentResult[]): Record<string, number> {
  const aspectCounts: Record<string, number> = {};

  for (const result of results) {
    for (const aspect of result.aspects) {
      aspectCounts[aspect.aspect] = (aspectCounts[aspect.aspect] || 0) + aspect.mentions;
    }
  }

  return Object.fromEntries(
    Object.entries(aspectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  );
}

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      analyses: sentimentResults.size,
      alerts: alerts.size,
      alertRules: alertRules.size,
      profiles: customerProfiles.size
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;
