/**
 * REZ Memory Cloud - Entity Model (Knowledge Graph)
 */

import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Entity types
export const EntityType = z.enum([
  'person',
  'organization',
  'product',
  'location',
  'event',
  'concept',
  'content',
  'preference',
]);
export type EntityType = z.infer<typeof EntityType>;

// Relation types
export const RelationType = z.enum([
  'knows',
  'works_for',
  'owns',
  'located_in',
  'interested_in',
  'purchased',
  'viewed',
  'related_to',
  'prefers',
  'dislikes',
  'mentioned_in',
  'authored',
]);
export type RelationType = z.infer<typeof RelationType>;

// Entity interface
export interface IEntity extends Document {
  entityId: string;
  type: EntityType;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  owners: string[]; // User IDs who own this entity
  memoryIds: string[]; // Associated memories
  incomingRelations: number;
  outgoingRelations: number;
  createdAt: Date;
  updatedAt: Date;
}

// Relation interface
export interface IRelation extends Document {
  relationId: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationType;
  properties?: Record<string, unknown>;
  strength: number; // 0-1, relation strength
  source?: string; // Memory or user that created this
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entity schema
const EntitySchema = new Schema<IEntity>(
  {
    entityId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: EntityType.options, required: true, index: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    properties: { type: Schema.Types.Mixed, default: {} },
    owners: { type: [String], default: [], index: true },
    memoryIds: { type: [String], default: [] },
    incomingRelations: { type: Number, default: 0 },
    outgoingRelations: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Text index for entity search
EntitySchema.index({ name: 'text', description: 'text' });

// Compound indexes
EntitySchema.index({ type: 1, name: 1 });
EntitySchema.index({ owners: 1, type: 1 });
EntitySchema.index({ owners: 1, updatedAt: -1 });

export const Entity = mongoose.model<IEntity>('Entity', EntitySchema);

// Relation schema
const RelationSchema = new Schema<IRelation>(
  {
    relationId: { type: String, required: true, unique: true, index: true },
    fromEntityId: { type: String, required: true, index: true },
    toEntityId: { type: String, required: true, index: true },
    type: { type: String, enum: RelationType.options, required: true, index: true },
    properties: { type: Schema.Types.Mixed },
    strength: { type: Number, default: 1.0, min: 0, max: 1 },
    source: { type: String },
    userId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for graph traversal
RelationSchema.index({ fromEntityId: 1, type: 1 });
RelationSchema.index({ toEntityId: 1, type: 1 });
RelationSchema.index({ fromEntityId: 1, toEntityId: 1, type: 1 }, { unique: true });

export const Relation = mongoose.model<IRelation>('Relation', RelationSchema);

// Zod schemas
export const CreateEntitySchema = z.object({
  type: EntityType,
  name: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  properties: z.record(z.unknown()).optional().default({}),
  userId: z.string().min(1),
});

export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;

export const CreateRelationSchema = z.object({
  fromEntityId: z.string(),
  toEntityId: z.string(),
  type: RelationType,
  properties: z.record(z.unknown()).optional(),
  strength: z.number().min(0).max(1).optional().default(1.0),
  source: z.string().optional(),
  userId: z.string().min(1),
});

export type CreateRelationInput = z.infer<typeof CreateRelationSchema>;

export const GraphQuerySchema = z.object({
  userId: z.string().min(1),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  entityType: EntityType.optional(),
  depth: z.number().int().min(1).max(5).optional().default(2),
  relationTypes: z.array(RelationType).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export type GraphQueryInput = z.infer<typeof GraphQuerySchema>;
