/**
 * GENIE Relationship Service - MongoDB Models
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Personal relationship tracking for GENIE Personal Intelligence OS
 */
import mongoose, { Document, Model, HydratedDocument } from 'mongoose';
import { RelationshipType, InteractionType } from '../types.js';
interface RelationshipBase {
    user_id: string;
    tenant_id: string;
    name: string;
    relationship_type: RelationshipType;
    importance_score: number;
    last_interaction: string;
    next_followup?: string;
    birthday?: string;
    tags: string[];
    notes: string;
    context: string[];
}
export interface IRelationship extends RelationshipBase, Document {
    created_at: Date;
    updated_at: Date;
}
export interface RelationshipPlain extends RelationshipBase {
    _id: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
    __v?: number;
}
export declare const RelationshipModel: Model<IRelationship>;
interface InteractionBase {
    relationship_id: string;
    tenant_id: string;
    user_id: string;
    type: InteractionType;
    description: string;
    timestamp: string;
}
export interface IInteraction extends InteractionBase, Document {
}
export interface InteractionPlain extends InteractionBase {
    _id: mongoose.Types.ObjectId;
    __v?: number;
}
export declare const InteractionModel: Model<IInteraction>;
/**
 * Get or create relationship
 */
export declare function findOrCreateRelationship(tenantId: string, userId: string, name: string, relationshipType: RelationshipType): Promise<HydratedDocument<IRelationship>>;
/**
 * Update last interaction timestamp
 */
export declare function updateLastInteraction(relationshipId: string): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map