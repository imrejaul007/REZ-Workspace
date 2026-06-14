import mongoose, { Document, Schema } from 'mongoose';

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total: number;
}

export interface IQuote extends Document {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerAddress?: string;
  title: string;
  description?: string;
  lineItems: ILineItem[];
  subtotal: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  acceptedBy?: string;
  notes?: string;
  terms?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true }
}, { _id: false });

const QuoteSchema = new Schema<IQuote>({
  quoteNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  customerCompany: { type: String },
  customerAddress: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  lineItems: { type: [LineItemSchema], default: [] },
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'INR' },
  validUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  acceptedBy: { type: String },
  notes: { type: String },
  terms: { type: String },
  createdBy: { type: String, required: true },
  updatedBy: { type: String }
}, {
  timestamps: true
});

// Index for faster queries
QuoteSchema.index({ customerEmail: 1 });
QuoteSchema.index({ status: 1 });
QuoteSchema.index({ validUntil: 1 });
QuoteSchema.index({ createdAt: -1 });

export const Quote = mongoose.model<IQuote>('Quote', QuoteSchema);