import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(process.env.LOG_FILE
      ? [
 new winston.transports.File({
            filename: path.join(process.env.LOG_DIR || './logs', 'error.log'),
            level: 'error',
          }),
          new winston.transports.File({
            filename: path.join(process.env.LOG_DIR || './logs', 'combined.log'),
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

export const createChildLogger = (module: string) => {
  return logger.child({ module });
};
