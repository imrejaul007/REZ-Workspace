import mongoose, { Schema, Document, Model } from 'mongoose';
import { IProposal, InvoiceItem } from '../types/index.js';

export interface ProposalDocument extends Omit<IProposal, '_id'>, Document {}

const invoiceItemSchema = new Schema<InvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const proposalSchema = new Schema<ProposalDocument>(
  {
    proposalId: {
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
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    dealId: { type: String, index: true },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    sentAt: { type: Date },
    viewedAt: { type: Date },
    signedAt: { type: Date },
    signatureData: { type: String },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
proposalSchema.index({ tenantId: 1, clientId: 1 });
proposalSchema.index({ tenantId: 1, dealId: 1 });
proposalSchema.index({ tenantId: 1, status: 1 });
proposalSchema.index({ validUntil: 1 });

// Generate proposal ID before saving
proposalSchema.pre('save', async function (next) {
  if (this.isNew && !this.proposalId) {
    const count = await mongoose.model('Proposal').countDocuments({ tenantId: this.tenantId });
    this.proposalId = `PROP-${String(count + 1).padStart(5, '0')}`;
  }

  // Auto-expire if past validUntil date
  if (this.status === 'sent' && new Date() > this.validUntil) {
    this.status = 'expired';
  }

  next();
});

export const Proposal: Model<ProposalDocument> = mongoose.model<ProposalDocument>('Proposal', proposalSchema);
