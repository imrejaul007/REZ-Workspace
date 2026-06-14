import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchAudit extends Document {
  matchId: string;
  action: 'deterministic_match' | 'probabilistic_match' | 'identity_merge' | 'identity_split' | 'confidence_update';
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  data: Record<string, any>;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  metadata: Record<string, any>;
}

const MatchAuditSchema = new Schema<IMatchAudit>(
  {
    matchId: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: [
        'deterministic_match',
        'probabilistic_match',
        'identity_merge',
        'identity_split',
        'confidence_update'
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    userId: {
      type: String,
      index: true
    },
    ipAddress: String,
    userAgent: String,
    data: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    previousState: {
      type: Map,
      of: Schema.Types.Mixed
    },
    newState: {
      type: Map,
      of: Schema.Types.Mixed
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false
  }
);

// Indexes for efficient querying
MatchAuditSchema.index({ action: 1, timestamp: -1 });
MatchAuditSchema.index({ userId: 1, timestamp: -1 });
MatchAuditSchema.index({ matchId: 1, timestamp: -1 });

// TTL index - keep audit logs for 1 year
MatchAuditSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

export const MatchAudit = mongoose.model<IMatchAudit>('MatchAudit', MatchAuditSchema);