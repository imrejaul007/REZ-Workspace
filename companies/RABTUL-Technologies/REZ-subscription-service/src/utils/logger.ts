import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Custom format for JSON logs
const jsonFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
);

// Console format with colors
const consoleColorFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  consoleFormat
);

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create transports array
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleColorFormat,
    level: logLevel
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    // Billing specific log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'billing.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'rez-subscription-service',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: jsonFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: jsonFormat
    })
  ]
});

// Create child logger for billing operations
export const billingLogger = logger.child({ module: 'billing' });

// Create child logger for subscriptions
export const subscriptionLogger = logger.child({ module: 'subscription' });

// Create child logger for payments
export const paymentLogger = logger.child({ module: 'payment' });

// Create child logger for webhooks
export const webhookLogger = logger.child({ module: 'webhook' });

// Create child logger for dunning
export const dunningLogger = logger.child({ module: 'dunning' });

// Create child logger for usage
export const usageLogger = logger.child({ module: 'usage' });

export default logger;
