/**
 * GENIE Relationship Service - Relationship Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Business logic for relationship management
 */
import { RelationshipModel, InteractionModel, updateLastInteraction, } from '../models/index.js';
// ============================================================================
// Response Helpers
// ============================================================================
function toRelationship(doc) {
    return {
        id: doc._id.toString(),
        user_id: doc.user_id,
        name: doc.name,
        relationship_type: doc.relationship_type,
        importance_score: doc.importance_score,
        last_interaction: doc.last_interaction,
        next_followup: doc.next_followup || undefined,
        birthday: doc.birthday || undefined,
        tags: doc.tags,
        notes: doc.notes,
        context: doc.context,
        created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at),
        updated_at: doc.updated_at instanceof Date ? doc.updated_at.toISOString() : String(doc.updated_at),
    };
}
function toInteraction(doc) {
    return {
        id: doc._id.toString(),
        relationship_id: doc.relationship_id,
        type: doc.type,
        description: doc.description,
        timestamp: doc.timestamp,
    };
}
// ============================================================================
// Relationship Service
// ============================================================================
export class RelationshipService {
    /**
     * Create a new relationship
     */
    async create(tenantId, userId, input) {
        const doc = await RelationshipModel.create({
            user_id: userId,
            tenant_id: tenantId,
            name: input.name,
            relationship_type: input.relationship_type,
            importance_score: input.importance_score || 5,
            last_interaction: new Date().toISOString(),
            next_followup: input.next_followup,
            birthday: input.birthday,
            tags: input.tags || [],
            notes: input.notes || '',
            context: input.context || [],
        });
        return toRelationship(doc);
    }
    /**
     * List relationships with pagination and filtering
     */
    async list(tenantId, userId, query) {
        const { page, pageSize, type, search, sortBy, sortOrder } = query;
        const skip = (page - 1) * pageSize;
        // Build filter
        const filter = {
            tenant_id: tenantId,
            user_id: userId,
        };
        if (type) {
            filter.relationship_type = type;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
        }
        // Build sort
        const sort = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };
        // Execute query
        const [relationships, total] = await Promise.all([
            RelationshipModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(pageSize)
                .lean(),
            RelationshipModel.countDocuments(filter),
        ]);
        return {
            relationships: relationships.map(toRelationship),
            total,
            page,
            pageSize,
        };
    }
    /**
     * Get a single relationship by ID
     */
    async get(tenantId, userId, relationshipId) {
        const doc = await RelationshipModel.findOne({
            _id: relationshipId,
            tenant_id: tenantId,
            user_id: userId,
        }).lean();
        return doc ? toRelationship(doc) : null;
    }
    /**
     * Update a relationship
     */
    async update(tenantId, userId, relationshipId, input) {
        const doc = await RelationshipModel.findOneAndUpdate({
            _id: relationshipId,
            tenant_id: tenantId,
            user_id: userId,
        }, { $set: input }, { new: true, lean: true }).lean();
        return doc ? toRelationship(doc) : null;
    }
    /**
     * Delete a relationship and its interactions
     */
    async delete(tenantId, userId, relationshipId) {
        // Delete the relationship
        const result = await RelationshipModel.deleteOne({
            _id: relationshipId,
            tenant_id: tenantId,
            user_id: userId,
        });
        if (result.deletedCount === 0) {
            return false;
        }
        // Delete associated interactions
        await InteractionModel.deleteMany({
            relationship_id: relationshipId,
            tenant_id: tenantId,
            user_id: userId,
        });
        return true;
    }
    /**
     * Get relationship statistics
     */
    async getStats(tenantId, userId) {
        const filter = { tenant_id: tenantId, user_id: userId };
        const [total, byTypeAgg, upcomingFollowups, upcomingBirthdays] = await Promise.all([
            RelationshipModel.countDocuments(filter),
            RelationshipModel.aggregate([
                { $match: filter },
                { $group: { _id: '$relationship_type', count: { $sum: 1 } } },
            ]),
            RelationshipModel.countDocuments({
                ...filter,
                next_followup: {
                    $gte: new Date().toISOString(),
                    $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                },
            }),
            RelationshipModel.countDocuments({
                ...filter,
                birthday: {
                    $regex: new Date().toISOString().slice(5, 10),
                },
            }),
        ]);
        const byType = {};
        for (const item of byTypeAgg) {
            byType[item._id] = item.count;
        }
        return {
            total,
            byType,
            upcomingFollowups,
            upcomingBirthdays,
        };
    }
}
// ============================================================================
// Interaction Service
// ============================================================================
export class InteractionService {
    /**
     * Log a new interaction
     */
    async create(tenantId, userId, relationshipId, input) {
        // Verify relationship exists
        const relationship = await RelationshipModel.findOne({
            _id: relationshipId,
            tenant_id: tenantId,
            user_id: userId,
        });
        if (!relationship) {
            return null;
        }
        // Create interaction
        const timestamp = input.timestamp || new Date().toISOString();
        const doc = await InteractionModel.create({
            relationship_id: relationshipId,
            tenant_id: tenantId,
            user_id: userId,
            type: input.type,
            description: input.description,
            timestamp,
        });
        // Update relationship's last interaction
        await updateLastInteraction(relationshipId);
        return toInteraction(doc);
    }
    /**
     * List interactions for a relationship
     */
    async list(tenantId, userId, relationshipId, query) {
        const { page, pageSize, type, startDate, endDate } = query;
        const skip = (page - 1) * pageSize;
        // Build filter
        const filter = {
            tenant_id: tenantId,
            user_id: userId,
            relationship_id: relationshipId,
        };
        if (type) {
            filter.type = type;
        }
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = startDate;
            }
            if (endDate) {
                filter.timestamp.$lte = endDate;
            }
        }
        // Execute query
        const [interactions, total] = await Promise.all([
            InteractionModel.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            InteractionModel.countDocuments(filter),
        ]);
        return {
            interactions: interactions.map(toInteraction),
            total,
            page,
            pageSize,
        };
    }
    /**
     * Get interaction by ID
     */
    async get(tenantId, userId, interactionId) {
        const doc = await InteractionModel.findOne({
            _id: interactionId,
            tenant_id: tenantId,
            user_id: userId,
        }).lean();
        return doc ? toInteraction(doc) : null;
    }
    /**
     * Delete an interaction
     */
    async delete(tenantId, userId, interactionId) {
        const result = await InteractionModel.deleteOne({
            _id: interactionId,
            tenant_id: tenantId,
            user_id: userId,
        });
        return result.deletedCount > 0;
    }
    /**
     * Get interaction statistics
     */
    async getStats(tenantId, userId, relationshipId) {
        const baseFilter = {
            tenant_id: tenantId,
            user_id: userId,
            ...(relationshipId && { relationship_id: relationshipId }),
        };
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [total, byTypeAgg, thisWeek, thisMonth] = await Promise.all([
            InteractionModel.countDocuments(baseFilter),
            InteractionModel.aggregate([
                { $match: baseFilter },
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]),
            InteractionModel.countDocuments({
                ...baseFilter,
                timestamp: { $gte: weekAgo.toISOString() },
            }),
            InteractionModel.countDocuments({
                ...baseFilter,
                timestamp: { $gte: monthStart.toISOString() },
            }),
        ]);
        const byType = {};
        for (const item of byTypeAgg) {
            byType[item._id] = item.count;
        }
        return {
            total,
            byType,
            thisWeek,
            thisMonth,
        };
    }
}
// ============================================================================
// Export singleton instances
// ============================================================================
export const relationshipService = new RelationshipService();
export const interactionService = new InteractionService();
//# sourceMappingURL=relationshipService.js.map