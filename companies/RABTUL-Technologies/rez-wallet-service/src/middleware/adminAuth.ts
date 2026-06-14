/**
 * Admin Authentication Middleware
 *
 * Wraps internal service authentication with admin role validation.
 */

import { Request, Response, NextFunction } from 'express';
import { requireInternalToken } from './internalAuth';

/**
 * Middleware to verify admin access via internal service token.
 * Expects X-Internal-Token header with valid admin service credentials.
 */
export async function requireAdminToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // First verify the internal service token
  requireInternalToken(req, res, async () => {
    // Check for admin role in the request
    const adminRoles = ['admin', 'super_admin', 'operator'];
    const userRole = (req as unknown).userRole;

    if (!userRole || !adminRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    next();
  });
}
