import winston from 'winston';
import { format } from 'date-fns';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: `;

  if (stack) {
    msg += `${stack}\n`;
  } else {
    msg += message;
  }

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  winston.format.json()
);

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string = 'App', level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || level,
      defaultMeta: { service: 'REZ-viewability-tracker', context: this.context },
      transports: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: fileFormat,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: fileFormat,
        }),
      ],
    });

    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatMessage(message: string, meta?: Record<string, unknown>): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${this.context}] ${message}${metaStr}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(this.formatMessage(message, meta));
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.logger.error(this.formatMessage(message), { ...meta, stack: error.stack, error: error.message });
    } else {
      this.logger.error(this.formatMessage(message), { ...meta, error });
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(this.formatMessage(message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(this.formatMessage(message, meta));
  }

  logImpression(adId: string, impressionId: string, measurable: boolean): void {
    this.info(`Impression tracked: ad=${adId}, impression=${impressionId}, measurable=${measurable}`);
  }

  logViewEvent(adId: string, eventType: string, percentVisible: number, timeInView: number): void {
    this.debug(`View event: ad=${adId}, type=${eventType}, visible=${percentVisible}%, time=${timeInView}ms`);
  }

  logVideoEvent(adId: string, eventType: string, currentTime: number, duration: number): void {
    this.info(`Video event: ad=${adId}, type=${eventType}, time=${currentTime}/${duration}`);
  }

  logViewabilityRate(adId: string, rate: number, impressions: number): void {
    this.info(`Viewability: ad=${adId}, rate=${rate.toFixed(2)}%, impressions=${impressions}`);
  }

  logApiRequest(endpoint: string, method: string, duration: number, statusCode: number): void {
    this.info(`${method} ${endpoint}`, { duration: `${duration}ms`, status: statusCode });
  }
}

export const createLogger = (context: string, level?: LogLevel): Logger => {
  return new Logger(context, level);
};

export const logger = new Logger();

export default logger;
