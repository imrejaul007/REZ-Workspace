import mongoose, { Document, Schema } from 'mongoose';

export interface IExpiration extends Document {
  expirationId: string;
  memberId: string;
  userId: string;
  companyId: string;
  pointsId: string;
  pointsAmount: number;
  earnedDate: Date;
  expirationDate: Date;
  daysUntilExpiration: number;
  status: 'pending' | 'expiring_soon' | 'expired' | 'used' | 'forgiven';
  notificationSent: boolean;
  notificationCount: number;
  lastNotificationDate?: Date;
  expiredAt?: Date;
  forgivenBy?: string;
  forgivenReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpirationSchema = new Schema<IExpiration>(
  {
    expirationId: { type: String, required: true, unique: true, index: true },
    memberId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    pointsId: { type: String, required: true },
    pointsAmount: { type: Number, required: true },
    earnedDate: { type: Date, required: true },
    expirationDate: { type: Date, required: true },
    daysUntilExpiration: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'expiring_soon', 'expired', 'used', 'forgiven'], default: 'pending' },
    notificationSent: { type: Boolean, default: false },
    notificationCount: { type: Number, default: 0 },
    lastNotificationDate: { type: Date },
    expiredAt: { type: Date },
    forgivenBy: { type: String },
    forgivenReason: { type: String }
  },
  { timestamps: true }
);

ExpirationSchema.index({ memberId: 1, status: 1 });
ExpirationSchema.index({ expirationDate: 1, status: 1 });
ExpirationSchema.index({ companyId: 1, status: 1 });

export const Expiration = mongoose.model<IExpiration>('Expiration', ExpirationSchema);