import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config';

/**
 * Auth Middleware
 * Verifies user authentication via local session or RABTUL auth service
 */

declare global {
 namespace Express {
   interface Request {
     userId?: string;
     user?: {
       id: string;
       name?: string;
       email?: string;
       phone?: string;
     };
   }
 }
}

interface AuthResponse {
 valid: boolean;
 userId?: string;
 user?: {
   id: string;
   name?: string;
   email?: string;
   phone?: string;
 };
 error?: string;
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractToken(req: Request): string | null {
 const authHeader = req.headers.authorization;
 if (authHeader?.startsWith('Bearer ')) {
   return authHeader.substring(7);
 }
 return null;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * CRITICAL FIX: Original code used !== which is vulnerable to timing attacks
 */
function timingSafeCompare(a: string, b: string): boolean {
 if (a.length !== b.length) {
   // Still do comparison to maintain constant time, but return false
   try {
     crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
   } catch {
     // Ignore errors
   }
   return false;
 }
 try {
   return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
 } catch {
   return false;
 }
}

/**
 * Authenticate via local session or RABTUL auth service
 */
export async function authenticate(
 req: Request,
 res: Response,
 next: NextFunction
): Promise<void> {
 const token = extractToken(req);

 if (!token) {
   res.status(401).json({ error: 'Authentication required' });
   return;
 }

 // Check local session first
 const sessionStore = (global as unknown).sessionStore;
 if (sessionStore) {
   const session = sessionStore.get(token);
   if (session && Date.now() < session.expiresAt) {
     req.userId = session.userId;
     req.user = {
       id: session.userId,
       phone: session.phone,
     };
     next();
     return;
   }
 }

 // Fallback to RABTUL auth service
 try {
   const response = await axios.post<AuthResponse>(
     `${config.auth.url}/api/auth/verify`,
     { token },
     {
       headers: {
         'Content-Type': 'application/json',
         'X-Internal-Token': config.internalToken,
       },
       timeout: 5000,
     }
   );

   if (response.data.valid) {
     req.userId = response.data.userId;
     req.user = response.data.user;
     next();
   } else {
     res.status(401).json({ error: response.data.error || 'Invalid token' });
   }
 } catch (error) {
   logger.error('Auth verification failed:', error.message);
   res.status(401).json({ error: 'Authentication failed' });
 }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
 req: Request,
 res: Response,
 next: NextFunction
): Promise<void> {
 const token = extractToken(req);

 if (!token) {
   next();
   return;
 }

 // Check local session
 const sessionStore = (global as unknown).sessionStore;
 if (sessionStore) {
   const session = sessionStore.get(token);
   if (session && Date.now() < session.expiresAt) {
     req.userId = session.userId;
     req.user = {
       id: session.userId,
       phone: session.phone,
     };
   }
 }

 next();
}

/**
 * Verify internal service token (for service-to-service communication)
 * CRITICAL FIX: Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyInternalToken(
 req: Request,
 res: Response,
 next: NextFunction
): Promise<void> {
 const internalToken = req.headers['x-internal-token'];

 if (!internalToken) {
   res.status(401).json({ error: 'Internal token required' });
   return;
 }

 // CRITICAL: Use timing-safe comparison to prevent timing attacks
 if (!timingSafeCompare(internalToken as string, config.internalToken)) {
   res.status(403).json({ error: 'Invalid internal token' });
   return;
 }

 next();
}

/**
 * Require admin role
 * CRITICAL FIX: Uses timing-safe comparison
 */
export async function requireAdmin(
 req: Request,
 res: Response,
 next: NextFunction
): Promise<void> {
 if (!req.user) {
   res.status(401).json({ error: 'Authentication required' });
   return;
 }

 // Check via internal token header with timing-safe comparison
 const internalToken = req.headers['x-internal-token'];
 if (internalToken && timingSafeCompare(internalToken as string, config.internalToken)) {
   next();
   return;
 }

 res.status(403).json({ error: 'Admin access required' });
}
