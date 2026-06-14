import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  if (metadata.stack) {
    msg += `\n${metadata.stack}`;
  }

  return msg;
});

const errorStackFormat = errors({ stack: true });

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errorStackFormat,
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
  exitOnError: false,
});

// Create stream for Morgan HTTP logging if needed
export const logStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};