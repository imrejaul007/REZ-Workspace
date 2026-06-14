/**
 * REZ Memory Cloud - Memory Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Memory categories
export const MemoryCategory = z.enum([
  'conversation',
  'fact',
  'preference',
  'event',
  'decision',
  'idea',
  'learning',
  'personal',
  'work',
  'social',
]);
export type MemoryCategory = z.infer<typeof MemoryCategory>;

// Memory importance
export const MemoryImportance = z.enum(['critical', 'high', 'medium', 'low']);
export type MemoryImportance = z.infer<typeof MemoryImportance>;

// Memory source
export const MemorySource = z.enum(['user_input', 'conversation', 'extraction', 'import', 'ai_generated']);
export type MemorySource = z.infer<typeof MemorySource>;

// Memory TTL types
export const MemoryTTLType = z.enum(['short', 'default', 'long', 'never']);
export type MemoryTTLType = z.infer<typeof MemoryTTLType>;

// Memory interface
export interface IMemory extends Document {
  memoryId: string;
  userId: string;
  content: string;
  summary?: string;
  category: MemoryCategory;
  tags: string[];
  entities: string[]; // Extracted entity IDs
  importance: MemoryImportance;
  source: MemorySource;
  context?: string;
  metadata?: Record<string, unknown>;
  relatedMemoryIds: string[];
  recallCount: number;
  lastRecalled?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Memory schema
const MemorySchema = new Schema<IMemory>(
  {
    memoryId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    summary: { type: String },
    category: {
      type: String,
      enum: MemoryCategory.options,
      default: 'fact',
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    entities: { type: [String], default: [] },
    importance: {
      type: String,
      enum: MemoryImportance.options,
      default: 'medium',
    },
    source: {
      type: String,
      enum: MemorySource.options,
      default: 'user_input',
    },
    context: { type: String },
    metadata: { type: Schema.Types.Mixed },
    relatedMemoryIds: { type: [String], default: [] },
    recallCount: { type: Number, default: 0 },
    lastRecalled: { type: Date },
    expiresAt: { type: Date, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
MemorySchema.index({ userId: 1, createdAt: -1 });
MemorySchema.index({ userId: 1, category: 1, createdAt: -1 });
MemorySchema.index({ userId: 1, tags: 1 });
MemorySchema.index({ userId: 1, importance: 1, createdAt: -1 });

// Text index for keyword search
MemorySchema.index({ content: 'text', summary: 'text' }, { weights: { content: 10, summary: 5 } });

// TTL index - MongoDB will auto-delete expired memories
MemorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Memory = mongoose.model<IMemory>('Memory', MemorySchema);

// Zod schemas for validation
export const CreateMemorySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  content: z.string().min(1, 'content is required').max(50000, 'content too long'),
  summary: z.string().max(500).optional(),
  category: MemoryCategory.optional().default('fact'),
  tags: z.array(z.string()).max(20).optional().default([]),
  entities: z.array(z.string()).max(50).optional().default([]),
  importance: MemoryImportance.optional().default('medium'),
  source: MemorySource.optional().default('user_input'),
  context: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
  ttlType: MemoryTTLType.optional().default('default'),
  expiresAt: z.string().datetime().optional(), // ISO date string
});

export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>;

export const RecallMemorySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  query: z.string().min(1, 'query is required').max(1000),
  limit: z.number().int().min(1).max(100).optional().default(10),
  categories: z.array(MemoryCategory).optional(),
  tags: z.array(z.string()).optional(),
  importance: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  since: z.string().datetime().optional(), // Only memories after this date
  before: z.string().datetime().optional(), // Only memories before this date
});

export type RecallMemoryInput = z.infer<typeof RecallMemorySchema>;

export const UpdateMemorySchema = z.object({
  content: z.string().min(1).max(50000).optional(),
  summary: z.string().max(500).optional(),
  category: MemoryCategory.optional(),
  tags: z.array(z.string()).max(20).optional(),
  importance: MemoryImportance.optional(),
  context: z.string().max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional().nullable(), // null to remove
});

export type UpdateMemoryInput = z.infer<typeof UpdateMemorySchema>;
