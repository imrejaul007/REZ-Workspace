// ============================================================================
// SUTAR Gateway - JWT Authentication
// Token validation and generation
// ============================================================================

import { createHmac, randomBytes, createSign, createVerify } from 'crypto';
import type {
  JWTPayload,
  JWTValidationResult,
  JWTConfig,
  ApiResponse,
} from '../types/index.js';

export interface JWTToken {
  token: string;
  expiresAt: Date;
  payload: JWTPayload;
}

export interface JWTGenerationOptions {
  subject: string;
  audience?: string[];
  scopes?: string[];
  services?: string[];
  expiresIn?: number;
  metadata?: Record<string, unknown>;
}

export class JWTAuthService {
  private config: JWTConfig;
  private tokenCache: Map<string, { token: string; expiresAt: Date }> = new Map();
  private revokedTokens: Set<string> = new Set();
  private blacklist: Set<string> = new Set();

  constructor(config: Partial<JWTConfig> = {}) {
    this.config = {
      issuer: config.issuer ?? 'sutar-gateway',
      audience: config.audience ?? ['sutar-os'],
      publicKey: config.publicKey,
      secret: config.secret ?? this.generateSecret(),
      algorithm: config.algorithm ?? 'HS256',
      expiresIn: config.expiresIn ?? 3600, // 1 hour default
      clockTolerance: config.clockTolerance ?? 30,
    };
  }

  // ---------------------------------------------------------------------------
  // Token Generation
  // ---------------------------------------------------------------------------

  generateToken(options: JWTGenerationOptions): ApiResponse<JWTToken> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const jti = this.generateJTI();

      const payload: JWTPayload = {
        sub: options.subject,
        iss: this.config.issuer,
        aud: options.audience ?? this.config.audience,
        exp: now + (options.expiresIn ?? this.config.expiresIn),
        iat: now,
        jti,
        scopes: options.scopes,
        services: options.services,
        metadata: options.metadata,
      };

      const token = this.signPayload(payload);

      return this.successResponse({
        token,
        expiresAt: new Date(payload.exp * 1000),
        payload,
      }, 'Token generated successfully');
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Token generation failed'
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Token Validation
  // ---------------------------------------------------------------------------

