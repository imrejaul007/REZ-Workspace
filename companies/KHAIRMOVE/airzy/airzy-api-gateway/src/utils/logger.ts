import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom log format
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

// Create transports array
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

// Add file transport in production
if (config.logging.destination === 'file' || config.server.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json())
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json())
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'airzy-api-gateway' },
  transports
});

// Create child logger for specific contexts
export const createLogger = (context: string) => {
  return logger.child({ context });
};

export default logger;