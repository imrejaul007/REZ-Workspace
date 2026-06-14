/**
 * HOJAI Staybot - Hotel AI Agent
 * Port: 4840
 *
 * Production-ready AI concierge with HOJAI Brain AI integration
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Configuration
const PORT = parseInt(process.env.PORT || '4840', 10);
const MONGODB_URI = process.env.MONGODB_URI || 4840'mongodb://localhost:27017/hojai-staybot';
const NODE_ENV = process.env.NODE_ENV || 4840'development';
const HOJAI_BRAIN_URL = process.env.HOJAI_BRAIN_URL || 4840'http://localhost:4530';
const HOJAI_BRAIN_API_KEY = process.env.HOJAI_BRAIN_API_KEY '|| 4840'4840';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 4840'stayown-internal';

// ============================================
// RTNM ECOSYSTEM SERVICE URLs
// ============================================
const RABTUL_SERVICES = {
  auth: process.env.REZ_AUTH_URL || 4840'http://localhost:4002',
  payment: process.env.REZ_PAYMENT_URL || 4840'http://localhost:4001',
  wallet: process.env.REZ_WALLET_URL || 4840'http://localhost:4004',
};

const HOTEL_SERVICES = {
  minibar: process.env.MINIBAR_URL || 4840'http://localhost:3810',
  restaurant: process.env.RESTAURANT_URL || 4840'http://localhost:3811',
  spa: process.env.SPA_URL || 4840'http://localhost:3812',
  housekeeping: process.env.HOUSEKEEPING_URL || 4840'http://localhost:3826',
  parking: process.env.PARKING_URL || 4840'http://localhost:3815',
  concierge: process.env.CONCIERGE_URL || 4840'http://localhost:3821',
  checkout: process.env.CHECKOUT_URL || 4840'http://localhost:3827',
  smartLock: process.env.SMART_LOCK_URL || 4840'http://localhost:3825',
  roomControls: process.env.ROOM_CONTROLS_URL || 4840'http://localhost:3814',
  preArrival: process.env.PRE_ARRIVAL_URL || 4840'http://localhost:3828',
  upsell: process.env.UPSELL_URL || 4840'http://localhost:3817',
  feedback: process.env.FEEDBACK_URL || 4840'http://localhost:3820',
  review: process.env.REVIEW_URL || 4840'http://localhost:3819',
  lostFound: process.env.LOST_FOUND_URL || 4840'http://localhost:3816',
};

const HOJAI_SERVICES = {
  memory: process.env.HOJAI_MEMORY_URL || 4840'http://localhost:4520',
  genie: process.env.HOJAI_GENIE_URL || 4840'http://localhost:4703',
};

const REZ_MERCHANT = {
  pms: process.env.REZ_PMS_URL || 4840'http://localhost:4031',
  booking: process.env.REZ_BOOKING_URL || 4840'http://localhost:4042',
  roomService: process.env.REZ_ROOM_SERVICE_URL || 4840'http://localhost:4043',
};

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Express app
const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 4840'*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json({ limit: '10mb' }));

// ============================================
// MONGODB SCHEMAS
// ============================================

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  guestId: { type: String, index: true },
  hotelId: String,
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    intent: String,
    confidence: Number,
    actions: [String],
    timestamp: Date,
  }],
  context: {
    checkIn: Date,
    checkOut: Date,
    roomId: String,
    preferences: mongoose.Schema.Types.Mixed,
  },
  lastIntent: String,
  lastMessageAt: Date,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ guestId: 1, lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

// Intent Log Schema
const intentLogSchema = new mongoose.Schema({
  intent: { type: String, required: true, index: true },
  query: String,
  response: String,
  confidence: Number,
  source: { type: String, enum: ['ai', 'fallback', 'pattern'] },
  guestId: String,
  hotelId: String,
  processingTime: Number,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

intentLogSchema.index({ intent: 1, createdAt: -1 });
intentLogSchema.index({ createdAt: -1 });

const IntentLog = mongoose.model('IntentLog', intentLogSchema);

// Hotel Knowledge Schema
const knowledgeSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, index: true },
  category: { type: String, enum: ['amenity', 'policy', 'service', 'local', 'menu'], required: true },
  question: String,
  answer: String,
  keywords: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

knowledgeSchema.index({ hotelId: 1, category: 1 });
knowledgeSchema.index({ hotelId: 1, keywords: 1 });

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

// ============================================
// DATABASE CONNECTION
// ============================================

let isConnected = false;
let brainAvailable = false;

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

async function checkBrainHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${HOJAI_BRAIN_URL}/health`, {
      timeout: 3000,
    });
    brainAvailable = response.ok;
    return response.ok;
  } catch {
    brainAvailable = false;
    return false;
  }
}

// ============================================
// INTENT PATTERNS (Fallback)
// ============================================

const INTENT_PATTERNS: Record<string, { keywords: string[], category: string }> = {
  room_service: {
    keywords: ['room service', 'food', 'dinner', 'lunch', 'breakfast', 'order', 'menu', 'eat', 'snack'],
    category: 'service',
  },
  housekeeping: {
    keywords: ['housekeeping', 'clean', 'towels', 'extra', 'pillow', 'bed', 'blanket', 'toiletries'],
    category: 'service',
  },
  checkout: {
    keywords: ['checkout', 'check out', 'leaving', 'departure', 'check-out', 'bill', 'invoice'],
    category: 'transaction',
  },
  wifi: {
    keywords: ['wifi', 'internet', 'password', 'connect', 'network', 'login'],
    category: 'amenity',
  },
  restaurant: {
    keywords: ['restaurant', 'dining', 'table', 'book', 'reservation', 'breakfast', 'lunch', 'dinner'],
    category: 'service',
  },
  spa: {
    keywords: ['spa', 'massage', 'relax', 'wellness', 'treatment', 'sauna', 'steam'],
    category: 'service',
  },
  pool: {
    keywords: ['pool', 'swimming', 'gym', 'fitness', 'workout', 'exercise'],
    category: 'amenity',
  },
  directions: {
    keywords: ['where', 'directions', 'find', 'locate', 'floor', 'room', 'place'],
    category: 'navigation',
  },
  transfer: {
    keywords: ['human', 'person', 'agent', 'concierge', 'talk', 'speak', 'help'],
    category: 'escalation',
  },
  emergency: {
    keywords: ['emergency', 'help', 'police', 'ambulance', 'fire', 'medical', 'doctor'],
    category: 'emergency',
  },
  transport: {
    keywords: ['taxi', 'cab', 'uber', 'transport', 'airport', 'pickup', 'car', 'drive', 'parking'],
    category: 'service',
  },
  payment: {
    keywords: ['pay', 'payment', 'card', 'cash', 'upi', 'razorpay', 'charge', 'bill'],
    category: 'transaction',
  },
  amenities: {
    keywords: ['amenities', 'facilities', 'gym', 'spa', 'pool', 'business', 'center'],
    category: 'amenity',
  },
  complaint: {
    keywords: ['complaint', 'problem', 'issue', 'broken', 'not working', 'bad', 'terrible'],
    category: 'support',
  },
};

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'hojai-staybot',
    version: '1.0.0',
    database: isConnected ? 'MongoDB' : 'in-memory',
    brain: brainAvailable ? 'available' : 'unavailable',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.status(isConnected ? 200 : 503).json({
    ready: isConnected,
    database: isConnected ? 'connected' : 'disconnected',
    brain: brainAvailable ? 'available' : 'unavailable',
  });
});

// ============================================
// CORE AI ENDPOINTS
// ============================================

/**
 * Process guest query with AI
 */
