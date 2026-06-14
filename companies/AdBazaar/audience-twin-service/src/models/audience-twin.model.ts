import mongoose, { Document, Schema } from 'mongoose';
import {
  AudienceTwin as IAudienceTwin,
  AudienceAttributes,
  BehavioralModel,
  SegmentAssignment,
  ChannelPreference,
} from '../types';

export interface AudienceTwinDocument extends Omit<IAudienceTwin, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const BrandAffinitiesSchema = new Schema(
  { String: Number },
  { _id: false, strict: false }
);

const AudienceAttributesSchema = new Schema<AudienceAttributes>(
  {
    interests: {
      type: [String],
      maxlength: 10,
      default: [],
    },
    intentLikelihood: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    channelPreference: {
      type: String,
      enum: ['whatsapp', 'email', 'push', 'sms'] as ChannelPreference[],
      required: true,
    },
    timingPreference: {
      type: String,
      default: '10:00-14:00',
    },
    lifetimeValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    brandAffinities: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  { _id: false }
);

const BehavioralModelSchema = new Schema<BehavioralModel>(
  {
    avgSessionDuration: {
      type: Number,
      min: 0,
      default: 0,
    },
    avgPurchaseFrequency: {
      type: Number,
      min: 0,
      default: 0,
    },
    avgOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    preferredCategories: {
      type: [String],
      default: [],
    },
    churnRisk: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
  },
  { _id: false }
);

const SegmentAssignmentSchema = new Schema<SegmentAssignment>(
  {
    segmentId: {
      type: String,
      required: true,
    },
    segmentName: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AudienceTwinSchema = new Schema<AudienceTwinDocument>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    size: {
      type: Number,
      min: 0,
      default: 0,
    },
    memberUserIds: {
      type: [String],
      default: [],
    },
    attributes: {
      type: AudienceAttributesSchema,
      required: true,
    },
    behavioralModel: {
      type: BehavioralModelSchema,
      required: true,
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },
    segments: {
      type: [SegmentAssignmentSchema],
      default: [],
    },
    criteria: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
AudienceTwinSchema.index({ category: 1, 'attributes.interests': 1 });
AudienceTwinSchema.index({ 'attributes.intentLikelihood': -1 });
AudienceTwinSchema.index({ qualityScore: -1 });
AudienceTwinSchema.index({ createdAt: -1 });

// Methods
AudienceTwinSchema.methods.toAudienceTwin = function (): IAudienceTwin {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    name: obj.name,
    description: obj.description,
    category: obj.category,
    size: obj.size,
    memberUserIds: obj.memberUserIds,
    attributes: {
      ...obj.attributes,
      brandAffinities: obj.attributes.brandAffinities instanceof Map
        ? Object.fromEntries(obj.attributes.brandAffinities)
        : obj.attributes.brandAffinities || {},
    },
    behavioralModel: obj.behavioralModel,
    qualityScore: obj.qualityScore,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

export const AudienceTwinModel = mongoose.model<AudienceTwinDocument>(
  'AudienceTwin',
  AudienceTwinSchema
);

export default AudienceTwinModel;