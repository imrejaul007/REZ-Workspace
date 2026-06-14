import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICareCircleMember {
  userId: string;
  name: string;
  relationship: 'parent' | 'child' | 'spouse' | 'sibling' | 'caregiver' | 'other';
  notifyOnHealth: boolean;
  notifyOnEmergency: boolean;
  accessLevel: 'view' | 'manage';
}

export interface IEngagementRecord extends Document {
  id: string;
  profileId: string;
  campaignId?: string;
  reminderId?: string;
  channel: string;
  action: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'ignored';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ICareCircle extends Document {
  id: string;
  profileId: string;
  members: ICareCircleMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IFamilyEngagement extends Document {
  id: string;
  familyId: string;
  patientId: string;
  engagementScore: number;
  totalMessages: number;
  acknowledgedMessages: number;
  lastActivityAt: Date;
  memberScores: Record<string, number>; // memberId -> score
  updatedAt: Date;
}

// Engagement Record Schema
const EngagementRecordSchema = new Schema<IEngagementRecord>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `ENG-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    profileId: { type: String, required: true, index: true },
    campaignId: { type: String, index: true },
    reminderId: { type: String, index: true },
    channel: { type: String, required: true },
    action: {
      type: String,
      enum: ['sent', 'delivered', 'opened', 'clicked', 'converted', 'ignored'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: false,
  }
);

EngagementRecordSchema.index({ profileId: 1, timestamp: -1 });
EngagementRecordSchema.index({ campaignId: 1, action: 1 });
EngagementRecordSchema.index({ profileId: 1, action: 1 });

// Care Circle Member Schema
const CareCircleMemberSchema = new Schema<ICareCircleMember>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    relationship: {
      type: String,
      enum: ['parent', 'child', 'spouse', 'sibling', 'caregiver', 'other'],
      required: true,
    },
    notifyOnHealth: { type: Boolean, default: true },
    notifyOnEmergency: { type: Boolean, default: true },
    accessLevel: { type: String, enum: ['view', 'manage'], default: 'view' },
  },
  { _id: false }
);

// Care Circle Schema
const CareCircleSchema = new Schema<ICareCircle>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `CC-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    profileId: { type: String, required: true, unique: true, index: true },
    members: [CareCircleMemberSchema],
  },
  {
    timestamps: true,
  }
);

// Family Engagement Schema
const FamilyEngagementSchema = new Schema<IFamilyEngagement>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => `FE-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    familyId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
    totalMessages: { type: Number, default: 0 },
    acknowledgedMessages: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    memberScores: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

FamilyEngagementSchema.index({ familyId: 1, patientId: 1 }, { unique: true });
FamilyEngagementSchema.index({ engagementScore: -1 });

export const EngagementRecord = mongoose.model<IEngagementRecord>('EngagementRecord', EngagementRecordSchema);
export const CareCircle = mongoose.model<ICareCircle>('CareCircle', CareCircleSchema);
export const FamilyEngagement = mongoose.model<IFamilyEngagement>('FamilyEngagement', FamilyEngagementSchema);