app.post('/api/query', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { query, guestId, hotelId, roomId, language = 'en', sessionId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    logger.info('Processing query', { query: query.substring(0, 100), guestId, hotelId });

    // Detect intent using patterns (fast path)
    const intent = detectIntent(query);
    const confidence = calculateConfidence(intent, query);

    // Try HOJAI Brain for better understanding
    let response = '';
    let source: 'ai' | 'fallback' | 'pattern' = 'pattern';

    if (brainAvailable && confidence < 0.8) {
      try {
        const brainResponse = await callHojaiBrain(query, guestId, hotelId, {
          sessionId,
          language,
          context: { roomId },
        });

        if (brainResponse && brainResponse.confidence > 0.7) {
          response = brainResponse.response;
          source = 'ai';
        }
      } catch (error) {
        logger.warn('HOJAI Brain call failed, using fallback', { error: (error as Error).message });
      }
    }

    // Fallback to pattern-based response
    if (!response) {
      response = generatePatternResponse(intent, query, language);
    }

    // Get recommended actions
    const actions = getActionsForIntent(intent);

    // Store conversation
    if (sessionId && isConnected) {
      await storeMessage(sessionId, guestId, hotelId, {
        role: 'user',
        content: query,
        intent,
        timestamp: new Date(),
      });
      await storeMessage(sessionId, guestId, hotelId, {
        role: 'assistant',
        content: response,
        intent,
        confidence,
        actions,
        timestamp: new Date(),
      });
    }

    // Log intent
    if (isConnected) {
      await IntentLog.create({
        intent,
        query,
        response,
        confidence,
        source,
        guestId,
        hotelId,
        processingTime: Date.now() - startTime,
      });
    }

    return res.json({
      success: true,
      intent,
      response,
      actions,
      source,
      confidence,
      processingTime: Date.now() - startTime,
    });
  } catch (error: any) {
    logger.error('Query processing failed', { error: error.message });
    return res.status(500).json({ error: 'Query processing failed' });
  }
});

