import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';
import { AuthPayload, RequestContext } from '../types';
import { logSecurityEvent, logError } from '../utils/logger';
import { requiresAuth } from '../routes';

// JWT expiry in seconds (86400 = 24 hours)
const JWT_EXPIRY_SECONDS = 86400;

// Extend Express Request to include auth data
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
      context?: RequestContext;
    }
  }
}

// Token extraction with multiple strategies
function extractToken(req: Request): string | null {
  // 1. Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. X-API-Key header
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string') {
    return apiKey;
  }

  // 3. Query parameter (for special cases like downloads)
  const tokenQuery = req.query.token;
  if (typeof tokenQuery === 'string') {
    return tokenQuery;
  }

  // 4. Internal service token (for service-to-service)
  const internalToken = req.headers['x-internal-token'];
  if (typeof internalToken === 'string') {
    return internalToken;
  }

  return null;
}

// Validate JWT token
function verifyJWT(token: string, secret: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256', 'HS384'],
    }) as AuthPayload;

    return decoded;
  } catch (error) {
    return null;
  }
}

// Validate internal service token (timing-safe comparison)
function verifyInternalToken(
  token: string,
  expectedToken: string
): boolean {
  if (token.length !== expectedToken.length) {
    return false;
  }

  // Timing-safe comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

// Validate API key (for service accounts)
function verifyApiKey(apiKey: string): AuthPayload | null {
  try {
    // API keys are encrypted with a master key
    const decrypted = CryptoJS.AES.decrypt(
      apiKey,
      process.env.API_KEY_SECRET || 'default-secret'
    );
    const payload = decrypted.toString(CryptoJS.enc.Utf8);

    if (!payload) {
      return null;
    }

    const parsed = JSON.parse(payload) as AuthPayload;

    // Validate required fields
    if (!parsed.userId || !parsed.serviceId || !parsed.companyId) {
      return null;
    }

    // Check expiry
    if (parsed.exp && parsed.exp < Date.now() / 1000) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// Main authentication middleware
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const path = req.path;

  // Skip auth for public routes
  if (!requiresAuth(path)) {
    next();
    return;
  }

  const token = extractToken(req);

  if (!token) {
    logSecurityEvent('auth_failure', {
      requestId: req.context?.requestId,
      method: req.method,
      path,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Check for internal service token
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN || '';
  if (req.headers['x-internal-token'] && internalToken) {
    if (verifyInternalToken(token, internalToken)) {
      // Internal service - set minimal auth
      req.auth = {
        userId: 'internal-service',
        email: 'service@corpperks.internal',
        role: 'service',
        companyId: 'corpperks',
        permissions: ['*'],
      };
      next();
      return;
    }
  }

  // Try JWT verification
  const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
  let authPayload = verifyJWT(token, jwtSecret);

  // Try API key verification if JWT failed
  if (!authPayload) {
    authPayload = verifyApiKey(token);
  }

  if (!authPayload) {
    logSecurityEvent('invalid_token', {
      requestId: req.context?.requestId,
      method: req.method,
      path,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Attach auth payload to request
  req.auth = authPayload;

  // Set user context
  if (req.context) {
    req.context.userId = authPayload.userId;
  }

  next();
}

// Role-based access control middleware
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      logSecurityEvent('auth_failure', {
        requestId: req.context?.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.auth.userId,
        details: { requiredRoles: allowedRoles, userRole: req.auth.role },
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

// Permission-based access control middleware
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const userPermissions = req.auth.permissions;
    const hasPermission = requiredPermissions.some(
      (perm) => userPermissions.includes(perm) || userPermissions.includes('*')
    );

    if (!hasPermission) {
      logSecurityEvent('auth_failure', {
        requestId: req.context?.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.auth.userId,
        details: { requiredPermissions, userPermissions },
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

// Company isolation middleware - ensures users can only access their company's data
export function companyIsolation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip for internal services
  if (req.auth?.role === 'service') {
    next();
    return;
  }

  // Extract company ID from query/body/params and validate
  const userCompanyId = req.auth?.companyId;
  const requestedCompanyId =
    (req.query.companyId as string) ||
    (req.body?.companyId as string) ||
    (req.params?.companyId as string);

  if (requestedCompanyId && requestedCompanyId !== userCompanyId) {
    logSecurityEvent('suspicious_activity', {
      requestId: req.context?.requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.auth?.userId,
      details: {
        userCompanyId,
        requestedCompanyId,
        action: 'cross_company_access_attempt',
      },
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'COMPANY_MISMATCH',
        message: 'Access denied: Company mismatch',
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Inject company ID from auth context if not provided
  if (!requestedCompanyId && userCompanyId) {
    if (req.query) req.query.companyId = userCompanyId;
    if (req.body) req.body.companyId = userCompanyId;
  }

  next();
}

// Token refresh endpoint handler
export async function refreshToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const currentToken = extractToken(req);

    if (!currentToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
    const decoded = jwt.decode(currentToken) as AuthPayload;

    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token format',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if token is within refresh window (expires in less than 7 days)
    const expiry = decoded.exp || 0;
    const now = Date.now() / 1000;
    const sevenDays = 7 * 24 * 60 * 60;

    if (expiry - now > sevenDays) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_EXPIRING_SOON',
          message: 'Token does not need refresh yet',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
        permissions: decoded.permissions,
      },
      jwtSecret,
      { expiresIn: JWT_EXPIRY_SECONDS }
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: `${JWT_EXPIRY_SECONDS}s`,
      },
      meta: {
        requestId: req.context?.requestId,
        latency: Date.now() - new Date(req.context?.timestamp || Date.now()).getTime(),
      },
    });
  } catch (error) {
    logError(error as Error, {
      requestId: req.context?.requestId,
      method: req.method,
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh token',
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
  }
}
