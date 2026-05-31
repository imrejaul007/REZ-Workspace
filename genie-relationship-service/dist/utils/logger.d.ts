/**
 * GENIE Relationship Service - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Structured JSON logging
 */
export interface LogLevel {
    info: (event: string, data?: Record<string, unknown>) => void;
    warn: (event: string, data?: Record<string, unknown>) => void;
    error: (event: string, data?: Record<string, unknown>) => void;
    debug: (event: string, data?: Record<string, unknown>) => void;
}
/**
 * Create a structured logger for a service
 */
export declare function createLogger(service: string): LogLevel;
export default createLogger;
//# sourceMappingURL=logger.d.ts.map