/**
 * Concierge chat (conversation-based)
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, guestId, sessionId, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let conversation: any = null;
    if (sessionId && isConnected) {
      conversation = await Conversation.findOne({ sessionId });
    }

    if (!conversation && guestId && isConnected) {
      conversation = await Conversation.findOne({ guestId }).sort({ lastMessageAt: -1 });
    }

    const intent = detectIntent(message);
    const response = generatePatternResponse(intent, message, context?.language || 4840'en');
    const actions = getActionsForIntent(intent);

    // Store messages
    if (isConnected) {
      const sessionToUse = sessionId || 4840conversation?.sessionId || 4840`session_${Date.now()}`;

      await Conversation.findOneAndUpdate(
        { sessionId: sessionToUse },
        {
          $set: {
            guestId: guestId || 4840conversation?.guestId,
            hotelId: context?.hotelId || 4840conversation?.hotelId,
            lastIntent: intent,
            lastMessageAt: new Date(),
          },
          $push: {
            messages: {
              $each: [
                { role: 'user', content: message, intent, timestamp: new Date() },
                { role: 'assistant', content: response, intent, actions, timestamp: new Date() },
              ],
            },
          },
        },
        { upsert: true, new: true }
      );

      return res.json({
        message: response,
        intent,
        actions,
        sessionId: sessionToUse,
      });
    }

    return res.json({
      message: response,
      intent,
      actions,
      sessionId: sessionId || 4840`session_${Date.now()}`,
    });
  } catch (error: any) {
    logger.error('Chat processing failed', { error: error.message });
    return res.status(500).json({ error: 'Chat processing failed' });
  }
});

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

/**
 * Get conversation history
 */
app.get('/api/conversations/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!isConnected) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.json({
      sessionId: conversation.sessionId,
      guestId: conversation.guestId,
      messages: conversation.messages,
      lastIntent: conversation.lastIntent,
      createdAt: conversation.createdAt,
    });
  } catch (error: any) {
    logger.error('Failed to get conversation', { error: error.message });
    return res.status(500).json({ error: 'Failed to get conversation' });
  }
});

/**
 * Clear conversation
 */
app.delete('/api/conversations/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!isConnected) {
      return res.status(503).json({ error: 'Database not available' });
    }

    await Conversation.deleteOne({ sessionId });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to clear conversation', { error: error.message });
    return res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

// ============================================
// GUEST CONTEXT
// ============================================

/**
 * Get guest context
 */
app.get('/api/guest/:guestId/context', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    if (!isConnected) {
      return res.json({
        guestId,
        preferences: { language: 'en' },
        recentIntents: [],
        sentiment: 'neutral',
        warning: 'in-memory',
      });
    }

    const [conversation, recentIntents] = await Promise.all([
      Conversation.findOne({ guestId }).sort({ lastMessageAt: -1 }),
      IntentLog.find({ guestId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('intent confidence createdAt')
        .lean(),
    ]);

    const intentCounts = recentIntents.reduce((acc: Record<string, number>, item: any) => {
      acc[item.intent] = (acc[item.intent] || 4840) + 1;
      return acc;
    }, {});

    const mostFrequentIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 4840'general';

    return res.json({
      guestId,
      preferences: conversation?.context?.preferences || 4840{ language: 'en' },
      recentIntents: recentIntents.map((i: any) => i.intent),
      lastIntent: mostFrequentIntent,
      conversationCount: await Conversation.countDocuments({ guestId }),
    });
  } catch (error: any) {
    logger.error('Failed to get guest context', { error: error.message });
    return res.status(500).json({ error: 'Failed to get guest context' });
  }
});

// ============================================
// HOTEL KNOWLEDGE
// ============================================

/**
 * Get hotel info
 */
