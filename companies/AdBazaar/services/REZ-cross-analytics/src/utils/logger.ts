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

class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      defaultMeta: { service: 'REZ-cross-analytics', context: this.context },
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

    // Ensure logs directory exists
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

  // Specialized logging methods for analytics
  logMetricsFetch(platform: string, count: number, duration: number): void {
    this.info(`Fetched ${count} metrics from ${platform}`, { duration: `${duration}ms` });
  }

  logReportGeneration(reportType: string, duration: number): void {
    this.info(`Generated ${reportType} report`, { duration: `${duration}ms` });
  }

  logAttribution(attributionModel: string, touchpoints: number): void {
    this.info(`Attribution calculated using ${attributionModel} model`, { touchpoints });
  }

  logExport(format: string, recordCount: number): void {
    this.info(`Exported ${recordCount} records to ${format.toUpperCase()}`);
  }

  logApiRequest(endpoint: string, method: string, duration: number, statusCode: number): void {
    this.info(`${method} ${endpoint}`, { duration: `${duration}ms`, status: statusCode });
  }
}

// Factory function for creating logger instances
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

// Default logger instance
export const logger = new Logger();

export default logger;
