import mongoose, { Schema, Model } from 'mongoose';
import { ITaxDeclaration, DeclarationStatus } from '../types/index.js';

const declarationItemSchema = new Schema({
  section: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  proof: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'] as DeclarationStatus[],
    default: 'pending',
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: String,
  },
}, { _id: false });

const taxDeclarationSchema = new Schema<ITaxDeclaration>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    fiscalYear: {
      type: String,
      required: true,
    },
    declarations: {
      type: [declarationItemSchema],
      default: [],
    },
    totalDeclared: {
      type: Number,
      default: 0,
    },
    totalVerified: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'] as DeclarationStatus[],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    verifiedBy: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAllowances: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index for employee + fiscal year
taxDeclarationSchema.index({ tenantId: 1, employeeId: 1, fiscalYear: 1 }, { unique: true });

// Index for queries
taxDeclarationSchema.index({ tenantId: 1, fiscalYear: 1 });
taxDeclarationSchema.index({ tenantId: 1, status: 1 });

export const TaxDeclaration: Model<ITaxDeclaration> = mongoose.model<ITaxDeclaration>(
  'TaxDeclaration',
  taxDeclarationSchema
);
