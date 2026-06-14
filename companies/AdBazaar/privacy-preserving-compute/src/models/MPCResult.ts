import mongoose, { Schema, Document } from 'mongoose';

export interface IMPCShare {
  partyId: string;
  shareValue: string;
  index: number;
}

export interface IMPCResult extends Document {
  computationId: string;
  shares: IMPCShare[];
  reconstructedValue: string | null;
  operation: string;
  threshold: number;
  totalParties: number;
  participatingParties: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

const MPCShareSchema = new Schema<IMPCShare>(
  {
    partyId: { type: String, required: true },
    shareValue: { type: String, required: true },
    index: { type: Number, required: true },
  },
  { _id: false }
);

const MPCResultSchema = new Schema<IMPCResult>(
  {
    computationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shares: {
      type: [MPCShareSchema],
      required: true,
    },
    reconstructedValue: {
      type: String,
      default: null,
    },
    operation: {
      type: String,
      required: true,
      enum: ['addition', 'multiplication', 'comparison', 'dot_product'],
    },
    threshold: {
      type: Number,
      required: true,
      default: 2,
    },
    totalParties: {
      type: Number,
      required: true,
    },
    participatingParties: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'mpc_results',
  }
);

// Indexes
MPCResultSchema.index({ createdAt: -1 });
MPCResultSchema.index({ operation: 1 });
MPCResultSchema.index({ threshold: 1 });

// Methods
MPCResultSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const MPCResult = mongoose.model<IMPCResult>('MPCResult', MPCResultSchema);
export default MPCResult;