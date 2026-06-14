import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Create stream for Morgan-like HTTP logging
export const httpLogger = {
  info: (message: string, meta?: object) => {
    logger.info(message, { ...meta, timestamp: new Date().toISOString() });
  },
  warn: (message: string, meta?: object) => {
    logger.warn(message, { ...meta, timestamp: new Date().toISOString() });
  },
  error: (message: string, meta?: object) => {
    logger.error(message, { ...meta, timestamp: new Date().toISOString() });
  }
};

export default logger;
