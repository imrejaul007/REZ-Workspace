import mongoose, { Schema, Document } from 'mongoose';

export interface IMFAUserDocument extends Document {
  userId: string;
  email: string;
  phone?: string;

  // TOTP Configuration
  totpSecret?: string;
  totpEnabled: boolean;
  totpEnabledAt?: Date;

  // MFA Status
  mfaEnabled: boolean;
  mfaEnabledAt?: Date;
  mfaDisabledAt?: Date;
  mfaDisabledBy?: string;
  mfaDisabledReason?: string;

  // Backup Codes
  backupCodes: Array<{
    codeHash: string;
    usedAt?: Date;
    createdAt: Date;
  }>;
  backupCodesGeneratedAt?: Date;

  // SMS Fallback
  smsEnabled: boolean;
  smsVerifiedAt?: Date;

  // Trusted Devices
  trustedDevices: Array<{
    deviceId: string;
    deviceName: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    userAgent: string;
    ipAddress: string;
    lastUsedAt: Date;
    createdAt: Date;
  }>;

  // Recovery
  recoveryEmail?: string;
  recoveryMethods: Array<{
    type: 'email' | 'sms' | 'admin';
    value: string;
    verified: boolean;
  }>;

  // Anomaly tracking
  failedAttempts: number;
  lastFailedAttemptAt?: Date;
  lockedUntil?: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

const TrustedDeviceSchema = new Schema({
  deviceId: { type: String, required: true },
  deviceName: { type: String, required: true },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'unknown'],
    default: 'unknown'
  },
  userAgent: { type: String, required: true },
  ipAddress: { type: String, required: true },
  lastUsedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const BackupCodeSchema = new Schema({
  codeHash: { type: String, required: true },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const RecoveryMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'admin'],
    required: true
  },
  value: { type: String, required: true },
  verified: { type: Boolean, default: false },
}, { _id: false });

const MFAUserSchema = new Schema<IMFAUserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      index: true,
    },

    // TOTP
    totpSecret: { type: String },
    totpEnabled: { type: Boolean, default: false },
    totpEnabledAt: { type: Date },

    // MFA Status
    mfaEnabled: { type: Boolean, default: false },
    mfaEnabledAt: { type: Date },
    mfaDisabledAt: { type: Date },
    mfaDisabledBy: { type: String },
    mfaDisabledReason: { type: String },

    // Backup Codes
    backupCodes: [BackupCodeSchema],
    backupCodesGeneratedAt: { type: Date },

    // SMS
    smsEnabled: { type: Boolean, default: false },
    smsVerifiedAt: { type: Date },

    // Trusted Devices
    trustedDevices: [TrustedDeviceSchema],

    // Recovery
    recoveryEmail: { type: String },
    recoveryMethods: [RecoveryMethodSchema],

    // Security
    failedAttempts: { type: Number, default: 0 },
    lastFailedAttemptAt: { type: Date },
    lockedUntil: { type: Date },
  },
  {
    timestamps: true,
    collection: 'mfa_users',
  }
);

// Indexes
MFAUserSchema.index({ email: 1 });
MFAUserSchema.index({ 'trustedDevices.deviceId': 1 });
MFAUserSchema.index({ mfaEnabled: 1 });
MFAUserSchema.index({ lockedUntil: 1 }, { expireAfterSeconds: 0 });

// Methods
MFAUserSchema.methods.isLocked = function (): boolean {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

MFAUserSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedAttempts += 1;
  this.lastFailedAttemptAt = new Date();

  // Lock account after too many failed attempts
  const maxAttempts = 10;
  if (this.failedAttempts >= maxAttempts) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  await this.save();
};

MFAUserSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedAttempts = 0;
  this.lastFailedAttemptAt = undefined;
  this.lockedUntil = undefined;
  await this.save();
};

MFAUserSchema.methods.addTrustedDevice = async function (
  deviceInfo: Omit<IMFAUserDocument['trustedDevices'][0], 'lastUsedAt' | 'createdAt'>
): Promise<void> {
  const existingIndex = this.trustedDevices.findIndex(
    d => d.deviceId === deviceInfo.deviceId
  );

  if (existingIndex >= 0) {
    this.trustedDevices[existingIndex].lastUsedAt = new Date();
  } else {
    // Limit trusted devices to 10
    if (this.trustedDevices.length >= 10) {
      this.trustedDevices.shift(); // Remove oldest
    }
    this.trustedDevices.push({
      ...deviceInfo,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    });
  }

  await this.save();
};

MFAUserSchema.methods.removeTrustedDevice = async function (deviceId: string): Promise<boolean> {
  const index = this.trustedDevices.findIndex(d => d.deviceId === deviceId);
  if (index === -1) return false;

  this.trustedDevices.splice(index, 1);
  await this.save();
  return true;
};

export const MFAUser = mongoose.model<IMFAUserDocument>('MFAUser', MFAUserSchema);
