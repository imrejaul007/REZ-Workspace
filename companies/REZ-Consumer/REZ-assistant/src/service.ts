/**
 * REZ Assistant - Consumer AI Service (SECURITY HARDENED)
 * Connects to: REZ-Mind, REZ-Intent-Graph, REZ-Agent
 */

import express from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import axios from 'axios';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const config = {
 nodeEnv: process.env.NODE_ENV || 'development',
 port: parseInt(process.env.PORT || '3000', 10),

 // Security
 allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://www.rez.money,https://app.rez.money').split(','),
 internalApiKey: process.env.INTERNAL_API_KEY || '',

 // External APIs
 mindApi: process.env.MIND_API || 'https://REZ-mind.onrender.com',
 intentApi: process.env.INTENT_API || 'https://rez-intent-graph.onrender.com',
 agentApi: process.env.AGENT_API || 'https://REZ-agent.onrender.com',

 // Rate limiting
 rateLimit: {
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100,
   chatMax: 20,
 },
};

// ============================================
// APP SETUP
// ============================================

const app = express();

// HTTPS redirect in production
app.use((req, res, next) => {
 if (config.nodeEnv === 'production' && req.protocol !== 'https') {
   return res.redirect(`https://${req.hostname}${req.url}`);
 }
 next();
});

