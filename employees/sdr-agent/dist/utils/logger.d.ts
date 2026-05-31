import winston from 'winston';
export declare const logger: winston.Logger;
export declare function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown>;
export declare function generateCorrelationId(): string;
export declare const logRequest: (method: string, path: string, statusCode: number, durationMs: number, metadata?: Record<string, unknown>) => void;
export declare const logError: (context: string, error: Error | unknown, metadata?: Record<string, unknown>) => void;
export declare const logMetric: (metric: string, value: number, metadata?: Record<string, unknown>) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map