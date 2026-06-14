import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? jsonFormat : logFormat,
  defaultMeta: {
    service: 'rez-merchant-trust-bridge',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

// Add file transport in production
if (isProduction) {
  const logDir = process.env.LOG_DIR || '/var/log/rez-merchant-trust-bridge';
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

// Create child logger for specific components
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

// Specific loggers for different components
export const trustSyncLogger = createComponentLogger('trust-sync');
export const limitEngineLogger = createComponentLogger('limit-engine');
export const alertLogger = createComponentLogger('alerts');
export const apiLogger = createComponentLogger('api');

export default logger;
