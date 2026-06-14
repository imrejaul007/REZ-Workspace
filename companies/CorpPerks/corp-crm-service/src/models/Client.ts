import mongoose, { Schema, Document, Model } from 'mongoose';
import { IClient, Contact } from '../types/index.js';

export interface ClientDocument extends Omit<IClient, '_id'>, Document {}

const contactSchema = new Schema<Contact>(
  {
    contactId: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    designation: { type: String },
    department: { type: String },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const clientSchema = new Schema<ClientDocument>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
    },
    website: { type: String },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    address: { type: addressSchema, default: {} },
    contacts: [contactSchema],
    status: {
      type: String,
      enum: ['prospect', 'active', 'inactive', 'churned'],
      default: 'prospect',
      index: true,
    },
    source: {
      type: String,
      enum: ['referral', 'website', 'linkedin', 'cold_call', 'event', 'other'],
      default: 'other',
    },
    assignedTo: {
      type: String,
      required: true,
      index: true,
    },
    dealValue: {
      type: Number,
      default: 0,
    },
    notes: { type: String },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
clientSchema.index({ tenantId: 1, status: 1 });
clientSchema.index({ tenantId: 1, industry: 1 });
clientSchema.index({ tenantId: 1, assignedTo: 1 });
clientSchema.index({ tenantId: 1, companyName: 'text', email: 'text' });

// Generate client ID before saving
clientSchema.pre('save', async function (next) {
  if (this.isNew && !this.clientId) {
    const count = await mongoose.model('Client').countDocuments({ tenantId: this.tenantId });
    this.clientId = `CLIENT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const Client: Model<ClientDocument> = mongoose.model<ClientDocument>('Client', clientSchema);
