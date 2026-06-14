import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

export interface IGstBreakdown {
  rate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
}

export interface IInvoiceItem {
  itemId: string;
  name: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
}

export interface IBillingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  gstin?: string;
}

export interface IInvoice extends Document {
  invoiceId: string;
  invoiceNumber: string;
  billId: string;

  restaurantDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    gstin: string;
    pan?: string;
    fssai?: string;
  };

  customerDetails: IBillingAddress;

  items: IInvoiceItem[];

  subtotal: number;
  totalDiscount: number;

  gstBreakdown: IGstBreakdown[];

  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  totalTax: number;

  tcsAmount: number;
  roundOff: number;
  grandTotal: number;

  amountInWords: string;

  paymentMode?: string;
  paymentReference?: string;
  paidAmount: number;
  dueAmount: number;

  invoiceDate: Date;
  dueDate?: Date;
  status: InvoiceStatus;

  qrCodeUrl?: string;
  signedUrl?: string;

  createdAt: Date;
  updatedAt: Date;
  issuedAt?: Date;
}

const GstBreakdownSchema = new Schema<IGstBreakdown>(
  {
    rate: { type: Number, required: true },
    taxableAmount: { type: Number, required: true },
    cgstAmount: { type: Number, required: true },
    sgstAmount: { type: Number, required: true },
    igstAmount: { type: Number, required: true },
    cessAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    hsnCode: { type: String },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'NOS' },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    cessAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const BillingAddressSchema = new Schema<IBillingAddress>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    gstin: { type: String },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    billId: { type: String, required: true, index: true },

    restaurantDetails: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
      gstin: { type: String, required: true },
      pan: { type: String },
      fssai: { type: String },
    },

    customerDetails: BillingAddressSchema,

    items: [InvoiceItemSchema],

    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },

    gstBreakdown: [GstBreakdownSchema],

    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    cessTotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },

    tcsAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    amountInWords: { type: String, required: true },

    paymentMode: { type: String },
    paymentReference: { type: String },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
    },

    qrCodeUrl: { type: String },
    signedUrl: { type: String },
    issuedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'invoices',
  }
);

InvoiceSchema.index({ restaurantDetails_gstin: 1, invoiceDate: -1 });
InvoiceSchema.index({ invoiceDate: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
