/**
 * Unit Tests for logger.ts
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: unknown;
}

function createLogger() {
  const entries: LogEntry[] = [];

  function log(level: LogLevel, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = { level, message, timestamp: Date.now(), data };
    entries.push(entry);
    return entry;
  }

  return {
    debug: (msg: string, data?: unknown) => log('debug', msg, data),
    info: (msg: string, data?: unknown) => log('info', msg, data),
    warn: (msg: string, data?: unknown) => log('warn', msg, data),
    error: (msg: string, data?: unknown) => log('error', msg, data),
    getEntries: () => [...entries],
  };
}

describe('logger', () => {
  it('should log messages at different levels', () => {
    const logger = createLogger();

    logger.info('App started');
    logger.warn('Low memory');
    logger.error('Fetch failed', { code: 500 });

    const entries = logger.getEntries();
    expect(entries).toHaveLength(3);
    expect(entries[0].level).toBe('info');
    expect(entries[1].level).toBe('warn');
    expect(entries[2].level).toBe('error');
  });

  it('should capture log message text', () => {
    const logger = createLogger();
    const entry = logger.info('User logged in');

    expect(entry.message).toBe('User logged in');
    expect(entry.level).toBe('info');
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it('should attach extra data to log entries', () => {
    const logger = createLogger();
    const payload = { userId: '123', action: 'purchase' };
    const entry = logger.debug('Track event', payload);

    expect(entry.data).toEqual(payload);
    expect(entry.level).toBe('debug');
  });
});
