import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0 && metadata.stack) {
    msg += `\n${metadata.stack}`;
  }
  if (Object.keys(metadata).length > 0 && !metadata.stack) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    )
  })
];

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'airzy-flight-service' },
  transports
});

export const createLogger = (context: string) => {
  return logger.child({ context });
};

export default logger;