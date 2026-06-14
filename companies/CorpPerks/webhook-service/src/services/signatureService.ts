import crypto from 'crypto';
import { config } from '../config/index.js';

export interface SignaturePayload {
  timestamp: number;
  payload: string | Buffer;
  secret: string;
}

export function generateSignature(payload: SignaturePayload): string {
  const { timestamp, payload: payloadStr, secret } = payload;
  const signaturePayload = `${timestamp}.${payloadStr}`;
  return crypto
    .createHmac(config.webhook.signatureAlgorithm, secret)
    .update(signaturePayload)
    .digest('hex');
}

export function verifySignature(
  signature: string,
  timestamp: number,
  payload: string | Buffer,
  secret: string
): boolean {
  // Check timestamp to prevent replay attacks (5 minute window)
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  if (Math.abs(now - timestamp) > fiveMinutes) {
    return false;
  }

  const expectedSignature = generateSignature({ timestamp, payload, secret });
  return timingSafeEqual(signature, expectedSignature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
