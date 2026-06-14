import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level.toUpperCase()}]`;

  if (stack) {
    log += `\n${stack}`;
  } else {
    log += `: ${message}`;
  }

  if (Object.keys(metadata).length > 0 && metadata.url === undefined) {
    log += ` ${JSON.stringify(metadata)}`;
  }

  return log;
});

const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

const productionFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : config.isProduction ? 'info' : 'error',
  defaultMeta: {
    service: 'rez-automotive-service',
    environment: config.env,
  },
  format: config.isProduction ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/exceptions.log',
            maxsize: 5242880,
            maxFiles: 3,
          }),
        ]
      : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(config.isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/rejections.log',
            maxsize: 5242880,
            maxFiles: 3,
          }),
        ]
      : []),
  ],
});

// Create stream for Morgan HTTP logging if needed
export const logStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export default logger;
