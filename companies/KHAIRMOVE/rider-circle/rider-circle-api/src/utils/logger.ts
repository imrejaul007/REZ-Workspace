import winston from 'winston';
import { config } from '../config/index';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }

  if (stack) {
    log += `\n${stack}`;
  }

  return log;
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
  // Don't exit on uncaught exceptions in production (let the process manager handle it)
  exitOnError: config.nodeEnv === 'production' ? false : true,
});

// Stream for Morgan HTTP logging
export const logStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Child logger for specific modules
export function createLogger(module: string): winston.Logger {
  return logger.child({ module });
}
