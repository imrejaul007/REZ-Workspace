import mongoose, { Schema, Document } from 'mongoose';

export interface IFederatedRound {
  roundNumber: number;
  participants: string[];
  gradients: Record<string, number[]>;
  aggregatedGradient: number[] | null;
  timestamp: Date;
}

export interface IFederatedResult extends Document {
  computationId: string;
  rounds: IFederatedRound[];
  finalModel: number[] | null;
  aggregationMethod: string;
  privacyMechanism: string;
  totalRounds: number;
  completedRounds: number;
  droppedParticipants: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

const FederatedRoundSchema = new Schema<IFederatedRound>(
  {
    roundNumber: { type: Number, required: true },
    participants: { type: [String], required: true },
    gradients: { type: Map, of: [Number], required: true },
    aggregatedGradient: { type: [Number], default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FederatedResultSchema = new Schema<IFederatedResult>(
  {
    computationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rounds: {
      type: [FederatedRoundSchema],
      default: [],
    },
    finalModel: {
      type: [Number],
      default: null,
    },
    aggregationMethod: {
      type: String,
      enum: ['fedavg', 'fedmed', 'fedopt'],
      default: 'fedavg',
    },
    privacyMechanism: {
      type: String,
      default: 'none',
    },
    totalRounds: {
      type: Number,
      default: 0,
    },
    completedRounds: {
      type: Number,
      default: 0,
    },
    droppedParticipants: {
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
    collection: 'federated_results',
  }
);

// Indexes
FederatedResultSchema.index({ createdAt: -1 });
FederatedResultSchema.index({ aggregationMethod: 1 });

// Methods
FederatedResultSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const FederatedResult = mongoose.model<IFederatedResult>('FederatedResult', FederatedResultSchema);
export default FederatedResult;