// Helmet security headers
app.use(helmet({
 hsts: { maxAge: 31536000, includeSubDomains: true },
 frameguard: { action: 'deny' },
 xssFilter: true,
 noSniff: true,
 referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS - SECURE: Restrict to allowed origins
app.use(cors({
 origin: config.allowedOrigins,
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE'],
 allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
}));

// Rate limiting - in-memory (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, max: number, windowMs: number): boolean {
 const now = Date.now();
 const record = requestCounts.get(ip);

 if (!record || now > record.resetTime) {
   requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
   return true;
 }

 if (record.count >= max) {
   return false;
 }

 record.count++;
 return true;
}

app.use((req, res, next) => {
 const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown';

 const max = req.path.includes('/chat')
   ? config.rateLimit.chatMax
   : config.rateLimit.max;

 if (!checkRateLimit(ip, max, config.rateLimit.windowMs)) {
   return res.status(429).json({
     error: 'Too many requests',
     message: 'Please try again later',
     retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
   });
 }
 next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// SECURITY HELPERS
// ============================================

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeCompare(a: string, b: string): boolean {
 if (a.length !== b.length) {
   try {
     crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
   } catch { /* ignore */ }
   return false;
 }
 try {
   return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
 } catch {
   return false;
 }
}

/**
 * Verify internal API key with timing-safe comparison
 */
function verifyApiKey(req: express.Request): boolean {
 const apiKey = req.headers['x-api-key'] as string;
 if (!apiKey || !config.internalApiKey) return false;
 return timingSafeCompare(apiKey, config.internalApiKey);
}

/**
 * Sanitize input string
 */
function sanitizeString(input): string {
 if (typeof input !== 'string') return '';
 return input
   .replace(/[<>]/g, '')
   .replace(/javascript:/gi, '')
   .trim()
   .substring(0, 5000);
}

// ============================================
// MODELS
// ============================================

const SearchIntent = mongoose.model('SearchIntent', new mongoose.Schema({
 intent_id: String,
 user_id: String,
 category: String,
 query: String,
 filters: mongoose.Schema.Types.Mixed,
 results_viewed: Number,
 clicked_merchant_id: String,
 location: { lat: Number, lng: Number },
 timestamp: { type: Date, default: Date.now },
 abandoned: Boolean
}));

const UserPreference = mongoose.model('UserPreference', new mongoose.Schema({
 user_id: { type: String, required: true, unique: true },
 preferences: mongoose.Schema.Types.Mixed,
 last_updated: { type: Date, default: Date.now }
}));

const Prediction = mongoose.model('Prediction', new mongoose.Schema({
 prediction_id: String,
 user_id: String,
 intent_type: String,
 prediction: mongoose.Schema.Types.Mixed,
 confidence: Number,
 model_version: String,
 timestamp: { type: Date, default: Date.now }
}));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
 res.json({
   status: 'ok',
   service: 'rez-assistant',
   timestamp: new Date().toISOString(),
   mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
 });
});

// POST /api/assistant/chat
app.post('/api/assistant/chat', async (req, res) => {
 try {
   const { user_id, message, context } = req.body;

   if (!message || typeof message !== 'string') {
     return res.status(400).json({ error: 'Message is required' });
   }

   // Sanitize inputs
   const sanitizedMessage = sanitizeString(message);
   const sanitizedUserId = sanitizeString(user_id);

   // Track search intent
   const intent = new SearchIntent({
     intent_id: `INT-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
     user_id: sanitizedUserId,
     query: sanitizedMessage,
     category: sanitizeString(context?.category || 'general'),
     filters: context?.filters || {},
     abandoned: false
   });
   await intent.save();

   // Get AI response from REZ-Mind
   let response = { message: 'Processing...', actions: [] };
   try {
     const mind = await axios.post(`${config.mindApi}/api/chat`, {
       user_id: sanitizedUserId,
       message: sanitizedMessage,
       context
     }, { timeout: 10000 });
     response = mind.data;
   } catch (e) {
     console.error('[Assistant] REZ-Mind error:', e.message);
   }

   // Track to Intent Graph
   try {
     await axios.post(`${config.intentApi}/api/intent/track`, {
       user_id: sanitizedUserId,
       intent_type: 'assistant_chat',
       entities: { query: sanitizedMessage },
       action: 'chat_message_sent'
     }, { timeout: 5000 });
   } catch (e) {
     console.error('[Assistant] Intent Graph error:', e.message);
   }

   res.json(response);
 } catch (error) {
   console.error('[Assistant] Chat error:', error);
   res.status(500).json({ error: 'Failed to process message' });
 }
});

// POST /api/assistant/search
app.post('/api/assistant/search', async (req, res) => {
 try {
   const { user_id, query, filters, location } = req.body;

   // Sanitize
   const sanitizedQuery = sanitizeString(query);
   const sanitizedUserId = sanitizeString(user_id);

   const intent = new SearchIntent({
     intent_id: `INT-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
     user_id: sanitizedUserId,
     query: sanitizedQuery,
     filters: filters || {},
     location: location ? { lat: location.lat, lng: location.lng } : undefined,
     timestamp: new Date()
   });
   await intent.save();

   // Get predictions from REZ-Agent
   let predictions = { results: [], next_actions: [] };
   try {
     const agent = await axios.post(`${config.agentApi}/api/agent/predict`, {
       user_id: sanitizedUserId,
       query: sanitizedQuery,
       context: { filters, location }
     }, { timeout: 8000 });
     predictions = agent.data;
   } catch (e) {
     console.error('[Assistant] Agent error:', e.message);
   }

   // Save prediction
   if (predictions.results?.length > 0) {
     const prediction = new Prediction({
       prediction_id: `PRED-${Date.now()}`,
       user_id: sanitizedUserId,
       intent_type: 'search_assist',
       prediction: predictions,
       confidence: predictions.confidence || 0.8,
       model_version: '1.0.0'
     });
     await prediction.save();
   }

   res.json(predictions);
 } catch (error) {
   console.error('[Assistant] Search error:', error);
   res.status(500).json({ error: 'Search failed' });
 }
});

// GET /api/assistant/preferences/:user_id
app.get('/api/assistant/preferences/:user_id', async (req, res) => {
 try {
   const { user_id } = req.params;
   const sanitizedUserId = sanitizeString(user_id);

   let preferences = await UserPreference.findOne({ user_id: sanitizedUserId });

   if (!preferences) {
     preferences = await UserPreference.create({
       user_id: sanitizedUserId,
       preferences: {},
       last_updated: new Date()
     });
   }

   res.json(preferences);
 } catch (error) {
   console.error('[Assistant] Preferences error:', error);
   res.status(500).json({ error: 'Failed to get preferences' });
 }
});

// PUT /api/assistant/preferences/:user_id
app.put('/api/assistant/preferences/:user_id', async (req, res) => {
 try {
   const { user_id } = req.params;
   const { preferences } = req.body;
   const sanitizedUserId = sanitizeString(user_id);

   // Validate preferences is an object
   if (typeof preferences !== 'object' || preferences === null) {
     return res.status(400).json({ error: 'Invalid preferences format' });
   }

   const updated = await UserPreference.findOneAndUpdate(
     { user_id: sanitizedUserId },
     {
       preferences,
       last_updated: new Date()
     },
     { new: true, upsert: true }
   );

   res.json(updated);
 } catch (error) {
   console.error('[Assistant] Update preferences error:', error);
   res.status(500).json({ error: 'Failed to update preferences' });
 }
});

// Internal routes (require API key)
app.post('/api/internal/sync', (req, res) => {
 if (!verifyApiKey(req)) {
   return res.status(401).json({ error: 'Unauthorized' });
 }

 const { intents, predictions } = req.body;
 // Sync logic here

 res.json({ success: true, synced: { intents: intents?.length || 0, predictions: predictions?.length || 0 } });
});

// Error handler
app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
 console.error('[Assistant] Unhandled error:', err);
 res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-assistant';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

function getMongoUri(): string {
 if (MONGODB_USER && MONGODB_PASSWORD) {
   try {
     const uri = new URL(MONGODB_URI);
     uri.username = MONGODB_USER;
     uri.password = MONGODB_PASSWORD;
     return uri.toString();
   } catch {
     return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@localhost:27017/rez-assistant`;
   }
 }
 return MONGODB_URI;
}

async function connectDB() {
 try {
   const uri = getMongoUri();
   await mongoose.connect(uri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   logger.info('[Assistant] MongoDB connected');
 } catch (err) {
   console.error('[Assistant] MongoDB connection failed:', err);
   process.exit(1);
 }
}

// ============================================
// START
// ============================================

async function start() {
 await connectDB();

 app.listen(config.port, () => {
   logger.info(`[Assistant] Service running on port ${config.port}`);
   logger.info(`[Assistant] Environment: ${config.nodeEnv}`);
   logger.info(`[Assistant] Allowed origins: ${config.allowedOrigins.join(', ')}`);
 });
}

start().catch(console.error);

export { app, config };