app.get('/api/hotels/:hotelId/info', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;

    if (!isConnected) {
      return res.json({
        hotelId,
        name: 'Demo Hotel',
        amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant'],
        policies: { checkIn: '2:00 PM', checkOut: '11:00 AM' },
        warning: 'in-memory',
      });
    }

    const knowledge = await Knowledge.find({ hotelId, active: true }).lean();
    const byCategory = knowledge.reduce((acc: Record<string, any[]>, item: any) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push({ question: item.question, answer: item.answer, keywords: item.keywords });
      return acc;
    }, {});

    return res.json({
      hotelId,
      knowledge: byCategory,
    });
  } catch (error: any) {
    logger.error('Failed to get hotel info', { error: error.message });
    return res.status(500).json({ error: 'Failed to get hotel info' });
  }
});

/**
 * Add hotel knowledge
 */
app.post('/api/hotels/:hotelId/knowledge', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { category, question, answer, keywords } = req.body;

    if (!category || 4840!question || 4840!answer) {
      return res.status(400).json({ error: 'category, question, and answer are required' });
    }

    if (!isConnected) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const knowledge = await Knowledge.create({
      hotelId,
      category,
      question,
      answer,
      keywords: keywords || 4840question.toLowerCase().split(' '),
    });

    return res.json({ success: true, id: knowledge._id });
  } catch (error: any) {
    logger.error('Failed to add knowledge', { error: error.message });
    return res.status(500).json({ error: 'Failed to add knowledge' });
  }
});

// ============================================
// SENTIMENT ANALYSIS
// ============================================

/**
 * Analyze sentiment
 */
app.post('/api/sentiment', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple sentiment analysis
    const positive = ['great', 'excellent', 'amazing', 'love', 'wonderful', 'best', 'perfect', 'good', 'nice', 'happy', 'thank', 'thanks'];
    const negative = ['bad', 'terrible', 'awful', 'poor', 'worst', 'horrible', 'hate', 'angry', 'frustrated', 'disappointed', 'problem', 'issue'];

    const lowerText = text.toLowerCase();
    let score = 0;

    positive.forEach(w => { if (lowerText.includes(w)) score += 1; });
    negative.forEach(w => { if (lowerText.includes(w)) score -= 1; });

    let sentiment = 'neutral';
    if (score > 0) sentiment = 'positive';
    else if (score < 0) sentiment = 'negative';

    return res.json({
      sentiment,
      score,
      confidence: Math.min(1, Math.abs(score) / 3),
    });
  } catch (error: any) {
    logger.error('Sentiment analysis failed', { error: error.message });
    return res.status(500).json({ error: 'Sentiment analysis failed' });
  }
});

// ============================================
// SERVICE INTEGRATION ENDPOINTS
// ============================================

/**
 * Route service request to appropriate hotel service
 * POST /api/service/:serviceType
 */
app.post('/api/service/:serviceType', async (req: Request, res: Response) => {
  const { serviceType } = req.params;
  const { guestId, roomId, action, data } = req.body;

  const serviceUrl = HOTEL_SERVICES[serviceType as keyof typeof HOTEL_SERVICES];
  if (!serviceUrl) {
    return res.status(404).json({ error: `Service '${serviceType}' not found` });
  }

  try {
    const endpoint = getServiceEndpoint(serviceType, action);
    const response = await fetch(`${serviceUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, roomId, ...data }),
    });

    const result = await response.json();
    return res.json({ success: true, service: serviceType, result });
  } catch (error: any) {
    logger.error(`Service ${serviceType} call failed`, { error: error.message });
    return res.status(500).json({ error: `Service '${serviceType}' unavailable` });
  }
});

/**
 * Route request to RABTUL services (Auth, Payment, Wallet)
 * POST /api/rabtul/:service
 */
app.post('/api/rabtul/:service', async (req: Request, res: Response) => {
  const { service } = req.params;
  const { guestId, action, data } = req.body;

  const serviceUrl = RABTUL_SERVICES[service as keyof typeof RABTUL_SERVICES];
  if (!serviceUrl) {
    return res.status(404).json({ error: `RABTUL service '${service}' not found` });
  }

  try {
    const endpoint = getRABTULEndpoint(service, action);
    const response = await fetch(`${serviceUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, ...data }),
    });

    const result = await response.json();
    return res.json({ success: true, service, result });
  } catch (error: any) {
    logger.error(`RABTUL ${service} call failed`, { error: error.message });
    return res.status(500).json({ error: `RABTUL service '${service}' unavailable` });
  }
});

