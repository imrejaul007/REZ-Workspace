/**
 * Feedback Aggregation Service
 * NPS/CSAT, categorization, and action tracking for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3026;
const SERVICE_NAME = 'feedback-aggregation-service';

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

export type FeedbackType = 'nps' | 'csat' | 'ces' | 'product_review' | 'service_review' | 'general';
export type FeedbackCategory = 'product_quality' | 'customer_service' | 'pricing' | 'usability' | 'delivery' | 'features' | 'support' | 'other';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'wont_fix';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface Feedback {
  id: string;
  customerId?: string;
  type: FeedbackType;
  rating?: number;
  score?: number;
  comment?: string;
  categories: FeedbackCategory[];
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  productId?: string;
  orderId?: string;
  tags: string[];
  source: 'email' | 'sms' | 'in_app' | 'web' | 'social' | 'survey' | 'support';
  responseRequired: boolean;
  respondedAt?: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  responderId: string;
  responderName: string;
  message: string;
  createdAt: Date;
}

export interface FeedbackAction {
  id: string;
  feedbackId: string;
  assigneeId?: string;
  assigneeName?: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Survey {
  id: string;
  name: string;
  type: FeedbackType;
  questions: SurveyQuestion[];
  active: boolean;
  targetAudience: SurveyTarget;
  responseCount: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface SurveyQuestion {
  id: string;
  type: 'rating' | 'nps' | 'text' | 'multiple_choice' | 'scale';
  question: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface SurveyTarget {
  customerType?: 'all' | 'new' | 'existing' | 'vip';
  industry?: string[];
  tags?: string[];
  lastPurchaseDays?: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  customerId?: string;
  answers: SurveyAnswer[];
  completedAt: Date;
}

export interface SurveyAnswer {
  questionId: string;
  value: string | number | string[];
}

export interface FeedbackMetrics {
  totalFeedback: number;
  averageRating: number;
  npsScore: number;
  csatScore: number;
  cesScore: number;
  byType: Record<FeedbackType, number>;
  byCategory: Record<FeedbackCategory, number>;
  bySentiment: Record<SentimentLabel, number>;
  trend: 'improving' | 'stable' | 'declining';
  responseRate: number;
}

export interface CategoryTrend {
  category: FeedbackCategory;
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
  avgRating: number;
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const feedbackItems: Map<string, Feedback> = new Map();
const feedbackResponses: Map<string, FeedbackResponse> = new Map();
const feedbackActions: Map<string, FeedbackAction> = new Map();
const surveys: Map<string, Survey> = new Map();
const surveyResponses: Map<string, SurveyResponse> = new Map();
const categoryTrends: Map<string, CategoryTrend[]> = new Map();

// ============================================================================
// Initialize Sample Data
// ============================================================================

function initializeSampleData(): void {
  // Sample survey
  const npsSurvey: Survey = {
    id: uuidv4(),
    name: 'Customer Satisfaction Survey',
    type: 'nps',
    questions: [
      { id: uuidv4(), type: 'nps', question: 'How likely are you to recommend us to a friend?', required: true },
      { id: uuidv4(), type: 'rating', question: 'How would you rate your overall experience?', required: true, minValue: 1, maxValue: 5 },
      { id: uuidv4(), type: 'text', question: 'What could we improve?', required: false }
    ],
    active: true,
    targetAudience: { customerType: 'all' },
    responseCount: 0,
    createdAt: new Date()
  };
  surveys.set(npsSurvey.id, npsSurvey);

  // Sample feedback items
  const sampleFeedback: Feedback[] = [
    {
      id: uuidv4(),
      customerId: 'cust-001',
      type: 'nps',
      score: 9,
      comment: 'Great service! Would definitely recommend.',
      categories: ['customer_service'],
      sentiment: 'positive',
      tags: ['promoter', 'satisfied'],
      source: 'email',
      responseRequired: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      metadata: {}
    },
    {
      id: uuidv4(),
      customerId: 'cust-002',
      type: 'csat',
      rating: 3,
      comment: 'Product quality could be better.',
      categories: ['product_quality'],
      sentiment: 'negative',
      tags: ['disappointed'],
      source: 'in_app',
      responseRequired: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      metadata: {}
    },
    {
      id: uuidv4(),
      customerId: 'cust-003',
      type: 'nps',
      score: 6,
      comment: 'Decent experience, but delivery was slow.',
      categories: ['delivery', 'customer_service'],
      sentiment: 'neutral',
      tags: ['passive'],
      source: 'sms',
      responseRequired: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      metadata: {}
    }
  ];

  sampleFeedback.forEach(f => feedbackItems.set(f.id, f));
}

initializeSampleData();

// ============================================================================
// Helper Functions
// ============================================================================

function analyzeSentiment(text: string): { label: SentimentLabel; score: number } {
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'perfect', 'wonderful', 'fantastic', 'happy', 'satisfied'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'poor', 'disappointed', 'slow', 'expensive', 'broken'];

  const words = text.toLowerCase().split(/\s+/);
  let positive = 0;
  let negative = 0;

  words.forEach(word => {
    if (positiveWords.some(p => word.includes(p))) positive++;
    if (negativeWords.some(n => word.includes(n))) negative++;
  });

  const total = positive + negative;
  if (total === 0) return { label: 'neutral', score: 0 };

  const score = (positive - negative) / total;
  const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

  return { label, score };
}

function categorizeFeedback(comment: string): FeedbackCategory[] {
  const categories: FeedbackCategory[] = [];
  const lower = comment.toLowerCase();

  if (lower.includes('product') || lower.includes('quality') || lower.includes('item')) {
    categories.push('product_quality');
  }
  if (lower.includes('service') || lower.includes('staff') || lower.includes('support')) {
    categories.push('customer_service');
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('expensive') || lower.includes('cheap')) {
    categories.push('pricing');
  }
  if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('arrived') || lower.includes('late')) {
    categories.push('delivery');
  }
  if (lower.includes('easy') || lower.includes('hard') || lower.includes('use') || lower.includes('interface')) {
    categories.push('usability');
  }
  if (lower.includes('feature') || lower.includes('missing') || lower.includes('wish')) {
    categories.push('features');
  }

  if (categories.length === 0) categories.push('other');

  return categories;
}

function calculateNPS(feedback: Feedback[]): number {
  const scores = feedback.filter(f => f.type === 'nps' && f.score !== undefined).map(f => f.score!);
  if (scores.length === 0) return 0;

  const promoters = scores.filter(s => s >= 9).length;
  const detractors = scores.filter(s => s <= 6).length;

  return Math.round(((promoters - detractors) / scores.length) * 100);
}

function calculateCSAT(feedback: Feedback[]): number {
  const ratings = feedback.filter(f => f.type === 'csat' && f.rating !== undefined).map(f => f.rating!);
  if (ratings.length === 0) return 0;

  const satisfied = ratings.filter(r => r >= 4).length;
  return Math.round((satisfied / ratings.length) * 100);
}

function calculateCES(feedback: Feedback[]): number {
  const scores = feedback.filter(f => f.type === 'ces' && f.score !== undefined).map(f => f.score!);
  if (scores.length === 0) return 0;

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
}

function getFeedbackMetrics(startDate?: Date, endDate?: Date): FeedbackMetrics {
  let filtered = Array.from(feedbackItems.values());

  if (startDate) {
    filtered = filtered.filter(f => new Date(f.createdAt) >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(f => new Date(f.createdAt) <= endDate);
  }

  const byType: Record<FeedbackType, number> = {
    nps: 0, csat: 0, ces: 0, product_review: 0, service_review: 0, general: 0
  };
  const byCategory: Record<FeedbackCategory, number> = {
    product_quality: 0, customer_service: 0, pricing: 0, usability: 0,
    delivery: 0, features: 0, support: 0, other: 0
  };
  const bySentiment: Record<SentimentLabel, number> = {
    positive: 0, negative: 0, neutral: 0
  };

  filtered.forEach(f => {
    byType[f.type]++;
    f.categories.forEach(c => byCategory[c]++);
    if (f.sentiment) bySentiment[f.sentiment]++;
  });

  const ratings = filtered.filter(f => f.rating !== undefined).map(f => f.rating!);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const requiresResponse = filtered.filter(f => f.responseRequired);
  const responded = requiresResponse.filter(f => f.respondedAt);
  const responseRate = requiresResponse.length > 0
    ? (responded.length / requiresResponse.length) * 100
    : 100;

  return {
    totalFeedback: filtered.length,
    averageRating: Math.round(avgRating * 10) / 10,
    npsScore: calculateNPS(filtered),
    csatScore: calculateCSAT(filtered),
    cesScore: calculateCES(filtered),
    byType,
    byCategory,
    bySentiment,
    trend: 'stable',
    responseRate: Math.round(responseRate)
  };
}

// ============================================================================
// Routes - Feedback
// ============================================================================

/**
 * Submit feedback
 */
