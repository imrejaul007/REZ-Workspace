/**
 * WAITRON - Logger Utility
 * Structured logging for Restaurant AI Agents
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
});

// Custom format for JSON logs
const jsonFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.json()
);

// Logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: jsonFormat,
  defaultMeta: { service: 'waitron' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1
            ? '\n' + JSON.stringify(meta, null, 2)
            : Object.keys(meta).length === 1 ? ` [${Object.values(meta)[0]}]` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5
  }));
}

// Log with request ID
export function logWithRequestId(requestId: string) {
  return {
    info: (message: string, meta?: any) => logger.info(message, { requestId, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { requestId, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { requestId, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { requestId, ...meta }),
  };
}

// Generate request ID
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${uuidv4().slice(0, 8)}`;
}

// Create child logger with context
export function createAgentLogger(agentId: string, agentType: string) {
  return {
    info: (message: string, meta?: any) => logger.info(message, { agentId, agentType, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { agentId, agentType, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { agentId, agentType, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { agentId, agentType, ...meta }),
    logTask: (taskId: string, status: string, meta?: any) =>
      logger.info(`[TASK ${taskId}] ${status}`, { agentId, agentType, taskId, status, ...meta }),
    logMessage: (target: string, action: string, meta?: any) =>
      logger.info(`[MSG → ${target}] ${action}`, { agentId, agentType, target, action, ...meta }),
  };
}

export default logger;
