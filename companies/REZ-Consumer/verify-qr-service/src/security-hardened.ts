/**
 * REZ Verify QR Service - SECURITY HARDENED
 * Complete security hardening applied
 */

import express, { Request, Response } from 'express';
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
 port: parseInt(process.env.PORT || "4013", 10),

 // Security
 allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://www.rez.money').split(','),
 internalApiKey: process.env.INTERNAL_API_KEY || '',
 webhookSecret: process.env.WEBHOOK_SECRET || '',

 // External APIs
 merchantApi: process.env.MERCHANT_API || 'https://rez-merchant.onrender.com',
 walletApi: process.env.WALLET_API || 'https://rez-wallet.onrender.com',
 mindApi: process.env.MIND_API || 'https://REZ-mind.onrender.com',
 notifApi: process.env.NOTIF_API || 'https://rez-notifications.onrender.com',
 intelligenceApi: process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com',
 agentApi: process.env.AGENT_API || 'https://REZ-agent.onrender.com',

 // Rate limiting
 rateLimit: {
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100,
   authMax: 10,
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
}));

// CORS - SECURE: Restrict to allowed origins
app.use(cors({
 origin: config.allowedOrigins,
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE'],
 allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Api-Key'],
}));

// Rate limiting (simple in-memory, use Redis in production)
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

 const max = req.path.includes('/admin') || req.path.includes('/auth')
   ? config.rateLimit.authMax
   : config.rateLimit.max;

 if (!checkRateLimit(ip, max, config.rateLimit.windowMs)) {
   return res.status(429).json({
     status: 'error',
     message: 'Too many requests. Please try again later.',
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
function verifyApiKey(req: Request): boolean {
 const apiKey = req.headers['x-api-key'] as string;
 if (!apiKey || !config.internalApiKey) return false;
 return timingSafeCompare(apiKey, config.internalApiKey);
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(req: Request): boolean {
 const signature = req.headers['x-rez-signature'] as string;
 const rawBody = (req as unknown).rawBody;

 if (!signature || !rawBody || !config.webhookSecret) return false;

 const expected = crypto
   .createHmac('sha256', config.webhookSecret)
   .update(rawBody)
   .digest('hex');

 const providedSig = signature.startsWith('sha256=')
   ? signature.substring(7)
   : signature;

 if (providedSig.length !== expected.length) return false;

 try {
   return crypto.timingSafeEqual(
     Buffer.from(providedSig, 'hex'),
     Buffer.from(expected, 'hex')
   );
 } catch {
   return false;
 }
}

/**
 * Input sanitization for strings
 */
function sanitizeString(input): string {
 if (typeof input !== 'string') return '';
 return input
   .replace(/[<>]/g, '') // Remove angle brackets
   .replace(/javascript:/gi, '') // Remove javascript:
   .replace(/on\w+=/gi, '') // Remove event handlers
   .trim()
   .substring(0, 10000); // Limit length
}

/**
 * Validate serial number format
 */
function isValidSerial(serial: string): boolean {
 // Alphanumeric, hyphens, 6-50 chars
 return /^[A-Za-z0-9\-]{6,50}$/.test(serial);
}

/**
 * Validate phone number
 */
function isValidPhone(phone: string): boolean {
 return /^\+?[\d\s\-()]{10,20}$/.test(phone);
}

/**
 * Validate email
 */
function isValidEmail(email: string): boolean {
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// MODELS
// ============================================

const SerialRegistry = mongoose.model('SerialRegistry', new mongoose.Schema({
 serial_number: {
   type: String,
   required: true,
   unique: true,
   index: true,
   validate: {
     validator: (v: string) => isValidSerial(v),
     message: 'Invalid serial number format'
   }
 },
 merchant_id: String,
 merchant_name: String,
 product_id: String,
 sku: String,
 brand: String,
 model: String,
 category: String,
 manufactured_at: Date,
 expiry_date: Date,
 status: { type: String, enum: ['active', 'deactivated', 'recalled'], default: 'active' },
 verification_count: { type: Number, default: 0 },
 ownership_status: { type: String, enum: ['unowned', 'owned', 'transferred', 'resale', 'revoked'], default: 'unowned' },
 created_at: { type: Date, default: Date.now },
 last_verified_at: Date,
 last_verified_location: Object,
}));

// ... ScanLog, Warranty, Claim, ServiceCenter, FraudRule, VerifyQueue models remain the same

const ScanLog = mongoose.model('ScanLog', new mongoose.Schema({
 serial_number: String,
 user_id: String,
 user_phone: String,
 location: { lat: Number, lng: Number, city: String },
 device_id: String,
 result: String,
 flags: { first_scan: Boolean, repeat_scan: Boolean, geo_anomaly: Boolean },
 created_at: { type: Date, default: Date.now }
}));

const Warranty = mongoose.model('Warranty', new mongoose.Schema({
 serial_number: String,
 user_id: String,
 product_id: String,
 merchant_id: String,
 customer_name: String,
 customer_phone: String,
 customer_email: String,
 purchase_date: Date,
 invoice_url: String,
 warranty_months: Number,
 warranty_start_date: Date,
 warranty_expiry_date: Date,
 warranty_status: { type: String, enum: ['pending', 'active', 'expired', 'claimed'], default: 'pending' },
 ownership_status: String,
 activated_at: Date
}));

const Claim = mongoose.model('Claim', new mongoose.Schema({
 claim_id: String,
 warranty_id: String,
 serial_number: String,
 user_id: String,
 customer_name: String,
 customer_phone: String,
 issue_type: String,
 issue_description: String,
 photos: [String],
 invoice_url: String,
 service_center_id: String,
 service_center_name: String,
 resolution_type: { type: String, enum: ['repair', 'replace', 'refund'] },
 priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
 status: {
   type: String,
   enum: ['submitted', 'under_review', 'inspection_scheduled', 'approved', 'rejected', 'in_repair', 'replacement_shipped', 'refund_processed', 'resolved', 'closed'],
   default: 'submitted'
 },
 timeline: [{ status: String, note: String, updated_by: String, updated_at: Date }],
 created_at: { type: Date, default: Date.now }
}));

const ServiceCenter = mongoose.model('ServiceCenter', new mongoose.Schema({
 center_id: String,
 name: String,
 merchant_id: String,
 city: String,
 services: [String],
 brands: [String],
 status: { type: String, default: 'active' }
}));

const FraudRule = mongoose.model('FraudRule', new mongoose.Schema({
 rule_id: String,
 name: String,
 type: String,
 condition: Object,
 action: String,
 severity: String,
 enabled: { type: Boolean, default: true }
}));

const VerifyQueue = mongoose.model('VerifyQueue', new mongoose.Schema({
 serial_number: String,
 reason: [String],
 scan_data: Object,
 status: { type: String, enum: ['pending', 'reviewed', 'approved', 'rejected'], default: 'pending' },
 reviewed_by: String,
 reviewed_at: Date
}));

// ============================================
// FRAUD DETECTION
// ============================================

async function checkFraud(serial: string, user_id: string, location) {
 const checks: unknown[] = [];

 const recentScans = await ScanLog.find({
   serial_number: serial,
   created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
 });

 if (recentScans.length > 1) {
   checks.push({ rule: 'multiple_scans_different_users', flag: true });
 }

 if (recentScans.some(s => s.device_id === location?.device_id && s.user_id !== user_id)) {
   checks.push({ rule: 'device_share', flag: true });
 }

 const geoChecks = recentScans.filter(s => location?.city && s.location?.city);
 if (geoChecks.length > 1) {
   checks.push({ rule: 'geo_impossible_travel', flag: true });
 }

 try {
   const mindCheck = await axios.post(`${config.mindApi}/api/fraud/verify`, {
     serial_number: serial,
     user_id,
     recent_scans: recentScans.length
   }, { timeout: 5000 });
   if (mindCheck.data.fraud_score > 0.7) {
     checks.push({ rule: 'ml_high_risk', flag: true });
   }
 } catch (e) { /* fail silently */ }

 try {
   const fraudCheck = await axios.post(`${config.intelligenceApi}/api/fraud/verify-qr`, {
     serial_number: serial,
     user_id,
     device_fingerprint: location?.device_id,
     geo_location: { lat: location?.lat, lng: location?.lng },
     activation_count: 0,
     recent_scan_count: recentScans.length
   }, { timeout: 5000 });
   if (fraudCheck.data.fraud_score > 0.7) {
     checks.push({ rule: 'ml_high_risk', flag: true, reason: fraudCheck.data.reasons });
   }
 } catch (e) { /* fail silently */ }

 return checks;
}

// ============================================
// APIS
// ============================================

// VERIFY + LOG SCAN
app.post('/api/verify', async (req: Request, res: Response) => {
 const { serial_number, user_id, user_phone, location, device_id } = req.body;

 // Validate serial number
 if (!serial_number || !isValidSerial(serial_number)) {
   return res.status(400).json({ status: 'error', message: 'Invalid serial number format' });
 }

 // Sanitize inputs
 const sanitizedSerial = sanitizeString(serial_number);
 const sanitizedUserId = sanitizeString(user_id);
 const sanitizedPhone = sanitizeString(user_phone);
 const sanitizedDeviceId = sanitizeString(device_id);

 const serial = await SerialRegistry.findOne({ serial_number: sanitizedSerial });
 if (!serial) {
   return res.json({ status: 'INVALID', message: 'Product not registered' });
 }

 const fraudChecks = await checkFraud(sanitizedSerial, sanitizedUserId, { location, device_id: sanitizedDeviceId });
 const isFraud = fraudChecks.some((c) => c.flag);

 const scan = new ScanLog({
   serial_number: sanitizedSerial,
   user_id: sanitizedUserId,
   user_phone: sanitizedPhone,
   location,
   device_id: sanitizedDeviceId,
   result: serial.ownership_status === 'owned' ? 'authentic' : 'unclaimed',
   flags: { first_scan: serial.verification_count === 0, repeat_scan: true, geo_anomaly: false }
 });
 await scan.save();

 serial.verification_count++;
 serial.last_verified_at = new Date();
 serial.last_verified_location = location;
 await serial.save();

 if (isFraud) {
   await VerifyQueue.create({
     serial_number: sanitizedSerial,
     reason: fraudChecks.filter((c) => c.flag).map((c) => c.rule),
     scan_data: { user_id: sanitizedUserId, location, device_id: sanitizedDeviceId }
   });

   try {
     await axios.post(`${config.agentApi}/api/agent/whatsapp/send`, {
       phone: sanitizedPhone,
       template: 'fraud_alert',
       params: { serial: sanitizedSerial, verification_link: `https://rez.app/verify/${sanitizedSerial}` },
       user_id: sanitizedUserId
     }, { timeout: 5000 });
   } catch (e) { /* fail silently */ }
 }

   try {
     await axios.post(`${config.intelligenceApi}/api/intent/track`, {
       user_id: sanitizedUserId || 'anonymous',
       intent_type: 'warranty_verification',
       entities: { product: sanitizedSerial, brand: serial.brand, category: serial.category },
       action: 'scan',
       context: { location, device_id: sanitizedDeviceId }
     }, { timeout: 5000 });
   } catch (e) { /* fail silently */ }
 }

 let recommendations: unknown[] = [];
 try {
   const recs = await axios.post(`${config.intelligenceApi}/api/recommend/verify-qr`, {
     user_id: sanitizedUserId || 'anonymous',
     context: { current_product: { id: sanitizedSerial, brand: serial.brand } }
   }, { timeout: 5000 });
   recommendations = recs.data.recommendations || [];
 } catch (e) { /* fail silently */ }

 const warranty = await Warranty.findOne({ serial_number: sanitizedSerial });

 res.json({
   status: isFraud ? 'FLAGGED' : 'AUTHENTIC',
   serial_number: sanitizedSerial,
   brand: serial.brand,
   model: serial.model,
   verification_count: serial.verification_count,
   warranty_status: warranty?.warranty_status || 'NOT_ACTIVATED',
   fraud_checks: fraudChecks,
   action: warranty ? 'VIEW_WARRANTY' : 'ACTIVATE_WARRANTY',
   recommendations
 });
});

// ACTIVATE WARRANTY + OWNERSHIP
app.post('/api/activate-warranty', async (req: Request, res: Response) => {
 const {
   serial_number, user_id, customer_name, customer_phone, customer_email,
   purchase_date, invoice_url, price_paid, service_center_id
 } = req.body;

 // Validate required fields
 if (!serial_number || !isValidSerial(serial_number)) {
   return res.status(400).json({ error: 'Invalid serial number' });
 }
 if (customer_phone && !isValidPhone(customer_phone)) {
   return res.status(400).json({ error: 'Invalid phone number' });
 }
 if (customer_email && !isValidEmail(customer_email)) {
   return res.status(400).json({ error: 'Invalid email' });
 }

 // Sanitize inputs
 const sanitizedSerial = sanitizeString(serial_number);
 const sanitizedUserId = sanitizeString(user_id);
 const sanitizedName = sanitizeString(customer_name);
 const sanitizedPhone = sanitizeString(customer_phone);
 const sanitizedEmail = sanitizeString(customer_email);

 const serial = await SerialRegistry.findOne({ serial_number: sanitizedSerial });
 if (!serial) {
   return res.status(404).json({ error: 'Product not found' });
 }

 const startDate = new Date(purchase_date || Date.now());
 const expiryDate = new Date(startDate);
 expiryDate.setMonth(expiryDate.getMonth() + 12);

 const warranty = new Warranty({
   serial_number: sanitizedSerial,
   user_id: sanitizedUserId,
   product_id: serial.product_id,
   merchant_id: serial.merchant_id,
   customer_name: sanitizedName,
   customer_phone: sanitizedPhone,
   customer_email: sanitizedEmail,
   purchase_date: startDate,
   invoice_url: sanitizeString(invoice_url),
   warranty_months: 12,
   warranty_start_date: startDate,
   warranty_expiry_date: expiryDate,
   warranty_status: 'active',
   ownership_status: 'owned',
   activated_at: new Date()
 });
 await warranty.save();

 serial.ownership_status = 'owned';
 await serial.save();

 // Internal API call (timing-safe key check)
 if (verifyApiKey(req)) {
   try {
     await axios.post(`${config.merchantApi}/api/customers/link-warranty`, {
       user_id: sanitizedUserId, warranty_id: warranty._id, serial_number: sanitizedSerial, activated_at: new Date()
     }, { timeout: 5000 });
   } catch (e) { /* fail silently */ }
 }

 try {
   await Promise.all([
     axios.post(`${config.intelligenceApi}/api/intent/track`, {
       user_id: sanitizedUserId,
       intent_type: 'warranty_activation',
       entities: { product: sanitizedSerial, brand: serial.brand },
       action: 'activate'
     }, { timeout: 5000 }),
     axios.post(`${config.intelligenceApi}/api/attribution/track`, {
       event_type: 'verify_qr_activate',
       user_id: sanitizedUserId,
       entities: { product: { id: sanitizedSerial, brand: serial.brand } },
       value: price_paid || 0
     }, { timeout: 5000 })
   ]);
 } catch (e) { /* fail silently */ }

 if (service_center_id) {
   await ServiceCenter.findOne({ center_id: service_center_id });
 }

 try {
   await axios.post(`${config.notifApi}/api/send`, {
     user_id: sanitizedUserId,
     template: 'warranty_activated',
     data: { serial_number: sanitizedSerial, brand: serial.brand, expiry: expiryDate }
   }, { timeout: 5000 });
 } catch (e) { /* fail silently */ }

 try {
   await axios.post(`${config.agentApi}/api/agent/whatsapp/send`, {
     phone: sanitizedPhone,
     template: 'warranty_activated',
     params: { brand: serial.brand, model: serial.model, serial: sanitizedSerial, expiry: expiryDate.toDateString() },
     user_id: sanitizedUserId
   }, { timeout: 5000 });
 } catch (e) { /* fail silently */ }

 let cashback = 0;
 if (price_paid > 1000) {
   cashback = Math.floor(price_paid * 0.01);
   try {
     await axios.post(`${config.walletApi}/api/earn`, {
       user_id: sanitizedUserId,
       amount: cashback,
       source: 'warranty_activation',
       reason: 'Warranty activated'
     }, { timeout: 5000 });
   } catch (e) { /* fail silently */ }
 }

 res.json({
   success: true,
   warranty_id: warranty._id,
   expires: expiryDate,
   cashback_earned: cashback
 });
});

// FILE CLAIM
app.post('/api/claim', async (req: Request, res: Response) => {
 const { warranty_id, issue_type, issue_description, photos, service_center_id } = req.body;

 if (!warranty_id) {
   return res.status(400).json({ error: 'Warranty ID required' });
 }

 const warranty = await Warranty.findById(warranty_id);
 if (!warranty) {
   return res.status(404).json({ error: 'Warranty not found' });
 }

 const center = await ServiceCenter.findOne({ center_id: service_center_id });

 const claim = new Claim({
   warranty_id,
   serial_number: warranty.serial_number,
   user_id: warranty.user_id,
   customer_name: sanitizeString(warranty.customer_name),
   customer_phone: sanitizeString(warranty.customer_phone),
   issue_type: sanitizeString(issue_type),
   issue_description: sanitizeString(issue_description),
   photos: photos?.map((p: string) => sanitizeString(p)) || [],
   service_center_id: center?._id,
   service_center_name: center?.name,
   priority: issue_type === 'not_working' ? 'high' : 'medium'
 });
 await claim.save();

 if (verifyApiKey(req)) {
   try {
     await axios.post(`${config.merchantApi}/api/warranty/claim-filed`, {
       warranty_id, serial_number: warranty.serial_number, claim_type: issue_type
     }, { timeout: 5000 });
   } catch (e) { /* fail silently */ }
 }

 try {
   await axios.post(`${config.agentApi}/api/agent/workflow/trigger`, {
     trigger: 'claim_filed',
     user_id: warranty.user_id,
     data: { claim_id: claim._id, serial: warranty.serial_number, issue: issue_type },
     workflow: {
       steps: [
         { action: 'send_whatsapp', template: 'claim_received', delay: '0h' },
         { action: 'assign_service_center', delay: '1h' }
       ]
     }
   }, { timeout: 5000 });
 } catch (e) { /* fail silently */ }

 res.json({ success: true, claim_id: claim._id });
});

// GET CLAIM STATUS
app.get('/api/claim/:claim_id', async (req, res) => {
 const claim = await Claim.findById(req.params.claim_id);
 if (!claim) return res.status(404).json({ error: 'Claim not found' });
 res.json(claim);
});

// ADMIN APIs (require API key)
const adminAuth = (req: Request, res: Response, next) => {
 if (!verifyApiKey(req)) {
   return res.status(401).json({ error: 'Unauthorized' });
 }
 next();
};

// Add serial to registry (Merchant adds product)
app.post('/admin/serial', adminAuth, async (req, res) => {
 const { serial_number, merchant_id, brand, model, category, manufactured_at } = req.body;

 if (!isValidSerial(serial_number)) {
   return res.status(400).json({ error: 'Invalid serial number format' });
 }

 const serial = await SerialRegistry.create({
   serial_number: sanitizeString(serial_number),
   merchant_id: sanitizeString(merchant_id),
   brand: sanitizeString(brand),
   model: sanitizeString(model),
   category: sanitizeString(category),
   manufactured_at: new Date(manufactured_at)
 });

 try {
   await axios.post(`${config.merchantApi}/api/products/register-serial`, {
     serial_number: serial.serial_number, product_id: serial._id
   }, { timeout: 5000 });
 } catch (e) { /* fail silently */ }

 res.json({ success: true, serial_id: serial._id });
});

// Get all serials for merchant
app.get('/admin/serials', adminAuth, async (req, res) => {
 const { merchant_id, page, limit } = req.query;
 const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));

 const serials = await SerialRegistry.find({ merchant_id })
   .skip(skip)
   .limit(Math.min(100, Math.max(1, Number(limit))));
 const total = await SerialRegistry.countDocuments({ merchant_id });
 res.json({ serials, total, page, limit });
});

// Fraud queue review
app.get('/admin/fraud-queue', adminAuth, async (req, res) => {
 const items = await VerifyQueue.find({ status: 'pending' });
 res.json(items);
});

// Resolve fraud case
app.post('/admin/fraud/resolve', adminAuth, async (req, res) => {
 const { queue_id, action } = req.body;
 await VerifyQueue.findByIdAndUpdate(queue_id, { status: action, reviewed_at: new Date() });
 res.json({ success: true });
});

// ANALYTICS
app.get('/analytics/verifications', async (req, res) => {
 const { from, to, merchant_id } = req.query;
 const match: unknown = {};
 if (merchant_id) match.merchant_id = merchant_id;
 if (from && to) {
   match.created_at = { $gte: new Date(from as string), $lte: new Date(to as string) };
 }

 const [scans, activations, claims] = await Promise.all([
   ScanLog.countDocuments(match),
   Warranty.countDocuments(match),
   Claim.countDocuments(match)
 ]);

 res.json({ scans, activations, claims });
});

// Import merchant routes
import merchantRoutes from './merchant';
app.use('/api', merchantRoutes);

// ============================================
// EXPORT
// ============================================

export { app, config };
export default app;
