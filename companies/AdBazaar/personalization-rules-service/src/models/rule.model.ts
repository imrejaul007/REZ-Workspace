import mongoose, { Document, Schema } from 'mongoose';

export interface IRule extends Document {
  ruleId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  priority: number;
  conditions: Array<{
    conditionId: string;
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between' | 'exists' | 'not_exists';
    value: unknown;
  }>;
  conditionLogic: 'and' | 'or';
  actions: Array<{
    actionId: string;
    type: 'show_content' | 'hide_content' | 'personalize' | 'recommend' | 'redirect' | 'modify_price' | 'apply_banner' | 'send_notification';
    config: Record<string, unknown>;
  }>;
  targetChannels?: string[];
  targetSegments?: string[];
  schedule?: {
    startDate?: Date;
    endDate?: Date;
    daysOfWeek?: number[];
    timeRanges?: Array<{ start: string; end: string }>;
  };
  limit?: {
    maxUses?: number;
    usedCount?: number;
    perUser?: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const conditionSchema = new Schema({
  conditionId: { type: String, required: true },
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'between', 'exists', 'not_exists'],
    required: true
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const actionSchema = new Schema({
  actionId: { type: String, required: true },
  type: {
    type: String,
    enum: ['show_content', 'hide_content', 'personalize', 'recommend', 'redirect', 'modify_price', 'apply_banner', 'send_notification'],
    required: true
  },
  config: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const scheduleSchema = new Schema({
  startDate: { type: Date },
  endDate: { type: Date },
  daysOfWeek: [Number],
  timeRanges: [{
    start: String,
    end: String
  }]
}, { _id: false });

const limitSchema = new Schema({
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  perUser: Number
}, { _id: false });

const ruleSchema = new Schema<IRule>({
  ruleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  priority: { type: Number, default: 0 },
  conditions: [conditionSchema],
  conditionLogic: {
    type: String,
    enum: ['and', 'or'],
    default: 'and'
  },
  actions: [actionSchema],
  targetChannels: [String],
  targetSegments: [String],
  schedule,
  limit: limitSchema,
  createdBy: { type: String, required: true }
}, { timestamps: true });

ruleSchema.index({ ruleId: 1 });
ruleSchema.index({ status: 1 });
ruleSchema.index({ priority: -1 });
ruleSchema.index({ createdBy: 1 });

export const Rule = mongoose.model<IRule>('Rule', ruleSchema);