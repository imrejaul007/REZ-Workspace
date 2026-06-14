import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, metadata } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0 && metadata._meta !== false) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

const errorStackFormat = printf(({ stack, message, timestamp, level }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    metadata({ fillExcept: ['message', 'timestamp', 'level', 'stack'] }),
    logFormat
  ),
  defaultMeta: { service: 'white-label-portal' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errorStackFormat
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  const logDir = process.env.LOG_DIR || './logs';
  
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), logFormat),
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: combine(timestamp(), logFormat),
    })
  );
}

// Create child logger for specific components
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

export default logger;
