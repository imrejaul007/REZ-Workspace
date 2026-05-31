/**
 * HOJAI AI Support Agent - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured logging with context and correlation
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
}
interface Logger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>, error?: Error): void;
    fatal(message: string, context?: Record<string, unknown>, error?: Error): void;
}
declare function createLogger(serviceName: string, minLevel?: LogLevel): Logger;
export { createLogger };
export type { Logger, LogLevel, LogEntry };
//# sourceMappingURL=logger.d.ts.map