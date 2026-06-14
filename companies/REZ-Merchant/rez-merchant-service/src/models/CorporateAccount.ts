import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    companyName: { type: String },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: Schema.Types.Mixed },
    gstNumber: { type: String },
    pan: { type: String },
    creditLimit: { type: Number },
    paymentTerms: { type: String },
    discount: { type: Number },
    status: { type: String },
    isActive: { type: Boolean },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
export const CorporateAccount = mongoose.models.CorporateAccount || mongoose.model('CorporateAccount', s, 'corporateaccounts');
