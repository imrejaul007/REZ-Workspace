import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format for structured logging
const structuredFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const logEntry = {
    timestamp,
    level,
    service: 'measurement-cloud-service',
    version: '1.0.0',
    message,
    traceId: metadata.traceId || uuidv4(),
    ...metadata
  };
  return JSON.stringify(logEntry);
});

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    structuredFormat
  ),
  defaultMeta: {
    service: 'measurement-cloud-service',
    version: '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Create child logger for specific contexts
export const createContextLogger = (context: string) => {
  return logger.child({ context });
};

// Log measurement events
export const logMeasurementEvent = (
  eventType: string,
  campaignId: string,
  data: Record<string, unknown>
) => {
  logger.info(`Measurement event: ${eventType}`, {
    eventType,
    campaignId,
    ...data
  });
};

// Log attribution events
export const logAttributionEvent = (
  eventType: string,
  campaignId: string,
  touchpoints: string[],
  data: Record<string, unknown>
) => {
  logger.info(`Attribution event: ${eventType}`, {
    eventType,
    campaignId,
    touchpoints,
    ...data
  });
};

// Log brand safety events
export const logBrandSafetyEvent = (
  eventType: string,
  campaignId: string,
  checkResult: Record<string, unknown>
) => {
  logger.info(`Brand safety event: ${eventType}`, {
    eventType,
    campaignId,
    ...checkResult
  });
};

// Log viewability events
export const logViewabilityEvent = (
  eventType: string,
  campaignId: string,
  metrics: Record<string, unknown>
) => {
  logger.info(`Viewability event: ${eventType}`, {
    eventType,
    campaignId,
    ...metrics
  });
};

export default logger;
