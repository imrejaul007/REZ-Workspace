/**
 * Feedback Survey Service
 * Port: 3820
 *
 * Mid-stay feedback, NPS tracking, sentiment analysis
 * "Guest stays → feedback collected → issues resolved → satisfaction improved"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3820;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface Survey {
  id: string;
  guestId: string;
  hotelId: string;
  bookingId: string;
  type: 'mid_stay' | 'checkout' | 'custom';
  status: 'pending' | 'sent' | 'completed';
  npsScore?: number; // 0-10
  responses: SurveyResponse[];
  sentiment: 'positive' | 'neutral' | 'negative';
  issues: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface SurveyResponse {
  questionId: string;
  question: string;
  answer: string | number;
  category: string;
}

interface SurveyTemplate {
  id: string;
  name: string;
  type: 'mid_stay' | 'checkout';
  questions: {
    id: string;
    text: string;
    type: 'rating' | 'text' | 'choice' | 'nps';
    category: string;
    required: boolean;
    options?: string[];
  }[];
  active: boolean;
}

// Demo templates
const templates: SurveyTemplate[] = [
  {
    id: 'mid_stay',
    name: 'Mid-Stay Check',
    type: 'mid_stay',
    active: true,
    questions: [
      { id: 'q1', text: 'How would you rate your room so far?', type: 'rating', category: 'room', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'q2', text: 'How would you rate our service?', type: 'rating', category: 'service', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'q3', text: 'Is there anything we can improve?', type: 'text', category: 'feedback', required: false },
      { id: 'q4', text: 'How likely are you to recommend us?', type: 'nps', category: 'nps', required: true }
    ]
  },
  {
    id: 'checkout',
    name: 'Checkout Survey',
    type: 'checkout',
    active: true,
    questions: [
      { id: 'q1', text: 'How was your overall experience?', type: 'rating', category: 'overall', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'q2', text: 'How clean was your room?', type: 'rating', category: 'cleanliness', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'q3', text: 'How was the check-in experience?', type: 'rating', category: 'checkin', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'q4', text: 'How was the check-out experience?', type: 'rating', category: 'checkout', required: true, options: ['1', '2', '3', '4', '5'] },
      { id: 'q5', text: 'Any comments or suggestions?', type: 'text', category: 'feedback', required: false },
      { id: 'q6', text: 'How likely are you to recommend us?', type: 'nps', category: 'nps', required: true }
    ]
  }
];

const surveys: Map<string, Survey> = new Map();

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'feedback-survey', port: PORT });
});

// Get survey template
app.get('/templates/:type', (req, res) => {
  const template = templates.find(t => t.type === req.params.type && t.active);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ template });
});

// Create survey
app.post('/surveys', async (req: Request, res: Response) => {
  const { guestId, hotelId, bookingId, type = 'mid_stay' } = req.body;

  const survey: Survey = {
    id: uuidv4(),
    guestId,
    hotelId,
    bookingId,
    type,
    status: 'pending',
    responses: [],
    issues: [],
    createdAt: new Date()
  };

  surveys.set(survey.id, survey);

  // Send survey
  await sendSurvey(survey);

  res.json({ survey });
});

// Get survey
app.get('/surveys/:id', (req, res) => {
  const survey = surveys.get(req.params.id);
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const template = templates.find(t => t.type === survey.type);
  res.json({ survey, template });
});

// Submit survey responses
app.post('/surveys/:id/respond', async (req: Request, res: Response) => {
  const { responses } = req.body;

  const survey = surveys.get(req.params.id);
  if (!survey) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  if (survey.status === 'completed') {
    return res.status(400).json({ error: 'Survey already completed' });
  }

  survey.responses = responses;
  survey.status = 'completed';
  survey.completedAt = new Date();

  // Calculate NPS
  const npsResponse = responses.find((r: any) => r.questionId?.includes('nps') || r.question === 'How likely are you to recommend us?');
  if (npsResponse) {
    survey.npsScore = parseInt(npsResponse.answer);
  }

  // Analyze sentiment and extract issues
  const analysis = analyzeResponses(responses);
  survey.sentiment = analysis.sentiment;
  survey.issues = analysis.issues;

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('feedback.survey.completed', Buffer.from(JSON.stringify(survey)));
  } catch (e) { /* Rabbit optional */ }

  // Alert for negative feedback
  if (survey.sentiment === 'negative' || (survey.npsScore && survey.npsScore <= 6)) {
    await alertForIssues(survey);
  }

  logger.info('Survey completed', { surveyId: survey.id, nps: survey.npsScore, sentiment: survey.sentiment });

  res.json({ survey });
});