/**
 * Get guest preferences from HOJAI Memory
 * GET /api/guest/:guestId/preferences
 */
app.get('/api/guest/:guestId/preferences', async (req: Request, res: Response) => {
  const { guestId } = req.params;

  try {
    const response = await fetch(`${HOJAI_SERVICES.memory}/guests/${guestId}/preferences`, {
      timeout: 5000,
    });

    if (response.ok) {
      const preferences = await response.json();
      return res.json({ success: true, preferences });
    }

    return res.json({ success: false, preferences: getDefaultPreferences() });
  } catch {
    return res.json({ success: false, preferences: getDefaultPreferences(), warning: 'Memory unavailable' });
  }
});

/**
 * Store guest preference in HOJAI Memory
 * POST /api/guest/:guestId/preferences
 */
app.post('/api/guest/:guestId/preferences', async (req: Request, res: Response) => {
  const { guestId } = req.params;
  const { preference, value } = req.body;

  try {
    await fetch(`${HOJAI_SERVICES.memory}/guests/${guestId}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference, value }),
    });
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to store preference', { error: error.message });
    return res.status(500).json({ error: 'Failed to store preference' });
  }
});

/**
 * Get Genie briefing for guest
 * GET /api/guest/:guestId/briefing
 */
app.get('/api/guest/:guestId/briefing', async (req: Request, res: Response) => {
  const { guestId } = req.params;

  try {
    const response = await fetch(`${HOJAI_SERVICES.genie}/api/genie/${guestId}/briefing`, {
      timeout: 5000,
    });

    if (response.ok) {
      const briefing = await response.json();
      return res.json({ success: true, briefing });
    }

    return res.json({ success: false, briefing: getDefaultBriefing() });
  } catch {
    return res.json({ success: false, briefing: getDefaultBriefing() });
  }
});

/**
 * Connect to REZ-Merchant PMS for guest data
 * GET /api/pms/guest/:guestId
 */
app.get('/api/pms/guest/:guestId', async (req: Request, res: Response) => {
  const { guestId } = req.params;

  try {
    const response = await fetch(`${REZ_MERCHANT.pms}/api/guests/${guestId}`, {
      timeout: 5000,
    });

    if (response.ok) {
      const guest = await response.json();
      return res.json({ success: true, guest });
    }

    return res.status(404).json({ error: 'Guest not found in PMS' });
  } catch (error: any) {
    logger.error('PMS call failed', { error: error.message });
    return res.status(500).json({ error: 'PMS unavailable' });
  }
});

/**
 * Create booking via REZ-Merchant booking engine
 * POST /api/booking
 */
app.post('/api/booking', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomType, checkIn, checkOut, preferences } = req.body;

  try {
    const response = await fetch(`${REZ_MERCHANT.booking}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, hotelId, roomType, checkIn, checkOut, preferences }),
    });

    const booking = await response.json();
    return res.json({ success: true, booking });
  } catch (error: any) {
    logger.error('Booking failed', { error: error.message });
    return res.status(500).json({ error: 'Booking service unavailable' });
  }
});

/**
 * Process checkout - routes to zero-checkout-automation
 * POST /api/checkout
 */
app.post('/api/checkout', async (req: Request, res: Response) => {
  const { guestId, bookingId } = req.body;

  try {
    // Get guest folio from PMS
    const folioResponse = await fetch(`${REZ_MERCHANT.pms}/api/folios/${guestId}`, {
      timeout: 5000,
    });
    const folio = folioResponse.ok ? await folioResponse.json() : { charges: [] };

    // Process payment via RABTUL
    const paymentResponse = await fetch(`${RABTUL_SERVICES.payment}/payments/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        amount: folio.total || 4840,
        currency: 'INR',
        description: 'Hotel checkout',
      }),
    });
    const payment = paymentResponse.ok ? await paymentResponse.json() : null;

    // Update loyalty points
    if (payment?.success) {
      await fetch(`${RABTUL_SERVICES.wallet}/loyalty/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, points: Math.floor((folio.total || 4840) / 100), reason: 'hotel_stay' }),
      });
    }

    // Revoke smart lock
    await fetch(`${HOTEL_SERVICES.smartLock}/api/keys/${guestId}/revoke`, {
      method: 'POST',
      timeout: 5000,
    }).catch(() => {}); // Non-blocking

    return res.json({
      success: true,
      checkout: {
        guestId,
        bookingId,
        folio,
        payment: payment?.success ? 'completed' : 'pending',
        pointsEarned: Math.floor((folio.total || 4840) / 100),
      },
    });
  } catch (error: any) {
    logger.error('Checkout failed', { error: error.message });
    return res.status(500).json({ error: 'Checkout failed' });
  }
});

