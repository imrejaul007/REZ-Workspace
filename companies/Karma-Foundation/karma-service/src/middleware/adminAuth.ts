import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './auth';

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    requireAuth(req, res, (err?: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // SECURITY FIX: Normalize role to lowercase before comparison
  const normalizedRole = (req.userRole ?? '').toLowerCase();
  const adminRoles = ['admin', 'superadmin'];

  if (!normalizedRole || !adminRoles.includes(normalizedRole)) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }

  next();
}
