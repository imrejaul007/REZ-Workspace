/**
 * REZ Copilot - Logger Middleware
 */

import winston from 'winston';
import { config } from '../config/services';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});

// Request logging middleware
export const requestLogger = (req: { method: string; path: string; ip?: string }, res: unknown, next: () => void) => {
  const start = Date.now();

  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
  });

  next();
};
