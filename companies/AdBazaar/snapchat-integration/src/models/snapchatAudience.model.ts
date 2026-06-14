import mongoose, { Schema, Document } from 'mongoose';

export type AudienceSource = 'CUSTOMER_LIST' | 'WEB_PIXEL' | 'APP_PIXEL' | 'ENGAGEMENT';
export type AudienceStatus = 'CREATING' | 'READY' | 'EXPIRED';

export interface ISnapchatAudience {
  id: string;
  adAccountId: string;
  name: string;
  description: string;
  size: number;
  source: AudienceSource;
  status: AudienceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISnapchatAudienceDocument extends ISnapchatAudience, Document {
  _id: mongoose.Types.ObjectId;
}

const SnapchatAudienceSchema = new Schema<ISnapchatAudienceDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    adAccountId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    size: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['CUSTOMER_LIST', 'WEB_PIXEL', 'APP_PIXEL', 'ENGAGEMENT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['CREATING', 'READY', 'EXPIRED'],
      default: 'CREATING',
    },
  },
  {
    timestamps: true,
    collection: 'snapchat_audiences',
  }
);

SnapchatAudienceSchema.index({ adAccountId: 1, status: 1 });

export const SnapchatAudience = mongoose.model<ISnapchatAudienceDocument>(
  'SnapchatAudience',
  SnapchatAudienceSchema
);