app.post('/api/feedback', (req: Request, res: Response) => {
  const { customerId, type, rating, score, comment, categories, productId, orderId, tags, source } = req.body;

  if (!type) {
    res.status(400).json({ error: 'Feedback type is required' });
    return;
  }

  let autoCategories = categories || [];
  let sentiment: SentimentLabel | undefined;
  let sentimentScore: number | undefined;

  if (comment) {
    const { label, score: s } = analyzeSentiment(comment);
    sentiment = label;
    sentimentScore = s;
    autoCategories = categories?.length ? categories : categorizeFeedback(comment);
  }

  const feedback: Feedback = {
    id: uuidv4(),
    customerId,
    type,
    rating,
    score,
    comment,
    categories: autoCategories,
    sentiment,
    sentimentScore,
    productId,
    orderId,
    tags: tags || [],
    source: source || 'web',
    responseRequired: sentiment === 'negative' || type === 'nps',
    createdAt: new Date(),
    metadata: {}
  };

  feedbackItems.set(feedback.id, feedback);

  logger.info(`Feedback submitted: ${feedback.id}`);
  res.status(201).json(feedback);
});

/**
 * Get all feedback
 */
app.get('/api/feedback', (req: Request, res: Response) => {
  const { type, category, sentiment, source, customerId, startDate, endDate, limit } = req.query;

  let filtered = Array.from(feedbackItems.values());

  if (type) filtered = filtered.filter(f => f.type === type);
  if (category) filtered = filtered.filter(f => f.categories.includes(category as FeedbackCategory));
  if (sentiment) filtered = filtered.filter(f => f.sentiment === sentiment);
  if (source) filtered = filtered.filter(f => f.source === source);
  if (customerId) filtered = filtered.filter(f => f.customerId === customerId);
  if (startDate) filtered = filtered.filter(f => new Date(f.createdAt) >= new Date(startDate as string));
  if (endDate) filtered = filtered.filter(f => new Date(f.createdAt) <= new Date(endDate as string));

  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const limitNum = limit ? parseInt(limit as string) : 100;
  res.json(filtered.slice(0, limitNum));
});

