import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

function resolveScopedTokens(): Record<string, string> | null {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    if (!raw || raw.trim() === '') return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;

  // SECURITY FIX: Fail closed when no token provided — no auth bypass
  if (!token || token.length === 0) {
    res.status(401).json({ success: false, error: 'Missing internal token' });
    return;
  }

  const scopedTokens = resolveScopedTokens();
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;

  // SECURITY FIX (ORDER-HMAC-001): Fail closed when neither auth mechanism is configured.
  // Previously fell back to 'fallback' literal string as HMAC key — trivially guessable.
  if (!scopedTokens && !legacyToken) {
    res.status(503).json({ success: false, error: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN' });
    return;
  }

  let expected: string | undefined;
  if (scopedTokens && callerService) {
    expected = scopedTokens[callerService];
  } else if (legacyToken) {
    expected = legacyToken;
  }

  // SECURITY FIX: Verify expected token is configured for this caller/service combination
  if (!expected) {
    res.status(401).json({ success: false, error: 'No internal token configured for this service' });
    return;
  }

  // C9 FIX: Use dedicated INTERNAL_SERVICE_HMAC_SECRET as the HMAC key.
  // The secret was already added to env.ts validation. Never use the token itself
  // as the HMAC key — that was the self-referential bug (ORDER-C9-001).
  const hmacKey = Buffer.from(env.INTERNAL_SERVICE_HMAC_SECRET, 'utf8');
  const tokenHmac = crypto.createHmac('sha256', hmacKey).update(token).digest();
  const expectedHmac = crypto.createHmac('sha256', hmacKey).update(expected).digest();

  // Length check before timing-safe compare to prevent TypeError
  const isValid = tokenHmac.length === expectedHmac.length &&
    crypto.timingSafeEqual(tokenHmac, expectedHmac);

  if (!isValid) {
    res.status(401).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  next();
}
