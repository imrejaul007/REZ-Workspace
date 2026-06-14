/**
 * RABTUL Auth Middleware for rez-whatsapp-commerce
 * Replaces local JWT auth with RABTUL Auth Service
 *
 * Features:
 * - OTP-based authentication via SMS
 * - Token verification via RABTUL
 * - Service-to-service authentication
 */

import { Request, Response, NextFunction }, logger from 'utils/logger.js';
import express from 'express';
import { CustomerSession } from '../models/CustomerSession';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

/**
 * Make authenticated request to RABTUL Auth Service
 */
async function rabtulRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${AUTH_SERVICE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw Object.assign(new Error(error.message || `Auth error: ${response.status}`), {
      status: response.status,
    });
  }

  return response.json();
}

export interface RABTULUser {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
}

/**
 * Verify token with RABTUL Auth Service
 */
export async function verifyRABTULToken(token: string): Promise<RABTULUser | null> {
  try {
    const result = await rabtulRequest<{ user?: RABTULUser }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return result.user || null;
  } catch {
    return null;
  }
}

/**
 * Send OTP via RABTUL
 */
export async function sendOTP(phone: string): Promise<{ message: string; expiresIn: number }> {
  // Normalize phone to Indian format
  const normalizedPhone = phone.replace(/\D/g, '');
  const phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneRegex.test(normalizedPhone)) {
    throw new Error('Invalid phone number format');
  }

  const result = await rabtulRequest<{ message?: string; expiresIn?: number }>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: normalizedPhone }),
  });

  return {
    message: result.message || 'OTP sent successfully',
    expiresIn: result.expiresIn || 300,
  };
}

/**
 * Verify OTP and get token from RABTUL
 */
export async function verifyOTP(
  phone: string,
  otp: string
): Promise<{ success: boolean; token?: string; user?: RABTULUser }> {
  const normalizedPhone = phone.replace(/\D/g, '');

  const result = await rabtulRequest<{
    success: boolean;
    token?: string;
    user?: RABTULUser;
  }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone: normalizedPhone, otp }),
  });

  return {
    success: result.success,
    token: result.token,
    user: result.user,
  };
}

/**
 * Authenticate customer via RABTUL
 * Replaces local JWT authentication
 */
export function authenticateRABTUL(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // If no token, try to use header-based auth (for internal service calls)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.customerId = req.headers['x-customer-id'] as string;
    req.customerPhone = req.headers['x-customer-phone'] as string;
    req.merchantId = req.headers['x-merchant-id'] as string;

    if (req.customerId && req.customerPhone && req.merchantId) {
      next();
      return;
    }

    // Try RABTUL authentication
    authenticateWithRABTUL(req, res, next);
    return;
  }

  const token = authHeader.substring(7);

  // First try local JWT verification (for backward compatibility)
  const localPayload = verifyLocalToken(token);
  if (localPayload) {
    req.customerId = localPayload.customerId;
    req.customerPhone = localPayload.customerPhone;
    req.merchantId = localPayload.merchantId;
    req.sessionId = localPayload.sessionId;
    next();
    return;
  }

  // Try RABTUL token verification
  authenticateWithRABTUL(req, res, next);
}

async function authenticateWithRABTUL(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyRABTULToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Set customer info from RABTUL user
    req.customerId = user.id;
    req.customerPhone = user.phone || '';
    req.merchantId = req.headers['x-merchant-id'] as string || '';

    // Load or create session
    if (req.customerId && req.customerPhone && req.merchantId) {
      const sessionId = await loadCustomerSession(
        req.customerId,
        req.customerPhone,
        req.merchantId,
        `whatsapp:${req.customerPhone}`
      );
      req.sessionId = sessionId || undefined;
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token verification failed',
    });
  }
}

/**
 * Verify local JWT token (for backward compatibility)
 */
function verifyLocalToken(token: string): unknown {
  try {
    // Lazy, to avoid circular dependency
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET!;

    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Load or create customer session
 */
async function loadCustomerSession(
  customerId: string,
  customerPhone: string,
  merchantId: string,
  whatsappPhone: string
): Promise<string | null> {
  try {
    const session = await CustomerSession.findOrCreate(
      customerId,
      customerPhone,
      merchantId,
      whatsappPhone
    );
    return session.sessionId;
  } catch (error) {
    logger.error('Failed to load/create customer session:', error);
    return null;
  }
}

/**
 * Authenticate internal service calls via RABTUL
 */
export function authenticateInternalService(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Missing internal service token',
    });
    return;
  }

  // Verify token with RABTUL
  rabtulRequest<{ valid?: boolean; serviceName?: string }>(
    '/api/auth/internal/validate',
    {
      method: 'GET',
      headers: { 'X-Internal-Token': internalToken },
    }
  )
    .then((result) => {
      if (result.valid) {
        req.isInternalService = true;
        req.serviceName = result.serviceName || 'unknown';
        next();
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid internal service token',
        });
      }
    })
    .catch(() => {
      // Fallback to local validation if RABTUL is unavailable
      const INTERNAL_SERVICE_TOKENS_JSON = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';
      let internalServiceTokens: Record<string, string> = {};

      try {
        internalServiceTokens = JSON.parse(INTERNAL_SERVICE_TOKENS_JSON);
      } catch {
        // Use empty object
      }

      const serviceName = Object.entries(internalServiceTokens).find(
        ([, token]) => token === internalToken
      )?.[0];

      if (!serviceName) {
        res.status(401).json({
          success: false,
          error: 'Invalid internal service token',
        });
        return;
      }

      req.isInternalService = true;
      req.serviceName = serviceName;
      next();
    });
}

/**
 * Verify Razorpay webhook via RABTUL
 * RABTUL handles the Razorpay webhook and re-signs it
 */
export async function verifyRABTULWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const signature = req.headers['x-rabtul-signature'] as string;

  // If no RABTUL signature, try local verification
  if (!signature) {
    verifyRazorpayWebhookLocal(req, res, next);
    return;
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not configured');
    next();
    return;
  }

  const body = JSON.stringify(req.body);
  const crypto = require('crypto');

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    res.status(401).json({
      success: false,
      error: 'Invalid webhook signature',
    });
    return;
  }

  next();
}

/**
 * Local Razorpay webhook verification (fallback)
 */
function verifyRazorpayWebhookLocal(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const razorpaySignature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not configured, skipping webhook verification');
    next();
    return;
  }

  if (!razorpaySignature) {
    next();
    return;
  }

  const body = JSON.stringify(req.body);
  const crypto = require('crypto');

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (razorpaySignature !== expectedSignature) {
    _res.status(401).json({
      success: false,
      error: 'Invalid Razorpay signature',
    });
    return;
  }

  next();
}
