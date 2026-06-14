import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  discount: number;
  taxableValue: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  transactionId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  items: IInvoiceItem[];
  subtotal: number;
  totalTaxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  discountTotal: number;
  roundOff: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet' | 'mixed';
  invoiceDate: Date;
  dueDate?: Date;
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  salonGstin: string;
  placeOfSupply: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    hsnCode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxableValue: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerEmail: { type: String },
    customerAddress: { type: String },
    customerGstin: { type: String },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    totalTaxableValue: { type: Number, required: true, min: 0 },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    totalTax: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'pending', 'refunded'],
      default: 'paid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'mixed'],
      required: true,
    },
    invoiceDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    salonName: { type: String, required: true },
    salonAddress: { type: String, required: true },
    salonPhone: { type: String, required: true },
    salonGstin: { type: String, required: true },
    placeOfSupply: { type: String, default: 'India' },
    pdfUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InvoiceSchema.index({ invoiceDate: -1 });
InvoiceSchema.index({ customerId: 1, invoiceDate: -1 });
InvoiceSchema.index({ paymentStatus: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
