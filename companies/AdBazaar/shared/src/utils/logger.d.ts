/**
 * ReZ Shared Logger
 * Structured logging with winston
 */
export declare const logger: any;
export declare function createServiceLogger(serviceName: string): {
    info: (message: string, metadata?: Record<string, unknown>) => any;
    error: (message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => any;
    warn: (message: string, metadata?: Record<string, unknown>) => any;
    debug: (message: string, metadata?: Record<string, unknown>) => any;
};
export default logger;
//# sourceMappingURL=logger.d.ts.map