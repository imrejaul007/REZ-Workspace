import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISSOUser, SSOProvider, SSOUserStatus } from '../types';

export interface SSOUserDocument extends Omit<ISSOUser, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const SSOUserSchema = new Schema<SSOUserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    externalId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'microsoft', 'saml', 'ldap', 'oidc'],
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    displayName: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    department: {
      type: String,
    },
    jobTitle: {
      type: String,
    },
    groups: {
      type: [String],
      default: [],
    },
    roles: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'suspended', 'pending', 'deprovisioned'],
      default: 'pending',
    },
    provisionedAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'sso_users',
  }
);

// Compound indexes
SSOUserSchema.index({ companyId: 1, status: 1 });
SSOUserSchema.index({ companyId: 1, provider: 1 });
SSOUserSchema.index({ companyId: 1, externalId: 1 });
SSOUserSchema.index({ email: 1, companyId: 1 }, { unique: true });

// Static to find by external ID
SSOUserSchema.statics.findByExternalId = async function (
  companyId: string,
  provider: SSOProvider,
  externalId: string
): Promise<SSOUserDocument | null> {
  return this.findOne({
    companyId,
    provider,
    externalId,
  });
};

// Static to find by email
SSOUserSchema.statics.findByEmail = async function (
  companyId: string,
  email: string
): Promise<SSOUserDocument | null> {
  return this.findOne({
    companyId,
    email: email.toLowerCase(),
  });
};

// Static to find users by group
SSOUserSchema.statics.findByGroup = async function (
  companyId: string,
  group: string
): Promise<SSOUserDocument[]> {
  return this.find({
    companyId,
    groups: group,
    status: 'active',
  });
};

// Static to sync users from provider
SSOUserSchema.statics.syncUsers = async function (
  companyId: string,
  provider: SSOProvider,
  users: Array<{
    externalId: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    jobTitle?: string;
    groups?: string[];
    roles?: string[];
  }>
): Promise<{ added: number; updated: number; deprovisioned: number }> {
  const stats = { added: 0, updated: 0, deprovisioned: 0 };
  const externalIds = users.map((u) => u.externalId);

  // Get existing users
  const existingUsers = await this.find({
    companyId,
    provider,
  });

  const existingMap = new Map(existingUsers.map((u) => [u.externalId, u]));

  // Process each user from provider
  for (const userData of users) {
    const existing = existingMap.get(userData.externalId);

    if (existing) {
      // Update existing user
      await this.updateOne(
        { _id: existing._id },
        {
          email: userData.email.toLowerCase(),
          displayName: userData.displayName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          department: userData.department,
          jobTitle: userData.jobTitle,
          groups: userData.groups || [],
          roles: userData.roles || [],
          status: 'active',
          metadata: { ...existing.metadata, lastSyncedAt: new Date() },
        }
      );
      stats.updated++;
    } else {
      // Create new user
      await this.create({
        userId: new mongoose.Types.ObjectId().toString(),
        externalId: userData.externalId,
        companyId,
        provider,
        email: userData.email.toLowerCase(),
        displayName: userData.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        jobTitle: userData.jobTitle,
        groups: userData.groups || [],
        roles: userData.roles || [],
        status: 'pending',
      });
      stats.added++;
    }
  }

  // Deprovision users no longer in provider
  const providerExternalIds = new Set(externalIds);
  const toDeprovision = existingUsers.filter(
    (u) => !providerExternalIds.has(u.externalId) && u.status !== 'deprovisioned'
  );

  for (const user of toDeprovision) {
    await this.updateOne(
      { _id: user._id },
      { status: 'deprovisioned' }
    );
    stats.deprovisioned++;
  }

  return stats;
};

export const SSOUser: Model<SSOUserDocument> = mongoose.model<SSOUserDocument>(
  'SSOUser',
  SSOUserSchema
);
