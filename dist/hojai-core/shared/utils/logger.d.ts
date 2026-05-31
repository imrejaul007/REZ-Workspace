/**
 * Hojai Core - Logger Utility
 * Version: 1.0 | Date: May 29, 2026
 */
export interface LoggerConfig {
    name: string;
    level?: 'debug' | 'info' | 'warn' | 'error';
    metadata?: Record<string, any>;
}
export declare function createLogger(config: string | LoggerConfig): {
    debug: (message: string, data?: Record<string, any>) => void;
    info: (message: string, data?: Record<string, any>) => void;
    warn: (message: string, data?: Record<string, any>) => void;
    error: (message: string, data?: Record<string, any>) => void;
};
//# sourceMappingURL=logger.d.ts.map