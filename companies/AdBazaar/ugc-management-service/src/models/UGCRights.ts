import mongoose, { Document, Schema } from 'mongoose';

export interface IUGCRights extends Document {
  ugcId: mongoose.Types.ObjectId;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  rightsType: 'display' | 'repost' | 'commercial' | 'all';
  usageTerms?: string;
  expiresAt?: Date;
  respondedBy?: string;
  respondedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UGCRightsSchema = new Schema<IUGCRights>(
  {
    ugcId: {
      type: Schema.Types.ObjectId,
      ref: 'UGCContent',
      required: true,
      index: true
    },
    requestedBy: {
      type: String,
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'expired'],
      default: 'pending',
      index: true
    },
    rightsType: {
      type: String,
      enum: ['display', 'repost', 'commercial', 'all'],
      required: true
    },
    usageTerms: {
      type: String
    },
    expiresAt: Date,
    respondedBy: String,
    respondedAt: Date,
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes
UGCRightsSchema.index({ ugcId: 1, status: 1 });
UGCRightsSchema.index({ requestedBy: 1 });
UGCRightsSchema.index({ expiresAt: 1 });

export const UGCRights = mongoose.model<IUGCRights>('UGCRights', UGCRightsSchema);