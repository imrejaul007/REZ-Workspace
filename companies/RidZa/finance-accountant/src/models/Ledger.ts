import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  entryId: string;
  tenantId: string;
  ledger: string;
  debit: number;
  credit: number;
  narration?: string;
  reference?: string;
  date: Date;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>({
  entryId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  ledger: { type: String, required: true, index: true },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  narration: { type: String },
  reference: { type: String },
  date: { type: Date, default: Date.now },
  invoiceId: { type: String, index: true }
}, {
  timestamps: true
});

// Compound indexes for common queries
LedgerEntrySchema.index({ tenantId: 1, ledger: 1 });
LedgerEntrySchema.index({ tenantId: 1, date: 1 });
LedgerEntrySchema.index({ tenantId: 1, ledger: 1, date: 1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
