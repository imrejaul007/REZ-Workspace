import winston from 'winston';
const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
export const logger = winston.createLogger({ level: process.env.LOG_LEVEL || 'info', format: logFormat, transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), logFormat) })] });
export const createServiceLogger = (name: string) => ({
  info: (msg: string, m?: Record<string, unknown>) => logger.info(`[${name}] ${msg}`, m),
  error: (msg: string, m?: Record<string, unknown>) => logger.error(`[${name}] ${msg}`, m),
  warn: (msg: string, m?: Record<string, unknown>) => logger.warn(`[${name}] ${msg}`, m),
  debug: (msg: string, m?: Record<string, unknown>) => logger.debug(`[${name}] ${msg}`, m)
});