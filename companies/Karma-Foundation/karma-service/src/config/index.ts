import 'dotenv/config';

// ── Service ─────────────────────────────────────────────────────────────────
export const port = parseInt(process.env.PORT || '3009', 10);
export const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

// ── MongoDB ─────────────────────────────────────────────────────────────────
export const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/karma_foundation';

// ── Redis ────────────────────────────────────────────────────────────────────
export const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ── ReZ Service URLs ────────────────────────────────────────────────────────
export const authServiceUrl =
  process.env.AUTH_SERVICE_URL || 'http://rez-auth-service:3001';
export const walletServiceUrl =
  process.env.WALLET_SERVICE_URL || 'http://rez-wallet-service:3007';
export const merchantServiceUrl =
  process.env.MERCHANT_SERVICE_URL || 'http://rez-merchant-service:3003';

// ── JWT ─────────────────────────────────────────────────────────────────────
// SECURITY FIX: Validate presence AND minimum length at startup.
export const jwtSecret = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('[CONFIG] JWT_SECRET environment variable is required');
  }
  if (secret.length < 32) {
    throw new Error('jwtSecret must be at least 32 characters');
  }
  return secret;
})();

// ── Batch Conversion ────────────────────────────────────────────────────────
export const batchCronSchedule = process.env.BATCH_CRON_SCHEDULE || '59 23 * * 0';

// ── Rate Limiting ───────────────────────────────────────────────────────────
export const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
export const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

// ── CORS ────────────────────────────────────────────────────────────────────
// SECURITY FIX: Removed '*' fallback - require explicit CORS_ORIGIN in production
export const corsOrigin = (() => {
  const origin = process.env.CORS_ORIGIN;
  if (!origin) {
    if (nodeEnv === 'production') {
      throw new Error('[CONFIG] CORS_ORIGIN environment variable is required in production');
    }
    console.warn('[CONFIG] CORS_ORIGIN not set - using development mode (allowing localhost)');
    return 'http://localhost:3000,http://localhost:3001';
  }
  return origin;
})();

// ── QR Verification ──────────────────────────────────────────────────────────
// SECURITY FIX: Fail-closed - throw if not configured
export const qrSecret = (() => {
  const secret = process.env.QR_SECRET;
  if (!secret) {
    throw new Error('[CONFIG] QR_SECRET environment variable is required for production');
  }
  return secret;
})();

// ── Sentry ───────────────────────────────────────────────────────────────────
export const sentryDsn = process.env.SENTRY_DSN;

// ── Internal Service Token ───────────────────────────────────────────────────
export const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;
