import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../config/metrics.js';

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  res.end = function (this: Response, ...args: Parameters<Response['end']>): Response {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);

    return originalEnd.apply(this, args);
  } as typeof res.end;

  next();
}