/**
 * Workflow Builder - Models
 * Visual journey/workflow designer
 */

import mongoose, { Schema } from 'mongoose';

// ============================================
// WORKFLOW DEFINITION
// ============================================

const WorkflowSchema = new Schema({
  name: { type: String, required: true },
  description: String,

  // Owner
  userId: { type: String, required: true, index: true },
  merchantId: String,

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },

  // Workflow nodes (visual representation)
  nodes: [{
    id: String,
    type: {
      type: String,
      enum: [
        'trigger',      // Entry point
        'action',       // Execute something
        'condition',     // Branch logic
        'delay',        // Wait
        'filter',       // Filter audience
        'webhook',      // External call
        'ai_agent',     // AI decision
        'end'           // Exit point
      ]
    },
    position: { x: Number, y: Number },
    data: Schema.Types.Mixed,
    config: Schema.Types.Mixed,
  }],

  // Workflow edges (connections)
  edges: [{
    id: String,
    source: String,
    target: String,
    sourceHandle: String,
    targetHandle: String,
    label: String,
    condition: String, // For conditional edges
  }],

  // Trigger config
  trigger: {
    type: {
      type: String,
      enum: ['event', 'schedule', 'manual', 'api', 'webhook']
    },
    config: Schema.Types.Mixed,
  },

  // Stats
  stats: {
    runs: { type: Number, default: 0 },
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    lastRun: Date,
  },

  // Settings
  settings: {
    concurrency: { type: Number, default: 10 },
    timeout: { type: Number, default: 300 }, // seconds
    retryOnFailure: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 3 },
  },

  // Versioning
  version: { type: Number, default: 1 },
  publishedVersion: Number,
}, { timestamps: true });

WorkflowSchema.index({ userId: 1, status: 1 });
WorkflowSchema.index({ 'trigger.type': 1 });

export const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

// ============================================
// WORKFLOW EXECUTION
// ============================================

const ExecutionSchema = new Schema({
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflowVersion: Number,

  // Execution context
  executionId: { type: String, required: true, unique: true, index: true },
  trigger: {
    type: String,
    enum: ['event', 'schedule', 'manual', 'api', 'webhook']
  },
  triggerData: Schema.Types.Mixed,

  // User/event context
  userId: String,
  entityId: String,
  entityType: String,

  // Status
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },

  // Current state
  currentNodeId: String,
  nodeHistory: [{
    nodeId: String,
    nodeType: String,
    status: String,
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    startedAt: Date,
    completedAt: Date,
    error: String,
  }],

  // Timing
  startedAt: Date,
  completedAt: Date,
  duration: Number, // ms

  // Error handling
  error: String,
  retryCount: { type: Number, default: 0 },
}, { timestamps: true });

ExecutionSchema.index({ workflowId: 1, status: 1 });
ExecutionSchema.index({ userId: 1, createdAt: -1 });
ExecutionSchema.index({ 'trigger.type': 1, createdAt: -1 });

export const Execution = mongoose.models.Execution || mongoose.model('Execution', ExecutionSchema);

// ============================================
// WORKFLOW TEMPLATES
// ============================================

const TemplateSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['marketing', 'operations', 'support', 'commerce', 'automation'],
    required: true
  },

  // Template nodes/edges
  nodes: [{
    id: String,
    type: String,
    position: { x: Number, y: Number },
    data: Schema.Types.Mixed,
    config: Schema.Types.Mixed,
  }],
  edges: [Schema.Types.Mixed],

  trigger: Schema.Types.Mixed,

  // Metadata
  isPublic: { type: Boolean, default: false },
  useCount: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true });

TemplateSchema.index({ category: 1, isPublic: 1 });

export const Template = mongoose.models.Template || mongoose.model('Template', TemplateSchema);

// ============================================
// AUDIENCE SEGMENTS
// ============================================

const SegmentSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  userId: { type: String, required: true, index: true },

  // Segment criteria
  criteria: {
    type: {
      type: String,
      enum: ['simple', 'compound'],
      default: 'simple'
    },
    rules: [{
      field: String,
      operator: {
        type: String,
        enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'in', 'not_in', 'exists', 'not_exists']
      },
      value: Schema.Types.Mixed,
    }],
    logic: {
      type: String,
      enum: ['and', 'or'],
      default: 'and'
    }
  },

  // Preview stats
  stats: {
    totalCount: { type: Number, default: 0 },
    lastCalculated: Date,
  },

  active: { type: Boolean, default: true },
}, { timestamps: true });

SegmentSchema.index({ userId: 1, active: 1 });

export const Segment = mongoose.models.Segment || mongoose.model('Segment', SegmentSchema);
