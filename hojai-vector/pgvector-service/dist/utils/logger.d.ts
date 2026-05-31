/**
 * HOJAI pgvector Service - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured logging for the pgvector service
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    [key: string]: unknown;
}
export interface Logger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    child(meta: Record<string, unknown>): Logger;
}
export declare function createLogger(serviceName: string): Logger;
//# sourceMappingURL=logger.d.ts.map