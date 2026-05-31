/**
 * GENIE Memory Service - Logger Utility
 * Version: 1.0.0 | Date: May 31, 2026
 * Purpose: Structured logging for the memory service
 */
interface Logger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
/**
 * Create a logger instance for a specific service
 */
export declare function createLogger(serviceName: string): Logger;
export default createLogger;
//# sourceMappingURL=logger.d.ts.map