import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { trackRequest } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'RequestLogger' });

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  moduleLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Track response on finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    moduleLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration.toFixed(3)}s`
    });

    // Track metrics
    trackRequest(req.method, route, res.statusCode, duration);
  });

  next();
};

export default requestLogger;