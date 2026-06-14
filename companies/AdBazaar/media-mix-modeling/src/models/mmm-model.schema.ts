import mongoose, { Document, Schema } from 'mongoose';
import { ChannelType, AttributionModel, ModelStatus } from '../types';

export interface IControlVariable {
  name: string;
  value: number;
}

export interface IMMMModel {
  name: string;
  advertiserId: string;
  channels: Schema.Types.ObjectId[];
  dateRange: {
    start: Date;
    end: Date;
  };
  targetMetric: 'conversions' | 'revenue' | 'leads' | 'engagement';
  attributionModel: AttributionModel;
  controlVariables?: IControlVariable[];
  status: ModelStatus;
  lastTrainedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMMMModelDocument extends IMMMModel, Document {}

const MMMModelSchema = new Schema<IMMMModelDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    advertiserId: {
      type: String,
      required: true,
      index: true
    },
    channels: [{
      type: Schema.Types.ObjectId,
      ref: 'Channel'
    }],
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    targetMetric: {
      type: String,
      enum: ['conversions', 'revenue', 'leads', 'engagement'],
      default: 'conversions'
    },
    attributionModel: {
      type: String,
      enum: ['FIRST_TOUCH', 'LAST_TOUCH', 'LINEAR', 'TIME_DECAY', 'POSITION_BASED', 'DATA_DRIVEN'],
      default: 'DATA_DRIVEN'
    },
    controlVariables: [{
      name: String,
      value: Number
    }],
    status: {
      type: String,
      enum: ['DRAFT', 'TRAINING', 'TRAINED', 'FAILED', 'ARCHIVED'],
      default: 'DRAFT'
    },
    lastTrainedAt: Date
  },
  {
    timestamps: true
  }
);

// Indexes
MMMModelSchema.index({ advertiserId: 1, status: 1 });
MMMModelSchema.index({ status: 1 });
MMMModelSchema.index({ createdAt: -1 });

export const MMMModel = mongoose.model<IMMMModelDocument>('MMMModel', MMMModelSchema);