/**
 * Get feedback by ID
 */
app.get('/api/feedback/:id', (req: Request, res: Response) => {
  const feedback = feedbackItems.get(req.params.id);
  if (!feedback) {
    res.status(404).json({ error: 'Feedback not found' });
    return;
  }

  const responses = Array.from(feedbackResponses.values())
    .filter(r => r.feedbackId === feedback.id);
  const actions = Array.from(feedbackActions.values())
    .filter(a => a.feedbackId === feedback.id);

  res.json({ ...feedback, responses, actions });
});

/**
 * Respond to feedback
 */
app.post('/api/feedback/:id/respond', (req: Request, res: Response) => {
  const { responderId, responderName, message } = req.body;
  const feedback = feedbackItems.get(req.params.id);

  if (!feedback) {
    res.status(404).json({ error: 'Feedback not found' });
    return;
  }

  if (!responderId || !message) {
    res.status(400).json({ error: 'Responder ID and message are required' });
    return;
  }

  const response: FeedbackResponse = {
    id: uuidv4(),
    feedbackId: feedback.id,
    responderId,
    responderName: responderName || 'Support Team',
    message,
    createdAt: new Date()
  };

  feedbackResponses.set(response.id, response);
  feedback.respondedAt = new Date();
  feedback.responseRequired = false;

  logger.info(`Response added to feedback: ${feedback.id}`);
  res.status(201).json(response);
});

/**
 * Update feedback
 */
app.put('/api/feedback/:id', (req: Request, res: Response) => {
  const feedback = feedbackItems.get(req.params.id);
  if (!feedback) {
    res.status(404).json({ error: 'Feedback not found' });
    return;
  }

  const { categories, tags, sentiment } = req.body;
  if (categories) feedback.categories = categories;
  if (tags) feedback.tags = tags;
  if (sentiment) feedback.sentiment = sentiment;

  res.json(feedback);
});

