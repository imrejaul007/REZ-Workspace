import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
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

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'rez-multi-warehouse' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? jsonFormat
        : winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for warehouse operations
    new winston.transports.File({
      filename: path.join(logDir, 'warehouse-operations.log'),
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // File transport for transfers
    new winston.transports.File({
      filename: path.join(logDir, 'transfers.log'),
      format: jsonFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Create a stream object for Morgan HTTP logging integration
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

export default logger;
