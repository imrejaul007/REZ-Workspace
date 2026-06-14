import mongoose, { Document, Schema } from 'mongoose';

export type ObjectiveType = 'company' | 'department' | 'individual';
export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface IKeyResult extends Document {
  objectiveId: mongoose.Types.ObjectId;
  title: string;
  target: number;
  current: number;
  unit: string;
  weight: number;
  startValue: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IMilestone extends Document {
  keyResultId: mongoose.Types.ObjectId;
  title: string;
  deadline: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IObjective extends Document {
  title: string;
  description?: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  departmentName?: string;
  type: ObjectiveType;
  status: ObjectiveStatus;
  progress: number;
  keyResults: IKeyResult[];
  milestones: IMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

const KeyResultSchema = new Schema<IKeyResult>(
  {
    objectiveId: { type: Schema.Types.ObjectId, ref: 'Objective', required: true },
    title: { type: String, required: true },
    target: { type: Number, required: true, min: 0 },
    current: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true },
    weight: { type: Number, default: 1, min: 0.1, max: 10 },
    startValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['on_track', 'at_risk', 'behind', 'completed'],
      default: 'on_track'
    }
  },
  { timestamps: true }
);

const MilestoneSchema = new Schema<IMilestone>(
  {
    keyResultId: { type: Schema.Types.ObjectId, ref: 'KeyResult', required: true },
    title: { type: String, required: true },
    deadline: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

const ObjectiveSchema = new Schema<IObjective>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    quarter: { type: Number, required: true, min: 1, max: 4 },
    year: { type: Number, required: true, min: 2020 },
    ownerId: { type: String, required: true },
    ownerName: { type: String, trim: true },
    departmentId: { type: String },
    departmentName: { type: String, trim: true },
    type: {
      type: String,
      enum: ['company', 'department', 'individual'],
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft'
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    keyResults: [KeyResultSchema],
    milestones: [MilestoneSchema]
  },
  { timestamps: true }
);

// Indexes
ObjectiveSchema.index({ ownerId: 1, quarter: 1, year: 1 });
ObjectiveSchema.index({ departmentId: 1, quarter: 1, year: 1 });
ObjectiveSchema.index({ type: 1, status: 1 });
ObjectiveSchema.index({ quarter: 1, year: 1 });

// Pre-save: calculate overall progress
ObjectiveSchema.pre('save', function (next) {
  if (this.keyResults && this.keyResults.length > 0) {
    const totalWeight = this.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    let weightedProgress = 0;

    this.keyResults.forEach(kr => {
      const krProgress = kr.target > 0
        ? Math.min(100, ((kr.current - kr.startValue) / (kr.target - kr.startValue)) * 100)
        : 0;
      weightedProgress += (kr.weight / totalWeight) * krProgress;
    });

    this.progress = Math.round(weightedProgress);
  }
  next();
});

export const KeyResult = mongoose.model<IKeyResult>('KeyResult', KeyResultSchema);
export const Milestone = mongoose.model<IMilestone>('Milestone', MilestoneSchema);
export const Objective = mongoose.model<IObjective>('Objective', ObjectiveSchema);