// ============================================================================
// Routes - Actions
// ============================================================================

/**
 * Create action from feedback
 */
app.post('/api/actions', (req: Request, res: Response) => {
  const { feedbackId, assigneeId, assigneeName, title, description, priority, dueDate } = req.body;

  if (!feedbackId || !title) {
    res.status(400).json({ error: 'Feedback ID and title are required' });
    return;
  }

  const feedback = feedbackItems.get(feedbackId);
  if (!feedback) {
    res.status(404).json({ error: 'Feedback not found' });
    return;
  }

  const action: FeedbackAction = {
    id: uuidv4(),
    feedbackId,
    assigneeId,
    assigneeName,
    title,
    description: description || '',
    status: 'pending',
    priority: priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  feedbackActions.set(action.id, action);
  feedback.responseRequired = true;

  logger.info(`Action created from feedback: ${feedback.id}`);
  res.status(201).json(action);
});

/**
 * Get all actions
 */
app.get('/api/actions', (req: Request, res: Response) => {
  const { status, priority, assigneeId } = req.query;

  let filtered = Array.from(feedbackActions.values());

  if (status) filtered = filtered.filter(a => a.status === status);
  if (priority) filtered = filtered.filter(a => a.priority === priority);
  if (assigneeId) filtered = filtered.filter(a => a.assigneeId === assigneeId);

  res.json(filtered.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }));
});

/**
 * Get action by ID
 */
app.get('/api/actions/:id', (req: Request, res: Response) => {
  const action = feedbackActions.get(req.params.id);
  if (!action) {
    res.status(404).json({ error: 'Action not found' });
    return;
  }

  const feedback = feedbackItems.get(action.feedbackId);
  res.json({ ...action, feedback });
});

/**
 * Update action status
 */
app.patch('/api/actions/:id', (req: Request, res: Response) => {
  const action = feedbackActions.get(req.params.id);
  if (!action) {
    res.status(404).json({ error: 'Action not found' });
    return;
  }

  const { status, assigneeId, assigneeName, priority, dueDate } = req.body;

  if (status) {
    action.status = status;
    if (status === 'completed') {
      action.completedAt = new Date();
    }
  }
  if (assigneeId) action.assigneeId = assigneeId;
  if (assigneeName) action.assigneeName = assigneeName;
  if (priority) action.priority = priority;
  if (dueDate) action.dueDate = new Date(dueDate);
  action.updatedAt = new Date();

  res.json(action);
});

// ============================================================================
// Routes - Surveys
// ============================================================================

/**
 * Create survey
 */
app.post('/api/surveys', (req: Request, res: Response) => {
  const { name, type, questions, targetAudience, expiresAt } = req.body;

  if (!name || !questions || questions.length === 0) {
    res.status(400).json({ error: 'Name and questions are required' });
    return;
  }

  const survey: Survey = {
    id: uuidv4(),
    name,
    type: type || 'general',
    questions: questions.map((q: any) => ({
      id: q.id || uuidv4(),
      type: q.type,
      question: q.question,
      required: q.required ?? true,
      options: q.options,
      minValue: q.minValue,
      maxValue: q.maxValue
    })),
    active: true,
    targetAudience: targetAudience || { customerType: 'all' },
    responseCount: 0,
    createdAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  };

  surveys.set(survey.id, survey);
  res.status(201).json(survey);
});

/**
 * Get all surveys
 */
app.get('/api/surveys', (req: Request, res: Response) => {
  const { active, type } = req.query;

  let filtered = Array.from(surveys.values());

  if (active !== undefined) {
    filtered = filtered.filter(s => s.active === (active === 'true'));
  }
  if (type) {
    filtered = filtered.filter(s => s.type === type);
  }

  res.json(filtered);
});

/**
 * Get survey by ID
 */
app.get('/api/surveys/:id', (req: Request, res: Response) => {
  const survey = surveys.get(req.params.id);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }

  const responses = Array.from(surveyResponses.values())
    .filter(r => r.surveyId === survey.id);

  res.json({ ...survey, responses });
});

/**
 * Submit survey response
 */
