import winston from 'winston';
import config from './index.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format
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
  format: config.logging.format === 'json'
    ? combine(errors({ stack: true }), timestamp(), json())
    : combine(errors({ stack: true }), timestamp(), colorize(), logFormat),
  defaultMeta: { service: config.serviceName },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Add file transports in production
if (config.nodeEnv === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create child logger for components
export const createLogger = (component: string) => {
  return logger.child({ component });
};

export default logger;