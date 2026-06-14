/**
 * Shared Winston logger for BullMQ microservices.
 * Configure via SERVICE_NAME, LOG_LEVEL, NODE_ENV env vars.
 */

import winston from 'winston';

export function createLogger(serviceName?: string): winston.Logger {
  const name = serviceName || process.env.SERVICE_NAME || 'microservice';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    ),
    defaultMeta: { service: name },
    transports: [new winston.transports.Console()],
  });
}

export function createServiceLogger(
  logger: winston.Logger,
  component: string,
) {
  return {
    info: (message: string, meta?) => logger.info(message, { component, ...meta }),
    warn: (message: string, meta?) => logger.warn(message, { component, ...meta }),
    error: (message: string, meta?) => logger.error(message, { component, ...meta }),
    debug: (message: string, meta?) => logger.debug(message, { component, ...meta }),
  };
}
