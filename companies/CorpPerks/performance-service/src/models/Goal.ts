import mongoose, { Schema, Document } from 'mongoose';
import type { IGoal, IKeyResult, GoalStatus, GoalTimeframe } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface IGoalDocument extends Omit<IGoal, '_id'>, Document {}

const KeyResultSchema = new Schema<IKeyResult>(
  {
    id: {
      type: String,
      default: () => uuidv4(),
    },
    title: {
      type: String,
      required: [true, 'Key result title is required'],
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    metric: {
      type: String,
      maxlength: [200, 'Metric cannot exceed 200 characters'],
    },
    targetValue: {
      type: Number,
      min: [0, 'Target value cannot be negative'],
    },
    currentValue: {
      type: Number,
      min: [0, 'Current value cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      maxlength: [50, 'Unit cannot exceed 50 characters'],
    },
  },
  { _id: false }
);

const GoalSchema = new Schema<IGoalDocument>(
  {
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
      index: 'text',
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      index: true,
    },
    cycleId: {
      type: String,
      index: true,
    },
    managerId: {
      type: String,
      index: true,
    },
    keyResults: {
      type: [KeyResultSchema],
      default: [],
      validate: {
        validator: function (v: IKeyResult[]) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 key results',
      },
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
      default: 0,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    timeframe: {
      type: String,
      enum: {
        values: ['weekly', 'monthly', 'quarterly', 'annual', 'project'],
        message: 'Invalid timeframe: {VALUE}',
      },
      default: 'quarterly',
    },
    status: {
      type: String,
      enum: {
        values: ['not_started', 'in_progress', 'completed', 'cancelled'],
        message: 'Invalid status: {VALUE}',
      },
      default: 'not_started',
      index: true,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
      max: [100, 'Weight cannot exceed 100'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
GoalSchema.index({ employeeId: 1, status: 1 });
GoalSchema.index({ managerId: 1, status: 1 });
GoalSchema.index({ cycleId: 1, employeeId: 1 });
GoalSchema.index({ dueDate: 1, status: 1 });
GoalSchema.index({ title: 'text', description: 'text' });

// Pre-save: Update status based on progress
GoalSchema.pre('save', function (next) {
  if (this.isModified('progress')) {
    if (this.progress > 0 && this.progress < 100 && this.status === 'not_started') {
      this.status = 'in_progress';
    }
    if (this.progress >= 100 && this.status !== 'completed' && this.status !== 'cancelled') {
      this.status = 'completed';
    }
  }
  next();
});

// Auto-calculate progress from key results
GoalSchema.methods.calculateProgressFromKeyResults = function (): number {
  if (this.keyResults.length === 0) return this.progress;

  let totalProgress = 0;
  let validKeyResults = 0;

  for (const kr of this.keyResults) {
    if (kr.targetValue && kr.targetValue > 0) {
      const krProgress = Math.min(100, ((kr.currentValue || 0) / kr.targetValue) * 100);
      totalProgress += krProgress;
      validKeyResults++;
    }
  }

  if (validKeyResults === 0) return this.progress;
  return Math.round(totalProgress / validKeyResults);
};

// Update key result progress
GoalSchema.methods.updateKeyResult = function (
  keyResultId: string,
  currentValue: number,
  notes?: string
): boolean {
  const keyResult = this.keyResults.find((kr) => kr.id === keyResultId);
  if (!keyResult) return false;

  keyResult.currentValue = currentValue;
  this.progress = this.calculateProgressFromKeyResults();
  return true;
};

// Static methods
GoalSchema.statics.findByEmployee = function (employeeId: string, status?: GoalStatus) {
  const query: Record<string, unknown> = { employeeId };
  if (status) query.status = status;
  return this.find(query).sort({ dueDate: 1, createdAt: -1 });
};

GoalSchema.statics.findByManager = function (managerId: string, status?: GoalStatus) {
  const query: Record<string, unknown> = { managerId };
  if (status) query.status = status;
  return this.find(query).sort({ dueDate: 1, createdAt: -1 });
};

GoalSchema.statics.findByCycle = function (cycleId: string) {
  return this.find({ cycleId }).sort({ employeeId: 1, createdAt: -1 });
};

GoalSchema.statics.findOverdue = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $in: ['not_started', 'in_progress'] },
  }).sort({ dueDate: 1 });
};

GoalSchema.statics.findUpcoming = function (days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    dueDate: { $gte: new Date(), $lte: futureDate },
    status: { $in: ['not_started', 'in_progress'] },
  }).sort({ dueDate: 1 });
};

export const Goal = mongoose.model<IGoalDocument>('Goal', GoalSchema);
