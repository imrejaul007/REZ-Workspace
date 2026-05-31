/**
 * HOJAI Embedding Service - Logger Utility
 * Version: 1.0.0 | Date: May 30, 2026
 */
declare class Logger {
    private serviceName;
    constructor(serviceName: string);
    private formatLog;
    private getMessage;
    private output;
    debug(event: string, data?: Record<string, unknown>): void;
    info(event: string, data?: Record<string, unknown>): void;
    warn(event: string, data?: Record<string, unknown>): void;
    error(event: string, data?: Record<string, unknown>): void;
}
export declare function createLogger(serviceName: string): Logger;
export type { Logger };
//# sourceMappingURL=logger.d.ts.map