import winston from 'winston';
import path from 'path';

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for file
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'rez-unified-calendar' },
  transports: [
    // Error log
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || './logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

// Specific loggers for different modules
export const calendarLogger = createModuleLogger('calendar');
export const platformLogger = createModuleLogger('platform-connector');
export const conflictLogger = createModuleLogger('conflict-detector');
export const scheduleLogger = createModuleLogger('scheduler');
export const apiLogger = createModuleLogger('api');

export default logger;