app.post('/api/surveys/:id/respond', (req: Request, res: Response) => {
  const { customerId, answers } = req.body;
  const survey = surveys.get(req.params.id);

  if (!survey || !survey.active) {
    res.status(404).json({ error: 'Survey not found or inactive' });
    return;
  }

  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: 'Answers are required' });
    return;
  }

  const response: SurveyResponse = {
    id: uuidv4(),
    surveyId: survey.id,
    customerId,
    answers,
    completedAt: new Date()
  };

  surveyResponses.set(response.id, response);
  survey.responseCount++;

  // Convert to feedback if NPS
  if (survey.type === 'nps') {
    const npsAnswer = answers.find((a: SurveyAnswer) => {
      const q = survey.questions.find((q: SurveyQuestion) => q.id === a.questionId);
      return q?.type === 'nps';
    });

    if (npsAnswer) {
      const feedback: Feedback = {
        id: uuidv4(),
        customerId,
        type: 'nps',
        score: npsAnswer.value as number,
        categories: [],
        tags: ['survey'],
        source: 'survey',
        responseRequired: false,
        createdAt: new Date(),
        metadata: { surveyId: survey.id, responseId: response.id }
      };
      feedbackItems.set(feedback.id, feedback);
    }
  }

  logger.info(`Survey response submitted: ${response.id}`);
  res.status(201).json(response);
});

/**
 * Deactivate survey
 */
app.patch('/api/surveys/:id', (req: Request, res: Response) => {
  const survey = surveys.get(req.params.id);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }

  const { active, name } = req.body;
  if (active !== undefined) survey.active = active;
  if (name) survey.name = name;

  res.json(survey);
});

// ============================================================================
// Routes - Analytics
// ============================================================================

/**
 * Get feedback metrics
 */
app.get('/api/analytics', (req: Request, res: Response) => {
  const { startDate, endDate, period } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const metrics = getFeedbackMetrics(start, end);
  res.json(metrics);
});

/**
 * Get category trends
 */
app.get('/api/analytics/trends', (req: Request, res: Response) => {
  const { period } = req.query;
  const p = (period as string) || 'week';

  const now = new Date();
  const periodMs: Record<string, number> = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000
  };

  const currentEnd = now;
  const currentStart = new Date(now.getTime() - periodMs[p]);
  const previousStart = new Date(currentStart.getTime() - periodMs[p]);
  const previousEnd = currentStart;

  const categories: FeedbackCategory[] = ['product_quality', 'customer_service', 'pricing', 'usability', 'delivery', 'features', 'support', 'other'];

  const trends = categories.map(category => {
    const current = Array.from(feedbackItems.values())
      .filter(f => f.categories.includes(category) &&
        new Date(f.createdAt) >= currentStart &&
        new Date(f.createdAt) < currentEnd);

    const previous = Array.from(feedbackItems.values())
      .filter(f => f.categories.includes(category) &&
        new Date(f.createdAt) >= previousStart &&
        new Date(f.createdAt) < previousEnd);

    const changePercent = previous.length > 0
      ? ((current.length - previous.length) / previous.length) * 100
      : current.length > 0 ? 100 : 0;

    const ratings = [...current, ...previous]
      .filter(f => f.rating !== undefined)
      .map(f => f.rating!);

    return {
      category,
      currentPeriod: current.length,
      previousPeriod: previous.length,
      changePercent: Math.round(changePercent),
      avgRating: ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0
    } as CategoryTrend;
  });

  res.json(trends);
});

/**
 * Get customer feedback history
 */
app.get('/api/analytics/customer/:customerId', (req: Request, res: Response) => {
  const customerFeedback = Array.from(feedbackItems.values())
    .filter(f => f.customerId === req.params.customerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const avgRating = customerFeedback
    .filter(f => f.rating !== undefined)
    .map(f => f.rating!);

  res.json({
    customerId: req.params.customerId,
    totalFeedback: customerFeedback.length,
    averageRating: avgRating.length > 0 ? avgRating.reduce((a, b) => a + b, 0) / avgRating.length : 0,
    feedback: customerFeedback,
    categories: [...new Set(customerFeedback.flatMap(f => f.categories))],
    sentimentTrend: customerFeedback.map(f => ({ date: f.createdAt, sentiment: f.sentiment }))
  });
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      feedback: feedbackItems.size,
      actions: feedbackActions.size,
      surveys: surveys.size,
      surveyResponses: surveyResponses.size
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
