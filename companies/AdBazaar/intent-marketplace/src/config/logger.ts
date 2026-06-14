import winston from 'winston';
import { getEnvironment } from '../utils/environment.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let metaStr = '';
  if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
    metaStr = JSON.stringify(metadata);
  }
  if (metadata.stack) {
    metaStr = `\n${metadata.stack}`;
  }
  return `${timestamp} [${level}]: ${message} ${metaStr}`;
});

const errorStackFormat = errors({ stack: true });

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errorStackFormat,
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
  exitOnError: false,
});

// Create stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
