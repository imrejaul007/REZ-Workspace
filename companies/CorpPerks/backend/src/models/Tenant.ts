import mongoose, { Schema } from 'mongoose';
import { ITenant, ITenantSettings } from '../types/index.js';

const tenantSettingsSchema = new Schema<ITenantSettings>({
  timezone: { type: String, default: 'Asia/Kolkata' },
  currency: { type: String, default: 'INR' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  weekStartsOn: { type: Number, enum: [0, 1], default: 1 },
  allowSelfRegistration: { type: Boolean, default: true },
});

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    domain: { type: String },
    logo: { type: String },
    settings: { type: tenantSettingsSchema, default: () => ({}) },
    status: { type: String, enum: ['active', 'suspended', 'trial'], default: 'trial' },
    trialEndsAt: { type: Date },
  },
  { timestamps: true }
);

tenantSchema.index({ slug: 1 });
tenantSchema.index({ domain: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
