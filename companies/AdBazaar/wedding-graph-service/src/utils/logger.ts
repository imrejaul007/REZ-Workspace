import winston from 'winston';
import path from 'path';

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wedding-graph-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? JSON.stringify(meta, null, 2)
            : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If in development, add more verbose logging
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;

/**
 * Create a child logger with additional context
 */
export function createChildLogger(meta: Record<string, any>) {
  return logger.child(meta);
}

/**
 * Log service-specific events
 */
export const serviceLogger = {
  wedding: {
    created: (weddingId: string, data: any) =>
      logger.info('Wedding created', { weddingId, ...data }),
    updated: (weddingId: string, changes: any) =>
      logger.info('Wedding updated', { weddingId, changes }),
    deleted: (weddingId: string) =>
      logger.info('Wedding deleted', { weddingId }),
    analytics: (weddingId: string, metrics: any) =>
      logger.info('Wedding analytics generated', { weddingId, metrics })
  },
  guest: {
    created: (guestId: string, weddingId: string) =>
      logger.info('Guest created', { guestId, weddingId }),
    rsvpUpdated: (guestId: string, rsvp: string) =>
      logger.info('Guest RSVP updated', { guestId, rsvp }),
    bulkCreated: (count: number, weddingId: string) =>
      logger.info('Bulk guests created', { count, weddingId })
  },
  vendor: {
    created: (vendorId: string, weddingId: string, category: string) =>
      logger.info('Vendor created', { vendorId, weddingId, category }),
    booked: (vendorId: string, price: number) =>
      logger.info('Vendor booked', { vendorId, price }),
    paymentRecorded: (vendorId: string, amount: number) =>
      logger.info('Vendor payment recorded', { vendorId, amount }),
    reviewAdded: (vendorId: string, rating: number) =>
      logger.info('Vendor review added', { vendorId, rating })
  },
  analytics: {
    snapshot: (weddingId: string, date: Date) =>
      logger.info('Analytics snapshot recorded', { weddingId, date }),
    campaignCreated: (campaignId: string, weddingId: string) =>
      logger.info('Campaign created', { campaignId, weddingId }),
    metricsUpdated: (campaignId: string, metrics: any) =>
      logger.info('Campaign metrics updated', { campaignId, metrics })
  },
  targeting: {
    audienceBuilt: (weddingId: string, size: number) =>
      logger.info('Targeting audience built', { weddingId, audienceSize: size }),
    lookalikeGenerated: (weddingId: string, sources: string[]) =>
      logger.info('Lookalike audiences generated', { weddingId, sources })
  }
};