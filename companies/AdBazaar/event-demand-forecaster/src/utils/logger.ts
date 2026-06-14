import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0 && metadata.stack) {
    msg += `\n  Stack: ${metadata.stack}`;
  }

  if (Object.keys(metadata).length > 0 && !metadata.stack) {
    msg += `\n  Data: ${JSON.stringify(metadata, null, 2)}`;
  }

  return msg;
});

// Create Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    logFormat
  ),
  defaultMeta: {
    service: 'event-demand-forecaster',
    port: process.env.PORT || 4885
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    maxsize: 10485760,
    maxFiles: 5
  }));
}

// Export a child logger for specific components
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

export default logger;