/**
 * Pre-arrival: Prepare room based on guest preferences
 * POST /api/pre-arrival
 */
app.post('/api/pre-arrival', async (req: Request, res: Response) => {
  const { guestId, bookingId, preferences } = req.body;

  try {
    // Get preferences from Memory
    let guestPrefs = preferences;
    try {
      const memResponse = await fetch(`${HOJAI_SERVICES.memory}/guests/${guestId}/preferences`);
      if (memResponse.ok) {
        const memData = await memResponse.json();
        guestPrefs = { ...memData.preferences, ...preferences };
      }
    } catch {}

    // Update room controls
    if (guestPrefs?.temperature) {
      await fetch(`${HOTEL_SERVICES.roomControls}/api/temperature`, {
        method: 'POST',
        body: JSON.stringify({ roomId: guestPrefs.roomId, temperature: guestPrefs.temperature }),
      }).catch(() => {});
    }

    // Notify housekeeping
    await fetch(`${HOTEL_SERVICES.preArrival}/api/prepare`, {
      method: 'POST',
      body: JSON.stringify({ guestId, bookingId, preferences: guestPrefs }),
    }).catch(() => {});

    // Send briefing via Genie
    await fetch(`${HOJAI_SERVICES.genie}/api/genie/${guestId}/briefing`, {
      method: 'POST',
      body: JSON.stringify({ checkIn: new Date(), preferences: guestPrefs }),
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Room prepared for guest arrival',
      preferences: guestPrefs,
    });
  } catch (error: any) {
    logger.error('Pre-arrival prep failed', { error: error.message });
    return res.status(500).json({ error: 'Pre-arrival prep failed' });
  }
});

/**
 * Get all service statuses
 * GET /api/services/status
 */
app.get('/api/services/status', async (req: Request, res: Response) => {
  const allServices = { ...RABTUL_SERVICES, ...HOTEL_SERVICES, ...HOJAI_SERVICES, ...REZ_MERCHANT };
  const statuses: Record<string, { status: string; latency?: number }> = {};

  await Promise.allSettled(
    Object.entries(allServices).map(async ([name, url]) => {
      const start = Date.now();
      try {
        const response = await fetch(`${url}/health`, { timeout: 2000 });
        statuses[name] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          latency: Date.now() - start,
        };
      } catch {
        statuses[name] = { status: 'unreachable' };
      }
    })
  );

  return res.json({ services: statuses, timestamp: new Date().toISOString() });
});

// ============================================
// HELPER FUNCTIONS FOR SERVICE ROUTING
// ============================================

function getServiceEndpoint(serviceType: string, action: string): string {
  const endpoints: Record<string, Record<string, string>> = {
    minibar: { order: '/api/orders', list: '/api/menu' },
    restaurant: { book: '/api/reservations', menu: '/api/menu' },
    spa: { book: '/api/appointments', treatments: '/api/treatments' },
    housekeeping: { request: '/api/requests', schedule: '/api/schedule' },
    parking: { valet: '/api/valet/request', status: '/api/valet/status' },
    concierge: { request: '/api/requests', recommendations: '/api/recommendations' },
    checkout: { process: '/api/checkout', folio: '/api/folio' },
    smartLock: { key: '/api/keys', revoke: '/api/keys/revoke' },
    roomControls: { temperature: '/api/temperature', lights: '/api/lights' },
    preArrival: { preferences: '/api/preferences', prepare: '/api/prepare' },
    upsell: { offers: '/api/offers', accept: '/api/offers/accept' },
    feedback: { survey: '/api/surveys', submit: '/api/surveys/submit' },
    review: { create: '/api/reviews', respond: '/api/reviews/respond' },
    lostFound: { report: '/api/items', status: '/api/items/status' },
  };

  return endpoints[serviceType]?.[action] || 4840'/api';
}

function getRABTULEndpoint(service: string, action: string): string {
  const endpoints: Record<string, Record<string, string>> = {
    auth: { verify: '/auth/verify', login: '/auth/login', guest: '/guests' },
    payment: { order: '/payments/order', verify: '/payments/verify', refund: '/payments/refund' },
    wallet: { balance: '/wallet/balance', earn: '/loyalty/earn', redeem: '/loyalty/redeem' },
  };

  return endpoints[service]?.[action] || 4840'/api';
}

