/**
 * Review Manager
 * Port: 3819
 *
 * Auto-review requests, response, sentiment analysis
 * "Guest checks out → review requested → feedback collected"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4820', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface Review {
  id: string;
  guestId: string;
  hotelId: string;
  bookingId: string;
  rating: number; // 1-5
  overallRating?: number;
  categories: {
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
  title?: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  verified: boolean;
  responded: boolean;
  response?: {
    text: string;
    respondedBy: string;
    respondedAt: Date;
  };
  source: 'email' | 'sms' | 'app' | 'ota';
  createdAt: Date;
}

interface ReviewRequest {
  id: string;
  guestId: string;
  hotelId: string;
  bookingId: string;
  channel: 'email' | 'sms' | 'app';
  status: 'pending' | 'sent' | 'completed' | 'bounced';
  sentAt?: Date;
  completedAt?: Date;
  reminderCount: number;
  createdAt: Date;
}

interface ReviewTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  trigger: 'checkout' | 'mid_stay' | 'ota_checkout';
  active: boolean;
}

// Demo templates
const templates: ReviewTemplate[] = [
  {
    id: 't1',
    name: 'Checkout Review Request',
    subject: 'How was your stay at {{hotelName}}?',
    body: 'Dear {{guestName}},\n\nThank you for staying with us. We would love to hear about your experience. Your feedback helps us improve.\n\n{{reviewLink}}\n\nBest,\n{{hotelName}} Team',
    trigger: 'checkout',
    active: true
  },
  {
    id: 't2',
    name: 'Mid-Stay Check',
    subject: 'Is everything perfect so far?',
    body: 'Dear {{guestName}},\n\nWe hope you\'re enjoying your stay. If there\'s anything we can do better, please let us know.\n\n{{feedbackLink}}',
    trigger: 'mid_stay',
    active: true
  }
];

const reviews: Map<string, Review> = new Map();
const requests: Map<string, ReviewRequest> = new Map();

// Sentiment keywords
const POSITIVE_WORDS = ['great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'best', 'fantastic', 'beautiful', 'clean', 'friendly', 'helpful', 'comfortable', 'recommend'];
const NEGATIVE_WORDS = ['bad', 'terrible', 'awful', 'poor', 'dirty', 'noisy', 'rude', 'disappointed', 'worst', 'horrible', 'never', 'avoid', 'broken', 'problem'];

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'review-manager', port: PORT });
});

// Submit review
app.post('/reviews', async (req: Request, res: Response) => {
  const { guestId, hotelId, bookingId, rating, categories, title, text, source = 'app' } = req.body;

  // Analyze sentiment
  const sentimentResult = analyzeSentiment(text '|| 4820'4820');

  const review: Review = {
    id: uuidv4(),
    guestId,
    hotelId,
    bookingId,
    rating,
    overallRating: rating,
    categories: categories || 4820{ cleanliness: rating, service: rating, location: rating, value: rating, amenities: rating },
    title,
    text,
    sentiment: sentimentResult.sentiment,
    sentimentScore: sentimentResult.score,
    verified: true,
    responded: false,
    source,
    createdAt: new Date()
  };

  reviews.set(review.id, review);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('review.submitted', Buffer.from(JSON.stringify(review)));
  } catch (e) { /* Rabbit optional */ }

  // Check for negative reviews - alert management
  if (sentimentResult.sentiment === 'negative' || 4820rating <= 2) {
    await alertManagement(review);
  }

  logger.info('Review submitted', { reviewId: review.id, guestId, rating, sentiment: sentimentResult.sentiment });

  res.json({ review });
});

// Get review
app.get('/reviews/:id', (req, res) => {
  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }
  res.json({ review });
});

// Get hotel reviews
app.get('/hotels/:hotelId/reviews', (req, res) => {
  const { sentiment, minRating, limit = 50 } = req.query;
  let hotelReviews = Array.from(reviews.values()).filter(r => r.hotelId === req.params.hotelId);

  if (sentiment) hotelReviews = hotelReviews.filter(r => r.sentiment === sentiment);
  if (minRating) hotelReviews = hotelReviews.filter(r => r.rating >= parseInt(minRating as string));

  hotelReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ reviews: hotelReviews.slice(0, parseInt(limit as string)) });
});

