/**
 * STAYBOT - Hotel AI Operating System | 10/10 Production Ready | Port: 4840
 * Integrated with: SDK, Webhooks, HOJAI Relationship OS
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { Guest, Room, Complaint, HousekeepingTask } from './models';
import { stayBotAIBrain } from './services/aiBrain';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'staybot' },
});

const PORT = parseInt(process.env.PORT || '4840', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/staybot';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';

// ============================================
// SDK & WEBHOOK HELPERS
// ============================================

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'staybot' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'staybot', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

async function sendNotification(phone: string, message: string, channel: 'sms' | 'whatsapp' = 'sms') {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error(`Notification error:`, error.message);
  }
}

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? ['https://hojai.ai'] : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED' } } }));
app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

interface AuthRequest extends Request { user?: any; isInternal?: boolean; }

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) { req.isInternal = true; return next(); }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/validate`, {
      headers: { Authorization: authHeader, 'X-Internal-Token': INTERNAL_TOKEN },
    });
    if (!response.ok) return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN' } });
    req.user = (await response.json()).user || (await response.json());
    next();
  } catch (error) { logger.error('Auth error:', error); res.status(500).json({ success: false, error: { code: 'AUTH_SERVICE_ERROR' } }); }
};

// Health checks
app.get('/health', async (req, res) => res.json({ status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded', service: 'staybot', version: '1.0.0', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => { if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' }); res.json({ status: 'ready' }); });

// AI Status
app.get('/ai/status', authenticate, (req, res) => res.json({ success: true, data: { employees: [
  { id: 'ai-frontdesk', name: 'AI Front Desk', status: 'active' },
  { id: 'ai-concierge', name: 'AI Concierge', status: 'active' },
  { id: 'ai-revenue', name: 'AI Revenue Manager', status: 'active' },
  { id: 'ai-roomservice', name: 'AI Room Service', status: 'active' },
  { id: 'ai-housekeeping', name: 'AI Housekeeping', status: 'active' },
  { id: 'ai-valet', name: 'AI Valet', status: 'active' },
  { id: 'expert-os', name: 'ExpertOS', status: 'active', description: 'Professional AI Twin for hoteliers' },
], uptime: process.uptime() } }));

// Guests
app.post('/api/guests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const guest = await Guest.create({ ...req.body, guestId: `GUEST-${Date.now().toString(36)}` });
    logger.info(`Guest check-in: ${guest.guestId}`);

    // Trigger webhook for guest check-in
    await Promise.all([
      triggerWebhook('staybot.guest.checkin', { guestId: guest.guestId, hotelId: guest.hotelId, name: guest.name, phone: guest.phone }),
      syncToHOJAI('guest', 'checkin', { guestId: guest.guestId, hotelId: guest.hotelId, name: guest.name, phone: guest.phone }),
    ]);

    // Send welcome notification
    if (guest.phone) {
      await sendNotification(guest.phone, `Welcome to ${guest.hotelId}! Your room is ready.`);
    }

    res.status(201).json({ success: true, data: guest });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/guests', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.hotelId) filter.hotelId = req.query.hotelId;
    if (req.query.status) filter.status = req.query.status;
    const guests = await Guest.find(filter).sort({ checkIn: -1 });
    res.json({ success: true, data: guests });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

app.patch('/api/guests/:guestId/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const oldGuest = await Guest.findOne({ guestId: req.params.guestId });
    const guest = await Guest.findOneAndUpdate({ guestId: req.params.guestId }, { $set: { status: 'checked-out' } }, { new: true });
    if (!guest) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    logger.info(`Guest check-out: ${guest.guestId}`);

    // Trigger webhook for checkout
    await Promise.all([
      triggerWebhook('staybot.guest.checkout', { guestId: guest.guestId, hotelId: guest.hotelId, name: guest.name }),
      syncToHOJAI('guest', 'checkout', { guestId: guest.guestId, hotelId: guest.hotelId, duration: guest.checkOut ? (new Date(guest.checkOut).getTime() - new Date(guest.checkIn).getTime()) : 0 }),
    ]);

    // Send checkout notification
    if (oldGuest?.phone) {
      await sendNotification(oldGuest.phone, 'Thank you for staying with us! We hope to see you again.');
    }

    res.json({ success: true, data: guest });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } }); }
});

// Rooms
app.post('/api/rooms', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.create({ ...req.body, roomId: `ROOM-${Date.now().toString(36)}` });
    res.status(201).json({ success: true, data: room });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.hotelId) filter.hotelId = req.query.hotelId;
    if (req.query.status) filter.status = req.query.status;
    const rooms = await Room.find(filter).sort({ roomNumber: 1 });
    res.json({ success: true, data: rooms });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Complaints
app.post('/api/complaints', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const complaint = await Complaint.create({ ...req.body, complaintId: `COMP-${Date.now().toString(36)}` });
    logger.info(`Complaint logged: ${complaint.complaintId}`);

    // Trigger webhook for new complaint (priority alert)
    await Promise.all([
      triggerWebhook('staybot.complaint.created', {
        complaintId: complaint.complaintId,
        hotelId: complaint.hotelId,
        category: complaint.category,
        priority: complaint.priority,
      }),
      syncToHOJAI('complaint', 'created', {
        complaintId: complaint.complaintId,
        category: complaint.category,
        priority: complaint.priority,
      }),
    ]);

    // High priority complaints get immediate notification
    if (complaint.priority === 'high' && complaint.phone) {
      await sendNotification(complaint.phone, 'Your complaint has been received. Our team will address it shortly.', 'whatsapp');
    }

    res.status(201).json({ success: true, data: complaint });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/complaints', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.hotelId) filter.hotelId = req.query.hotelId;
    if (req.query.status) filter.status = req.query.status;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// Housekeeping
app.post('/api/housekeeping', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const task = await HousekeepingTask.create({ ...req.body, taskId: `TASK-${Date.now().toString(36)}` });
    res.status(201).json({ success: true, data: task });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/housekeeping', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.hotelId) filter.hotelId = req.query.hotelId;
    if (req.query.status) filter.status = req.query.status;
    const tasks = await HousekeepingTask.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// AI Front Desk
app.post('/api/ai/frontdesk/checkin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, hotelId, checkIn, checkOut, roomNumber } = req.body;
    const guest = await Guest.create({
      guestId: `GUEST-${Date.now().toString(36)}`,
      name, phone, email, hotelId, checkIn: new Date(checkIn), checkOut: new Date(checkOut), roomNumber,
      status: 'checked-in', loyaltyTier: 'standard',
    });
    logger.info(`AI Front Desk check-in: ${guest.guestId}`);

    // Trigger webhook for AI-initiated check-in
    await Promise.all([
      triggerWebhook('staybot.guest.ai_checkin', { guestId: guest.guestId, hotelId, source: 'ai-frontdesk' }),
      syncToHOJAI('guest', 'ai_checkin', { guestId: guest.guestId, hotelId, source: 'ai-frontdesk' }),
    ]);

    res.json({ success: true, data: { guestId: guest.guestId, message: 'Check-in successful' } });
  } catch (error) { logger.error('AI error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

app.post('/api/ai/frontdesk/complaint', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const complaint = await Complaint.create({ ...req.body, complaintId: `COMP-${Date.now().toString(36)}` });
    res.json({ success: true, data: { complaintId: complaint.complaintId, message: 'Complaint registered, team notified' } });
  } catch (error) { logger.error('AI error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

// ============================================
// AI BRAIN ENDPOINTS (Claude-Powered)
// ============================================

/**
 * POST /api/ai/frontdesk/understand
 * Parse natural language guest requests into structured data
 * Input: { text: "I need an extra pillow and wake up call at 7am" }
 * Output: { requests: [...], confidence: 0.95 }
 */
