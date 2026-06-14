/**
 * Logger utilities
 */

import pino from 'pino';

export interface LoggerConfig {
  name?: string;
  level?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  pretty?: boolean;
}

/**
 * Create a logger instance
 */
export function createLogger(config: LoggerConfig = {}): pino.Logger {
  const { name, level = 'info', pretty = process.env.NODE_ENV !== 'production' } = config;

  const options: pino.LoggerOptions = {
    name,
    level,
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    }),
  };

  return pino(options);
}

/**
 * Default logger
 */
export const logger = createLogger({
  name: 'rez-shared',
});

/**
 * Create child logger
 */
export function createChildLogger(parent: pino.Logger, bindings: Record<string, unknown>): pino.Logger {
  return parent.child(bindings);
}

// Re-export pino for advanced usage
export { pino };