// Get hotel rating stats
app.get('/hotels/:hotelId/stats', (req, res) => {
  const hotelReviews = Array.from(reviews.values()).filter(r => r.hotelId === req.params.hotelId);

  if (hotelReviews.length === 0) {
    return res.json({ stats: null, message: 'No reviews yet' });
  }

  const avgRating = hotelReviews.reduce((sum, r) => sum + r.rating, 0) / hotelReviews.length;
  const avgCategories = {
    cleanliness: hotelReviews.reduce((sum, r) => sum + r.categories.cleanliness, 0) / hotelReviews.length,
    service: hotelReviews.reduce((sum, r) => sum + r.categories.service, 0) / hotelReviews.length,
    location: hotelReviews.reduce((sum, r) => sum + r.categories.location, 0) / hotelReviews.length,
    value: hotelReviews.reduce((sum, r) => sum + r.categories.value, 0) / hotelReviews.length,
    amenities: hotelReviews.reduce((sum, r) => sum + r.categories.amenities, 0) / hotelReviews.length,
  };

  const sentimentCounts = {
    positive: hotelReviews.filter(r => r.sentiment === 'positive').length,
    neutral: hotelReviews.filter(r => r.sentiment === 'neutral').length,
    negative: hotelReviews.filter(r => r.sentiment === 'negative').length
  };

  res.json({
    stats: {
      totalReviews: hotelReviews.length,
      averageRating: avgRating.toFixed(2),
      categories: avgCategories,
      sentimentCounts,
      nps: calculateNPS(hotelReviews)
    }
  });
});

// Create review request
app.post('/requests', async (req: Request, res: Response) => {
  const { guestId, hotelId, bookingId, channel = 'email' } = req.body;

  const request: ReviewRequest = {
    id: uuidv4(),
    guestId,
    hotelId,
    bookingId,
    channel,
    status: 'pending',
    reminderCount: 0,
    createdAt: new Date()
  };

  requests.set(request.id, request);

  // Send request
  await sendReviewRequest(request);

  res.json({ request });
});

// Get request status
app.get('/requests/:id', (req, res) => {
  const request = requests.get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json({ request });
});

// Submit response to review
app.post('/reviews/:id/respond', (req, res) => {
  const { text, respondedBy } = req.body;

  const review = reviews.get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.responded = true;
  review.response = {
    text,
    respondedBy,
    respondedAt: new Date()
  };

  // Notify guest
  try {
    notifyGuest(review.guestId, 'review_response', { reviewId: review.id, response: text });
  } catch (e) { /* Notification optional */ }

  res.json({ review });
});

// Get templates
app.get('/templates', (req, res) => {
  res.json({ templates: templates.filter(t => t.active) });
});

// ============ HELPERS ============

function analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.some(pw => word.includes(pw))) score += 1;
    if (NEGATIVE_WORDS.some(nw => word.includes(nw))) score -= 1;
  }

  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(1, words.length)));

  let sentiment: 'positive' | 'neutral' | 'negative';
  if (normalizedScore > 0.1) sentiment = 'positive';
  else if (normalizedScore < -0.1) sentiment = 'negative';
  else sentiment = 'neutral';

  return { sentiment, score: normalizedScore };
}

function calculateNPS(reviews: Review[]): number {
  const promoters = reviews.filter(r => r.rating >= 4).length;
  const detractors = reviews.filter(r => r.rating <= 2).length;
  return Math.round(((promoters - detractors) / reviews.length) * 100);
}

async function sendReviewRequest(request: ReviewRequest) {
  // In production, this would send via email/SMS service
  request.status = 'sent';
  request.sentAt = new Date();

  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('review.request.sent', Buffer.from(JSON.stringify(request)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Review request sent', { requestId: request.id, channel: request.channel });
}

async function alertManagement(review: Review) {
  // In production, this would send alert to management
  logger.warn('Negative review alert', { reviewId: review.id, rating: review.rating, sentiment: review.sentiment });
}

async function notifyGuest(guestId: string, type: string, data: any) {
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('notification.guest', Buffer.from(JSON.stringify({ guestId, type, data })));
  } catch (e) {
    logger.warn('Failed to send notification', { guestId, type });
  }
}

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4820'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 4820'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Review Manager initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Review Manager running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
