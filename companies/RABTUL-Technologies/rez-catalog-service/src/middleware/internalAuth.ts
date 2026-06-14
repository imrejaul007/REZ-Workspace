import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * CRITICAL-002 FIX: HMAC secret must come from environment, not runtime generation.
 * Runtime generation (`crypto.randomBytes()`) caused ALL internal auth to fail because
 * callers use a static token from INTERNAL_SERVICE_TOKENS_JSON, but the catalog service
 * generated a new random HMAC key on every startup. Result: every call returned 401.
 */
function getHmacSecret(): Buffer {
  const secret = process.env.INTERNAL_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      'INTERNAL_HMAC_SECRET environment variable is required. ' +
      'Set it to a shared 64-character hex string (32 bytes) across all services ' +
      'that call the catalog service. Generate with: node -e "logger.info(require("crypto").randomBytes(32).toString("hex"))"'
    );
  }
  if (secret.length < 32) {
    throw new Error('INTERNAL_HMAC_SECRET must be at least 32 characters (16 bytes hex)');
  }
  return Buffer.from(secret, 'utf8');
}

let _hmacSecret: Buffer | null = null;
function hmacSecret(): Buffer {
  if (!_hmacSecret) {
    _hmacSecret = getHmacSecret();
  }
  return _hmacSecret;
}

function hmac(value: string): Buffer {
  return crypto.createHmac('sha256', hmacSecret()).update(value).digest();
}

function resolveScopedTokens(): Record<string, string> | null {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[InternalAuth] Failed to parse INTERNAL_SERVICE_TOKENS_JSON: ${errorMessage}`);
    return null;
  }
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;
  const scopedTokens = resolveScopedTokens();

  if (!scopedTokens) {
    res.status(503).json({ success: false, error: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON' });
    return;
  }

  const expected = callerService ? scopedTokens[callerService] : undefined;

  // Use HMAC on both sides so both buffers are always the same fixed length,
  // making crypto.timingSafeEqual safe regardless of input length differences.
  const tokenHmac = hmac(token || '');
  const expectedHmac = hmac(expected || '');

  const isValid = !!expected && crypto.timingSafeEqual(tokenHmac, expectedHmac);

  if (!isValid) {
    res.status(401).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  next();
}
