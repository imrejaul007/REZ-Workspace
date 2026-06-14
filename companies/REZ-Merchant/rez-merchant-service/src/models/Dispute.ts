import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    store: { type: Schema.Types.Mixed },
    merchantId: { type: Schema.Types.Mixed },
    type: { type: String },
    referenceType: { type: String },
    referenceId: { type: String },
    reason: { type: String },
    description: { type: String },
    attachments: { type: [Schema.Types.Mixed] },
    status: { type: String, default: 'open' },
    amount: { type: Number },
    needsFinanceReview: { type: Boolean },
    merchantResponse: { type: Schema.Types.Mixed },
    timeline: { type: [Schema.Types.Mixed] },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ store: 1, status: 1 });
export const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', s, 'disputes');
