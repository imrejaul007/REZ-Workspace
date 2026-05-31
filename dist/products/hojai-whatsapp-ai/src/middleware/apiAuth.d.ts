import { Request, Response, NextFunction } from 'express';
/**
 * API Key authentication middleware
 */
export declare function verifyApiKey(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Tenant ID extraction middleware (for internal services)
 */
export declare function extractTenantId(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=apiAuth.d.ts.map