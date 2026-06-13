/**
 * Logger - Structured logging for agents
 */
import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Create agent logger
 */
export function createLogger(config = {}) {
  const {
    level = 'info',
    name = 'agent',
    format = 'json', // 'json' or 'simple'
    output = 'console' // 'console', 'file', or 'both'
  } = config;

  const formats = {
    json: combine(
      timestamp(),
      json()
    ),
    simple: combine(
      timestamp(),
      printf(({ level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp()} [${level}] ${name}: ${message} ${metaStr}`;
      })
    )
  };

  const transports = [];

  if (output === 'console' || output === 'both') {
    transports.push(new winston.transports.Console({
      format: combine(
        colorize(),
        formats[format]
      )
    }));
  }

  if (output === 'file' || output === 'both') {
    transports.push(new winston.transports.File({
      filename: `logs/${name}-${Date.now()}.log`,
      format: formats.json
    }));
  }

  return winston.createLogger({
    level,
    defaultMeta: { service: name },
    transports
  });
}

/**
 * Log levels for agents
 */
export const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
};

/**
 * Log formatters
 */
export const formatters = {
  /**
   * Format log entry as structured JSON
   */
  structured: (entry) => ({
    timestamp: entry.timestamp || new Date().toISOString(),
    level: entry.level,
    service: entry.service,
    message: entry.message,
    agentId: entry.agentId,
    taskId: entry.taskId,
    duration: entry.duration,
    metadata: entry.metadata
  }),

  /**
   * Format log entry as human-readable
   */
  human: (entry) => {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const parts = [`[${time}]`, `[${entry.level.toUpperCase()}]`];
    
    if (entry.agentId) parts.push(`[${entry.agentId}]`);
    if (entry.taskId) parts.push(`{${entry.taskId.slice(0, 8)}}`);
    
    parts.push(entry.message);
    
    if (entry.metadata && Object.keys(entry.metadata).length) {
      parts.push(JSON.stringify(entry.metadata));
    }
    
    return parts.join(' ');
  }
};

export default createLogger;
