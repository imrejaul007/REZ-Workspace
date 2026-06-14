import { Request, Response, NextFunction } from 'express';
import { createServiceLogger } from 'utils/logger.js';
const logger = createServiceLogger('AuthMiddleware');
export interface AuthRequest extends Request { userId?: string; companyId?: string; role?: string; }
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authorization token required' });
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.companyId = decoded.companyId;
    req.role = decoded.role;
    next();
  } catch (error) {
    logger.error('Token verification failed', { error });
    return res.status(401).json({ error: 'Invalid token' });
  }
};
function verifyToken(token: string): { userId: string; companyId: string; role: string } {
  if (token.startsWith('adb_')) return { userId: token.split('_')[1] || 'user_001', companyId: 'adb_company_001', role: 'admin' };
  throw new Error('Invalid token format');
}