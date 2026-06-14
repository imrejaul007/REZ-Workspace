/**
 * Centralized Logger Utility
 * Replaces console.log/error with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = (): LogLevel => {
  if (process.env.NODE_ENV === 'production') {
    return 'error'
  }
  return 'debug'
}

function formatLog(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
  if (entry.context) {
    return `${prefix} ${entry.message} ${JSON.stringify(entry.context)}`
  }
  return `${prefix} ${entry.message}`
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = currentLevel()
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(formatLog(createLogEntry('debug', message, context)))
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatLog(createLogEntry('info', message, context)))
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatLog(createLogEntry('warn', message, context)))
    }
  },

  error(message: string, error?: Error, context?: LogContext): void {
    const fullContext: LogContext = {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    }
    if (shouldLog('error')) {
      console.error(formatLog(createLogEntry('error', message, fullContext)))
    }
  },
}

export default logger
