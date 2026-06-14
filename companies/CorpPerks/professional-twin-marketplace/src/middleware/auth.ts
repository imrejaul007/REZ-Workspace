/**
 * Authentication Middleware
 *
 * Secures all twin endpoints with JWT authentication.
 * Verifies:
 * - Valid JWT token
 * - Token matches CorpID
 * - User owns the twin (for protected operations)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'twin-marketplace-secret';
const CORPID_URL = process.env.CORPID_URL || 'http://localhost:4702';
const CORPID_TOKEN = process.env.CORPID_TOKEN || 'corpid-internal-token';

// =============================================================================
// TYPES
// =============================================================================

export interface AuthPayload {
  corpId: string;
  email?: string;
  role: 'user' | 'company' | 'admin';
  type: 'individual' | 'business';
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
  isOwner?: boolean;
  hasAccess?: boolean;
}

// =============================================================================
// VERIFY TOKEN
// =============================================================================

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch {
    return null;
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Authenticate request with JWT token
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' }
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Verify user owns the twin
 */
export async function verifyTwinOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // Must have authenticated user
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
    return;
  }

  // Get twinId from params or body
  const twinId = req.params.twinId || req.body.twinId;

  if (!twinId) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Twin ID required' }
    });
    return;
  }

  // Extract owner CorpID from twinId (format: TWIN-CI-IND-XXXXX-TWINTYPE)
  const parts = twinId.split('-');
  if (parts.length >= 3) {
    const ownerCorpId = parts.slice(0, 3).join('-');
    req.isOwner = ownerCorpId === req.user.corpId;
  }

  next();
}

/**
 * Verify CorpID is valid
 */
export async function verifyCorpId(corpId: string): Promise<boolean> {
  try {
    const response = await fetch(`${CORPID_URL}/identities/${corpId}`, {
      method: 'GET',
      headers: { 'x-internal-token': CORPID_TOKEN }
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Verify user has access to twin (owner OR has active grant)
 */
export async function verifyTwinAccess(corpId: string, twinId: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:4760/hire/access-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': 'corpid-internal-token'
      },
      body: JSON.stringify({ corpId, twinId })
    });

    if (response.ok) {
      const data = await response.json();
      return data.hasAccess || false;
    }
    return false;
  } catch {
    return false;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate JWT token (for testing/development)
 */
export function generateToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Extract token from request
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Check if user is admin
 */
export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'admin';
}

/**
 * Check if user is company
 */
export function isCompany(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'company';
}

/**
 * Check if user is individual
 */
export function isIndividual(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'user';
}

// =============================================================================
// ROLE-BASED ACCESS
// =============================================================================

/**
 * Require admin role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' }
    });
    return;
  }
  next();
}

/**
 * Require company role
 */
export function requireCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'company') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Company access required' }
    });
    return;
  }
  next();
}

/**
 * Require individual/user role
 */
export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'user') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'User access required' }
    });
    return;
  }
  next();
}

/**
 * Require authenticated user (any role)
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
    return;
  }
  next();
}

// =============================================================================
// COMPOSED MIDDLEWARE
// =============================================================================

/**
 * Authenticate + verify twin ownership
 */
export function authenticateAndVerifyOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  authenticate(req, res, () => {
    verifyTwinOwnership(req, res, () => {
      if (!req.isOwner) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not own this twin' }
        });
        return;
      }
      next();
    });
  });
}

/**
 * Authenticate + verify twin access (owner OR company with grant)
 */
export async function authenticateAndVerifyAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  authenticate(req, res, async () => {
    if (!req.user) return;

    const twinId = req.params.twinId || req.body.twinId;
    if (!twinId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Twin ID required' }
      });
      return;
    }

    // Extract owner CorpId from twinId
    const parts = twinId.split('-');
    const ownerCorpId = parts.slice(0, 3).join('-');

    // User is owner
    if (ownerCorpId === req.user.corpId) {
      req.isOwner = true;
      req.hasAccess = true;
      next();
      return;
    }

    // Check if user (company) has access grant
    req.hasAccess = await verifyTwinAccess(req.user.corpId, twinId);

    if (!req.hasAccess) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have access to this twin' }
      });
      return;
    }

    next();
  });
}

export default {
  authenticate,
  optionalAuth,
  verifyTwinOwnership,
  verifyToken,
  generateToken,
  requireAdmin,
  requireCompany,
  requireUser,
  requireAuth,
  authenticateAndVerifyOwner,
  authenticateAndVerifyAccess
};
