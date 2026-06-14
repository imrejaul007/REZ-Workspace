/**
 * Dunning Sequence Model
 *
 * Tracks the progress of dunning for specific suppliers/POs.
 * Each sequence contains steps that are executed according to the dunning config rules.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Subdocument Schemas ──────────────────────────────────────────────────────

/**
 * Dunning Step - represents a single communication in the dunning sequence
 */
export interface IDunningStep {
  stepNumber: number;
  scheduledAt: Date;
  executedAt?: Date;
  channel: 'whatsapp' | 'sms' | 'email';
  template: string;
  status: 'scheduled' | 'pending_approval' | 'approved' | 'sent' | 'failed' | 'skipped' | 'cancelled';
  messageId?: string;
  response?: Record<string, unknown>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;
}

const DunningStepSchema = new Schema<IDunningStep>(
  {
    stepNumber: { type: Number, required: true, min: 1 },
    scheduledAt: { type: Date, required: true },
    executedAt: { type: Date },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'email'],
      required: true,
    },
    template: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'pending_approval', 'approved', 'sent', 'failed', 'skipped', 'cancelled'],
      default: 'scheduled',
    },
    messageId: { type: String },
    response: { type: Schema.Types.Mixed },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    approvalNotes: { type: String },
  },
  { _id: true }
);

/**
 * Payment Event - tracks payments received during dunning
 */
