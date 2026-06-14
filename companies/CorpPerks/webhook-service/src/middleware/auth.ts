import { Request, Response, NextFunction } from 'express';
import { verifySignature } from '../services/signatureService.js';
import { WebhookSubscription } from '../models/webhookSubscription.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isInternalService?: boolean;
}

/**
 * Internal service authentication middleware
 * Verifies the X-Internal-Token header for service-to-service communication
 */
export function internalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-Internal-Token header',
    });
    return;
  }

  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    logger.warn('Invalid internal token attempt', {
      ip: req.ip,
      path: req.path,
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid internal token',
    });
    return;
  }

  req.isInternalService = true;
  next();
}

/**
 * Webhook receiver authentication middleware
 * Verifies HMAC signature on incoming webhooks
 */
export async function webhookAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;
  const webhookId = req.headers['x-webhook-id'] as string;

  if (!signature) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing webhook signature',
    });
    return;
  }

  if (!timestamp) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing webhook timestamp',
    });
    return;
  }

  const timestampNum = parseInt(timestamp, 10);

  if (isNaN(timestampNum)) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid timestamp format',
    });
    return;
  }

  // Find subscription by ID if provided
  if (webhookId) {
    const subscription = await WebhookSubscription.findById(webhookId).select(
      '+secret'
    );

    if (!subscription) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Subscription not found',
      });
      return;
    }

    const payload = JSON.stringify(req.body);
    const isValid = verifySignature(
      signature,
      timestampNum,
      payload,
      subscription.secret
    );

    if (!isValid) {
      logger.warn('Invalid webhook signature', {
        webhookId,
        ip: req.ip,
      });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature',
      });
      return;
    }
  }

  next();
}

/**
 * Optional auth middleware - sets userId if token present, continues otherwise
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, verify JWT and set req.userId
    // For now, we'll just pass through
    req.userId = token;
  }

  next();
}
