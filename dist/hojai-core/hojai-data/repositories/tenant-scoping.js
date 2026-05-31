/**
 * Hojai Data Platform - Tenant Scoping Utilities
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Database query helpers with automatic tenant scoping
 */
// ============================================
// TENANT SCOPING
// ============================================
/**
 * Add tenant_id to any filter
 */
export function scopeFilter(filter, tenantId) {
    return {
        ...filter,
        tenant_id: tenantId
    };
}
/**
 * Add tenant_id to any update
 */
export function scopeUpdate(update, tenantId) {
    if ('$set' in update) {
        return {
            ...update,
            $set: {
                ...update.$set,
                tenant_id: tenantId,
                updated_at: new Date().toISOString()
            }
        };
    }
    if ('$push' in update || '$addToSet' in update) {
        return {
            ...update,
            $set: {
                tenant_id: tenantId,
                updated_at: new Date().toISOString()
            }
        };
    }
    return {
        ...update,
        tenant_id: tenantId,
        updated_at: new Date().toISOString()
    };
}
// ============================================
// QUERY BUILDERS
// ============================================
/**
 * Tenant-scoped query builder
 */
export class TenantQueryBuilder {
    collection;
    tenantId;
    filter = {};
    sortOptions;
    limitValue;
    skipValue;
    constructor(collection, tenantId) {
        this.collection = collection;
        this.tenantId = tenantId;
        this.filter = { tenant_id: tenantId };
    }
    /**
     * Add filter conditions
     */
    where(field, value) {
        this.filter = { ...this.filter, [field]: value };
        return this;
    }
    /**
     * Add filter with operator
     */
    whereGt(field, value) {
        this.filter = {
            ...this.filter,
            [field]: { $gt: value }
        };
        return this;
    }
    whereLt(field, value) {
        this.filter = {
            ...this.filter,
            [field]: { $lt: value }
        };
        return this;
    }
    whereIn(field, values) {
        this.filter = {
            ...this.filter,
            [field]: { $in: values }
        };
        return this;
    }
    whereExists(field, exists) {
        this.filter = {
            ...this.filter,
            [field]: { $exists: exists }
        };
        return this;
    }
    whereRegex(field, pattern) {
        this.filter = {
            ...this.filter,
            [field]: { $regex: pattern, $options: 'i' }
        };
        return this;
    }
    /**
     * Sort results
     */
    sort(field, order = 'asc') {
        this.sortOptions = { [field]: order === 'asc' ? 1 : -1 };
        return this;
    }
    /**
     * Limit results
     */
    limit(count) {
        this.limitValue = count;
        return this;
    }
    /**
     * Skip results
     */
    skip(count) {
        this.skipValue = count;
        return this;
    }
    /**
     * Execute query - find one
     */
    async findOne() {
        return this.collection.findOne(this.filter);
    }
    /**
     * Execute query - find many
     */
    async find() {
        let cursor = this.collection.find(this.filter);
        if (this.sortOptions) {
            cursor = cursor.sort(this.sortOptions);
        }
        if (this.skipValue) {
            cursor = cursor.skip(this.skipValue);
        }
        if (this.limitValue) {
            cursor = cursor.limit(this.limitValue);
        }
        return cursor.toArray();
    }
    /**
     * Execute query - count
     */
    async count() {
        return this.collection.countDocuments(this.filter);
    }
    /**
     * Execute query - delete
     */
    async delete() {
        const result = await this.collection.deleteMany(this.filter);
        return result.deletedCount;
    }
}
// ============================================
// AGGREGATION HELPERS
// ============================================
/**
 * Add tenant scope to aggregation pipeline
 */
export function scopeAggregation(tenantId, pipeline) {
    return [
        { $match: { tenant_id: tenantId } },
        ...pipeline
    ];
}
/**
 * Common aggregation stages
 */
export const aggregationStages = {
    /**
     * Group by field
     */
    groupBy(field, operations) {
        return { $group: { _id: `$${field}`, ...operations } };
    },
    /**
     * Sort stage
     */
    sort(sort) {
        return { $sort: sort };
    },
    /**
     * Limit stage
     */
    limit(count) {
        return { $limit: count };
    },
    /**
     * Skip stage
     */
    skip(count) {
        return { $skip: count };
    },
    /**
     * Lookup (join) with tenant scope
     */
    lookup(from, localField, foreignField, as, tenantId) {
        return {
            $lookup: {
                from,
                let: { localField: `$${localField}` },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: [`$${foreignField}`, '$$localField'] },
                            tenant_id: tenantId
                        }
                    }
                ],
                as
            }
        };
    },
    /**
     * Facet for multiple aggregations
     */
    facet(facets) {
        return { $facet: facets };
    }
};
// ============================================
// VALIDATION HELPERS
// ============================================
/**
 * Validate tenant ID
 */
export function isValidTenantId(tenantId) {
    // Alphanumeric, dashes, underscores
    // Length 3-50
    return /^[a-zA-Z0-9_-]{3,50}$/.test(tenantId);
}
/**
 * Validate tenant ID and throw if invalid
 */
export function validateTenantId(tenantId) {
    if (!tenantId) {
        throw new Error('Tenant ID is required');
    }
    if (!isValidTenantId(tenantId)) {
        throw new Error('Invalid tenant ID format');
    }
    return tenantId;
}
/**
 * Sanitize tenant ID (prevent injection)
 */
export function sanitizeTenantId(tenantId) {
    // Remove any characters that aren't alphanumeric, dash, underscore
    return tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
}
/**
 * Create audit entry for data access
 */
export function auditAccess(tenantId, resourceType, resourceId, userId) {
    return {
        tenant_id: tenantId,
        user_id: userId,
        action: 'access',
        resource_type: resourceType,
        resource_id: resourceId,
        timestamp: new Date().toISOString()
    };
}
/**
 * Create audit entry for data modification
 */
export function auditModify(tenantId, action, resourceType, resourceId, changes, userId) {
    return {
        tenant_id: tenantId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        timestamp: new Date().toISOString()
    };
}
export default {
    scopeFilter,
    scopeUpdate,
    TenantQueryBuilder,
    scopeAggregation,
    aggregationStages,
    isValidTenantId,
    validateTenantId,
    sanitizeTenantId,
    auditAccess,
    auditModify
};
//# sourceMappingURL=tenant-scoping.js.map