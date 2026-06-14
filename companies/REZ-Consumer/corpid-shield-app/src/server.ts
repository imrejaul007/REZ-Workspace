/**
 * CorpID Shield Server
 *
 * Consumer-facing fraud protection service.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';

// Services
import { scamDetector } from './services/scamDetector.js';
import { guardianAI } from './services/guardianAI.js';

// Types
import {
  RegisterRequest,
  CheckScamRequest,
  AnalyzeSMSRequest,
  VerifyUPIRequest,
  AnalyzeQRRequest,
  CheckBreachRequest,
  GuardianChatRequest,
  ShieldUser,
  TrustScoreDetails,
  BreachAlert
} from './types/index.js';

// ============================================
// LOGGER SETUP
// ============================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/corpid-shield.log' })
  ]
});

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
const PORT = process.env.PORT || 4716;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// ============================================
// IN-MEMORY STORAGE (would use DB in production)
// ============================================

const users: Map<string, ShieldUser> = new Map();
const alerts: Map<string, ShieldAlert[]> = new Map();
const breaches: Map<string, BreachAlert[]> = new Map();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const registerSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  email: z.string().email().optional(),
  name: z.string().optional()
});

const checkScamSchema = z.object({
  phoneNumber: z.string().min(10),
  callerName: z.string().optional()
});

const analyzeSMSSchema = z.object({
  message: z.string().min(1),
  sender: z.string().optional()
});

const verifyUPISchema = z.object({
  upiId: z.string().min(1),
  amount: z.number().optional()
});

const analyzeQRSchema = z.object({
  qrData: z.string().min(1)
});

const checkBreachSchema = z.object({
  type: z.enum(['email', 'phone', 'pan', 'aadhaar']),
  value: z.string().min(1)
});

const guardianChatSchema = z.object({
  question: z.string().min(1),
  category: z.enum(['scam_check', 'upi_safety', 'password_security', 'phishing', 'investment_fraud', 'general']).optional(),
  context: z.string().optional()
});

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Register new user
 * POST /api/register
 */
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const userId = `user_${uuidv4().slice(0, 12)}`;

    const user: ShieldUser = {
      userId,
      phone: body.phone,
      email: body.email,
      trustScore: 500,
      trustLevel: 'GOOD',
      registeredAt: new Date(),
      lastActive: new Date(),
      plan: 'free',
      verified: {
        phone: true,
        email: !!body.email
      }
    };

    users.set(userId, user);
    alerts.set(userId, []);
    breaches.set(userId, []);

    logger.info('User registered', { userId, phone: body.phone });

    res.status(201).json({
      userId,
      phone: body.phone,
      trustScore: 500,
      verificationRequired: false,
      message: 'Welcome to CorpID Shield!'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logger.error('Error registering user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user profile
 * GET /api/user/:userId
 */
app.get('/api/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// ============================================
// SCAM DETECTION ENDPOINTS
// ============================================

/**
 * Check if a phone number is a scam
 * POST /api/scam/check-phone
 */
app.post('/api/scam/check-phone', (req: Request, res: Response) => {
  try {
    const body = checkScamSchema.parse(req.body);

    const result = scamDetector.checkPhone(body.phoneNumber, body.callerName);

    logger.info('Phone scam check', {
      phone: body.phoneNumber,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logger.error('Error checking phone', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Analyze SMS for scams
 * POST /api/scam/analyze-sms
 */
app.post('/api/scam/analyze-sms', (req: Request, res: Response) => {
  try {
    const body = analyzeSMSSchema.parse(req.body);

    const result = scamDetector.analyzeSMS(body.message, body.sender);

    logger.info('SMS analysis', {
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      detections: result.detections.length
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logger.error('Error analyzing SMS', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Report a scam
 * POST /api/scam/report
 */
app.post('/api/scam/report', (req: Request, res: Response) => {
  try {
    const { phoneNumber, type, category, userId } = req.body;

    if (!phoneNumber || !type || !category) {
      return res.status(400).json({ error: 'phoneNumber, type, and category required' });
    }

    scamDetector.reportScam(phoneNumber, type, category);

    // Create alert for user
    if (userId && users.has(userId)) {
      const userAlerts = alerts.get(userId) || [];
      const alert: ShieldAlert = {
        alertId: `alert_${uuidv4().slice(0, 8)}`,
        userId,
        type: 'scam_call',
        title: 'Scam Reported Successfully',
        description: `You reported ${phoneNumber} as a ${category} scam`,
        severity: 'LOW',
        createdAt: new Date(),
        status: 'action_taken'
      };
      userAlerts.push(alert);
      alerts.set(userId, userAlerts);
    }

    logger.info('Scam reported', { phoneNumber, type, category });

    res.json({
      success: true,
      message: 'Thank you for reporting! This helps protect others.',
      reportId: `report_${uuidv4().slice(0, 8)}`
    });
  } catch (error) {
    logger.error('Error reporting scam', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// UPI SAFETY ENDPOINTS
// ============================================

/**
 * Verify UPI ID
 * POST /api/upi/verify
 */
app.post('/api/upi/verify', (req: Request, res: Response) => {
  try {
    const body = verifyUPISchema.parse(req.body);

    // Simulated verification (would query actual data in production)
    const riskScore = Math.random() * 30; // Simulated low risk

    const result = {
      upiId: body.upiId,
      recipientName: 'Merchant ' + body.upiId.split('@')[0],
      merchantName: 'Verified Merchant',
      riskLevel: riskScore < 10 ? 'SAFE' : riskScore < 20 ? 'SUSPICIOUS' : 'LIKELY_FRAUD',
      riskScore: Math.round(riskScore),
      trustScore: Math.round(100 - riskScore * 3),
      verifications: {
        merchantVerified: riskScore < 20,
        kycVerified: riskScore < 15,
        complaintsCount: Math.floor(Math.random() * 3),
        transactionCount: Math.floor(Math.random() * 100) + 10,
        avgRating: riskScore < 15 ? 4.5 : 3.2
      },
      warnings: riskScore > 15 ? ['Multiple complaints reported', 'New merchant - low transaction history'] : [],
      recommendation: riskScore < 10 ? 'pay' : riskScore < 20 ? 'review' : 'avoid'
    };

    logger.info('UPI verification', { upiId: body.upiId, riskLevel: result.riskLevel });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logger.error('Error verifying UPI', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Analyze QR code
 * POST /api/qr/analyze
 */
app.post('/api/qr/analyze', (req: Request, res: Response) => {
  try {
    const body = analyzeQRSchema.parse(req.body);

    const result = {
      qrId: `qr_${uuidv4().slice(0, 8)}`,
      data: body.qrData,
      type: body.qrData.includes('@') ? 'upi' : body.qrData.startsWith('http') ? 'url' : 'text',
      parsedData: {
        upiId: body.qrData.includes('@') ? body.qrData : undefined,
        merchantName: body.qrData.includes('@') ? body.qrData.split('@')[0] : undefined
      },
      riskLevel: 'SAFE',
      riskScore: 5,
      warnings: [],
      recommendation: 'scan'
    };

    logger.info('QR code analyzed', { type: result.type });

    res.json(result);
  } catch (error) {
    logger.error('Error analyzing QR', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// BREACH MONITORING ENDPOINTS
// ============================================

/**
 * Check for breaches
 * POST /api/breach/check
 */
app.post('/api/breach/check', (req: Request, res: Response) => {
  try {
    const body = checkBreachSchema.parse(req.body);

    // Simulated breach check
    const foundInBreaches = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;

    const result = {
      type: body.type,
      value: body.value,
      foundInBreaches,
      breaches: foundInBreaches > 0 ? [
        {
          source: 'Have I Been Pwned',
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          dataTypes: ['email', 'password', 'phone']
        }
      ] : [],
      riskLevel: foundInBreaches === 0 ? 'LOW' : foundInBreaches < 3 ? 'MEDIUM' : 'HIGH'
    };

    logger.info('Breach check', { type: body.type, foundInBreaches });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logger.error('Error checking breach', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's breach alerts
 * GET /api/breach/alerts/:userId
 */
app.get('/api/breach/alerts/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userBreaches = breaches.get(userId) || [];

  res.json({
    userId,
    alerts: userBreaches,
    count: userBreaches.length
  });
});

// ============================================
// TRUST SCORE ENDPOINTS
// ============================================

/**
 * Get trust score details
 * GET /api/trust-score/:userId
 */
app.get('/api/trust-score/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const response: TrustScoreDetails = {
    userId,
    score: user.trustScore,
    level: user.trustLevel,
    factors: [
      { factor: 'identity_verified', contribution: 100, description: 'Phone verified' },
      { factor: 'reports_filed', contribution: 50, description: 'Community contributions' },
      { factor: 'no_fraud_history', contribution: 80, description: 'Clean record' }
    ],
    badges: [
      { badge: 'verified_user', description: 'Identity verified', awardedAt: new Date(), icon: '✅' },
      { badge: 'scam_reporter', description: 'Active community member', awardedAt: new Date(), icon: '🛡️' }
    ],
    improvements: [
      'Verify your email to increase score',
      'Enable breach monitoring',
      'Link your Aadhaar for higher trust'
    ],
    history: [
      { date: new Date(), score: user.trustScore }
    ]
  };

  res.json(response);
});

// ============================================
// AI GUARDIAN ENDPOINTS
// ============================================

/**
 * Chat with AI Guardian
 * POST /api/guardian/chat
 */
app.post('/api/guardian/chat', (req: Request, res: Response) => {
  try {
    const body = guardianChatSchema.parse(req.body);
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    const result = guardianAI.processQuery(userId, body.question, body.category);

    logger.info('Guardian chat', { userId, category: body.category });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    logger.error('Error in guardian chat', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Clear guardian conversation
 * DELETE /api/guardian/history
 */
app.delete('/api/guardian/history', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    guardianAI.clearHistory(userId);
  }
  res.json({ success: true });
});

// ============================================
// ALERTS ENDPOINTS
// ============================================

/**
 * Get user alerts
 * GET /api/alerts/:userId
 */
app.get('/api/alerts/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userAlerts = alerts.get(userId) || [];

  res.json({
    userId,
    alerts: userAlerts,
    count: userAlerts.length,
    unread: userAlerts.filter(a => a.status === 'new').length
  });
});

/**
 * Dismiss alert
 * PUT /api/alerts/:userId/:alertId
 */
app.put('/api/alerts/:userId/:alertId', (req: Request, res: Response) => {
  const { userId, alertId } = req.params;
  const userAlerts = alerts.get(userId) || [];

  const alert = userAlerts.find(a => a.alertId === alertId);
  if (alert) {
    alert.status = 'dismissed';
  }

  res.json({ success: true });
});

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

/**
 * Get dashboard stats
 * GET /api/dashboard/:userId
 */
app.get('/api/dashboard/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userAlerts = alerts.get(userId) || [];
  const userBreaches = breaches.get(userId) || [];

  res.json({
    userId,
    trustScore: user.trustScore,
    trustLevel: user.trustLevel,
    stats: {
      scamCallsBlocked: Math.floor(Math.random() * 50),
      phishingDetected: Math.floor(Math.random() * 20),
      alertsActive: userAlerts.filter(a => a.status === 'new').length,
      breachesFound: userBreaches.length
    },
    recentAlerts: userAlerts.slice(-5)
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CorpID Shield',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CorpID Shield',
    description: 'Consumer Fraud Protection - IronTrex competitor',
    version: '1.0.0',
    endpoints: {
      user: {
        'POST /api/register': 'Register new user',
        'GET /api/user/:userId': 'Get user profile'
      },
      scam: {
        'POST /api/scam/check-phone': 'Check phone for scam',
        'POST /api/scam/analyze-sms': 'Analyze SMS for scams',
        'POST /api/scam/report': 'Report a scam'
      },
      upi: {
        'POST /api/upi/verify': 'Verify UPI ID',
        'POST /api/qr/analyze': 'Analyze QR code'
      },
      breach: {
        'POST /api/breach/check': 'Check for data breaches',
        'GET /api/breach/alerts/:userId': 'Get breach alerts'
      },
      trust: {
        'GET /api/trust-score/:userId': 'Get trust score details'
      },
      guardian: {
        'POST /api/guardian/chat': 'Chat with AI Guardian'
      },
      alerts: {
        'GET /api/alerts/:userId': 'Get user alerts',
        'PUT /api/alerts/:userId/:alertId': 'Update alert'
      }
    }
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`CorpID Shield server started on port ${PORT}`);
  logger.info(🛡️  CorpID Shield running at http://localhost:${PORT}`);
  logger.info(📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
