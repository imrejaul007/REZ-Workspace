import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logDir: string;
  private errorLogPath: string;
  private accessLogPath: string;
  private combinedLogPath: string;

  constructor(logDir?: string) {
    this.logDir = logDir || path.join(process.cwd(), 'logs');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    this.errorLogPath = path.join(this.logDir, `error-${timestamp}.log`);
    this.accessLogPath = path.join(this.logDir, `access-${timestamp}.log`);
    this.combinedLogPath = path.join(this.logDir, `combined-${timestamp}.log`);
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  }

  private writeToFile(filePath: string, message: string): void {
    try {
      fs.appendFileSync(filePath, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message: string, meta?: any): void {
    const formatted = this.formatMessage('INFO', message, meta);
    console.log(formatted.trim());
    this.writeToFile(this.combinedLogPath, formatted);
  }

  warn(message: string, meta?: any): void {
    const formatted = this.formatMessage('WARN', message, meta);
    console.warn(formatted.trim());
    this.writeToFile(this.combinedLogPath, formatted);
    this.writeToFile(this.errorLogPath, formatted);
  }

  error(message: string, meta?: any): void {
    const formatted = this.formatMessage('ERROR', message, meta);
    console.error(formatted.trim());
    this.writeToFile(this.errorLogPath, formatted);
    this.writeToFile(this.combinedLogPath, formatted);
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = this.formatMessage('DEBUG', message, meta);
      console.log(formatted.trim());
    }
  }

  logRequest(req: any, res: any, duration: number): void {
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    const meta = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      status: res.statusCode
    };
    const formatted = this.formatMessage('ACCESS', message, meta);
    this.writeToFile(this.accessLogPath, formatted);
  }
}

export const logger = new Logger();
