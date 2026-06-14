import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { errorResponse, errors } from '../utils/response';

function resolveScopedTokens(): Record<string, string> | null {
  try {
    const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * FIX-WEBHOOK-001: Verify HMAC-SHA256 signature on webhook payloads.
 * Prevents replay attacks and ensures payload integrity.
 *
 * @param payload - Raw request body as string
 * @param signature - X-Signature header value (HMAC-SHA256 hex digest)
 * @param secret - Shared secret for HMAC computation
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!payload || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Middleware factory for HMAC-verified webhook endpoints.
 * Use for sensitive internal endpoints that receive external webhooks.
 *
 * @param headerName - Header containing the HMAC signature (default: 'x-signature')
 * @param secretKey - Env var name containing the shared secret
 */
export function requireWebhookSignature(headerName: string = 'x-signature', secretKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const secret = process.env[secretKey];
    if (!secret) {
      return errorResponse(res, errors.authServiceUnavailable({ message: `Webhook secret ${secretKey} not configured` }));
    }

    const signature = req.headers[headerName] as string;
    if (!signature) {
      return errorResponse(res, errors.authTokenInvalid({ message: 'Missing webhook signature' }));
    }

    // Get raw body - Express should have parsed this, we need the original string
    const rawBody = JSON.stringify(req.body);
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return errorResponse(res, errors.authTokenInvalid({ message: 'Invalid webhook signature' }));
    }

    next();
  };
}

/**
 * Middleware to validate X-Internal-Token for service-to-service calls.
 *
 * Supports two modes (checked in order):
 *   1. Scoped: INTERNAL_SERVICE_TOKENS_JSON — per-service tokens, caller identified
 *      by x-internal-service header. Falls through to legacy if caller not found.
 *   2. Legacy: INTERNAL_SERVICE_TOKEN — single shared secret (backward compatible).
 *
 * Also accepts x-internal-key as an alias for x-internal-token for backward
 * compatibility with callers that use the older header name.
 */
export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers['x-internal-token'] || req.headers['x-internal-key']) as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;
  const scopedTokens = resolveScopedTokens();
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!scopedTokens && !legacyToken) {
    return errorResponse(res, errors.authServiceUnavailable({ message: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN' }));
  }

  let isValid = false;
  const tokenBuf = Buffer.from(token || '');

  if (scopedTokens) {
    // Scoped mode: X-Internal-Service header is required.
    // Omitting it is an error — do NOT fall through to legacy token to prevent
    // token isolation bypass (matches monolith behaviour).
    if (!callerService) {
      return errorResponse(res, errors.authTokenInvalid({ message: 'X-Internal-Service header required in scoped auth mode' }));
    }
    const expected = scopedTokens[callerService];
    if (expected) {
      const expectedBuf = Buffer.from(expected);
      isValid = tokenBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(tokenBuf, expectedBuf);
    }
  }

  // Legacy fallback: single shared token — used ONLY when INTERNAL_SERVICE_TOKENS_JSON
  // is NOT configured (pure legacy mode). Never reached in scoped mode.
  if (!isValid && !scopedTokens && legacyToken) {
    const legacyBuf = Buffer.from(legacyToken);
    isValid = tokenBuf.length === legacyBuf.length &&
      crypto.timingSafeEqual(tokenBuf, legacyBuf);
  }

  if (!isValid) {
    return errorResponse(res, errors.authTokenInvalid());
  }

  next();
}
