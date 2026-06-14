import winston from 'winston';
import { validateEnv } from '../config/env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`.trim();
  })
);

let env: { NODE_ENV?: string; SERVICE_NAME?: string };
try {
  env = validateEnv();
} catch {
  env = { NODE_ENV: 'development', SERVICE_NAME: 'rez-referral-os' };
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: env.SERVICE_NAME || 'rez-referral-os' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

export default logger;