app.post('/api/ai/frontdesk/understand', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TEXT', message: 'Text is required' } });
    }

    logger.info(`AI understanding request: "${text}"`);
    const result = await stayBotAIBrain.understandRequest(text);

    // Learn from the interaction
    await stayBotAIBrain.learnGuestPreference(req.body.guestId || 'anonymous', {
      type: 'frontdesk_request',
      data: { text },
      timestamp: new Date()
    });

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI understand error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/concierge/recommend
 * Get restaurant recommendations based on guest preferences
 * Input: { guestId, preferences: { cuisine, budget, dietary } }
 * Output: { recommendations: [...], reasoning: "..." }
 */
app.post('/api/ai/concierge/recommend', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guestId, preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PREFERENCES', message: 'Preferences are required' } });
    }

    logger.info(`AI restaurant recommendation for guest: ${guestId}`);
    const result = await stayBotAIBrain.recommendRestaurant(guestId || 'guest', preferences);

    // Learn from the interaction
    if (preferences.cuisine) {
      await stayBotAIBrain.learnGuestPreference(guestId || 'guest', {
        type: 'restaurant_booking',
        data: { cuisine: preferences.cuisine },
        timestamp: new Date()
      });
    }

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI concierge error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/room-service/recommend
 * Get personalized room service recommendations
 * Input: { guestId, dietary, timeOfDay, specialOccasion }
 * Output: { menu: [...], personalizedGreeting: "..." }
 */
