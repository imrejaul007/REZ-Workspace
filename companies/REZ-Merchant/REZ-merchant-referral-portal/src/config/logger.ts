import winston from 'winston';
import { config } from './index';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
    return log;
  })
);

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), logFormat) })],
});
