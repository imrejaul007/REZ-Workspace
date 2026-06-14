/**
 * Budget Model - MongoDB Schema for Budget Data
 */

import mongoose, { Document, Schema } from 'mongoose';

// Category types for budget items
export type BudgetCategory = 
  | 'marketing'
  | 'operations'
  | 'hr'
  | 'technology'
  | 'sales'
  | 'admin'
  | 'rnd'
  | 'other';

// Transaction type
export type TransactionType = 'income' | 'expense';

// Budget item interface
export interface IBudgetItem {
  category: BudgetCategory;
  subcategory?: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  type: TransactionType;
}

// Spending record interface
export interface ISpendingRecord {
  category: BudgetCategory;
  subcategory?: string;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
}

// Budget document interface
export interface IBudget extends Document {
  tenantId: string;
  name: string;
  fiscalYear: number;
  fiscalQuarter?: 1 | 2 | 3 | 4;
  items: IBudgetItem[];
  spending: ISpendingRecord[];
  createdAt: Date;
  updatedAt: Date;
}

// Budget item schema
const BudgetItemSchema = new Schema<IBudgetItem>(
  {
    category: {
      type: String,
      required: true,
      enum: ['marketing', 'operations', 'hr', 'technology', 'sales', 'admin', 'rnd', 'other'],
    },
    subcategory: { type: String },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    frequency: {
      type: String,
      required: true,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
    },
  },
  { _id: false }
);

// Spending record schema
const SpendingRecordSchema = new Schema<ISpendingRecord>(
  {
    category: {
      type: String,
      required: true,
      enum: ['marketing', 'operations', 'hr', 'technology', 'sales', 'admin', 'rnd', 'other'],
    },
    subcategory: { type: String },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
    },
  },
  { _id: true }
);

// Main budget schema
const BudgetSchema = new Schema<IBudget>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    fiscalYear: {
      type: Number,
      required: true,
    },
    fiscalQuarter: {
      type: Number,
      min: 1,
      max: 4,
    },
    items: [BudgetItemSchema],
    spending: [SpendingRecordSchema],
  },
  {
    timestamps: true,
    collection: 'budgets',
  }
);

// Compound index for tenant + fiscal year queries
BudgetSchema.index({ tenantId: 1, fiscalYear: 1 });
BudgetSchema.index({ tenantId: 1, fiscalYear: 1, fiscalQuarter: 1 });

// Export the model
export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);

// Category display names
export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  marketing: 'Marketing & Advertising',
  operations: 'Operations',
  hr: 'Human Resources',
  technology: 'Technology & IT',
  sales: 'Sales',
  admin: 'Administration',
  rnd: 'Research & Development',
  other: 'Other',
};

export default Budget;
