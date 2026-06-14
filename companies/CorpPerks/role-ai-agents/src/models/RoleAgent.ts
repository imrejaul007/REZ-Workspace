// ============================================================================
// Role AI Agents - Role Agent Model
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { JobRole, AgentLevel, RoleCapability } from '../types';

export interface IRoleAgent extends Document {
  role: JobRole;
  level: AgentLevel;
  name: string;
  title: string;
  experience: string;
  capabilities: RoleCapability[];
  systemPrompt: string;
  tools: string[];
  traits: string[];
  goals: string[];
  constraints: string[];
  usageStats: {
    totalChats: number;
    totalSessions: number;
    averageRating: number;
    lastUsed: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RoleCapabilitySchema = new Schema<RoleCapability>(
  {
    category: { type: String, required: true },
    skills: [{ type: String }],
    description: { type: String, required: true },
  },
  { _id: false }
);

const RoleAgentSchema = new Schema<IRoleAgent>(
  {
    role: {
      type: String,
      required: true,
      enum: [
        'software-engineer',
        'sales',
        'marketing',
        'finance',
        'hr',
        'operations',
        'product',
        'design',
        'support',
        'admin',
      ],
      index: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['L1', 'L2', 'L3', 'L4'],
      index: true,
    },
    name: { type: String, required: true },
    title: { type: String, required: true },
    experience: { type: String, required: true },
    capabilities: [RoleCapabilitySchema],
    systemPrompt: { type: String, required: true },
    tools: [{ type: String }],
    traits: [{ type: String }],
    goals: [{ type: String }],
    constraints: [{ type: String }],
    usageStats: {
      totalChats: { type: Number, default: 0 },
      totalSessions: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      lastUsed: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for role + level
RoleAgentSchema.index({ role: 1, level: 1 }, { unique: true });

// Text index for search
RoleAgentSchema.index({ name: 'text', title: 'text', 'capabilities.skills': 'text' });

export const RoleAgent: Model<IRoleAgent> = mongoose.model<IRoleAgent>('RoleAgent', RoleAgentSchema);
