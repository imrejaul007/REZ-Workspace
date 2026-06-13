import winston from 'winston';

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================================================
// LOGGER EXPORT
// ============================================================================

export const logger = winston.createLogger({
  level: logLevel,
  format: process.env.NODE_ENV === 'production' ? jsonFormat : logFormat,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.combine(winston.format.colorize(), jsonFormat)
        : winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
  defaultMeta: { service: 'portfolio-twin-service' },
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
  }));
}