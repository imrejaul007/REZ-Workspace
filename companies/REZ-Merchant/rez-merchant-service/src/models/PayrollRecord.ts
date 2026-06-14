import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    employeeId: { type: Schema.Types.Mixed },
    period: { type: Schema.Types.Mixed },
    month: { type: Number },
    year: { type: Number },
    baseSalary: { type: Number },
    deductions: { type: Schema.Types.Mixed },
    bonuses: { type: Schema.Types.Mixed },
    overtime: { type: Schema.Types.Mixed },
    totalAmount: { type: Number },
    notes: { type: String },
    status: { type: String, default: 'processed' },
    processedAt: { type: Date },
    paidAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, status: 1 });
export const PayrollRecord = mongoose.models.PayrollRecord || mongoose.model('PayrollRecord', s, 'payrolls');
