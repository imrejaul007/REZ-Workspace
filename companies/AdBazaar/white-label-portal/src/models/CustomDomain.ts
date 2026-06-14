import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomDomain extends Document {
  portalId: string;
  domain: string;
  subdomain?: string;
  verification: {
    method: 'CNAME' | 'TXT' | 'A';
    token: string;
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  ssl: {
    enabled: boolean;
    certificateId?: string;
    issuedAt?: Date;
    expiresAt?: Date;
    autoRenew: boolean;
  };
  dns: {
    target: string;
    priority?: number;
    records: {
      type: string;
      name: string;
      value: string;
      ttl: number;
    }[];
  };
  status: 'pending' | 'verifying' | 'active' | 'expired' | 'failed';
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastCheckedAt?: Date;
    errorMessage?: string;
  };
}

const CustomDomainSchema = new Schema<ICustomDomain>(
  {
    portalId: { type: String, required: true, index: true },
    domain: { type: String, required: true, lowercase: true },
    subdomain: { type: String },
    verification: {
      method: {
        type: String,
        enum: ['CNAME', 'TXT', 'A'],
        default: 'CNAME',
      },
      token: { type: String, required: true },
      verifiedAt: { type: Date },
      verifiedBy: { type: String },
    },
    ssl: {
      enabled: { type: Boolean, default: false },
      certificateId: { type: String },
      issuedAt: { type: Date },
      expiresAt: { type: Date },
      autoRenew: { type: Boolean, default: true },
    },
    dns: {
      target: { type: String, required: true },
      priority: { type: Number },
      records: [
        {
          type: { type: String, required: true },
          name: { type: String, required: true },
          value: { type: String, required: true },
          ttl: { type: Number, default: 3600 },
        },
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'verifying', 'active', 'expired', 'failed'],
      default: 'pending',
    },
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      lastCheckedAt: { type: Date },
      errorMessage: { type: String },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CustomDomainSchema.index({ portalId: 1, domain: 1 }, { unique: true });
CustomDomainSchema.index({ domain: 1 }, { unique: true });
CustomDomainSchema.index({ status: 1 });

// Virtual for full domain
CustomDomainSchema.virtual('fullDomain').get(function () {
  if (this.subdomain) {
    return `${this.subdomain}.${this.domain}`;
  }
  return this.domain;
});

// Method to verify domain
CustomDomainSchema.methods.verify = async function (
  verifiedBy: string
): Promise<void> {
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = verifiedBy;
  this.status = 'active';
  this.ssl.enabled = true;
  this.ssl.issuedAt = new Date();
  // Certificate expires in 90 days
  this.ssl.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await this.save();
};

// Method to check SSL status
CustomDomainSchema.methods.checkSSL = async function (): Promise<boolean> {
  this.metadata.lastCheckedAt = new Date();
  if (this.ssl.expiresAt && this.ssl.expiresAt < new Date()) {
    this.status = 'expired';
    this.ssl.enabled = false;
    await this.save();
    return false;
  }
  return true;
};

export const CustomDomain = mongoose.model<ICustomDomain>(
  'CustomDomain',
  CustomDomainSchema
);
