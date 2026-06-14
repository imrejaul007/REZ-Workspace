import winston from 'winston';
import { config } from './index';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  if (stack) {
    msg += `\n${stack}`;
  }

  return msg;
});

const jsonFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...metadata,
  });
});

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    config.nodeEnv === 'production' ? jsonFormat : combine(colorize(), logFormat)
  ),
  defaultMeta: { service: 'data-clean-room-service' },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export default logger;