  validateToken(token: string): JWTValidationResult {
    try {
      // Check blacklist
      if (this.blacklist.has(token)) {
        return { valid: false, error: 'Token has been revoked' };
      }

      // Split and validate structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token structure' };
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Decode and parse header
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      if (header.typ !== 'JWT') {
        return { valid: false, error: 'Invalid token type' };
      }

      // Verify signature
      const signatureValid = this.verifySignature(headerB64, payloadB64, signatureB64, header.alg);
      if (!signatureValid) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Decode and parse payload
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as JWTPayload;

      // Validate standard claims
      const now = Math.floor(Date.now() / 1000);

      // Check expiration
      if (payload.exp && payload.exp < now - (this.config.clockTolerance ?? 0)) {
        return { valid: false, error: 'Token has expired' };
      }

      // Check not before
      if (payload.nbf && payload.nbf > now + (this.config.clockTolerance ?? 0)) {
        return { valid: false, error: 'Token not yet valid' };
      }

      // Check issuer
      if (payload.iss !== this.config.issuer) {
        return { valid: false, error: 'Invalid issuer' };
      }

      // Check audience
      if (payload.aud && payload.aud.length > 0) {
        const hasValidAudience = payload.aud.some(aud =>
          this.config.audience.includes(aud)
        );
        if (!hasValidAudience) {
          return { valid: false, error: 'Invalid audience' };
        }
      }

      return {
        valid: true,
        payload,
        expiresAt: new Date(payload.exp * 1000),
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Token Refresh
  // ---------------------------------------------------------------------------

  refreshToken(token: string): ApiResponse<JWTToken> {
    const validation = this.validateToken(token);

    if (!validation.valid || !validation.payload) {
      return this.errorResponse(validation.error ?? 'Invalid token');
    }

    // Revoke old token
    this.revokeToken(token);

    // Generate new token with same subject and claims
    return this.generateToken({
      subject: validation.payload.sub,
      audience: validation.payload.aud,
      scopes: validation.payload.scopes,
      services: validation.payload.services,
      metadata: validation.payload.metadata,
    });
  }

  // ---------------------------------------------------------------------------
  // Token Revocation
  // ---------------------------------------------------------------------------

  revokeToken(token: string): ApiResponse<{ revoked: boolean }> {
    const validation = this.validateToken(token);

    if (validation.valid && validation.payload) {
      // Add to blacklist until expiration
      this.blacklist.add(token);

      // Schedule cleanup
      const expiresIn = (validation.payload.exp * 1000) - Date.now();
      if (expiresIn > 0) {
        setTimeout(() => {
          this.blacklist.delete(token);
        }, expiresIn);
      }

      return this.successResponse({ revoked: true }, 'Token revoked successfully');
    }

    // Even if invalid, add to revoked set to prevent reuse
    this.revokedTokens.add(token);

    return this.successResponse({ revoked: true });
  }

  revokeAllTokensForUser(subject: string): ApiResponse<{ revoked: number }> {
    // Note: This only works for tokens we track - stateless JWTs need external tracking
    let revoked = 0;
    for (const token of this.blacklist) {
      const validation = this.validateToken(token);
      if (validation.valid && validation.payload?.sub === subject) {
        this.blacklist.delete(token);
        revoked++;
      }
    }
    return this.successResponse({ revoked });
  }

  // ---------------------------------------------------------------------------
  // Scope Validation
  // ---------------------------------------------------------------------------

  validateScopes(token: string, requiredScopes: string[]): JWTValidationResult {
    const validation = this.validateToken(token);

    if (!validation.valid || !validation.payload) {
      return validation;
    }

    const tokenScopes = validation.payload.scopes ?? [];
    const hasAllScopes = requiredScopes.every(scope => tokenScopes.includes(scope));

    if (!hasAllScopes) {
      return {
        valid: false,
        payload: validation.payload,
        error: `Missing required scopes: ${requiredScopes.filter(s => !tokenScopes.includes(s)).join(', ')}`,
        expiresAt: validation.expiresAt,
      };
    }

    return validation;
  }

  validateServices(token: string, requiredServices: string[]): JWTValidationResult {
    const validation = this.validateToken(token);

    if (!validation.valid || !validation.payload) {
      return validation;
    }

    const tokenServices = validation.payload.services ?? [];
    const hasAccess = requiredServices.some(service => tokenServices.includes(service));

    if (!hasAccess) {
      return {
        valid: false,
        payload: validation.payload,
        error: `No access to required services: ${requiredServices.filter(s => !tokenServices.includes(s)).join(', ')}`,
        expiresAt: validation.expiresAt,
      };
    }

    return validation;
  }

  // ---------------------------------------------------------------------------
  // Token Introspection
  // ---------------------------------------------------------------------------

  introspectToken(token: string): ApiResponse<{
    active: boolean;
    sub?: string;
    iss?: string;
    aud?: string[];
    exp?: number;
    iat?: number;
    scopes?: string[];
    services?: string[];
  }> {
    const validation = this.validateToken(token);

    if (!validation.valid || !validation.payload) {
      return this.successResponse({ active: false });
    }

    return this.successResponse({
      active: true,
      sub: validation.payload.sub,
      iss: validation.payload.iss,
      aud: validation.payload.aud,
      exp: validation.payload.exp,
      iat: validation.payload.iat,
      scopes: validation.payload.scopes,
      services: validation.payload.services,
    });
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<JWTConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): JWTConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private signPayload(payload: JWTPayload): string {
    const header = {
      alg: this.config.algorithm,
      typ: 'JWT',
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    let signature: string;

    if (this.config.algorithm.startsWith('HS')) {
      // HMAC signing
      const signingInput = `${headerB64}.${payloadB64}`;
      signature = createHmac('sha256', this.config.secret!)
        .update(signingInput)
        .digest('base64url');
    } else if (this.config.algorithm === 'RS256') {
      // RSA signing
      const sign = createSign('RSA-SHA256');
      sign.update(`${headerB64}.${payloadB64}`);
      signature = sign.sign(this.config.secret!, 'base64url');
    } else {
      throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
    }

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  private verifySignature(
    headerB64: string,
    payloadB64: string,
    signatureB64: string,
    algorithm: string
  ): boolean {
    const signingInput = `${headerB64}.${payloadB64}`;

    if (algorithm.startsWith('HS')) {
      const expectedSignature = createHmac('sha256', this.config.secret!)
        .update(signingInput)
        .digest('base64url');
      return this.constantTimeCompare(signatureB64, expectedSignature);
    } else if (algorithm === 'RS256') {
      if (!this.config.publicKey) {
        // Fall back to secret verification
        const expectedSignature = createHmac('sha256', this.config.secret!)
          .update(signingInput)
          .digest('base64url');
        return this.constantTimeCompare(signatureB64, expectedSignature);
      }
      const verify = createVerify('RSA-SHA256');
      verify.update(signingInput);
      return verify.verify(this.config.publicKey, signatureB64, 'base64url');
    }

    return false;
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private generateJTI(): string {
    return randomBytes(16).toString('base64url');
  }

  private generateSecret(): string {
    return randomBytes(32).toString('base64url');
  }

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  clearExpiredFromBlacklist(): number {
    const now = Math.floor(Date.now() / 1000);
    let cleaned = 0;

    for (const token of this.blacklist) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as JWTPayload;
          if (payload.exp && payload.exp < now) {
            this.blacklist.delete(token);
            cleaned++;
          }
        }
      } catch {
        // Invalid token format, remove it
        this.blacklist.delete(token);
        cleaned++;
      }
    }

    return cleaned;
  }

  getStats(): {
    blacklistSize: number;
    revokedSize: number;
    config: JWTConfig;
  } {
    return {
      blacklistSize: this.blacklist.size,
      revokedSize: this.revokedTokens.size,
      config: {
        issuer: this.config.issuer,
        audience: this.config.audience,
        algorithm: this.config.algorithm,
        expiresIn: this.config.expiresIn,
      },
    };
  }
}

// ============================================================================
// Singleton and Helpers
// ============================================================================

export const jwtAuthService = new JWTAuthService();

// Helper functions
export function generateJWT(options: JWTGenerationOptions): ApiResponse<JWTToken> {
  return jwtAuthService.generateToken(options);
}

export function validateJWT(token: string): JWTValidationResult {
  return jwtAuthService.validateToken(token);
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (authHeader.startsWith('bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}