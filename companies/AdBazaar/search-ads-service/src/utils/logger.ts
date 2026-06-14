/**
 * Winston Logger for Search Ads Service
 */

import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    config.logging.format === 'json' ? winston.format.json() : logFormat
  ),
  defaultMeta: { service: 'search-ads-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat
      ),
    }),
  ],
});

// Create stream for Morgan-like HTTP logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export default logger;