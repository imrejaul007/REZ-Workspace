import mongoose, { Schema, Document } from 'mongoose';
import {
  EscrowStatus,
  EscrowCondition,
  EscrowMilestone,
  EscrowDispute,
  TransactionFee,
  AuditLog,
  EscrowDocument
} from '../types';

export interface IEscrow extends Document {
  // Unique identifiers
  escrowId: string;

  // Parties
  buyerId: string;
  sellerId: string;
  arbiterId?: string;

  // Amount and currency
  amount: number;
  currency: string;

  // Description and conditions
  description: string;
  conditions: EscrowCondition[];

  // Milestones for partial releases
  milestones: EscrowMilestone[];

  // Status
  status: EscrowStatus;

  // Dispute handling
  dispute?: EscrowDispute;

  // Fees
  feeConfig: TransactionFee;
  platformFee: number;

  // Documents
  documents: EscrowDocument[];

  // Expiration
  expiresAt?: Date;
  autoReleaseAt?: Date;

  // Audit trail
  auditLog: AuditLog[];

  // Metadata for flexibility
  metadata: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  fundedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  cancelledAt?: Date;
}

const EscrowConditionSchema = new Schema<EscrowCondition>(
  {
    type: {
      type: String,
      enum: ['delivery', 'approval', 'milestone', 'custom'],
      required: true
    },
    description: { type: String, required: true },
    completedAt: { type: Date },
    completedBy: { type: String }
  },
  { _id: false }
);

const EscrowMilestoneSchema = new Schema<EscrowMilestone>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  { _id: false }
);

const EscrowDisputeSchema = new Schema<EscrowDispute>(
  {
    reason: { type: String, required: true },
    filedBy: { type: String, required: true },
    filedAt: { type: Date, required: true, default: Date.now },
    resolvedAt: { type: Date },
    resolution: {
      type: String,
      enum: ['release_to_seller', 'refund_to_buyer', 'split', null]
    }
  },
  { _id: false }
);

const TransactionFeeSchema = new Schema<TransactionFee>(
  {
    percentage: { type: Number, required: true, default: 2.5 },
    fixed: { type: Number, required: true, default: 0 },
    chargedTo: {
      type: String,
      enum: ['buyer', 'seller', 'split'],
      default: 'split'
    }
  },
  { _id: false }
);

const AuditLogSchema = new Schema<AuditLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedAt: { type: Date, required: true, default: Date.now },
    details: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const EscrowDocumentSchema = new Schema<EscrowDocument>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: String },
    verifiedAt: { type: Date }
  },
  { _id: false }
);

const EscrowSchema = new Schema<IEscrow>(
  {
    escrowId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    buyerId: {
      type: String,
      required: true,
      index: true
    },
    sellerId: {
      type: String,
      required: true,
      index: true
    },
    arbiterId: {
      type: String,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true
    },
    description: {
      type: String,
      required: true
    },
    conditions: [EscrowConditionSchema],
    milestones: [EscrowMilestoneSchema],
    status: {
      type: String,
      enum: ['pending', 'funded', 'released', 'refunded', 'disputed', 'cancelled'],
      default: 'pending',
      index: true
    },
    dispute: EscrowDisputeSchema,
    feeConfig: {
      type: TransactionFeeSchema,
      default: () => ({
        percentage: 2.5,
        fixed: 0,
        chargedTo: 'split'
      })
    },
    platformFee: {
      type: Number,
      default: 0
    },
    documents: [EscrowDocumentSchema],
    expiresAt: {
      type: Date,
      index: true
    },
    autoReleaseAt: Date,
    auditLog: [AuditLogSchema],
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    fundedAt: Date,
    releasedAt: Date,
    refundedAt: Date,
    cancelledAt: Date
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
EscrowSchema.index({ createdAt: -1 });
EscrowSchema.index({ buyerId: 1, status: 1 });
EscrowSchema.index({ sellerId: 1, status: 1 });
EscrowSchema.index({ expiresAt: 1 }, { sparse: true });

// Virtual for calculating total amount with fees
EscrowSchema.virtual('totalAmount').get(function() {
  const feeAmount = (this.amount * this.feeConfig.percentage / 100) + this.feeConfig.fixed;
  if (this.feeConfig.chargedTo === 'buyer' || this.feeConfig.chargedTo === 'split') {
    return this.amount + (this.feeConfig.chargedTo === 'split' ? feeAmount / 2 : feeAmount);
  }
  return this.amount;
});

// Virtual for checking if all conditions are met
EscrowSchema.virtual('allConditionsMet').get(function() {
  return this.conditions.every(c => c.completedAt);
});

// Method to add audit log entry
EscrowSchema.methods.addAuditEntry = function(
  action: string,
  performedBy: string,
  details?: Record<string, unknown>
) {
  this.auditLog.push({
    action,
    performedBy,
    performedAt: new Date(),
    details
  });
};

// Static method to find escrows by user
EscrowSchema.statics.findByUser = function(userId: string) {
  return this.find({
    $or: [{ buyerId: userId }, { sellerId: userId }]
  }).sort({ createdAt: -1 });
};

// Static method to find pending escrows for auto-processing
EscrowSchema.statics.findPendingForAutoRelease = function() {
  return this.find({
    status: 'funded',
    autoReleaseAt: { $lte: new Date() }
  });
};

export const Escrow = mongoose.model<IEscrow>('Escrow', EscrowSchema);
export default Escrow;
