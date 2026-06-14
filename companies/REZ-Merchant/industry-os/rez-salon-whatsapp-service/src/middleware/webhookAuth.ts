import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';

export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature'] as string;
  const mode = req.headers['x-hub-mode'] as string;

  if (mode === 'subscribe') {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const challenge = req.query['hub.challenge'] as string;

    if (req.query['hub.verify_token'] === verifyToken) {
      res.status(200).send(challenge);
      return;
    } else {
      res.status(403).json({ error: 'Invalid verify token' });
      return;
    }
  }

  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;

  if (secret && signature) {
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Webhook signature verification failed');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  next();
}

export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const validTokens = process.env.INTERNAL_SERVICE_TOKENS_JSON
    ? JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON)
    : {};

  const isValid = Object.values(validTokens).includes(token);

  if (!isValid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
