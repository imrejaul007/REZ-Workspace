import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ============================================================================
// LOG FORMAT
// ============================================================================

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  if (stack) {
    msg += `\n${stack}`;
  }

  return msg;
});

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
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

// ============================================================================
// STREAM FOR MORGAN (HTTP LOGGING)
// ============================================================================

export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;