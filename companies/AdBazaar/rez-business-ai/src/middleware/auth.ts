/**
 * REZ Business AI - Auth Middleware
 */

// API Keys for service-to-service auth
const API_KEYS = new Map([
  ['merchant-service', process.env.MERCHANT_SERVICE_KEY || 'key-merchant-123'],
  ['media-service', process.env.MEDIA_SERVICE_KEY || 'key-media-123'],
  ['admin', process.env.ADMIN_KEY || 'key-admin-123'],
]);

// Merchant API keys
const MERCHANT_KEYS = new Map();

/**
 * Verify API key middleware
 */
function verifyApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!key) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Check service keys
  for (const [service, serviceKey] of API_KEYS) {
    if (key === serviceKey) {
      req.service = service;
      return next();
    }
  }

  // Check merchant keys
  if (MERCHANT_KEYS.has(key)) {
    req.merchantId = MERCHANT_KEYS.get(key);
    return next();
  }

  return res.status(401).json({ error: 'Invalid API key' });
}

/**
 * Verify internal token for service-to-service
 */
function verifyInternalToken(req, res, next) {
  const token = req.headers['x-internal-token'];
  const validToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-token-123';

  if (!token) {
    return res.status(401).json({ error: 'Internal token required' });
  }

  if (token !== validToken) {
    return res.status(401).json({ error: 'Invalid internal token' });
  }

  next();
}

/**
 * Rate limiter per merchant
 */
const rateLimiters = new Map();

function rateLimit(req, res, next) {
  const key = req.merchantId || req.ip;
  const now = Date.now();

  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, { count: 1, resetAt: now + 60000 });
    return next();
  }

  const limiter = rateLimiters.get(key);

  if (now > limiter.resetAt) {
    limiter.count = 1;
    limiter.resetAt = now + 60000;
    return next();
  }

  if (limiter.count >= 100) { // 100 requests/minute
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  limiter.count++;
  next();
}

/**
 * Generate merchant API key
 */
function generateMerchantKey(merchantId) {
  const key = 'mk_' + Buffer.from(`${merchantId}:${Date.now()}`).toString('base64').slice(0, 32);
  MERCHANT_KEYS.set(key, merchantId);
  return key;
}

/**
 * CORS middleware
 */
function corsMiddleware(req, res, next) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',');
  const origin = req.headers.origin;

  if (allowed.includes('*') || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Internal-Token');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

module.exports = {
  verifyApiKey,
  verifyInternalToken,
  rateLimit,
  generateMerchantKey,
  corsMiddleware,
};