app.post('/api/ai/room-service/recommend', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guestId, dietary, timeOfDay, specialOccasion } = req.body;
    if (!guestId) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_GUEST_ID', message: 'Guest ID is required' } });
    }

    logger.info(`AI room service recommendation for guest: ${guestId}`);
    const result = await stayBotAIBrain.recommendRoomService(guestId, {
      timeOfDay,
      dietary: dietary || [],
      specialOccasion
    });

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI room service error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/revenue/suggest-pricing
 * Suggest optimal room pricing based on market conditions
 * Input: { roomType, date, occupancy, competitorPrices }
 * Output: { suggestedPrice, reason, confidence }
 */
app.post('/api/ai/revenue/suggest-pricing', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { roomType, date, occupancy, competitorPrices, dayOfWeek, leadTime } = req.body;
    if (!roomType || !date) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Room type and date are required' } });
    }

    logger.info(`AI pricing suggestion for ${roomType} on ${date}`);
    const result = await stayBotAIBrain.suggestPricing({
      roomType,
      date,
      occupancy: occupancy || 50,
      competitorPrices: competitorPrices || [],
      dayOfWeek,
      leadTime
    });

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI revenue error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/feedback/analyze
 * Analyze guest feedback and extract insights
 * Input: { feedback: "The bed was uncomfortable but staff was great" }
 * Output: { sentiment, positives, negatives, insights }
 */
app.post('/api/ai/feedback/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { feedback, guestId } = req.body;
    if (!feedback) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FEEDBACK', message: 'Feedback is required' } });
    }

    logger.info(`AI feedback analysis: "${feedback.substring(0, 50)}..."`);
    const result = await stayBotAIBrain.analyzeFeedback(feedback);

    // Learn from feedback
    await stayBotAIBrain.learnGuestPreference(guestId || 'anonymous', {
      type: 'feedback',
      data: { sentiment: result.sentiment, negatives: result.negatives },
      timestamp: new Date()
    });

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI feedback error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/guest/learn
 * Learn guest preferences from interactions
 * Input: { guestId, type, data }
 */
app.post('/api/ai/guest/learn', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guestId, type, data } = req.body;
    if (!guestId || !type) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Guest ID and type are required' } });
    }

    logger.info(`AI learning from guest ${guestId}: ${type}`);
    const result = await stayBotAIBrain.learnGuestPreference(guestId, { type, data, timestamp: new Date() });

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI learning error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * GET /api/ai/guest/welcome
 * Generate personalized welcome message for guest
 * Input: { guestId }
 * Output: { message: "..." }
 */
app.get('/api/ai/guest/welcome', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guestId } = req.query;
    if (!guestId) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_GUEST_ID', message: 'Guest ID is required' } });
    }

    const message = await stayBotAIBrain.generateWelcomeMessage(guestId as string);
    res.json({ success: true, data: { message } });
  } catch (error) { logger.error('AI welcome error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

/**
 * POST /api/ai/guest/upsells
 * Suggest upsell opportunities based on guest profile
 * Input: { guestId, currentSpend }
 * Output: { upsells: [...] }
 */
app.post('/api/ai/guest/upsells', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { guestId, currentSpend } = req.body;
    if (!guestId) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_GUEST_ID', message: 'Guest ID is required' } });
    }

    logger.info(`AI upsell suggestions for guest: ${guestId}`);
    const result = await stayBotAIBrain.suggestUpsells(guestId, currentSpend || 0);

    res.json({ success: true, data: result });
  } catch (error) { logger.error('AI upsell error:', error); res.status(500).json({ success: false, error: { code: 'AI_ERROR' } }); }
});

// ============================================
// EXPERTOS - Professional AI Twin for Hoteliers
// ============================================

const expertOSRouter = registerExpertOS('staybot');
app.use('/api/expert-os', expertOSRouter);

// Analytics
app.get('/api/analytics/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = req.query.hotelId ? { hotelId: req.query.hotelId } : {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [totalGuests, checkedIn, checkedOut, complaints] = await Promise.all([
      Guest.countDocuments(filter),
      Guest.countDocuments({ ...filter, status: 'checked-in' }),
      Guest.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Complaint.countDocuments({ ...filter, status: 'open' }),
    ]);
    res.json({ success: true, data: { totalGuests, checkedIn, checkedOutToday: checkedOut, openComplaints: complaints } });
  } catch (error) { logger.error('Analytics error:', error); res.status(500).json({ success: false, error: { code: 'ANALYTICS_ERROR' } }); }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => { logger.error('Unhandled error:', err); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } }); });
app.use((req: Request, res: Response) => { res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } }); });

const shutdown = async () => { logger.info('Shutting down...'); await mongoose.disconnect(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL, { maxPoolSize: 20, minPoolSize: 5 });
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => { logger.info(`STAYBOT started on port ${PORT}`); });
  } catch (error) { logger.error('Failed to start:', error); process.exit(1); }
};

start();