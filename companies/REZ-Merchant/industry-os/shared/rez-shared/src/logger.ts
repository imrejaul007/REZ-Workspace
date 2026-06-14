import winston from 'winston';
import { Logger } from 'winston';

export interface LoggerOptions {
  serviceName: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  json?: boolean;
}

/**
 * Create a standardized Winston logger for REZ services
 */
export function createLogger(options: LoggerOptions): Logger {
  const { serviceName, level = 'info', json = process.env.NODE_ENV === 'production' } = options;

  const formats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
  ];

  if (json) {
    formats.push(winston.format.json());
  } else {
    formats.push(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${serviceName}] ${level}: ${message} ${metaStr}`;
      })
    );
  }

  return winston.createLogger({
    level,
    format: winston.format.combine(...formats),
    transports: [
      new winston.transports.Console(),
    ],
    defaultMeta: { service: serviceName },
  });
}

/**
 * Default logger instance for services that don't configure their own
 */
export const defaultLogger = createLogger({
  serviceName: process.env.SERVICE_NAME || 'rez-service',
  level: (process.env.LOG_LEVEL as any) || 'info',
});

export default defaultLogger;
