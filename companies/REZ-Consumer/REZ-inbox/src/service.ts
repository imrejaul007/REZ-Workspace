/**
 * REZ Inbox - Email Receipt Import Service (SECURITY HARDENED)
 * Imports travel confirmations, food receipts, invoices
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
 analyticsApi: process.env.ANALYTICS_API || 'https://rez-analytics.onrender.com',
 intelligenceApi: process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com',

 // Rate limiting
 rateLimit: {
   windowMs: 15 * 60 * 1000,
   max: 100,
   importMax: 10,
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

// CORS - SECURE
app.use(cors({
 origin: config.allowedOrigins,
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE'],
 allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
}));

// Rate limiting
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

 const max = req.path.includes('/email/import')
   ? config.rateLimit.importMax
   : config.rateLimit.max;

 if (!checkRateLimit(ip, max, config.rateLimit.windowMs)) {
   return res.status(429).json({
     error: 'Too many requests',
     message: 'Please try again later',
   });
 }
 next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// SECURITY HELPERS
// ============================================

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

function verifyApiKey(req: express.Request): boolean {
 const apiKey = req.headers['x-api-key'] as string;
 if (!apiKey || !config.internalApiKey) return false;
 return timingSafeCompare(apiKey, config.internalApiKey);
}

function sanitizeString(input): string {
 if (typeof input !== 'string') return '';
 return input
   .replace(/[<>]/g, '')
   .replace(/javascript:/gi, '')
   .trim()
   .substring(0, 50000); // Larger for email content
}

function sanitizeAmount(amount): number {
 const num = parseFloat(amount);
 return isNaN(num) ? 0 : Math.abs(num);
}

// ============================================
// MODELS
// ============================================

import { EmailReceipt } from './models/EmailReceipt';
import { TravelPlan } from './models/TravelPlan';
import { Subscription } from './models/Subscription';

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
 res.json({
   status: 'ok',
   service: 'rez-inbox',
   timestamp: new Date().toISOString(),
   mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
 });
});

// POST /api/email/import - Import email receipt
app.post('/api/email/import', async (req, res) => {
 try {
   const { user_id, email_content, type, merchant_name, amount, date } = req.body;

   if (!user_id) {
     return res.status(400).json({ error: 'User ID is required' });
   }

   // Sanitize inputs
   const sanitizedUserId = sanitizeString(user_id);
   const sanitizedMerchant = sanitizeString(merchant_name || '');
   const sanitizedType = sanitizeString(type || 'other');
   const sanitizedAmount = sanitizeAmount(amount);

   // Validate amount
   if (sanitizedAmount > 1000000) {
     return res.status(400).json({ error: 'Amount exceeds maximum limit' });
   }

   const receipt = new EmailReceipt({
     user_id: sanitizedUserId,
     source_email: sanitizeString(email_content?.from || 'unknown'),
     merchant_name: sanitizedMerchant,
     category: sanitizedType,
     amount: sanitizedAmount,
     date: date ? new Date(date) : new Date(),
     imported_at: new Date()
   });

   await receipt.save();

   // Track to Intelligence
   try {
     await axios.post(`${config.intelligenceApi}/api/spend/track`, {
       user_id: sanitizedUserId,
       merchant_name: sanitizedMerchant,
       category: sanitizedType,
       amount: sanitizedAmount
     }, { timeout: 5000 });
   } catch (e) {
     console.error('[Inbox] Intelligence API error:', e.message);
   }

   res.json({ success: true, receipt_id: receipt._id });
 } catch (error) {
   console.error('[Inbox] Import error:', error);
   res.status(500).json({ error: 'Failed to import receipt' });
 }
});

// GET /api/travel/:userId - Get travel plans
app.get('/api/travel/:userId', async (req, res) => {
 try {
   const { userId } = req.params;
   const sanitizedUserId = sanitizeString(userId);

   const plans = await TravelPlan.find({ user_id: sanitizedUserId })
     .sort({ travel_date: -1 })
     .limit(100);

   res.json({ plans });
 } catch (error) {
   console.error('[Inbox] Travel plans error:', error);
   res.status(500).json({ error: 'Failed to get travel plans' });
 }
});

// POST /api/subscriptions - Add subscription
app.post('/api/subscriptions', async (req, res) => {
 try {
   const { user_id, merchant_name, amount, frequency } = req.body;

   if (!user_id) {
     return res.status(400).json({ error: 'User ID is required' });
   }

   const sanitizedUserId = sanitizeString(user_id);
   const sanitizedMerchant = sanitizeString(merchant_name || '');
   const sanitizedAmount = sanitizeAmount(amount);
   const sanitizedFrequency = sanitizeString(frequency || 'monthly');

   const sub = new Subscription({
     user_id: sanitizedUserId,
     merchant_name: sanitizedMerchant,
     amount: sanitizedAmount,
     frequency: sanitizedFrequency,
     status: 'active',
     next_billing_date: calculateNextBillingDate(sanitizedFrequency),
     created_at: new Date()
   });

   await sub.save();

   // Track subscription
   try {
     await axios.post(`${config.intelligenceApi}/api/subscription/track`, {
       user_id: sanitizedUserId,
       merchant_name: sanitizedMerchant,
       amount: sanitizedAmount,
       frequency: sanitizedFrequency
     }, { timeout: 5000 });
   } catch (e) {
     console.error('[Inbox] Subscription tracking error:', e.message);
   }

   res.json({ success: true, subscription_id: sub._id });
 } catch (error) {
   console.error('[Inbox] Subscription error:', error);
   res.status(500).json({ error: 'Failed to add subscription' });
 }
});

// GET /api/subscriptions/:userId - Get user subscriptions
app.get('/api/subscriptions/:userId', async (req, res) => {
 try {
   const { userId } = req.params;
   const sanitizedUserId = sanitizeString(userId);

   const subs = await Subscription.find({ user_id: sanitizedUserId, status: 'active' })
     .sort({ next_billing_date: 1 });

   res.json({ subscriptions: subs });
 } catch (error) {
   console.error('[Inbox] Get subscriptions error:', error);
   res.status(500).json({ error: 'Failed to get subscriptions' });
 }
});

// Internal routes
app.post('/api/internal/sync', (req, res) => {
 if (!verifyApiKey(req)) {
   return res.status(401).json({ error: 'Unauthorized' });
 }
 res.json({ success: true });
});

// Error handler
app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
 console.error('[Inbox] Unhandled error:', err);
 res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// HELPERS
// ============================================

function calculateNextBillingDate(frequency: string): Date {
 const date = new Date();
 switch (frequency) {
   case 'weekly': date.setDate(date.getDate() + 7); break;
   case 'monthly': date.setMonth(date.getMonth() + 1); break;
   case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
   default: date.setMonth(date.getMonth() + 1);
 }
 return date;
}

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-inbox';
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
     return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@localhost:27017/rez-inbox`;
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
   logger.info('[Inbox] MongoDB connected');
 } catch (err) {
   console.error('[Inbox] MongoDB connection failed:', err);
   process.exit(1);
 }
}

// ============================================
// START
// ============================================

async function start() {
 await connectDB();

 app.listen(config.port, () => {
   logger.info(`[Inbox] Service running on port ${config.port}`);
   logger.info(`[Inbox] Environment: ${config.nodeEnv}`);
   logger.info(`[Inbox] Allowed origins: ${config.allowedOrigins.join(', ')}`);
 });
}

start().catch(console.error);

export { app, config };
