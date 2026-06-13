import winston from 'winston';
import fs from 'fs';

const logLevel = process.env.LOG_LEVEL || 'info';
const logsDir = 'logs';

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0 && Object.keys(meta)[0] !== 'stack') {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({
      filename: `${logsDir}/error.log`,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: `${logsDir}/combined.log`,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Security event logging
export const logSecurityEvent = (event: string, details: Record<string, unknown>): void => {
  logger.warn(`SECURITY EVENT: ${event}`, { event, ...details });
};

// Performance metrics logging
export const logPerformanceMetric = (
  operation: string,
  durationMs: number,
  details?: Record<string, unknown>
): void => {
  logger.info(`PERFORMANCE: ${operation}`, {
    operation,
    durationMs,
    ...details
  });
};

// Telemetry event logging
export const logTelemetryEvent = (
  vehicleId: string,
  event: string,
  data: Record<string, unknown>
): void => {
  logger.debug(`TELEMETRY [${vehicleId}]: ${event}`, { vehicleId, event, ...data });
};

// Export a typed logger instance
export type Logger = typeof logger;
