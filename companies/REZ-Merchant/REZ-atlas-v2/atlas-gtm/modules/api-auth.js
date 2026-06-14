/**
 * REZ Atlas GTM - API Authentication Middleware
 * JWT-based authentication for all protected routes
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'atlas-gtm-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const API_KEY_HEADER = 'x-api-key';
const AUTH_HEADER = 'authorization';

// In-memory API keys store (in production, use database)
const apiKeys = new Map([
  ['atlas-gtm-api-key-dev', {
    name: 'Development Key',
    scopes: ['read', 'write', 'admin'],
    createdAt: new Date().toISOString()
  }]
]);

// Rate limiting store
const rateLimits = new Map();

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

/**
 * Generate JWT token for user/service
 */
function generateToken(payload, options = {}) {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN,
    issuer: 'atlas-gtm'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: 'atlas-gtm' });
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
function decodeToken(token) {
  return jwt.decode(token);
}

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Generate new API key
 */
function generateApiKey(name, scopes = ['read']) {
  const key = `atlas-gtm-${crypto.randomBytes(24).toString('hex')}`;
  apiKeys.set(key, {
    name,
    scopes,
    createdAt: new Date().toISOString(),
    lastUsed: null
  });
  return { key, name, scopes };
}

/**
 * Validate API key
 */
function validateApiKey(key) {
  const apiKeyData = apiKeys.get(key);
  if (!apiKeyData) return null;

  apiKeyData.lastUsed = new Date().toISOString();
  return apiKeyData;
}

/**
 * Revoke API key
 */
function revokeApiKey(key) {
  return apiKeys.delete(key);
}

/**
 * List all API keys (without secrets)
 */
function listApiKeys() {
  return Array.from(apiKeys.entries()).map(([key, data]) => ({
    key: key.substring(0, 15) + '...',
    name: data.name,
    scopes: data.scopes,
    createdAt: data.createdAt,
    lastUsed: data.lastUsed
  }));
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Check rate limit for identifier
 */
function checkRateLimit(identifier, limits = {}) {
  const {
    windowMs = 60000,    // 1 minute default
    maxRequests = 100    // 100 requests per window
  } = limits;

  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create rate limit record
  let record = rateLimits.get(identifier) || { requests: [], count: 0 };

  // Filter out old requests
  record.requests = record.requests.filter(time => time > windowStart);
  record.count = record.requests.length;

  // Check limit
  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.requests[0] + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      reset: retryAfter,
      limit: maxRequests
    };
  }

  // Add new request
  record.requests.push(now);
  rateLimits.set(identifier, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count - 1,
    reset: Math.ceil(windowMs / 1000),
    limit: maxRequests
  };
}

/**
 * Get rate limit status without incrementing
 */
function getRateLimitStatus(identifier) {
  const record = rateLimits.get(identifier);
  if (!record) {
    return { used: 0, remaining: 100, reset: 60 };
  }

  const now = Date.now();
  const windowMs = 60000;
  const windowStart = now - windowMs;
  const recentRequests = record.requests.filter(time => time > windowStart);

  return {
    used: recentRequests.length,
    remaining: 100 - recentRequests.length,
    reset: Math.ceil((record.requests[0] + windowMs - now) / 1000) || 60
  };
}

// ============================================
// MIDDLEWARE FACTORY
// ============================================

/**
 * Create authentication middleware
 */
function createAuthMiddleware(options = {}) {
  const {
    required = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'],
    scopes = []
  } = options;

  return (req, res, next) => {
    // Check method
    if (!allowedMethods.includes(req.method)) {
      return next();
    }

    // Try JWT first
    const authHeader = req.headers[AUTH_HEADER];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload) {
        req.user = payload;
        req.authType = 'jwt';

        // Check scopes
        if (scopes.length > 0 && payload.scopes) {
          const hasScope = scopes.some(scope => payload.scopes.includes(scope));
          if (!hasScope) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              required: scopes
            });
          }
        }

        return next();
      }
    }

    // Try API Key
    const apiKey = req.headers[API_KEY_HEADER];
    if (apiKey) {
      const keyData = validateApiKey(apiKey);

      if (keyData) {
        req.apiKey = keyData;
        req.authType = 'api-key';

        // Check scopes
        if (scopes.length > 0) {
          const hasScope = scopes.some(scope => keyData.scopes.includes(scope));
          if (!hasScope) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              required: scopes
            });
          }
        }

        return next();
      }
    }

    // Auth required but not provided
    if (required) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Provide Bearer token or API key',
        hints: {
          jwt: 'Authorization: Bearer <token>',
          apiKey: 'X-API-Key: <api-key>'
        }
      });
    }

    // Auth not required
    next();
  };
}

