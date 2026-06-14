import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});

export const createServiceLogger = (serviceName: string) => {
  return {
    info: (message: string, metadata?: Record<string, unknown>) =>
      logger.info(`[${serviceName}] ${message}`, metadata),
    error: (message: string, metadata?: Record<string, unknown>) =>
      logger.error(`[${serviceName}] ${message}`, metadata),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      logger.warn(`[${serviceName}] ${message}`, metadata),
    debug: (message: string, metadata?: Record<string, unknown>) =>
      logger.debug(`[${serviceName}] ${message}`, metadata)
  };
};
