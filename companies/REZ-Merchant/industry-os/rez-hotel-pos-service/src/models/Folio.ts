import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Folio Status Enum
 */
export enum FolioStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CHECKED_OUT = 'CHECKED_OUT',
  POSTED = 'POSTED',
}

/**
 * Folio - Represents a guest's bill/folio in the hotel
 * A folio can have multiple transactions from different outlets
 */
export interface IFolio extends Document {
  folioId: string;
  guestId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber?: string;
  reservationId?: string;
  propertyId: string;
  status: FolioStatus;
  transactions: string[]; // Transaction IDs
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  currency: string;
  paymentStatus: string;
  splitBillEnabled: boolean;
  splitBillMembers: ISplitMember[];
  checkInDate?: Date;
  checkOutDate?: Date;
  notes?: string;
  pmsFolioId?: string; // PMS system folio reference
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  closedBy?: string;
}

/**
 * Split Bill Member - represents a guest sharing a folio
 */
export interface ISplitMember {
  guestId: string;
  guestName: string;
  sharePercentage: number;
  shareAmount: number;
  settled: boolean;
  settledAt?: Date;
}

const SplitMemberSchema = new Schema<ISplitMember>(
  {
    guestId: { type: String, required: true },
    guestName: { type: String, required: true },
    sharePercentage: { type: Number, required: true, min: 0, max: 100 },
    shareAmount: { type: Number, default: 0 },
    settled: { type: Boolean, default: false },
    settledAt: { type: Date },
  },
  { _id: false }
);

const FolioSchema = new Schema<IFolio>(
  {
    folioId: {
      type: String,
      required: true,
      unique: true,
      default: () => `FOLIO-${uuidv4().substring(0, 8).toUpperCase()}`,
    },
    guestId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String },
    guestPhone: { type: String },
    roomNumber: { type: String, index: true },
    reservationId: { type: String, index: true },
    propertyId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(FolioStatus),
      default: FolioStatus.OPEN,
      index: true,
    },
    transactions: [{ type: String, ref: 'Transaction' }],
    totalAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: { type: String, default: 'PENDING' },
    splitBillEnabled: { type: Boolean, default: false },
    splitBillMembers: [SplitMemberSchema],
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    notes: { type: String },
    pmsFolioId: { type: String, index: true },
    closedAt: { type: Date },
    closedBy: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
FolioSchema.index({ propertyId: 1, status: 1 });
FolioSchema.index({ guestId: 1, status: 1 });
FolioSchema.index({ createdAt: -1 });

// Pre-save hook to recalculate totals
FolioSchema.pre('save', function (next) {
  if (this.isModified('transactions') || this.isModified('discountAmount')) {
    this.netAmount = this.totalAmount + this.taxAmount - this.discountAmount;
  }
  next();
});

export const Folio = mongoose.model<IFolio>('Folio', FolioSchema);
