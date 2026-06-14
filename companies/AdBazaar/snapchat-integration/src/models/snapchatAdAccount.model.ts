import mongoose, { Schema, Document } from 'mongoose';

export interface ISnapchatAdAccount {
  id: string;
  snapchatAccountId: string;
  organizationId: string;
  displayName: string;
  timezone: string;
  currency: string;
  connectedAt: Date;
  accessToken?: string;
  refreshToken?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISnapchatAdAccountDocument extends ISnapchatAdAccount, Document {
  _id: mongoose.Types.ObjectId;
}

const SnapchatAdAccountSchema = new Schema<ISnapchatAdAccountDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    snapchatAccountId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    timezone: { type: String, default: 'America/Los_Angeles' },
    currency: { type: String, default: 'USD' },
    connectedAt: { type: Date, default: Date.now },
    accessToken: { type: String },
    refreshToken: { type: String },
    status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'connected' },
    lastSyncAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'snapchat_ad_accounts',
  }
);

SnapchatAdAccountSchema.index({ organizationId: 1, status: 1 });

export const SnapchatAdAccount = mongoose.model<ISnapchatAdAccountDocument>(
  'SnapchatAdAccount',
  SnapchatAdAccountSchema
);
