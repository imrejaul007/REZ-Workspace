"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = exports.AuditLogModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../../types/index.js");
const AuditLogSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    userId: { type: String, index: true },
    userEmail: { type: String },
    apiKeyId: { type: String, index: true },
    action: { type: String, enum: Object.values(index_js_1.AuditAction), required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Map, of: mongoose_1.Schema.Types.Mixed },
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
exports.AuditLogModel = mongoose_1.default.model('AuditLog', AuditLogSchema);
class AuditLogger {
    /**
     * Log an audit event
     */
    async log(params) {
        const log = new exports.AuditLogModel({
            id: (0, uuid_1.v4)(),
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
            exports.AuditLogModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(params.offset ?? 0)
                .limit(params.limit ?? 50),
            exports.AuditLogModel.countDocuments(filter)
        ]);
        return { logs: logs.map(l => l.toObject()), total };
    }
    /**
     * Get audit trail for a specific resource
     */
    async getResourceHistory(tenantId, resource, resourceId) {
        const logs = await exports.AuditLogModel.find({
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
        const logs = await exports.AuditLogModel.find({
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
        const logs = await exports.AuditLogModel.find({
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
        const logs = await exports.AuditLogModel.find({
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
            exports.AuditLogModel.aggregate([
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
            if (log._id === index_js_1.AuditAction.AUTH_LOGIN_FAILED) {
                summary.failedLogins = log.count;
            }
            else if (log._id === index_js_1.AuditAction.API_KEY_CREATED || log._id === index_js_1.AuditAction.API_KEY_REVOKED) {
                summary.apiKeyUsage += log.count;
            }
            else if (log._id === index_js_1.AuditAction.TENANT_QUOTA_EXCEEDED) {
                summary.quotaExceeded = log.count;
            }
            else if (log._id === index_js_1.AuditAction.POLICY_VIOLATED) {
                summary.policyViolations = log.count;
            }
        }
        return summary;
    }
}
exports.AuditLogger = AuditLogger;
exports.auditLogger = new AuditLogger();
//# sourceMappingURL=auditLogger.js.map