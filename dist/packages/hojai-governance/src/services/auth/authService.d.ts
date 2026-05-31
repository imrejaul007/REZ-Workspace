import { Model } from 'mongoose';
import { User, ApiKey, ApiKeyType } from '../../types/index.js';
interface UserDocument extends User {
}
export declare const UserModel: Model<UserDocument>;
interface ApiKeyDocument extends ApiKey {
}
export declare const ApiKeyModel: Model<ApiKeyDocument>;
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthResult {
    user: User;
    tokens: AuthTokens;
}
export declare class AuthService {
    private readonly jwtSecret;
    private readonly jwtRefreshSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    constructor();
    /**
     * Register a new user
     */
    register(params: {
        tenantId: string;
        email: string;
        password: string;
        name: string;
        phone?: string;
        organizationId?: string;
    }): Promise<AuthResult>;
    /**
     * Authenticate user with email/password
     */
    login(params: {
        tenantId: string;
        email: string;
        password: string;
        ip?: string;
        userAgent?: string;
    }): Promise<AuthResult>;
    /**
     * Generate JWT tokens for a user
     */
    private generateTokens;
    /**
     * Verify JWT access token
     */
    verifyAccessToken(token: string): {
        sub: string;
        tenantId: string;
        email: string;
        type: string;
    };
    /**
     * Refresh access token
     */
    refreshTokens(refreshToken: string): Promise<AuthTokens>;
    /**
     * Create API key for a tenant
     */
    createApiKey(params: {
        tenantId: string;
        userId?: string;
        name: string;
        type: ApiKeyType;
        permissions?: string[];
        expiresInDays?: number;
    }): Promise<{
        apiKey: ApiKey;
        rawKey: string;
    }>;
    /**
     * Verify API key
     */
    verifyApiKey(tenantId: string, rawKey: string): Promise<ApiKey | null>;
    /**
     * Revoke API key
     */
    revokeApiKey(tenantId: string, apiKeyId: string): Promise<void>;
    /**
     * Get user by ID
     */
    getUser(userId: string): Promise<User | null>;
    /**
     * List API keys for a tenant
     */
    listApiKeys(tenantId: string): Promise<ApiKey[]>;
    /**
     * Change password
     */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map