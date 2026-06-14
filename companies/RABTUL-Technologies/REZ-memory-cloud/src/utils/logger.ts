/**
 * REZ Memory Cloud - Logger
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0 && metadata.stack) {
    msg += `\n${metadata.stack}`;
  } else if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const jsonFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

const consoleFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  colorize({ all: true }),
  errors({ stack: true }),
  logFormat
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'REZ-memory-cloud' },
  format: process.env.LOG_FORMAT === 'json' ? jsonFormat : consoleFormat,
  transports: [new winston.transports.Console()],
});

export const createModuleLogger = (module: string) => logger.child({ module });
export default logger;
