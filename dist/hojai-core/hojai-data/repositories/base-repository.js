/**
 * Hojai Data Platform - Base Repository
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Standard repository pattern with tenant isolation
 */
/**
 * Base repository with tenant isolation
 */
export class BaseRepository {
    collection;
    tenant_id;
    constructor(db, collectionName, tenant_id) {
        this.collection = db.collection(collectionName);
        this.tenant_id = tenant_id;
    }
    /**
     * Always scope queries to tenant
     */
    scopeQuery(filter = {}) {
        return { ...filter, tenant_id: this.tenant_id };
    }
    /**
     * Create new document
     */
    async create(data) {
        const now = new Date().toISOString();
        const doc = {
            ...data,
            id: this.generateId(),
            tenant_id: this.tenant_id,
            created_at: now,
            updated_at: now
        };
        await this.collection.insertOne(doc);
        return doc;
    }
    /**
     * Find by ID
     */
    async findById(id) {
        return this.collection.findOne(this.scopeQuery({ id }));
    }
    /**
     * Find one
     */
    async findOne(filter) {
        return this.collection.findOne(this.scopeQuery(filter));
    }
    /**
     * Find many
     */
    async findMany(filter = {}, options) {
        const cursor = this.collection
            .find(this.scopeQuery(filter))
            .sort(options?.sort || { created_at: -1 });
        if (options?.skip)
            cursor.skip(options.skip);
        if (options?.limit)
            cursor.limit(options.limit);
        return cursor.toArray();
    }
    /**
     * Count
     */
    async count(filter = {}) {
        return this.collection.countDocuments(this.scopeQuery(filter));
    }
    /**
     * Update one
     */
    async updateOne(filter, update) {
        const result = await this.collection.findOneAndUpdate(this.scopeQuery(filter), {
            $set: { ...update, updated_at: new Date().toISOString() }
        }, { returnDocument: 'after' });
        return result;
    }
    /**
     * Update many
     */
    async updateMany(filter, update) {
        const result = await this.collection.updateMany(this.scopeQuery(filter), {
            $set: { ...update, updated_at: new Date().toISOString() }
        });
        return result.modifiedCount;
    }
    /**
     * Delete one
     */
    async deleteOne(filter) {
        const result = await this.collection.deleteOne(this.scopeQuery(filter));
        return result.deletedCount > 0;
    }
    /**
     * Delete many
     */
    async deleteMany(filter = {}) {
        const result = await this.collection.deleteMany(this.scopeQuery(filter));
        return result.deletedCount;
    }
    /**
     * Aggregate with tenant scope
     */
    async aggregate(pipeline) {
        return this.collection
            .aggregate([{ $match: { tenant_id: this.tenant_id } }, ...pipeline])
            .toArray();
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `${this.tenant_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
/**
 * Create indexes for a collection
 */
export async function createIndexes(collection, indexes) {
    for (const index of indexes) {
        await collection.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false
        });
    }
}
/**
 * Standard indexes for tenant-scoped collections
 */
export const standardIndexes = {
    by_tenant: { key: { tenant_id: 1 }, name: 'idx_tenant' },
    by_tenant_created: { key: { tenant_id: 1, created_at: -1 }, name: 'idx_tenant_created' },
    by_tenant_id: { key: { tenant_id: 1, id: 1 }, name: 'idx_tenant_id', unique: true }
};
//# sourceMappingURL=base-repository.js.map