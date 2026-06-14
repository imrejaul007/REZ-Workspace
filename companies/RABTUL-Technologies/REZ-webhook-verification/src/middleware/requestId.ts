/**
 * Request ID middleware
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-Id', requestId);
  (req as unknown).requestId = requestId;
  next();
};
