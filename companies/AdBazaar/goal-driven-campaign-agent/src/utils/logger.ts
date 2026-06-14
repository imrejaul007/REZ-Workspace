import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
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
      logFormat
    )
  })
];

// Add file transport in production
if (config.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: `${config.logging.outputDirectory}/error.log`,
      level: 'error',
      format: combine(timestamp(), logFormat)
    }),
    new winston.transports.File({
      filename: `${config.logging.outputDirectory}/combined.log`,
      format: combine(timestamp(), logFormat)
    })
  );
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'goal-driven-campaign-agent' },
  transports
});

// Create child logger with additional context
export function createContextLogger(context: Record<string, unknown>): winston.Logger {
  return logger.child(context);
}

export default logger;
