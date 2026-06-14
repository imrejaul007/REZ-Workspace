import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

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

// JSON format for production
const jsonLogFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

// Console format for development
const consoleLogFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize(),
  errors({ stack: true }),
  logFormat
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: config.serviceName },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.nodeEnv === 'production' ? jsonLogFormat : consoleLogFormat,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleLogFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleLogFormat,
    }),
  ],
});

// Stream for Morgan HTTP logging (if needed)
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper methods
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export default logger;