import mongoose, { Schema, Document } from 'mongoose';

export interface IContractParty {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  signedAt?: Date;
  signature?: string;
}

export interface IContractClause {
  title: string;
  content: string;
  order: number;
}

export interface IContract extends Document {
  contractNumber: string;
  title: string;
  type: 'employment' | 'nda' | 'vendor' | 'partnership' | 'service' | 'lease' | 'other';
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';
  parties: IContractParty[];
  clauses: IContractClause[];
  startDate?: Date;
  endDate?: Date;
  value?: number;
  currency?: string;
  terms?: string;
  attachments?: string[];
  signedPdfPath?: string;
  createdBy: string;
  updatedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ContractPartySchema = new Schema<IContractParty>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: String },
  address: { type: String },
  signedAt: { type: Date },
  signature: { type: String }
}, { _id: false });

const ContractClauseSchema = new Schema<IContractClause>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true }
}, { _id: false });

const ContractSchema = new Schema<IContract>(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['employment', 'nda', 'vendor', 'partnership', 'service', 'lease', 'other'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'pending_signature', 'active', 'expired', 'terminated'],
      default: 'draft',
      index: true
    },
    parties: {
      type: [ContractPartySchema],
      required: true,
      validate: {
        validator: (v: IContractParty[]) => v.length >= 2,
        message: 'At least 2 parties are required'
      }
    },
    clauses: {
      type: [ContractClauseSchema],
      default: []
    },
    startDate: { type: Date, index: true },
    endDate: { type: Date, index: true },
    value: { type: Number },
    currency: { type: String, default: 'INR' },
    terms: { type: String },
    attachments: [{ type: String }],
    signedPdfPath: { type: String },
    createdBy: {
      type: String,
      required: true,
      index: true
    },
    updatedBy: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes
ContractSchema.index({ createdAt: -1 });
ContractSchema.index({ 'parties.email': 1 });
ContractSchema.index({ status: 1, type: 1 });

// Generate contract number before save
ContractSchema.pre('save', async function (next) {
  if (this.isNew && !this.contractNumber) {
    const count = await mongoose.model('Contract').countDocuments();
    this.contractNumber = `CTR-${Date.now()}-${count + 1}`;
  }
  next();
});

export const Contract = mongoose.model<IContract>('Contract', ContractSchema);
