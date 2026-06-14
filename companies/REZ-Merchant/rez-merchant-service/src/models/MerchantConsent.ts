/**
 * MerchantConsent — GDPR-compliant consent management for merchants
 *
 * Purpose:
 * - Implements Article 7 (Conditions for consent) of GDPR
 * - Tracks merchant consent decisions for marketing, analytics, data sharing
 * - Append-only ledger pattern preserves audit trail
 *
 * Consent Categories:
 * - marketing: Email/SMS/WhatsApp marketing communications
 * - analytics: Product usage analytics beyond basic security
 * - personalization: Personalized recommendations and experiences
 * - third_party: Data sharing with third-party partners
 *
 * Legal Bases (GDPR Article 6):
 * - consent: Explicit opt-in consent
 * - contract: Necessary for contract performance
 * - legitimate_interest: Security, fraud prevention
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// Consent categories specific to merchants
export const MERCHANT_CONSENT_CATEGORIES = [
  'marketing_email',
  'marketing_sms',
  'marketing_whatsapp',
  'analytics_usage',
  'analytics_performance',
  'personalization_ai',
  'third_party_integrations',
  'data_export_api',
] as const;

export type MerchantConsentCategory = (typeof MERCHANT_CONSENT_CATEGORIES)[number];

export const CONSENT_STATUSES = ['granted', 'withdrawn'] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const CONSENT_SOURCES = [
  'onboarding',
  'settings',
  'api',
  'admin_action',
  'consent_banner',
] as const;
export type ConsentSource = (typeof CONSENT_SOURCES)[number];

export interface IMerchantConsent extends Document {
  merchantId: Types.ObjectId;
  category: MerchantConsentCategory;
  status: ConsentStatus;
  source: ConsentSource;
  legalBasis: 'consent' | 'contract' | 'legitimate_interest';
  ipAddress?: string;
  userAgent?: string;
  note?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMerchantConsentModel extends Model<IMerchantConsent> {
  getCurrentConsent(
    merchantId: Types.ObjectId | string,
    category: MerchantConsentCategory,
  ): Promise<IMerchantConsent | null>;
  hasActiveConsent(
    merchantId: Types.ObjectId | string,
    category: MerchantConsentCategory,
  ): Promise<boolean>;
  recordConsent(params: {
    merchantId: Types.ObjectId | string;
    category: MerchantConsentCategory;
    status: ConsentStatus;
    source: ConsentSource;
    ipAddress?: string;
    userAgent?: string;
    note?: string;
    expiresAt?: Date;
  }): Promise<IMerchantConsent>;
  getAllConsents(merchantId: Types.ObjectId | string): Promise<IMerchantConsent[]>;
}

const MerchantConsentSchema = new Schema<IMerchantConsent, IMerchantConsentModel>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    category: {
      type: String,
      enum: MERCHANT_CONSENT_CATEGORIES as unknown as string[],
      required: true,
    },
    status: {
      type: String,
      enum: CONSENT_STATUSES as unknown as string[],
      required: true,
    },
    source: {
      type: String,
      enum: CONSENT_SOURCES as unknown as string[],
      required: true,
      default: 'settings',
    },
    legalBasis: {
      type: String,
      enum: ['consent', 'contract', 'legitimate_interest'],
      default: 'consent',
    },
    ipAddress: { type: String, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 500 },
    note: { type: String, trim: true, maxlength: 500 },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes for efficient queries
MerchantConsentSchema.index({ merchantId: 1, category: 1, createdAt: -1 });
MerchantConsentSchema.index({ merchantId: 1, status: 1 });

// GDPR Data Retention: TTL index to auto-delete expired consent records after 7 years
// Consent records must be kept for audit purposes under GDPR Article 7
// Note: 7 years is typical for accounting/legal compliance
MerchantConsentSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 },
);

// Static methods
MerchantConsentSchema.statics.getCurrentConsent = async function (
  merchantId: Types.ObjectId | string,
  category: MerchantConsentCategory,
): Promise<unknown | null> {
  return this.findOne({ merchantId, category })
    .sort({ createdAt: -1 })
    .lean();
};

MerchantConsentSchema.statics.hasActiveConsent = async function (
  merchantId: Types.ObjectId | string,
  category: MerchantConsentCategory,
): Promise<boolean> {
  const consent = await this.findOne({
    merchantId,
    category,
    status: 'granted',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .select('status')
    .lean();

  return !!consent;
};

MerchantConsentSchema.statics.recordConsent = async function (params: {
  merchantId: Types.ObjectId | string;
  category: MerchantConsentCategory;
  status: ConsentStatus;
  source: ConsentSource;
  ipAddress?: string;
  userAgent?: string;
  note?: string;
  expiresAt?: Date;
}): Promise<IMerchantConsent> {
  return this.create({
    merchantId: params.merchantId,
    category: params.category,
    status: params.status,
    source: params.source,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    note: params.note,
    expiresAt: params.expiresAt,
  });
};

MerchantConsentSchema.statics.getAllConsents = async function (
  merchantId: Types.ObjectId | string,
): Promise<IMerchantConsent[]> {
  // Get latest consent per category
  const consents = await this.aggregate([
    { $match: { merchantId: new Types.ObjectId(merchantId as string) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$category',
        latestConsent: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$latestConsent' } },
  ]);

  return consents;
};

export const MerchantConsent =
  (mongoose.models.MerchantConsent as IMerchantConsentModel) ||
  mongoose.model<IMerchantConsent, IMerchantConsentModel>('MerchantConsent', MerchantConsentSchema);

export default MerchantConsent;
