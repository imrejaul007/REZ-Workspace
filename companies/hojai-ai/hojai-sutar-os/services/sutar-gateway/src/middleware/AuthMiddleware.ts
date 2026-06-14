// ============================================================================
// SUTAR Gateway - Authentication Middleware
// API Key, JWT, and OAuth authentication middleware
// ============================================================================

import type { Request, Response, NextFunction } from 'express';
import { apiKeyManager } from '../services/ApiKeyManager.js';
import { jwtAuthService, extractTokenFromHeader } from '../services/JWTAuth.js';
import { oauthService } from '../services/OAuthService.js';
import type { ApiResponse } from '../types/index.js';

export interface AuthMiddlewareConfig {
  apiKeyHeader: string;
  jwtHeader: string;
  jwtQueryParam: string;
  allowAnonymous: boolean;
  defaultScopes: string[];
}

export interface AuthContext {
  authenticated: boolean;
  authType?: 'api_key' | 'jwt' | 'oauth';
  userId?: string;
  scopes?: string[];
  services?: string[];
  metadata?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export class AuthMiddleware {
  private config: AuthMiddlewareConfig;

  constructor(config?: Partial<AuthMiddlewareConfig>) {
    this.config = {
      apiKeyHeader: config?.apiKeyHeader ?? 'X-API-Key',
      jwtHeader: config?.jwtHeader ?? 'Authorization',
      jwtQueryParam: config?.jwtQueryParam ?? 'token',
      allowAnonymous: config?.allowAnonymous ?? true,
      defaultScopes: config?.defaultScopes ?? ['read'],
    };
  }

  // ---------------------------------------------------------------------------
  // Main Authentication Middleware
  // ---------------------------------------------------------------------------

  authenticate(options?: {
    required?: boolean;
    types?: Array<'api_key' | 'jwt' | 'oauth'>;
    scopes?: string[];
    services?: string[];
  }): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const authTypes = options?.types ?? ['api_key', 'jwt'];
      const required = options?.required ?? this.config.allowAnonymous;

      // Try each auth type in order
      for (const authType of authTypes) {
        let context: AuthContext | null = null;

        switch (authType) {
          case 'api_key':
            context = this.authenticateApiKey(req);
            break;
          case 'jwt':
            context = this.authenticateJwt(req);
            break;
          case 'oauth':
            context = this.authenticateOAuth(req);
            break;
        }

        if (context?.authenticated) {
          // Check scopes if required
          if (options?.scopes && options.scopes.length > 0) {
            const hasScopes = options.scopes.every(scope =>
              context!.scopes?.includes(scope)
            );
            if (!hasScopes) {
              return res.status(403).json(this.errorResponse(
                `Missing required scopes: ${options.scopes.filter(s => !context!.scopes?.includes(s)).join(', ')}`
              ));
            }
          }

          // Check services if required
          if (options?.services && options.services.length > 0) {
            const hasServices = options.services.some(service =>
              context!.services?.includes(service)
            );
            if (!hasServices) {
              return res.status(403).json(this.errorResponse(
                `No access to required services: ${options.services.filter(s => !context!.services?.includes(s)).join(', ')}`
              ));
            }
          }

          req.auth = context;
          return next();
        }
      }

      // No authentication succeeded
      if (required) {
        return res.status(401).json(this.errorResponse('Authentication required'));
      }

      // Anonymous access allowed
      req.auth = { authenticated: false };
      next();
    };
  }

  // ---------------------------------------------------------------------------
  // API Key Authentication
  // ---------------------------------------------------------------------------

  private authenticateApiKey(req: Request): AuthContext | null {
    const apiKey = req.headers[this.config.apiKeyHeader.toLowerCase()] as string;

    if (!apiKey) {
      return null;
    }

    const result = apiKeyManager.validateKey(apiKey);

    if (!result.valid) {
      return null;
    }

    // Record usage
    if (result.key) {
      apiKeyManager.recordUsage(result.key.id);
    }

    return {
      authenticated: true,
      authType: 'api_key',
      userId: result.key?.id,
      scopes: result.scopes,
      services: result.services,
      metadata: { keyName: result.key?.name },
    };
  }

  // ---------------------------------------------------------------------------
  // JWT Authentication
  // ---------------------------------------------------------------------------

  private authenticateJwt(req: Request): AuthContext | null {
    // Check header first
    const authHeader = req.headers[this.config.jwtHeader] as string;
    let token = extractTokenFromHeader(authHeader);

    // Fall back to query param
    if (!token) {
      token = req.query[this.config.jwtQueryParam] as string;
    }

    if (!token) {
      return null;
    }

    const result = jwtAuthService.validateToken(token);

    if (!result.valid || !result.payload) {
      return null;
    }

    return {
      authenticated: true,
      authType: 'jwt',
      userId: result.payload.sub,
      scopes: result.payload.scopes,
      services: result.payload.services,
      metadata: {
        issuer: result.payload.iss,
        audience: result.payload.aud,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // OAuth Authentication
  // ---------------------------------------------------------------------------

  private authenticateOAuth(req: Request): AuthContext | null {
    // OAuth tokens are typically handled via JWT or API key
    // This is a placeholder for OAuth-specific token validation
    const oauthToken = req.headers['x-oauth-token'] as string;

    if (!oauthToken) {
      return null;
    }

    // For now, treat OAuth tokens like API keys
    const result = apiKeyManager.validateKey(oauthToken);

    if (!result.valid) {
      return null;
    }

    return {
      authenticated: true,
      authType: 'oauth',
      userId: result.key?.id,
      scopes: result.scopes,
      services: result.services,
      metadata: { keyName: result.key?.name, authType: 'oauth' },
    };
  }

  // ---------------------------------------------------------------------------
  // Scope-Based Authorization
  // ---------------------------------------------------------------------------

  requireScopes(...scopes: string[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth?.authenticated) {
        return res.status(401).json(this.errorResponse('Authentication required'));
      }

      const userScopes = req.auth.scopes ?? [];
      const hasAllScopes = scopes.every(scope => userScopes.includes(scope));

      if (!hasAllScopes) {
        return res.status(403).json(this.errorResponse(
          `Missing required scopes: ${scopes.filter(s => !userScopes.includes(s)).join(', ')}`
        ));
      }

      next();
    };
  }

  // ---------------------------------------------------------------------------
  // Service-Based Authorization
  // ---------------------------------------------------------------------------

  requireServices(...services: string[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth?.authenticated) {
        return res.status(401).json(this.errorResponse('Authentication required'));
      }

      const userServices = req.auth.services ?? [];
      const hasAccess = services.some(service => userServices.includes(service));

      if (!hasAccess) {
        return res.status(403).json(this.errorResponse(
          `No access to required services: ${services.filter(s => !userServices.includes(s)).join(', ')}`
        ));
      }

      next();
    };
  }

  // ---------------------------------------------------------------------------
  // Rate Limiting Middleware
  // ---------------------------------------------------------------------------

  rateLimitByAuth(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.auth?.authenticated || !req.auth.userId) {
        return next();
      }

      // For API key auth, check rate limit
      if (req.auth.authType === 'api_key') {
        const result = apiKeyManager.checkRateLimit(req.auth.userId);

        if (!result.allowed) {
          res.setHeader('X-RateLimit-Reset', result.resetAt);
          res.setHeader('X-RateLimit-Remaining', '0');
          return res.status(429).json(this.errorResponse(
            `Rate limit exceeded. Reset at: ${result.resetAt}`
          ));
        }

        res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      }

      next();
    };
  }

  // ---------------------------------------------------------------------------
  // Audit Logging
  // ---------------------------------------------------------------------------

  auditLog(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(JSON.stringify({
          type: 'audit',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'],
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          auth: req.auth?.authenticated ? {
            type: req.auth.authType,
            userId: req.auth.userId,
          } : null,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }));
      });

      next();
    };
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<AuthMiddlewareConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AuthMiddlewareConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private errorResponse(message: string): ApiResponse<null> {
    return {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Singleton and Pre-built Middleware
// ============================================================================

export const authMiddleware = new AuthMiddleware();

// Pre-built middleware instances
export const requireAuth = authMiddleware.authenticate({ required: true });
export const optionalAuth = authMiddleware.authenticate({ required: false });
export const requireAdmin = authMiddleware.requireScopes('admin');
export const requireRead = authMiddleware.requireScopes('read');
export const requireWrite = authMiddleware.requireScopes('write');
export const auditLog = authMiddleware.auditLog();
export const rateLimitByAuth = authMiddleware.rateLimitByAuth();

// Helper to get auth context from request
export function getAuthContext(req: Request): AuthContext | null {
  return req.auth ?? null;
}

// Helper to check if request is authenticated
export function isAuthenticated(req: Request): boolean {
  return req.auth?.authenticated ?? false;
}

// Helper to get user ID from request
export function getUserId(req: Request): string | undefined {
  return req.auth?.userId;
}
