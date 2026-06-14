import mongoose, { Document, Schema } from 'mongoose';

// ==================== INTERFACE ====================

export type DevicePlatform = 'ios' | 'android' | 'web';

export interface IExpoToken extends Document {
  tokenId: string;
  userId: string;
  companyId: string;
  expoPushToken: string;
  platform: DevicePlatform;
  deviceId?: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  isActive: boolean;
  lastUsedAt: Date;
  notificationCount: number;
  failedCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMA ====================

const ExpoTokenSchema = new Schema<IExpoToken>(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    expoPushToken: { type: String, required: true, unique: true, index: true },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    deviceId: { type: String },
    deviceName: { type: String },
    deviceModel: { type: String },
    osVersion: { type: String },
    appVersion: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: Date.now },
    notificationCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

ExpoTokenSchema.index({ userId: 1, isActive: 1 });
ExpoTokenSchema.index({ expoPushToken: 1 }, { unique: true });
ExpoTokenSchema.index({ companyId: 1, userId: 1 });
ExpoTokenSchema.index({ lastUsedAt: 1 });

// ==================== METHODS ====================

ExpoTokenSchema.methods.recordSuccess = async function (): Promise<void> {
  this.notificationCount += 1;
  this.lastUsedAt = new Date();
  this.failedCount = 0;
  await this.save();
};

ExpoTokenSchema.methods.recordFailure = async function (): Promise<void> {
  this.failedCount += 1;
  if (this.failedCount >= 10) {
    this.isActive = false;
  }
  await this.save();
};

ExpoTokenSchema.methods.deactivate = async function (): Promise<void> {
  this.isActive = false;
  await this.save();
};

// ==================== STATICS ====================

ExpoTokenSchema.statics.findByUserId = function (userId: string): Promise<IExpoToken[]> {
  return this.find({ userId, isActive: true }).exec();
};

ExpoTokenSchema.statics.findActiveByCompany = function (companyId: string): Promise<IExpoToken[]> {
  return this.find({ companyId, isActive: true }).exec();
};

ExpoTokenSchema.statics.findByToken = function (token: string): Promise<IExpoToken | null> {
  return this.findOne({ expoPushToken: token, isActive: true }).exec();
};

ExpoTokenSchema.statics.deactivateByToken = async function (token: string): Promise<boolean> {
  const result = await this.updateOne(
    { expoPushToken: token },
    { $set: { isActive: false } }
  );
  return result.modifiedCount > 0;
};

// ==================== MODEL ====================

export const ExpoToken = mongoose.model<IExpoToken>('ExpoToken', ExpoTokenSchema);