// Get guest surveys
app.get('/guests/:guestId/surveys', (req, res) => {
  const guestSurveys = Array.from(surveys.values()).filter(s => s.guestId === req.params.guestId);
  res.json({ surveys: guestSurveys });
});

// Get hotel feedback stats
app.get('/hotels/:hotelId/stats', (req, res) => {
  const hotelSurveys = Array.from(surveys.values()).filter(s => s.hotelId === req.params.hotelId && s.status === 'completed');

  if (hotelSurveys.length === 0) {
    return res.json({ stats: null, message: 'No feedback yet' });
  }

  const avgRating = hotelSurveys.reduce((sum, s) => {
    const rating = s.responses.find(r => r.category === 'overall' || r.category === 'room');
    return sum + (rating ? parseInt(rating.answer as string) : 0);
  }, 0) / hotelSurveys.length;

  const npsScores = hotelSurveys.map(s => s.npsScore).filter(Boolean) as number[];
  const avgNPS = npsScores.length > 0 ? npsScores.reduce((sum, n) => sum + n, 0) / npsScores.length : 0;

  const sentimentCounts = {
    positive: hotelSurveys.filter(s => s.sentiment === 'positive').length,
    neutral: hotelSurveys.filter(s => s.sentiment === 'neutral').length,
    negative: hotelSurveys.filter(s => s.sentiment === 'negative').length
  };

  // Aggregate issues
  const allIssues = hotelSurveys.flatMap(s => s.issues);
  const issueCounts = allIssues.reduce((acc, issue) => {
    acc[issue] = (acc[issue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    stats: {
      totalResponses: hotelSurveys.length,
      averageRating: avgRating.toFixed(2),
      averageNPS: avgNPS.toFixed(1),
      sentimentCounts,
      topIssues: Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count }))
    }
  });
});

// ============ HELPERS ============

function analyzeResponses(responses: SurveyResponse[]): { sentiment: 'positive' | 'neutral' | 'negative'; issues: string[] } {
  const issues: string[] = [];
  let totalScore = 0;
  let count = 0;

  for (const response of responses) {
    if (response.type === 'rating' || response.type === 'nps') {
      const score = parseInt(response.answer as string);
      totalScore += score;
      count++;

      if (response.type === 'rating' && score <= 2) {
        issues.push(`${response.category} needs improvement`);
      }
 }

    if (response.type === 'text' && response.answer) {
      const text = response.answer as string;
      const textIssues = extractIssues(text);
      issues.push(...textIssues);
    }
  }

  const avgScore = count > 0 ? totalScore / count : 3;
  let sentiment: 'positive' | 'neutral' | 'negative';
  if (avgScore >= 4) sentiment = 'positive';
  else if (avgScore <= 2) sentiment = 'negative';
  else sentiment = 'neutral';

  return { sentiment, issues: [...new Set(issues)] };
}

function extractIssues(text: string): string[] {
  const issues: string[] = [];
  const issuePatterns = [
    { pattern: /dirty|clean|cleaning|room clean/i, issue: 'Cleanliness' },
    { pattern: /noise|noisy|loud|sound/i, issue: 'Noise' },
    { pattern: /service|slow|wait|staff/i, issue: 'Service quality' },
    { pattern: /ac|air|cool|heat|temperature/i, issue: 'AC/Temperature' },
    { pattern: /wifi|internet|connect/i, issue: 'WiFi' },
    { pattern: /bathroom|shower|water|hot water/i, issue: 'Bathroom' },
    { pattern: /bed|sleep|comfort|mattress/i, issue: 'Bed comfort' },
    { pattern: /check.*in|check.*out|front desk/i, issue: 'Check-in/out process' }
  ];

  for (const { pattern, issue } of issuePatterns) {
    if (pattern.test(text)) {
      issues.push(issue);
    }
  }

  return issues;
}

async function sendSurvey(survey: Survey) {
  survey.status = 'sent';

  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('feedback.survey.sent', Buffer.from(JSON.stringify(survey)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Survey sent', { surveyId: survey.id, type: survey.type });
}

async function alertForIssues(survey: Survey) {
  // In production, this would alert management via SMS/email
  logger.warn('Negative feedback alert', { surveyId: survey.id, issues: survey.issues });
}

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Feedback Survey Service initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Feedback Survey Service running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
