import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MULTIPLE = 'MULTIPLE',
}

export interface ISplitPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  cardType?: string;
  lastFourDigits?: string;
  bankName?: string;
  walletName?: string;
}

export interface IPaymentTransaction {
  transactionId: string;
  amount: number;
  method: PaymentMethod;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference?: string;
  timestamp: Date;
  responseMessage?: string;
}

export interface IPayment extends Document {
  paymentId: string;
  billId: string;
  invoiceId?: string;
  restaurantId: string;
  customerId?: string;

  amount: number;
  tipAmount: number;
  totalAmount: number;

  paymentMethod: PaymentMethod;
  splitPayments?: ISplitPayment[];

  status: PaymentStatus;

  transactions: IPaymentTransaction[];

  cardDetails?: {
    cardType: 'DEBIT' | 'CREDIT';
    cardNetwork: string;
    lastFourDigits: string;
    bankName?: string;
  };

  upiDetails?: {
    vpa: string;
    provider: string;
  };

  walletDetails?: {
    walletName: string;
    walletId?: string;
  };

  cashDetails?: {
    amountTendered: number;
    changeGiven: number;
  };

  refundDetails?: {
    refundId: string;
    amount: number;
    reason: string;
    processedBy: string;
    processedAt: Date;
    reference?: string;
  };

  metadata?: Record<string, unknown>;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const SplitPaymentSchema = new Schema<ISplitPayment>(
  {
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    amount: { type: Number, required: true },
    reference: { type: String },
    cardType: { type: String },
    lastFourDigits: { type: String },
    bankName: { type: String },
    walletName: { type: String },
  },
  { _id: false }
);

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], required: true },
    reference: { type: String },
    timestamp: { type: Date, required: true },
    responseMessage: { type: String },
  },
  { _id: false }
);

const RefundDetailsSchema = new Schema(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    processedBy: { type: String, required: true },
    processedAt: { type: Date, required: true },
    reference: { type: String },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    billId: { type: String, required: true, index: true },
    invoiceId: { type: String, index: true },
    restaurantId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },

    amount: { type: Number, required: true },
    tipAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    splitPayments: [SplitPaymentSchema],

    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },

    transactions: [PaymentTransactionSchema],

    cardDetails: {
      cardType: { type: String, enum: ['DEBIT', 'CREDIT'] },
      cardNetwork: { type: String },
      lastFourDigits: { type: String },
      bankName: { type: String },
    },

    upiDetails: {
      vpa: { type: String },
      provider: { type: String },
    },

    walletDetails: {
      walletName: { type: String },
      walletId: { type: String },
    },

    cashDetails: {
      amountTendered: { type: Number },
      changeGiven: { type: Number },
    },

    refundDetails: RefundDetailsSchema,

    metadata: { type: Schema.Types.Mixed },

    createdBy: { type: String, required: true },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

PaymentSchema.index({ restaurantId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ billId: 1, status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
