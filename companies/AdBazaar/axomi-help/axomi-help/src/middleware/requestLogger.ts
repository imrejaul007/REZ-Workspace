import type { Request, Response, NextFunction } from "express";

/**
 * HTTP request logger middleware.
 *
 * Logs method, path, status code, and response time for every request.
 * Skips logging for /health to reduce noise.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === "/health") {
    return next();
  }

  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`;
    if (res.statusCode >= 500) {
      logger.error(logLine);
    } else if (res.statusCode >= 400) {
      logger.warn(logLine);
    } else {
      logger.info(logLine);
    }
  });
  next();
}
