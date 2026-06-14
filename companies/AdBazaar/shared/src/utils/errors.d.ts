/**
 * Custom application error class
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare const errors: {
    badRequest: (message?: string) => AppError;
    unauthorized: (message?: string) => AppError;
    forbidden: (message?: string) => AppError;
    notFound: (resource?: string) => AppError;
    conflict: (message?: string) => AppError;
    validation: (message?: string) => AppError;
    tooManyRequests: (message?: string) => AppError;
    internal: (message?: string) => AppError;
    serviceUnavailable: (message?: string) => AppError;
};
//# sourceMappingURL=errors.d.ts.map