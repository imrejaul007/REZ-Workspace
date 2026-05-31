import { Model } from 'mongoose';
import { AuditLog, AuditAction } from '../../types/index.js';
interface AuditLogDocument extends AuditLog {
}
export declare const AuditLogModel: Model<AuditLogDocument>;
export interface AuditLogParams {
    tenantId: string;
    organizationId?: string;
    userId?: string;
    userEmail?: string;
    apiKeyId?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    requestId?: string;
    success?: boolean;
    error?: string;
}
export declare class AuditLogger {
    /**
     * Log an audit event
     */
    log(params: AuditLogParams): Promise<AuditLog>;
    /**
     * Log an audit event asynchronously (fire and forget)
     */
    logAsync(params: AuditLogParams): void;
    /**
     * Query audit logs with filters
     */
    query(params: {
        tenantId: string;
        userId?: string;
        action?: AuditAction;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        success?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: AuditLog[];
        total: number;
    }>;
    /**
     * Get audit trail for a specific resource
     */
    getResourceHistory(tenantId: string, resource: string, resourceId: string): Promise<AuditLog[]>;
    /**
     * Get user activity history
     */
    getUserActivity(tenantId: string, userId: string, limit?: number): Promise<AuditLog[]>;
    /**
     * Get failed operations for a tenant
     */
    getFailedOperations(tenantId: string, startDate: Date, endDate: Date): Promise<AuditLog[]>;
    /**
     * Export audit logs (for compliance)
     */
    export(params: {
        tenantId: string;
        startDate: Date;
        endDate: Date;
        format: 'json' | 'csv';
    }): Promise<string>;
    /**
     * Get security events summary
     */
    getSecuritySummary(tenantId: string, days?: number): Promise<{
        totalEvents: number;
        failedLogins: number;
        apiKeyUsage: number;
        quotaExceeded: number;
        policyViolations: number;
    }>;
}
export declare const auditLogger: AuditLogger;
export {};
//# sourceMappingURL=auditLogger.d.ts.map