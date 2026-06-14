import mongoose, { Document, Schema } from 'mongoose';
import {
  GoalDrivenCampaign,
  GoalType,
  CampaignStatus,
  LogLevel,
  Goal,
  CurrentStatus,
  AgentAction,
  Decision,
  LogEntry
} from '../types/index.js';

// Mongoose sub-schemas
const GoalSchema = new Schema<Goal>(
  {
    type: {
      type: String,
      enum: ['leads', 'sales', 'bookings', 'app_installs', 'engagement'],
      required: true
    },
    target: { type: Number, required: true, min: 1 },
    budget: { type: Number, required: true, min: 1 },
    deadline: { type: Date }
  },
  { _id: false }
);

const CurrentStatusSchema = new Schema<CurrentStatus>(
  {
    achieved: { type: Number, default: 0, min: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    spend: { type: Number, default: 0, min: 0 },
    cpa: { type: Number, default: 0, min: 0 },
    roas: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const AgentActionSchema = new Schema<AgentAction>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const DecisionSchema = new Schema<Decision>(
  {
    audienceTargeted: [{ type: String }],
    creativesUsed: [{ type: String }],
    channelsActive: [{ type: String }],
    bidStrategy: { type: String, default: 'auto' }
  },
  { _id: false }
);

const LogEntrySchema = new Schema<LogEntry>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    level: {
      type: String,
      enum: ['info', 'warning', 'error'],
      required: true
    },
    message: { type: String, required: true },
    context: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

// Main Campaign document interface
export interface ICampaignDocument extends Document {
  campaignId: string;
  agentId: string;
  advertiserId: string;
  name: string;
  goal: Goal;
  currentStatus: CurrentStatus;
  agentActions: AgentAction[];
  decisions: Decision;
  status: CampaignStatus;
  logs: LogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// Main Campaign schema
const CampaignSchema = new Schema<ICampaignDocument>(
  {
    campaignId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    agentId: {
      type: String,
      required: true,
      index: true
    },
    advertiserId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 200
    },
    goal: {
      type: GoalSchema,
      required: true
    },
    currentStatus: {
      type: CurrentStatusSchema,
      default: () => ({
        achieved: 0,
        progress: 0,
        spend: 0,
        cpa: 0,
        roas: 0
      })
    },
    agentActions: {
      type: [AgentActionSchema],
      default: []
    },
    decisions: {
      type: DecisionSchema,
      default: () => ({
        audienceTargeted: [],
        creativesUsed: [],
        channelsActive: [],
        bidStrategy: 'auto'
      })
    },
    status: {
      type: String,
      enum: ['planning', 'running', 'paused', 'completed', 'failed'],
      default: 'planning',
      index: true
    },
    logs: {
      type: [LogEntrySchema],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'campaigns'
  }
);

// Indexes
CampaignSchema.index({ advertiserId: 1, createdAt: -1 });
CampaignSchema.index({ status: 1, 'goal.type': 1 });
CampaignSchema.index({ 'goal.deadline': 1 }, { sparse: true });

// Instance methods
CampaignSchema.methods.addLog = function (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  this.logs.push({
    timestamp: new Date(),
    level,
    message,
    context
  });
};

CampaignSchema.methods.addAction = function (
  action: string,
  details: Record<string, unknown>,
  result?: Record<string, unknown>
): void {
  this.agentActions.push({
    timestamp: new Date(),
    action,
    details,
    result
  });
};

CampaignSchema.methods.updateProgress = function (achieved: number): void {
  this.currentStatus.achieved = achieved;
  this.currentStatus.progress = Math.min(
    100,
    (achieved / this.goal.target) * 100
  );
  this.currentStatus.cpa =
    this.currentStatus.spend > 0 && achieved > 0
      ? this.currentStatus.spend / achieved
      : 0;
};

CampaignSchema.methods.calculateRoas = function (revenue: number): void {
  this.currentStatus.roas =
    this.currentStatus.spend > 0 ? revenue / this.currentStatus.spend : 0;
};

// Static methods
CampaignSchema.statics.findByCampaignId = function (
  campaignId: string
): Promise<ICampaignDocument | null> {
  return this.findOne({ campaignId });
};

CampaignSchema.statics.findByAdvertiser = function (
  advertiserId: string,
  limit = 50
): Promise<ICampaignDocument[]> {
  return this.find({ advertiserId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

CampaignSchema.statics.findActiveCampaigns = function (): Promise<
  ICampaignDocument[]
> {
  return this.find({ status: 'running' });
};

// Pre-save hook for campaignId generation
CampaignSchema.pre('save', function (next) {
  if (!this.campaignId) {
    this.campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  if (!this.agentId) {
    this.agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Transform for JSON serialization
CampaignSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const CampaignModel = mongoose.model<ICampaignDocument>(
  'Campaign',
  CampaignSchema
);

export default CampaignModel;