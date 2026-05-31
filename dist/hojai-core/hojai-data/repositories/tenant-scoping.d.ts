/**
 * Hojai Data Platform - Tenant Scoping Utilities
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Database query helpers with automatic tenant scoping
 */
import { Collection, Filter, UpdateFilter } from 'mongodb';
/**
 * Add tenant_id to any filter
 */
export declare function scopeFilter<T extends {
    tenant_id?: string;
}>(filter: Filter<T>, tenantId: string): Filter<T>;
/**
 * Add tenant_id to any update
 */
export declare function scopeUpdate<T extends {
    tenant_id?: string;
}>(update: UpdateFilter<T> | Partial<T>, tenantId: string): UpdateFilter<T> | Partial<T>;
/**
 * Tenant-scoped query builder
 */
export declare class TenantQueryBuilder<T extends {
    tenant_id: string;
}> {
    private collection;
    private tenantId;
    private filter;
    private sortOptions?;
    private limitValue?;
    private skipValue?;
    constructor(collection: Collection<T>, tenantId: string);
    /**
     * Add filter conditions
     */
    where<K extends keyof T>(field: K, value: T[K]): this;
    /**
     * Add filter with operator
     */
    whereGt<K extends keyof T>(field: K, value: number): this;
    whereLt<K extends keyof T>(field: K, value: number): this;
    whereIn<K extends keyof T>(field: K, values: T[K][]): this;
    whereExists<K extends keyof T>(field: K, exists: boolean): this;
    whereRegex<K extends keyof T>(field: K, pattern: string): this;
    /**
     * Sort results
     */
    sort(field: keyof T, order?: 'asc' | 'desc'): this;
    /**
     * Limit results
     */
    limit(count: number): this;
    /**
     * Skip results
     */
    skip(count: number): this;
    /**
     * Execute query - find one
     */
    findOne(): Promise<T | null>;
    /**
     * Execute query - find many
     */
    find(): Promise<T[]>;
    /**
     * Execute query - count
     */
    count(): Promise<number>;
    /**
     * Execute query - delete
     */
    delete(): Promise<number>;
}
/**
 * Add tenant scope to aggregation pipeline
 */
export declare function scopeAggregation<T extends {
    tenant_id: string;
}>(tenantId: string, pipeline: any[]): any[];
/**
 * Common aggregation stages
 */
export declare const aggregationStages: {
    /**
     * Group by field
     */
    groupBy(field: string, operations: Record<string, any>): {
        $group: {
            _id: string;
        };
    };
    /**
     * Sort stage
     */
    sort(sort: Record<string, 1 | -1>): {
        $sort: Record<string, 1 | -1>;
    };
    /**
     * Limit stage
     */
    limit(count: number): {
        $limit: number;
    };
    /**
     * Skip stage
     */
    skip(count: number): {
        $skip: number;
    };
    /**
     * Lookup (join) with tenant scope
     */
    lookup(from: string, localField: string, foreignField: string, as: string, tenantId: string): {
        $lookup: {
            from: string;
            let: {
                localField: string;
            };
            pipeline: {
                $match: {
                    $expr: {
                        $eq: string[];
                    };
                    tenant_id: string;
                };
            }[];
            as: string;
        };
    };
    /**
     * Facet for multiple aggregations
     */
    facet(facets: Record<string, any[]>): {
        $facet: Record<string, any[]>;
    };
};
/**
 * Validate tenant ID
 */
export declare function isValidTenantId(tenantId: string): boolean;
/**
 * Validate tenant ID and throw if invalid
 */
export declare function validateTenantId(tenantId: string | undefined): string;
/**
 * Sanitize tenant ID (prevent injection)
 */
export declare function sanitizeTenantId(tenantId: string): string;
/**
 * Create audit log entry
 */
export interface AuditEntry {
    tenant_id: string;
    user_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    changes?: {
        before?: any;
        after?: any;
    };
    ip_address?: string;
    user_agent?: string;
    timestamp: string;
}
/**
 * Create audit entry for data access
 */
export declare function auditAccess(tenantId: string, resourceType: string, resourceId: string, userId?: string): AuditEntry;
/**
 * Create audit entry for data modification
 */
export declare function auditModify(tenantId: string, action: 'create' | 'update' | 'delete', resourceType: string, resourceId: string, changes: {
    before?: any;
    after?: any;
}, userId?: string): AuditEntry;
export { scopeFilter, scopeUpdate, TenantQueryBuilder };
declare const _default: {
    scopeFilter: typeof scopeFilter;
    scopeUpdate: typeof scopeUpdate;
    TenantQueryBuilder: typeof TenantQueryBuilder;
    scopeAggregation: typeof scopeAggregation;
    aggregationStages: {
        /**
         * Group by field
         */
        groupBy(field: string, operations: Record<string, any>): {
            $group: {
                _id: string;
            };
        };
        /**
         * Sort stage
         */
        sort(sort: Record<string, 1 | -1>): {
            $sort: Record<string, 1 | -1>;
        };
        /**
         * Limit stage
         */
        limit(count: number): {
            $limit: number;
        };
        /**
         * Skip stage
         */
        skip(count: number): {
            $skip: number;
        };
        /**
         * Lookup (join) with tenant scope
         */
        lookup(from: string, localField: string, foreignField: string, as: string, tenantId: string): {
            $lookup: {
                from: string;
                let: {
                    localField: string;
                };
                pipeline: {
                    $match: {
                        $expr: {
                            $eq: string[];
                        };
                        tenant_id: string;
                    };
                }[];
                as: string;
            };
        };
        /**
         * Facet for multiple aggregations
         */
        facet(facets: Record<string, any[]>): {
            $facet: Record<string, any[]>;
        };
    };
    isValidTenantId: typeof isValidTenantId;
    validateTenantId: typeof validateTenantId;
    sanitizeTenantId: typeof sanitizeTenantId;
    auditAccess: typeof auditAccess;
    auditModify: typeof auditModify;
};
export default _default;
//# sourceMappingURL=tenant-scoping.d.ts.map