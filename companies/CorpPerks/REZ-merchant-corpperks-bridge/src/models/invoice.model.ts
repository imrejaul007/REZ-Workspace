import mongoose, { Document, Schema } from 'mongoose';
import { GSTInvoice, InvoiceStatus, InvoiceType } from '../types';

export interface IGSTInvoice extends Omit<GSTInvoice, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const invoiceItemSchema = new Schema(
  {
    description: { type: String, required: true },
    hsnCode: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxableValue: { type: Number, required: true },
    cgstRate: { type: Number, default: 0, min: 0, max: 100 },
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstRate: { type: Number, default: 0, min: 0, max: 100 },
    sgstAmount: { type: Number, default: 0, min: 0 },
    igstRate: { type: Number, default: 0, min: 0, max: 100 },
    igstAmount: { type: Number, default: 0, min: 0 },
    cessRate: { type: Number, default: 0, min: 0, max: 100 },
    cessAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const gstInvoiceSchema = new Schema<IGSTInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    corpPerksInvoiceId: {
      type: String,
      sparse: true,
      index: true,
    },
    merchantInvoiceId: {
      type: String,
      sparse: true,
      index: true,
    },
    invoiceType: {
      type: String,
      enum: ['tax_invoice', 'receipt', 'credit_note', 'debit_note', 'refund_voucher'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'issued', 'sent', 'paid', 'cancelled', 'expired'],
      default: 'draft',
      index: true,
    },
    issueDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    shippingAddress: {
      type: addressSchema,
    },
    gstin: {
      type: String,
      sparse: true,
      index: true,
    },
    placeOfSupply: {
      type: String,
      required: true,
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v && v.length > 0,
        message: 'Invoice must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalTaxableValue: {
      type: Number,
      required: true,
    },
    totalCgst: {
      type: Number,
      default: 0,
    },
    totalSgst: {
      type: Number,
      default: 0,
    },
    totalIgst: {
      type: Number,
      default: 0,
    },
    totalCess: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    irn: {
      type: String,
      sparse: true,
      index: true,
    },
    irnDate: {
      type: Date,
    },
    ewaybillNumber: {
      type: String,
      sparse: true,
    },
    signedInvoiceUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Generate invoice number
gstInvoiceSchema.statics.generateInvoiceNumber = async function (): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const prefix = `CP-INV-${year}${month}-`;

  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');

  if (!lastInvoice) {
    return `${prefix}000001`;
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
  const newNumber = lastNumber + 1;
  return `${prefix}${String(newNumber).padStart(6, '0')}`;
};

// Calculate totals from items
gstInvoiceSchema.methods.calculateTotals = function (): void {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;
  let totalTax = 0;

  for (const item of this.items) {
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.discount;
    totalTaxableValue += item.taxableValue;
    totalCgst += item.cgstAmount;
    totalSgst += item.sgstAmount;
    totalIgst += item.igstAmount;
    totalCess += item.cessAmount;
    totalTax += item.cgstAmount + item.sgstAmount + item.igstAmount + item.cessAmount;
  }

  this.subtotal = subtotal;
  this.totalDiscount = totalDiscount;
  this.totalTaxableValue = totalTaxableValue;
  this.totalCgst = totalCgst;
  this.totalSgst = totalSgst;
  this.totalIgst = totalIgst;
  this.totalCess = totalCess;
  this.totalTax = totalTax;
  this.grandTotal = totalTaxableValue + totalTax;
};

// Compound indexes
gstInvoiceSchema.index({ status: 1, issueDate: 1 });
gstInvoiceSchema.index({ customerEmail: 1, status: 1 });
gstInvoiceSchema.index({ gstin: 1, status: 1 });
gstInvoiceSchema.index({ irn: 1 });

export const GSTInvoiceModel = mongoose.model<IGSTInvoice>('GSTInvoice', gstInvoiceSchema);
export default GSTInvoiceModel;
