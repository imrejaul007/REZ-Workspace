import mongoose, { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { AuditAction } from '../../types/index.js';
const AuditLogSchema = new Schema({
    id: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    userId: { type: String, index: true },
    userEmail: { type: String },
    apiKeyId: { type: String, index: true },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Map, of: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    requestId: { type: String, index: true },
    success: { type: Boolean, default: true },
    error: { type: String }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'audit_logs'
});
// Indexes for common queries
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, resource: 1, createdAt: -1 });
// TTL index - keep logs for 2 years
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });
export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);
export class AuditLogger {
    /**
     * Log an audit event
     */
    async log(params) {
        const log = new AuditLogModel({
            id: uuid(),
            ...params,
            success: params.success ?? true
        });
        await log.save();
        return log.toObject();
    }
    /**
     * Log an audit event asynchronously (fire and forget)
     */
    logAsync(params) {
        setImmediate(async () => {
            try {
                await this.log(params);
            }
            catch (error) {
                console.error('[AuditLogger] Failed to log event:', error);
            }
        });
    }
    /**
     * Query audit logs with filters
     */
    async query(params) {
        const filter = { tenantId: params.tenantId };
        if (params.userId)
            filter.userId = params.userId;
        if (params.action)
            filter.action = params.action;
        if (params.resource)
            filter.resource = params.resource;
        if (params.success !== undefined)
            filter.success = params.success;
        if (params.startDate || params.endDate) {
            filter.createdAt = {};
            if (params.startDate) {
                filter.createdAt.$gte = params.startDate;
            }
            if (params.endDate) {
                filter.createdAt.$lte = params.endDate;
            }
        }
        const [logs, total] = await Promise.all([
            AuditLogModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(params.offset ?? 0)
                .limit(params.limit ?? 50),
            AuditLogModel.countDocuments(filter)
        ]);
        return { logs: logs.map(l => l.toObject()), total };
    }
    /**
     * Get audit trail for a specific resource
     */
    async getResourceHistory(tenantId, resource, resourceId) {
        const logs = await AuditLogModel.find({
            tenantId,
            resource,
            resourceId
        })
            .sort({ createdAt: -1 })
            .limit(100);
        return logs.map(l => l.toObject());
    }
    /**
     * Get user activity history
     */
    async getUserActivity(tenantId, userId, limit = 50) {
        const logs = await AuditLogModel.find({
            tenantId,
            userId
        })
            .sort({ createdAt: -1 })
            .limit(limit);
        return logs.map(l => l.toObject());
    }
    /**
     * Get failed operations for a tenant
     */
    async getFailedOperations(tenantId, startDate, endDate) {
        const logs = await AuditLogModel.find({
            tenantId,
            success: false,
            createdAt: { $gte: startDate, $lte: endDate }
        })
            .sort({ createdAt: -1 })
            .limit(100);
        return logs.map(l => l.toObject());
    }
    /**
     * Export audit logs (for compliance)
     */
    async export(params) {
        const logs = await AuditLogModel.find({
            tenantId: params.tenantId,
            createdAt: { $gte: params.startDate, $lte: params.endDate }
        }).sort({ createdAt: -1 });
        if (params.format === 'json') {
            return JSON.stringify(logs.map(l => l.toObject()), null, 2);
        }
        // CSV format
        const headers = [
            'id',
            'tenantId',
            'userId',
            'userEmail',
            'action',
            'resource',
            'resourceId',
            'success',
            'error',
            'ip',
            'createdAt'
        ];
        const rows = logs.map(log => [
            log.id,
            log.tenantId,
            log.userId ?? '',
            log.userEmail ?? '',
            log.action,
            log.resource,
            log.resourceId ?? '',
            log.success.toString(),
            log.error ?? '',
            log.ip ?? '',
            log.createdAt.toISOString()
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    /**
     * Get security events summary
     */
    async getSecuritySummary(tenantId, days = 7) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const [logs] = await Promise.all([
            AuditLogModel.aggregate([
                { $match: { tenantId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        const summary = {
            totalEvents: 0,
            failedLogins: 0,
            apiKeyUsage: 0,
            quotaExceeded: 0,
            policyViolations: 0
        };
        for (const log of logs) {
            summary.totalEvents += log.count;
            if (log._id === AuditAction.AUTH_LOGIN_FAILED) {
                summary.failedLogins = log.count;
            }
            else if (log._id === AuditAction.API_KEY_CREATED || log._id === AuditAction.API_KEY_REVOKED) {
                summary.apiKeyUsage += log.count;
            }
            else if (log._id === AuditAction.TENANT_QUOTA_EXCEEDED) {
                summary.quotaExceeded = log.count;
            }
            else if (log._id === AuditAction.POLICY_VIOLATED) {
                summary.policyViolations = log.count;
            }
        }
        return summary;
    }
}
export const auditLogger = new AuditLogger();
//# sourceMappingURL=auditLogger.js.map