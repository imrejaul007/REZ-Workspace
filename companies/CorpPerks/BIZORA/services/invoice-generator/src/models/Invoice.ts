import mongoose, { Document, Schema } from 'mongoose';

// Line item interface
export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxableAmount: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  total: number;
}

// GST details interface
export interface IGSTDetails {
  gstin: string;
  businessName: string;
  address: string;
  state: string;
  stateCode: string;
}

// Invoice document interface
export interface IInvoice extends Document {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  seller: IGSTDetails;
  buyer: IGSTDetails;
  placeOfSupply: string;
  reverseCharge: boolean;
  lineItems: ILineItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  totalInWords: string;
  currency: string;
  notes?: string;
  terms?: string;
  paymentDetails?: {
    paymentMethod?: string;
    paymentDate?: Date;
    transactionId?: string;
  };
  sentAt?: Date;
  sentTo?: string;
  reminderCount: number;
  lastReminderAt?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Line item schema
const LineItemSchema = new Schema<ILineItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  taxableAmount: { type: Number, required: true, min: 0 },
  cgstRate: { type: Number, default: 0, min: 0, max: 100 },
  cgstAmount: { type: Number, default: 0, min: 0 },
  sgstRate: { type: Number, default: 0, min: 0, max: 100 },
  sgstAmount: { type: Number, default: 0, min: 0 },
  igstRate: { type: Number, default: 0, min: 0, max: 100 },
  igstAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

// GST details schema
const GSTDetailsSchema = new Schema<IGSTDetails>({
  gstin: { type: String, required: true },
  businessName: { type: String, required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  stateCode: { type: String, required: true }
}, { _id: false });

// Payment details schema
const PaymentDetailsSchema = new Schema({
  paymentMethod: { type: String },
  paymentDate: { type: Date },
  transactionId: { type: String }
}, { _id: false });

// Invoice schema
const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  seller: {
    type: GSTDetailsSchema,
    required: true
  },
  buyer: {
    type: GSTDetailsSchema,
    required: true
  },
  placeOfSupply: {
    type: String,
    required: true
  },
  reverseCharge: {
    type: Boolean,
    default: false
  },
  lineItems: {
    type: [LineItemSchema],
    required: true,
    validate: {
      validator: function(items: ILineItem[]) {
        return items && items.length > 0;
      },
      message: 'At least one line item is required'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCgst: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSgst: {
    type: Number,
    default: 0,
    min: 0
  },
  totalIgst: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTaxableAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalTaxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalInWords: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  notes: String,
  terms: String,
  paymentDetails: PaymentDetailsSchema,
  sentAt: Date,
  sentTo: String,
  reminderCount: {
    type: Number,
    default: 0
  },
  lastReminderAt: Date,
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: String
}, {
  timestamps: true
});

// Indexes
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ seller: 1 });
InvoiceSchema.index({ buyer: 1 });
InvoiceSchema.index({ invoiceDate: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ 'seller.gstin': 1 });
InvoiceSchema.index({ 'buyer.gstin': 1 });
InvoiceSchema.index({ createdBy: 1 });

// Pre-save hook to update timestamps
InvoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function(prefix: string = 'INV'): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}/${year}/${month}/` }
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('/');
    const lastSeq = parts[parts.length - 1];
    sequence = parseInt(lastSeq, 10) + 1;
  }

  return `${prefix}/${year}/${month}/${String(sequence).padStart(4, '0')}`;
};

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;
