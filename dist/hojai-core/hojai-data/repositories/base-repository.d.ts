/**
 * Hojai Data Platform - Base Repository
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Standard repository pattern with tenant isolation
 */
import { Collection, Db } from 'mongodb';
/**
 * Base repository with tenant isolation
 */
export declare abstract class BaseRepository<T extends {
    tenant_id: string;
    id: string;
}> {
    protected collection: Collection<T>;
    protected tenant_id: string;
    constructor(db: Db, collectionName: string, tenant_id: string);
    /**
     * Always scope queries to tenant
     */
    protected scopeQuery(filter?: Partial<T>): Partial<T>;
    /**
     * Create new document
     */
    create(data: Omit<T, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>): Promise<T>;
    /**
     * Find by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Find one
     */
    findOne(filter: Partial<T>): Promise<T | null>;
    /**
     * Find many
     */
    findMany(filter?: Partial<T>, options?: {
        skip?: number;
        limit?: number;
        sort?: Record<string, 1 | -1>;
    }): Promise<T[]>;
    /**
     * Count
     */
    count(filter?: Partial<T>): Promise<number>;
    /**
     * Update one
     */
    updateOne(filter: Partial<T>, update: Partial<T>): Promise<T | null>;
    /**
     * Update many
     */
    updateMany(filter: Partial<T>, update: Partial<T>): Promise<number>;
    /**
     * Delete one
     */
    deleteOne(filter: Partial<T>): Promise<boolean>;
    /**
     * Delete many
     */
    deleteMany(filter?: Partial<T>): Promise<number>;
    /**
     * Aggregate with tenant scope
     */
    aggregate(pipeline: any[]): Promise<any[]>;
    /**
     * Generate unique ID
     */
    protected generateId(): string;
}
/**
 * Create indexes for a collection
 */
export declare function createIndexes(collection: Collection<any>, indexes: {
    key: Record<string, 1 | -1>;
    name: string;
    unique?: boolean;
}[]): Promise<void>;
/**
 * Standard indexes for tenant-scoped collections
 */
export declare const standardIndexes: {
    by_tenant: {
        key: {
            tenant_id: number;
        };
        name: string;
    };
    by_tenant_created: {
        key: {
            tenant_id: number;
            created_at: number;
        };
        name: string;
    };
    by_tenant_id: {
        key: {
            tenant_id: number;
            id: number;
        };
        name: string;
        unique: boolean;
    };
};
//# sourceMappingURL=base-repository.d.ts.map