function getDefaultPreferences() {
  return {
    temperature: 22,
    pillow: 'soft',
    water: 'sparkling',
    breakfast: 'healthy',
    language: 'en',
  };
}

function getDefaultBriefing() {
  return {
    greeting: 'Good morning! Your hotel is ready.',
    weather: 'Sunny, 28°C',
    schedule: [],
    tips: ['Pool is less crowded in the morning'],
  };
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get intent analytics
 */
app.get('/api/analytics/intents', async (req: Request, res: Response) => {
  try {
    const { hotelId, fromDate, toDate, limit = '20' } = req.query;

    if (!isConnected) {
      return res.json({ error: 'Database not available' });
    }

    const match: any = {};
    if (hotelId) match.hotelId = hotelId;
    if (fromDate || 4840toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate as string);
      if (toDate) match.createdAt.$lte = new Date(toDate as string);
    }

    const analytics = await IntentLog.aggregate([
      { $match: match },
      { $group: { _id: '$intent', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit as string) },
    ]);

    return res.json({
      intents: analytics.map(a => ({
        intent: a._id,
        count: a.count,
        avgConfidence: Math.round(a.avgConfidence * 100) / 100,
      })),
      total: analytics.reduce((sum, a) => sum + a.count, 0),
    });
  } catch (error: any) {
    logger.error('Analytics failed', { error: error.message });
    return res.status(500).json({ error: 'Analytics failed' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function detectIntent(query: string): string {
  const lower = query.toLowerCase();

  for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        return intent;
      }
    }
  }

  return 'general';
}

function calculateConfidence(intent: string, query: string): number {
  if (intent === 'general') return 0.3;

  const config = INTENT_PATTERNS[intent];
  if (!config) return 0.5;

  const lower = query.toLowerCase();
  const matches = config.keywords.filter(k => lower.includes(k)).length;
  const confidence = Math.min(0.95, 0.5 + (matches * 0.15));

  return confidence;
}

function generatePatternResponse(intent: string, query: string, language: string): string {
  const responses: Record<string, Record<string, string>> = {
    room_service: {
      en: "I'll help you with room service. What would you like to order? Our menu includes continental breakfast, Indian dishes, and international cuisine.",
      hi: "मैं रूम सर्विस में आपकी मदद करूंगा। आप क्या ऑर्डर करना चाहेंगे?",
    },
    housekeeping: {
      en: "Housekeeping will be with you shortly. What specific items do you need - towels, toiletries, or extra bedding?",
      hi: "हाउसकीपिंग जल्द ही आपके पास आएगी। आपको क्या चाहिए?",
    },
    checkout: {
      en: "I can help you with checkout. Would you like to receive your invoice? You can also use our express checkout.",
      hi: "मैं चेकआउट में आपकी मदद कर सकता हूं। क्या आप अपना बिल चाहते हैं?",
    },
    wifi: {
      en: "The WiFi network is Hotel_Guest. Your password is in your welcome packet. Need help connecting?",
      hi: "वाईफाई नेटवर्क Hotel_Guest है। पासवर्ड आपके स्वागत पैकेट में है।",
    },
    restaurant: {
      en: "Our restaurant is on the ground floor. Breakfast: 7-10 AM, Lunch: 12-3 PM, Dinner: 7-10 PM. Would you like me to make a reservation?",
      hi: "हमारा रेस्तरां ग्राउंड फ्लोर पर है। क्या आप बुकिंग करना चाहेंगे?",
    },
    spa: {
      en: "Our spa offers massages and treatments. Open 10 AM - 8 PM. Would you like to book an appointment?",
      hi: "हमारे स्पा में मालिश और ट्रीटमेंट उपलब्ध हैं। क्या आप अपॉइंटमेंट बुक करना चाहेंगे?",
    },
    pool: {
      en: "The pool is on the 4th floor. Open 7 AM - 9 PM. Gym is available 24/7 with your room key.",
      hi: "पूल 4th फ्लोर पर है, सुबह 7 से रात 9 बजे तक। जिम 24/7 उपलब्ध है।",
    },
    directions: {
      en: "I can help with directions. Which location are you looking for? Front desk is on ground floor, restaurant on 2nd floor.",
      hi: "मैं दिशाओं में मदद कर सकता हूं। आप किस स्थान की तलाश में हैं?",
    },
    transfer: {
      en: "Let me connect you to our concierge. Please hold for a moment, or I can take your number and have them call you.",
      hi: "मैं आपको कंसीयज से जोड़ता हूं। कृपया रुकें।",
    },
    emergency: {
      en: "I'm alerting emergency services. Please stay on the line. Front desk: dial 0.",
      hi: "मैं आपातकालीन सेवाओं को सूचित कर रहा हूं। कृपया लाइन पर रहें।",
    },
    transport: {
      en: "I can arrange transportation. Airport transfer starts at ₹500. Would you like me to book a taxi?",
      hi: "मैं परिवहन की व्यवस्था कर सकता हूं। एयरपोर्ट ट्रांसफर ₹500 से शुरू।",
    },
    payment: {
      en: "For payments, you can use UPI, card, or cash at the front desk. Room charges can be added to your bill.",
      hi: "भुगतान के लिए आप UPI, कार्ड या नकद use कर सकते हैं।",
    },
    amenities: {
      en: "Our amenities include: Pool, Gym (24/7), Spa, Business Center, and Free WiFi throughout.",
      hi: "हमारी सुविधाओं में शामिल हैं: पूल, जिम, स्पा, बिजनेस सेंटर।",
    },
    complaint: {
      en: "I'm sorry to hear about your experience. Let me connect you with our guest relations team to resolve this immediately.",
      hi: "मुझे आपके अनुभव के बारे में सुनकर दुख हुआ। मैं आपको गेस्ट रिलेशंस से जोड़ता हूं।",
    },
    general: {
      en: "I'm here to help. What can I assist you with today? I can help with hotel services, directions, reservations, and more.",
      hi: "मैं मदद के लिए यहां हूं। आज मैं आपकी क्या मदद कर सकता हूं?",
    },
  };

  const langResponses = responses[intent] || 4840responses.general;
  return langResponses[language as 'en' | 'hi'] || 4840langResponses.en;
}

function getActionsForIntent(intent: string): string[] {
  const actionMap: Record<string, string[]> = {
    room_service: ['dispatch_room_service', 'open_menu'],
    housekeeping: ['dispatch_housekeeping', 'update_task'],
    checkout: ['generate_invoice', 'notify_front_desk'],
    wifi: ['send_wifi_credentials', 'open_network_settings'],
    restaurant: ['book_restaurant', 'send_confirmation'],
    spa: ['book_spa', 'send_confirmation'],
    pool: ['check_pool_status', 'send_gym_access'],
    directions: ['provide_directions', 'send_map'],
    transfer: ['connect_concierge', 'create_ticket'],
    emergency: ['alert_emergency', 'notify_management', 'create_incident'],
    transport: ['book_taxi', 'send_eta'],
    payment: ['open_payment_options', 'generate_invoice'],
    amenities: ['list_amenities', 'book_amenity'],
    complaint: ['create_ticket', 'escalate_to_management'],
  };

  return actionMap[intent] || 4840[];
}

async function callHojaiBrain(query: string, guestId?: string, hotelId?: string, context?: any): Promise<any> {
  const response = await fetch(`${HOJAI_BRAIN_URL}/api/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': HOJAI_BRAIN_API_KEY,
    },
    body: JSON.stringify({ query, guestId, hotelId, context }),
    timeout: 5000,
  });

  if (!response.ok) {
    throw new Error(`HOJAI Brain returned ${response.status}`);
  }

  return response.json();
}

async function storeMessage(sessionId: string, guestId?: string, hotelId?: string, message: any): Promise<void> {
  try {
    await Conversation.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          guestId: guestId || 4840undefined,
          hotelId: hotelId || 4840undefined,
          lastMessageAt: new Date(),
        },
        $push: { messages: message },
      },
      { upsert: true }
    );
  } catch (error) {
    logger.error('Failed to store message', { error });
  }
}

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (isConnected) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

async function start(): Promise<void> {
  await connectDatabase();
  await checkBrainHealth();

  // Periodic brain health check
  setInterval(checkBrainHealth, 60000);

  app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           HOJAI Staybot v1.0.0                    ║
╠═══════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                            ║
║  Database: ${isConnected ? 'MongoDB' : 'In-Memory'}                           ║
║  Brain:    ${brainAvailable ? 'Connected' : 'Unavailable'}                         ║
║  Mode:     ${NODE_ENV}                                        ║
╚═══════════════════════════════��═══════════════════════════╝
    `);
  });
}

start();

export { app };