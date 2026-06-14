/**
 * REZ Security Middleware Package
 * Shared security middleware for all REZ services
 */

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { Request, Response, NextFunction, Express } from 'express';

// ============================================
// TYPES
// ============================================

export interface SecurityConfig {
 nodeEnv?: string;
 allowedOrigins?: string[];
 rateLimitMax?: number;
 authRateLimitMax?: number;
 internalApiKey?: string;
 webhookSecret?: string;
 enableHelmet?: boolean;
 enableCors?: boolean;
 enableRateLimit?: boolean;
}

export interface RateLimitConfig {
 windowMs: number;
 max: number;
 message?: string;
}

export const DEFAULT_CONFIG: Required<SecurityConfig> = {
 nodeEnv: process.env.NODE_ENV || 'development',
 allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://www.rez.money').split(','),
 rateLimitMax: 100,
 authRateLimitMax: 10,
 internalApiKey: process.env.INTERNAL_API_KEY || '',
 webhookSecret: process.env.WEBHOOK_SECRET || '',
 enableHelmet: true,
 enableCors: true,
 enableRateLimit: true,
};

// ============================================
// TIMING-SAFE UTILITIES
// ============================================

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
 if (a.length !== b.length) {
   try {
     crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
   } catch {
     // Ignore length mismatch errors
   }
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
export function verifyInternalApiKey(req: Request, expectedKey: string): boolean {
 const apiKey = req.headers['x-api-key'] as string;
 if (!apiKey || !expectedKey) return false;
 return timingSafeCompare(apiKey, expectedKey);
}

/**
 * Verify webhook signature
 */
export interface WebhookVerificationResult {
 valid: boolean;
 error?: string;
}

export function verifyWebhookSignature(
 req: Request,
 secret: string,
 signatureHeader: string = 'x-rez-signature'
): WebhookVerificationResult {
 const signature = req.headers[signatureHeader] as string;
 const rawBody = (req as unknown).rawBody;

 if (!signature) {
   return { valid: false, error: 'Missing signature header' };
 }

 if (!rawBody) {
   return { valid: false, error: 'Raw body not available' };
 }

 if (!secret) {
   return { valid: false, error: 'Webhook secret not configured' };
 }

 const expected = crypto
   .createHmac('sha256', secret)
   .update(rawBody)
   .digest('hex');

 const providedSig = signature.startsWith('sha256=')
   ? signature.substring(7)
   : signature;

 if (providedSig.length !== expected.length) {
   return { valid: false, error: 'Invalid signature length' };
 }

 try {
   const isValid = crypto.timingSafeEqual(
     Buffer.from(providedSig, 'hex'),
     Buffer.from(expected, 'hex')
   );
   return { valid: isValid, error: isValid ? undefined : 'Signature mismatch' };
 } catch {
   return { valid: false, error: 'Signature verification failed' };
 }
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(payload: string | object, secret: string): string {
 const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
 const signature = crypto
   .createHmac('sha256', secret)
   .update(payloadStr)
   .digest('hex');
 return `sha256=${signature}`;
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input
 */
export function sanitizeString(input, maxLength: number = 10000): string {
 if (typeof input !== 'string') return '';
 return input
   .replace(/[<>]/g, '') // Remove angle brackets
   .replace(/javascript:/gi, '') // Remove javascript:
   .replace(/on\w+=/gi, '') // Remove event handlers
   .replace(/\0/g, '') // Remove null bytes
   .trim()
   .substring(0, maxLength);
}

/**
 * Validate serial number format
 */
export function isValidSerial(serial: string): boolean {
 return /^[A-Za-z0-9\-]{6,50}$/.test(serial);
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
 return /^\+?[\d\s\-()]{10,20}$/.test(phone);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
 try {
   const parsed = new URL(url);
   return ['http:', 'https:'].includes(parsed.protocol);
 } catch {
   return false;
 }
}

// ============================================
// RATE LIMITING
// ============================================

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit (in-memory)
 */
export function checkRateLimit(
 ip: string,
 max: number,
 windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
 const now = Date.now();
 const record = rateLimitStore.get(ip);

 if (!record || now > record.resetTime) {
   rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
   return { allowed: true, remaining: max - 1, resetIn: windowMs };
 }

 if (record.count >= max) {
   return {
     allowed: false,
     remaining: 0,
     resetIn: record.resetTime - now,
   };
 }

 record.count++;
 return {
   allowed: true,
   remaining: max - record.count,
   resetIn: record.resetTime - now,
 };
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
 return (req: Request, res: Response, next: NextFunction) => {
   const ip =
     (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
     req.ip ||
     req.socket.remoteAddress ||
     'unknown';

   const result = checkRateLimit(ip, config.max, config.windowMs);

   // Set rate limit headers
   res.setHeader('X-RateLimit-Limit', config.max);
   res.setHeader('X-RateLimit-Remaining', result.remaining);
   res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + result.resetIn) / 1000));

   if (!result.allowed) {
     return res.status(429).json({
       error: 'Too many requests',
       message: config.message || 'Please try again later',
       retryAfter: Math.ceil(result.resetIn / 1000),
     });
   }

   next();
 };
}

// ============================================
// EXPRESS MIDDLEWARE CREATORS
// ============================================

/**
 * Create all security middleware
 */
export function createSecurityMiddleware(app: Express, config: SecurityConfig = {}) {
 const cfg = { ...DEFAULT_CONFIG, ...config };

 // 1. HTTPS Redirect (must be first)
 if (cfg.nodeEnv === 'production') {
   app.use((req: Request, res: Response, next: NextFunction) => {
     if (req.protocol !== 'https') {
       return res.redirect(`https://${req.hostname}${req.url}`);
     }
     next();
   });
 }

 // 2. Helmet
 if (cfg.enableHelmet) {
   app.use(
     helmet({
       hsts: {
         maxAge: 31536000,
         includeSubDomains: true,
         preload: true,
       },
       frameguard: { action: 'deny' },
       xssFilter: true,
       noSniff: true,
       referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
       contentSecurityPolicy: {
         directives: {
           defaultSrc: ["'self'"],
           scriptSrc: ["'self'", "'unsafe-inline'"],
           styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
           fontSrc: ["'self'", 'https://fonts.gstatic.com'],
           imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
           connectSrc: ["'self'", ...cfg.allowedOrigins],
           frameAncestors: ["'none'"],
         },
       },
     })
   );
 }

 // 3. CORS
 if (cfg.enableCors) {
   app.use(
     cors({
       origin: cfg.allowedOrigins,
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
       allowedHeaders: [
         'Content-Type',
         'Authorization',
         'X-Internal-Token',
         'X-Api-Key',
       ],
       exposedHeaders: [
         'X-RateLimit-Limit',
         'X-RateLimit-Remaining',
         'X-RateLimit-Reset',
       ],
     })
   );
 }

 // 4. Rate Limiting
 if (cfg.enableRateLimit) {
   const globalLimiter = createRateLimitMiddleware({
     windowMs: 15 * 60 * 1000,
     max: cfg.rateLimitMax,
     message: 'Too many requests, please try again later.',
   });

   const authLimiter = createRateLimitMiddleware({
     windowMs: 15 * 60 * 1000,
     max: cfg.authRateLimitMax,
     message: 'Too many authentication attempts, please try again later.',
   });

   // Apply global rate limiting to /api routes
   app.use('/api', globalLimiter);

   // Stricter rate limiting for auth routes
   app.use('/api/auth', authLimiter);
   app.use('/api/login', authLimiter);
   app.use('/api/register', authLimiter);
 }

 // 5. Body parsing
 app.use(express.json({ limit: '10mb' }));
 app.use(express.urlencoded({ extended: true, limit: '10mb' }));

 return cfg;
}

/**
 * Create auth middleware factory
 */
export function createAuthMiddleware(config: SecurityConfig = {}) {
 const cfg = { ...DEFAULT_CONFIG, ...config };

 return {
   /**
    * Verify internal API key
    */
   verifyApiKey: (req: Request, res: Response, next: NextFunction) => {
     if (!verifyInternalApiKey(req, cfg.internalApiKey)) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   },

   /**
    * Verify webhook signature
    */
   verifyWebhook: (req: Request, res: Response, next: NextFunction) => {
     const result = verifyWebhookSignature(req, cfg.webhookSecret);
     if (!result.valid) {
       return res.status(401).json({ error: result.error || 'Invalid signature' });
     }
     next();
   },

   /**
    * Sanitize request body
    */
   sanitizeBody: (fields: string[], maxLength: number = 10000) => {
     return (req: Request, res: Response, next: NextFunction) => {
       if (req.body) {
         for (const field of fields) {
           if (req.body[field] !== undefined) {
             req.body[field] = sanitizeString(req.body[field], maxLength);
           }
         }
       }
       next();
     };
   },
 };
}

// ============================================
// QR CONTENT SANITIZER
// ============================================

export interface SanitizedQRContent {
 content: string;
 type: 'text' | 'url' | 'phone' | 'email' | 'wifi' | 'vcard' | 'unknown';
 isValid: boolean;
 warnings: string[];
}

/**
 * Sanitize QR code content
 */
export function sanitizeQRContent(rawContent: string): SanitizedQRContent {
 const warnings: string[] = [];
 let content = rawContent.trim();

 if (!content || content.length === 0) {
   return { content: '', type: 'text', isValid: false, warnings: ['Empty QR content'] };
 }

 if (content.length > 4096) {
   return {
     content: '',
     type: 'text',
     isValid: false,
     warnings: ['QR content exceeds maximum length'],
   };
 }

 let type: SanitizedQRContent['type'] = 'unknown';

 // URL detection
 if (content.match(/^https?:\/\//i)) {
   type = 'url';
   const parsed = new URL(content);
   const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
   if (dangerousProtocols.some((p) => content.toLowerCase().includes(p))) {
     return { content: '', type, isValid: false, warnings: ['Dangerous protocol blocked'] };
   }
   // Block private IPs
   if (isPrivateIP(parsed.hostname)) {
     return { content: '', type, isValid: false, warnings: ['Private IP addresses not allowed'] };
   }
 }

 // Phone detection
 else if (content.match(/^tel:/i) || content.match(/^\+?[\d\s\-\(\)]{7,20}$/)) {
   type = 'phone';
 }

 // Email detection
 else if (content.match(/^mailto:/i) || content.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
   type = 'email';
 }

 // Apply sanitization
 content = sanitizeString(content);

 return { content, type, isValid: true, warnings };
}

/**
 * Check if hostname is private IP
 */
function isPrivateIP(hostname: string): boolean {
 if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return true;

 const privateRanges = [
   /^10\./,
   /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
   /^192\.168\./,
   /^169\.254\./,
   /^fc00:/i,
   /^fe80:/i,
 ];

 return privateRanges.some((range) => range.test(hostname));
}

// ============================================
// EXPORTS
// ============================================

export {
 securityHeaders,
 productionCors,
 rateLimitConfig,
 responseSecurityHeaders,
} from './security-headers';

export default {
 createSecurityMiddleware,
 createAuthMiddleware,
 createRateLimitMiddleware,
 timingSafeCompare,
 verifyInternalApiKey,
 verifyWebhookSignature,
 generateWebhookSignature,
 sanitizeString,
 sanitizeQRContent,
 isValidSerial,
 isValidPhone,
 isValidEmail,
 isValidUrl,
 checkRateLimit,
};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'security-middleware',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
