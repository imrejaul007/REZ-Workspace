import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ISSOConfiguration,
  SSOProvider,
  SSOStatus,
  SSOProviderConfig,
} from '../types';

export interface SSOConfigurationDocument extends Omit<ISSOConfiguration, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const SSOConfigurationSchema = new Schema<SSOConfigurationDocument>(
  {
    configId: {
      type: String,
      required: true,
      unique: true,
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
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'pending_verification', 'error'],
      default: 'inactive',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    config: {
      type: Schema.Types.Mixed,
      required: true,
    },
    securitySettings: {
      enforceSSO: {
        type: Boolean,
        default: false,
      },
      allowPasswordLogin: {
        type: Boolean,
        default: true,
      },
      sessionTimeout: {
        type: Number,
        default: 480, // 8 hours
      },
      maxSessionDuration: {
        type: Number,
        default: 24, // 24 hours
      },
      requireMFA: {
        type: Boolean,
        default: false,
      },
      allowedDomains: [String],
      blockedDomains: [String],
    },
    syncSettings: {
      autoProvisionUsers: {
        type: Boolean,
        default: true,
      },
      autoUpdateUsers: {
        type: Boolean,
        default: true,
      },
      syncGroups: {
        type: Boolean,
        default: true,
      },
      syncFrequency: {
        type: Number,
        default: 24, // hours
      },
      lastSyncedAt: {
        type: Date,
      },
    },
    createdBy: {
      type: String,
      required: true,
    },
    lastVerifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'sso_configurations',
  }
);

// Compound indexes
SSOConfigurationSchema.index({ companyId: 1, provider: 1 });
SSOConfigurationSchema.index({ companyId: 1, isDefault: 1 });
SSOConfigurationSchema.index({ companyId: 1, status: 1 });

// Pre-save middleware
SSOConfigurationSchema.pre('save', async function (this: SSOConfigurationDocument) {
  // If this is the primary SSO config, ensure it's the only primary for this company/provider
  if (this.isPrimary) {
    await this.constructor.updateMany(
      {
        companyId: this.companyId,
        provider: this.provider,
        _id: { $ne: this._id },
      },
      { isPrimary: false }
    );
  }

  // If this is the default, ensure it's the only default for this company
  if (this.isDefault) {
    await this.constructor.updateMany(
      {
        companyId: this.companyId,
        _id: { $ne: this._id },
      },
      { isDefault: false }
    );
  }
});

// Static to find active config for company
SSOConfigurationSchema.statics.findActiveConfig = async function (
  companyId: string
): Promise<SSOConfigurationDocument | null> {
  return this.findOne({
    companyId,
    status: 'active',
    isDefault: true,
  });
};

// Static to find config by company and provider
SSOConfigurationSchema.statics.findByCompanyAndProvider = async function (
  companyId: string,
  provider: SSOProvider
): Promise<SSOConfigurationDocument | null> {
  return this.findOne({
    companyId,
    provider,
  });
};

// Static to find all configs for company
SSOConfigurationSchema.statics.findByCompany = async function (
  companyId: string
): Promise<SSOConfigurationDocument[]> {
  return this.find({ companyId }).sort({ createdAt: -1 });
};

export const SSOConfiguration: Model<SSOConfigurationDocument> = mongoose.model<SSOConfigurationDocument>(
  'SSOConfiguration',
  SSOConfigurationSchema
);
