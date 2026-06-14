import winston from 'winston';
import { config } from './environment.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

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

const jsonFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const logObject = {
    timestamp,
    level,
    message,
    ...metadata,
  };
  return JSON.stringify(logObject);
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    handleErrors: true,
    handleExceptions: true,
  }),
];

// Add file transports in production
if (config.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: config.logging.format === 'json'
    ? combine(errors({ stack: true }), timestamp(), jsonFormat)
    : combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), colorize(), logFormat),
  defaultMeta: { service: 'festival-graph-service' },
  transports,
  exitOnError: false,
});

export { logger };