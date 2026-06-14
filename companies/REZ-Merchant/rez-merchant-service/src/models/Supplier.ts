import mongoose, { Schema, Document } from 'mongoose';

// Validation regex patterns
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PHONE_REGEX = /^[0-9]{10}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Enums
export type SupplierStatus = 'pending' | 'approved' | 'rejected' | 'blocked';
export type DueDatePreference = 'end_of_month' | 'immediate' | 'specific_day';

export interface ISupplier extends Document {
  merchantId: string;
  // Basic Info
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  // GST/PAN
  gstNumber?: string;
  pan?: string;
  // Credit
  creditLimit: number;
  creditUsed: number;
  creditPeriodDays: number;
  // Due Date
  dueDatePreference: DueDatePreference;
  specificDayOfMonth?: number;
  // Banking
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  // Status
  isActive: boolean;
  status: SupplierStatus;
  // Tags and Notes
  tags: string[];
  notes?: string;
  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
  // Metadata
  metadata?: Record<string, unknown>;
}

const supplierSchema = new Schema<ISupplier>(
  {
    merchantId: { type: String, required: true, index: true },
    // Basic Info
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },
    address: {
      type: Schema.Types.Mixed,
    },
    // GST/PAN
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
      match: [GST_REGEX, 'Invalid GST number format'],
    },
    pan: {
      type: String,
      uppercase: true,
      trim: true,
      match: [PAN_REGEX, 'Invalid PAN format'],
    },
    // Credit
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
      max: 999999999,
    },
    creditUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditPeriodDays: {
      type: Number,
      default: 30,
      min: 0,
      max: 365,
    },
    // Due Date
    dueDatePreference: {
      type: String,
      enum: ['end_of_month', 'immediate', 'specific_day'],
      default: 'end_of_month',
    },
    specificDayOfMonth: {
      type: Number,
      min: 1,
      max: 28,
    },
    // Banking
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: {
      type: String,
      uppercase: true,
      trim: true,
      match: [IFSC_REGEX, 'Invalid IFSC code format'],
    },
    accountHolderName: { type: String, trim: true },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'blocked'],
      default: 'pending',
    },
    // Tags and Notes
    tags: {
      type: [String],
      default: [],
    },
    notes: { type: String },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: { type: Date },
    // Metadata
    metadata: { type: Schema.Types.Mixed },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
    collection: 'suppliers',
  }
);

// Indexes
supplierSchema.index({ merchantId: 1, isDeleted: 1 });
supplierSchema.index({ merchantId: 1, status: 1 });
supplierSchema.index({ merchantId: 1, isActive: 1 });
supplierSchema.index({ merchantId: 1, name: 'text', phone: 'text', gstNumber: 'text' });
supplierSchema.index({ gstNumber: 1 }, { sparse: true });
supplierSchema.index({ pan: 1 }, { sparse: true });

// Virtual for available credit
supplierSchema.virtual('creditAvailable').get(function () {
  return Math.max(0, this.creditLimit - this.creditUsed);
});

// Pre-save hook to validate credit used doesn't exceed limit
supplierSchema.pre('save', function (next) {
  if (this.creditUsed > this.creditLimit) {
    next(new Error('Credit used cannot exceed credit limit'));
  }
  next();
});

// Instance method to check credit availability
supplierSchema.methods.hasCreditAvailable = function (amount: number): boolean {
  return (this.creditLimit - this.creditUsed) >= amount;
};

// Instance method to calculate due date based on preference
supplierSchema.methods.calculateDueDate = function (poDate: Date = new Date()): Date {
  const date = new Date(poDate);

  switch (this.dueDatePreference) {
    case 'immediate':
      return date;

    case 'end_of_month': {
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return lastDay;
    }

    case 'specific_day': {
      const targetDay = this.specificDayOfMonth || 1;
      let dueDate = new Date(date.getFullYear(), date.getMonth(), targetDay);
      // If the specific day has passed this month, move to next month
      if (dueDate <= date) {
        dueDate = new Date(date.getFullYear(), date.getMonth() + 1, targetDay);
      }
      return dueDate;
    }

    default:
      // Add credit period days
      date.setDate(date.getDate() + this.creditPeriodDays);
      return date;
  }
};

// Static method to find suppliers with overdue payments
supplierSchema.statics.findWithOverduePayments = async function (
  merchantId: string,
  referenceDate: Date = new Date()
) {
  return this.find({
    merchantId,
    isDeleted: { $ne: true },
    isActive: true,
    status: 'approved',
    creditUsed: { $gt: 0 },
  }).lean();
};

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', supplierSchema);
