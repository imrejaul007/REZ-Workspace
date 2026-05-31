import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export interface TenantContext {
    tenantId: string;
    userId?: string;
    role: 'admin' | 'agent' | 'customer' | 'system';
    permissions: string[];
}
export interface AuthenticatedRequest extends Request {
    tenant: TenantContext;
    requestId: string;
}
export interface JWTPayload {
    sub: string;
    tenantId: string;
    role: 'admin' | 'agent' | 'customer' | 'system';
    permissions?: string[];
    iat: number;
    exp: number;
}
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    tenantId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    tenantId: string;
}, {
    email: string;
    password: string;
    tenantId: string;
}>;
export declare const TokenRefreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    tenantId: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["admin", "agent", "customer"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    tenantId: string;
    name: string;
    role: "admin" | "agent" | "customer";
}, {
    email: string;
    password: string;
    tenantId: string;
    name: string;
    role?: "admin" | "agent" | "customer" | undefined;
}>;
export declare function hasPermission(tenant: TenantContext, permission: string): boolean;
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - populates tenant context if token present
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Required authentication - rejects if no valid token
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Require specific roles
 */
export declare function requireRole(...roles: Array<'admin' | 'agent' | 'customer' | 'system'>): (req: Request, res: Response, next: NextFunction) => void;
export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        name: string;
        tenantId: string;
        role: string;
    };
}
export interface RegisterResult {
    userId: string;
    email: string;
    name: string;
    tenantId: string;
    role: string;
}
export declare function login(email: string, password: string, tenantId: string): Promise<LoginResult | null>;
export declare function register(data: {
    email: string;
    password: string;
    name: string;
    tenantId: string;
    role?: 'admin' | 'agent' | 'customer';
}): Promise<RegisterResult>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
} | null>;
export declare function successResponse<T>(res: Response, data: T, statusCode?: number): void;
export declare function errorResponse(res: Response, error: unknown, statusCode?: number): void;
