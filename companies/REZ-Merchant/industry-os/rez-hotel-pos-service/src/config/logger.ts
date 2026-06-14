import winston from 'winston';
import { inspect } from 'util';

const logLevel = process.env.LOG_LEVEL || 'info';
const serviceName = process.env.SERVICE_NAME || 'rez-hotel-pos-service';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${inspect(meta, { depth: null, colors: false })}` : '';
    return `[${timestamp}] [${serviceName}] ${level.toUpperCase()}: ${message}${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? jsonFormat : logFormat,
  defaultMeta: { service: serviceName },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

// Add convenience methods for common patterns
(logger as unknown).profile = (name: string) => {
  const start = Date.now();
  return {
    stop: (message?: string) => {
      const duration = Date.now() - start;
      logger.info(message || 'Profile completed', { profile: name, duration_ms: duration });
    },
  };
};

// Stream for Morgan HTTP logging compatibility
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