export interface IPaymentEvent {
  eventType: 'partial' | 'full';
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paidAt: Date;
  reference?: string;
  notes?: string;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    eventType: {
      type: String,
      enum: ['partial', 'full'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

// ── Main Dunning Sequence Schema ──────────────────────────────────────────────

export type DunningSequenceStatus = 'active' | 'paused' | 'completed' | 'cancelled' | 'bad_debt';

export interface IDunningSequence extends Document {
  // Identification
  sequenceNumber: string; // Auto-generated: DUN-YYYYMMDD-XXXX

  // Relationships
  merchantId: Types.ObjectId;
  supplierId: Types.ObjectId;
  supplierName?: string;
  poId?: Types.ObjectId; // Specific PO or null for all supplier POs
  poNumbers?: string[]; // Array of PO numbers in this sequence
  configId: Types.ObjectId;

  // Status
  status: DunningSequenceStatus;
  currentStep: number;
  steps: IDunningStep[];

  // Pause/Resume tracking
  pausedReason?: string;
  pausedAt?: Date;
  resumedAt?: Date;

  // Completion
  completedAt?: Date;
  completionReason?: string;

  // Financial tracking
  totalOverdueAmount: number;
  currentOverdueAmount: number;
  paymentEvents: IPaymentEvent[];

  // Escalation
  escalationLevel: number;
  lastEscalationAt?: Date;

  // Audit
  initiatedBy?: Types.ObjectId;
  initiatedByEmail?: string;
  lastActionBy?: Types.ObjectId;
  lastActionByEmail?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const DunningSequenceSchema = new Schema<IDunningSequence>(
  {
    sequenceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierName: { type: String },
    poId: {
      type: Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      sparse: true,
    },
    poNumbers: [{ type: String }],
    configId: {
      type: Schema.Types.ObjectId,
      ref: 'DunningConfig',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled', 'bad_debt'],
      default: 'active',
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
    },
    steps: {
      type: [DunningStepSchema],
      default: [],
    },
    pausedReason: { type: String },
    pausedAt: { type: Date },
    resumedAt: { type: Date },
    completedAt: { type: Date },
    completionReason: { type: String },
    totalOverdueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentOverdueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentEvents: {
      type: [PaymentEventSchema],
      default: [],
    },
    escalationLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastEscalationAt: { type: Date },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    initiatedByEmail: { type: String },
    lastActionBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    lastActionByEmail: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: 'dunningsequences',
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────

DunningSequenceSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
DunningSequenceSchema.index({ merchantId: 1, supplierId: 1, status: 1 });
DunningSequenceSchema.index({ merchantId: 1, poId: 1 });
DunningSequenceSchema.index({ status: 1, 'steps.scheduledAt': 1 });
DunningSequenceSchema.index({ status: 1, 'steps.status': 1 });
DunningSequenceSchema.index({ sequenceNumber: 1 }, { unique: true });

// Compound index for sequence lookups
DunningSequenceSchema.index({ supplierId: 1, poId: 1, status: 1 });

// Index for escalation job
DunningSequenceSchema.index({ status: 1, escalationLevel: 1, lastEscalationAt: 1 });

// ── Pre-save Hooks ──────────────────────────────────────────────────────────

/**
 * Generate sequence number before saving
 */
DunningSequenceSchema.pre('save', async function (next) {
  if (!this.sequenceNumber) {
    const count = await DunningSequence.countDocuments({ merchantId: this.merchantId });
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    this.sequenceNumber = `DUN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ── Instance Methods ──────────────────────────────────────────────────────────

/**
 * Get current step
 */
DunningSequenceSchema.methods.getCurrentStep = function (): IDunningStep | undefined {
  return this.steps.find((step) => step.stepNumber === this.currentStep);
};

/**
 * Get next pending step
 */
DunningSequenceSchema.methods.getNextPendingStep = function (): IDunningStep | undefined {
  return this.steps
    .filter((step) => step.status === 'scheduled' || step.status === 'pending_approval')
    .sort((a, b) => a.stepNumber - b.stepNumber)[0];
};

/**
 * Get completed steps count
 */
DunningSequenceSchema.methods.getCompletedStepsCount = function (): number {
  return this.steps.filter((step) => step.status === 'sent' || step.status === 'skipped').length;
};

/**
 * Check if sequence can be resumed
 */
DunningSequenceSchema.methods.canResume = function (): boolean {
  return this.status === 'paused';
};

/**
 * Check if sequence can be paused
 */
DunningSequenceSchema.methods.canPause = function (): boolean {
  return this.status === 'active';
};

/**
 * Check if payment received (full or partial)
 */
DunningSequenceSchema.methods.hasPayment = function (): boolean {
  return this.paymentEvents.length > 0;
};

/**
 * Get total paid amount
 */
DunningSequenceSchema.methods.getTotalPaidAmount = function (): number {
  return this.paymentEvents.reduce((sum, event) => sum + event.paidAmount, 0);
};

/**
 * Check if fully paid
 */
DunningSequenceSchema.methods.isFullyPaid = function (): boolean {
  return this.currentOverdueAmount <= 0;
};

/**
 * Advance to next step
 */
DunningSequenceSchema.methods.advanceToNextStep = function (): boolean {
  const nextStep = this.getNextPendingStep();
  if (nextStep) {
    this.currentStep = nextStep.stepNumber;
    return true;
  }
  return false;
};

// ── Static Methods ───────────────────────────────────────────────────────────

/**
 * Get active sequences for a merchant
 */
DunningSequenceSchema.statics.getActiveSequences = async function (
  merchantId: Types.ObjectId
): Promise<IDunningSequence[]> {
  return this.find({ merchantId, status: 'active' })
    .populate('supplierId')
    .populate('configId')
    .sort({ createdAt: -1 });
};

/**
 * Get sequences due for step execution
 */
DunningSequenceSchema.statics.getDueSequences = async function (): Promise<IDunningSequence[]> {
  const now = new Date();
  return this.find({
    status: 'active',
    'steps.status': 'scheduled',
    'steps.scheduledAt': { $lte: now },
  })
    .populate('merchantId')
    .populate('supplierId')
    .populate('configId');
};

/**
 * Get overdue sequences that need escalation
 */
DunningSequenceSchema.statics.getOverdueSequences = async function (): Promise<IDunningSequence[]> {
  return this.find({
    status: 'active',
    'steps.status': 'failed',
  })
    .populate('merchantId')
    .populate('supplierId');
};

/**
 * Get sequences for a specific supplier
 */
DunningSequenceSchema.statics.getBySupplier = async function (
  merchantId: Types.ObjectId,
  supplierId: Types.ObjectId
): Promise<IDunningSequence[]> {
  return this.find({ merchantId, supplierId }).sort({ createdAt: -1 });
};

/**
 * Get dunning summary by status
 */
DunningSequenceSchema.statics.getStatusSummary = async function (
  merchantId: Types.ObjectId
): Promise<Record<string, number>> {
  const result = await this.aggregate([
    { $match: { merchantId: new Types.ObjectId(merchantId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  return result.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Get sequences needing cleanup (completed/cancelled older than N days)
 */
DunningSequenceSchema.statics.getSequencesForCleanup = async function (
  daysOld: number = 90
): Promise<IDunningSequence[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  return this.find({
    status: { $in: ['completed', 'cancelled'] },
    updatedAt: { $lt: cutoffDate },
  });
};

// ── Model Export ─────────────────────────────────────────────────────────────

export const DunningSequence =
  mongoose.models.DunningSequence || mongoose.model<IDunningSequence>('DunningSequence', DunningSequenceSchema);
