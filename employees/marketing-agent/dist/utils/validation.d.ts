import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
export interface ValidationErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Array<{
            field: string;
            message: string;
        }>;
    };
}
/**
 * Validate request body against a Zod schema
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate request query against a Zod schema
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate request params against a Zod schema
 */
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate UUID format
 */
export declare const UUIDSchema: z.ZodString;
/**
 * Validate email format
 */
export declare const EmailSchema: z.ZodString;
/**
 * Validate URL format
 */
export declare const URLSchema: z.ZodString;
/**
 * Validate ISO date string
 */
export declare const DateSchema: z.ZodString;
/**
 * Pagination schema
 */
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    sortBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sort?: "asc" | "desc";
    limit?: number;
    page?: number;
    sortBy?: string;
}, {
    sort?: "asc" | "desc";
    limit?: number;
    page?: number;
    sortBy?: string;
}>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
/**
 * Get pagination options from query
 */
export declare function getPaginationOptions(query: PaginationInput): {
    skip: number;
    limit: number;
    sort: Record<string, 1 | -1>;
};
/**
 * Format pagination response
 */
export declare function formatPaginatedResponse<T>(items: T[], total: number, page: number, limit: number): {
    success: true;
    data: {
        items: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
};
//# sourceMappingURL=validation.d.ts.map