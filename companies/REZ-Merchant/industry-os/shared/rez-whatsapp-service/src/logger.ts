import winston from 'winston';

export interface LoggerOptions {
  serviceName: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  json?: boolean;
}

const formatters: winston.Format[] = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
];

if (process.env.NODE_ENV !== 'production') {
  formatters.push(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
  );
} else {
  formatters.push(winston.format.json());
}

export const createLogger = (options: LoggerOptions): winston.Logger => {
  const { serviceName, level = 'info', json } = options;

  return winston.createLogger({
    level: level || (process.env.LOG_LEVEL as any) || 'info',
    format: winston.format.combine(...formatters),
    transports: [new winston.transports.Console()],
    defaultMeta: { service: serviceName },
  });
};

export const logger = createLogger({
  serviceName: 'whatsapp-service',
  level: (process.env.LOG_LEVEL as any) || 'info',
});

export default logger;
