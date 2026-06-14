import { Response } from 'express';
export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    requestId?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: unknown;
    requestId?: string;
}
/**
 * Create a success response
 */
export declare function createSuccessResponse<T>(res: Response, data: T, meta?: SuccessResponse['meta']): Response;
/**
 * Create an error response
 */
export declare function createErrorResponse(res: Response, statusCode: number, error: string, code?: string, details?: unknown): Response;
/**
 * Create a paginated response
 */
export declare function createPaginatedResponse<T>(res: Response, data: T[], meta: {
    page: number;
    limit: number;
    total: number;
}): Response;
//# sourceMappingURL=response.d.ts.map