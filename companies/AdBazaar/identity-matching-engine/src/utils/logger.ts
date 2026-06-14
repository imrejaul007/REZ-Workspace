import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0 && metadata.stack) {
    msg += `\n${metadata.stack}`;
  } else if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: {
    service: 'identity-matching-engine',
    version: '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  );
}

// Create child logger for specific components
export function createComponentLogger(component: string): typeof logger {
  return logger.child({ component });
}

// Log helpers
export const logMatch = {
  start: (identifiers: Record<string, any>, method: string) => {
    logger.info(`Starting ${method} match`, { identifiers: Object.keys(identifiers), method });
  },
  success: (canonicalId: string, confidence: number) => {
    logger.info('Match successful', { canonicalId, confidence });
  },
  failure: (error: Error) => {
    logger.error('Match failed', { error: error.message });
  }
};

export const logMerge = {
  start: (sourceIds: string[], targetId?: string) => {
    logger.info('Starting identity merge', { sourceIds, targetId });
  },
  success: (canonicalId: string, mergedIds: string[]) => {
    logger.info('Identity merge successful', { canonicalId, mergedCount: mergedIds.length });
  },
  failure: (error: Error) => {
    logger.error('Identity merge failed', { error: error.message });
  }
};

export const logGraph = {
  build: (entityId: string, depth: number) => {
    logger.debug('Building identity graph', { entityId, depth });
  },
  expand: (nodeCount: number, edgeCount: number) => {
    logger.debug('Graph expanded', { nodeCount, edgeCount });
  }
};

export const logAudit = {
  create: (matchId: string, action: string) => {
    logger.debug('Audit entry created', { matchId, action });
  },
  query: (filter: Record<string, any>) => {
    logger.debug('Audit query', { filter });
  }
};

export default logger;