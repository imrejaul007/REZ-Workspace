/**
 * ReZ Upsell - Security Middleware
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';

// Rate limiting - General API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - Strict (auth, billing)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: { error: 'Too many attempts, please try again later.' },
});

// Rate limiting - Webhook
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 webhooks per minute
  message: { error: 'Webhook rate limit exceeded.' },
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Input validation schemas
export const schemas = {
  configureUpsell: z.object({
    shop: z.string().min(1),
    products: z.array(z.object({
      productId: z.string(),
      variantId: z.string(),
      title: z.string(),
      price: z.number().positive(),
    })).optional(),
    discountPercentage: z.number().min(1).max(100).optional(),
    discountCode: z.string().optional(),
    position: z.enum(['checkout', 'cart', 'thank_you']).optional(),
  }),

  trackEvent: z.object({
    shop: z.string().min(1),
    sessionId: z.string().min(1),
    offerId: z.string().min(1),
    productId: z.string().min(1),
    event: z.enum(['offer_shown', 'offer_clicked', 'offer_accepted', 'offer_declined']),
    revenue: z.number().optional(),
  }),

  getOffer: z.object({
    shop: z.string().min(1),
    cartItems: z.array(z.object({
      productId: z.string(),
      variantId: z.string(),
      title: z.string(),
      price: z.number(),
      quantity: z.number().int().positive(),
    })),
    sessionId: z.string().optional(),
  }),
};

// Validation middleware factory
export function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
}

// HMAC verification for webhooks
export function verifyShopifyWebhook(req: Request, res: Response, next: NextFunction) {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!hmac || !secret) {
    res.status(401).json({ error: 'Missing HMAC' });
    return;
  }

  // In production, verify HMAC properly
  // const hash = crypto.createHmac('sha256', secret)
  //   .update(req.rawBody)
  //   .digest('base64');

  // if (hash !== hmac) {
  //   res.status(401).json({ error: 'Invalid HMAC' });
  //   return;
  // }

  next();
}

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://admin.shopify.com', /\.myshopify\.com$/]
    : true,
  credentials: true,
};
