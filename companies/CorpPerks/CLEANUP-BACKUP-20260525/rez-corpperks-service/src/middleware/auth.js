import logger from './utils/logger';

/**
 * CorpPerks Auth Middleware - RABTUL Integration
 *
 * Delegates all authentication to the RABTUL Auth Service.
 * This ensures single identity across the REZ ecosystem.
 */

const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

/**
 * Verify token with RABTUL Auth Service
 */
async function verifyTokenWithRABTUL(token) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      return {
        sub: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        role: data.user.role || 'user',
        companyId: data.user.companyId,
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] RABTUL verify failed:', error);
    return null;
  }
}

/**
 * Request logging
 */
const requestLogger = (req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

/**
 * Require valid JWT Bearer token (via RABTUL)
 */
const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = auth.substring(7);

  try {
    const user = await verifyTokenWithRABTUL(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

/**
 * Require internal service token
 */
const requireInternal = (req, res, next) => {
  const token = req.headers['x-internal-token'];

  if (token !== INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ error: 'Internal access required' });
  }

  next();
};

/**
 * Rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many attempts, try later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Send OTP via RABTUL
 */
async function sendOTP(phone) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify OTP via RABTUL
 */
async function verifyOTP(phone, otp) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    return { success: res.ok, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  requireAuth,
  requireInternal,
  authLimiter,
  requestLogger,
  verifyTokenWithRABTUL,
  sendOTP,
  verifyOTP,
};
