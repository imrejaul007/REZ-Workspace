import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  expenseId: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  vendorName?: string;
  vendorGstin?: string;
  invoiceNumber?: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  staffId?: string;
  staffName?: string;
  expenseDate: Date;
  dueDate?: Date;
  attachments?: string[];
  notes?: string;
  recurringExpense: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategory = [
  'salary',
  'rent',
  'utilities',
  'supplies',
  'maintenance',
  'marketing',
  'insurance',
  'taxes',
  'equipment',
  'training',
  'uniforms',
  'cosmetics',
  'laundry',
  'software',
  'other',
] as const;

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseId: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ExpenseCategory,
      index: true,
    },
    subcategory: { type: String },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    vendorName: { type: String },
    vendorGstin: { type: String },
    invoiceNumber: { type: String },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    approvedBy: { type: String },
    staffId: { type: String },
    staffName: { type: String },
    expenseDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    attachments: { type: [String], default: [] },
    notes: { type: String },
    recurringExpense: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for reporting
ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ category: 1, expenseDate: -1 });
ExpenseSchema.index({ status: 1, expenseDate: -1 });
ExpenseSchema.index({ staffId: 1, expenseDate: -1 });

// Virtual for calculating monthly total
ExpenseSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  return this.dueDate < new Date() && this.status !== 'paid';
});

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);

export const EXPENSE_CATEGORIES = ExpenseCategory;
