/**
 * Internal Service Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

function resolveScopedTokens(): Record<string, string> | null {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers['x-internal-token'] || req.headers['x-internal-key']) as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;
  const scopedTokens = resolveScopedTokens();
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!scopedTokens && !legacyToken) {
    res.status(503).json({ success: false, message: 'Internal auth not configured' });
    return;
  }

  let isValid = false;
  const tokenBuf = Buffer.from(token || '');

  if (scopedTokens) {
    if (!callerService) {
      res.status(401).json({ success: false, message: 'X-Internal-Service header required' });
      return;
    }
    const expected = scopedTokens[callerService];
    if (expected) {
      const expectedBuf = Buffer.from(expected);
      isValid = tokenBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(tokenBuf, expectedBuf);
    }
  }

  if (!isValid && !scopedTokens && legacyToken) {
    const legacyBuf = Buffer.from(legacyToken);
    isValid = tokenBuf.length === legacyBuf.length &&
      crypto.timingSafeEqual(tokenBuf, legacyBuf);
  }

  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  next();
}
