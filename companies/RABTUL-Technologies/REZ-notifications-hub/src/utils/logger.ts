import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
});

export default logger;

// Request logging middleware helper
export const logRequest = (req: { method: string; path: string; ip?: string }) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
};

// Notification logging helpers
export const logNotificationSent = (
  notificationId: string,
  channel: string,
  recipientId: string
) => {
  logger.info('Notification sent', {
    notificationId,
    channel,
    recipientId,
  });
};

export const logNotificationFailed = (
  notificationId: string,
  channel: string,
  error: string
) => {
  logger.error('Notification failed', {
    notificationId,
    channel,
    error,
  });
};

export const logNotificationDelivered = (
  notificationId: string,
  channel: string
) => {
  logger.info('Notification delivered', {
    notificationId,
    channel,
  });
};
