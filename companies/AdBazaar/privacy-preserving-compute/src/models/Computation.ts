import mongoose, { Schema, Document } from 'mongoose';
import { ComputationType, ComputationStatus, PrivacyParams } from '../types/index.js';

export interface IComputation extends Document {
  computationId: string;
  type: ComputationType;
  status: ComputationStatus;
  participants: string[];
  privacyParams: PrivacyParams;
  config: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  startedAt: Date | null;
}

const PrivacyParamsSchema = new Schema({
  epsilon: { type: Number, required: true },
  delta: { type: Number, default: 1e-5 },
  sensitivity: { type: Number, required: true },
  mechanism: { type: String, enum: ['laplace', 'gaussian', 'exponential'], default: 'laplace' },
}, { _id: false });

const ComputationSchema = new Schema<IComputation>(
  {
    computationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ComputationType),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ComputationStatus),
      default: ComputationStatus.PENDING,
    },
    participants: {
      type: [String],
      default: [],
    },
    privacyParams: {
      type: PrivacyParamsSchema,
      required: true,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'computations',
  }
);

// Indexes
ComputationSchema.index({ type: 1, status: 1 });
ComputationSchema.index({ createdAt: -1 });
ComputationSchema.index({ participants: 1 });

// Methods
ComputationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const Computation = mongoose.model<IComputation>('Computation', ComputationSchema);
export default Computation;