/**
 * Create rate limiting middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const identifier = keyGenerator(req);
    const result = checkRateLimit(identifier, { windowMs, maxRequests });

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.reset
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: result.reset
      });
    }

    next();
  };
}

/**
 * CORS middleware with configurable origins
 */
function createCorsMiddleware(allowedOrigins = ['*']) {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Request ID middleware
 */
function requestIdMiddleware(req, res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Request logging middleware
 */
function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.id}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

// ============================================
// SERVICE-TO-SERVICE AUTH
// ============================================

/**
 * Verify internal service token (for microservice communication)
 */
function verifyInternalToken(token) {
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
  return token === expectedToken;
}

/**
 * Create service auth middleware
 */
function serviceAuthMiddleware(req, res, next) {
  const token = req.headers['x-internal-token'];

  if (token && verifyInternalToken(token)) {
    req.isInternalService = true;
    return next();
  }

  // Fall back to regular auth
  createAuthMiddleware({ required: true })(req, res, next);
}

// ============================================
// OAUTH INTEGRATION (RABTUL)
// ============================================

/**
 * Exchange authorization code for tokens
 */
async function exchangeOAuthCode(code, redirectUri) {
  const authServiceUrl = process.env.RABTUL_AUTH_URL || 'http://localhost:4002';

  try {
    const response = await fetch(`${authServiceUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.OAUTH_CLIENT_ID || 'atlas-gtm',
        client_secret: process.env.OAUTH_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      throw new Error(`OAuth exchange failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`OAuth error: ${error.message}`);
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  const authServiceUrl = process.env.RABTUL_AUTH_URL || 'http://localhost:4002';

  try {
    const response = await fetch(`${authServiceUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.OAUTH_CLIENT_ID || 'atlas-gtm',
        client_secret: process.env.OAUTH_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Token refresh error: ${error.message}`);
  }
}

// ============================================
// USER SESSIONS
// ============================================

const sessions = new Map();

/**
 * Create session for user
 */
function createSession(userId, data = {}) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const session = {
    id: sessionId,
    userId,
    data,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  };

  sessions.set(sessionId, session);
  return session;
}

/**
 * Get session by ID
 */
function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(sessionId);
    return null;
  }

  // Update last active
  session.lastActive = new Date().toISOString();
  return session;
}

/**
 * Update session data
 */
function updateSession(sessionId, data) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.data = { ...session.data, ...data };
  session.lastActive = new Date().toISOString();
  return session;
}

/**
 * Delete session
 */
function deleteSession(sessionId) {
  return sessions.delete(sessionId);
}

/**
 * Clean expired sessions
 */
function cleanExpiredSessions() {
  const now = new Date();
  let cleaned = 0;

  for (const [id, session] of sessions.entries()) {
    if (new Date(session.expiresAt) < now) {
      sessions.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

// ============================================
// PERMISSIONS SYSTEM
// ============================================

const permissions = new Map([
  ['admin', ['read', 'write', 'delete', 'admin']],
  ['manager', ['read', 'write']],
  ['user', ['read']],
  ['readonly', ['read']]
]);

/**
 * Check if role has permission
 */
function hasPermission(role, permission) {
  const rolePerms = permissions.get(role) || [];
  return rolePerms.includes(permission) || rolePerms.includes('admin');
}

/**
 * Create permission middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const role = user.role || 'user';
    if (!hasPermission(role, permission)) {
      return res.status(403).json({
        error: 'Permission denied',
        required: permission,
        role: role
      });
    }

    next();
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // JWT
  generateToken,
  verifyToken,
  decodeToken,

  // API Keys
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,

  // Rate Limiting
  checkRateLimit,
  getRateLimitStatus,

  // Middleware
  createAuthMiddleware,
  createRateLimiter,
  createCorsMiddleware,
  requestIdMiddleware,
  requestLoggerMiddleware,
  serviceAuthMiddleware,
  requirePermission,

  // OAuth
  exchangeOAuthCode,
  refreshAccessToken,

  // Sessions
  createSession,
  getSession,
  updateSession,
  deleteSession,
  cleanExpiredSessions,

  // Permissions
  hasPermission,
  permissions
};
