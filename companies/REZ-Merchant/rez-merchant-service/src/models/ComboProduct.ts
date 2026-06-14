import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    description: { type: String },
    items: { type: [Schema.Types.Mixed] },
    comboPrice: { type: Number },
    originalTotal: { type: Number },
    savings: { type: Number },
    images: { type: [String] },
    category: { type: String },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validTo: { type: Date },
    sortOrder: { type: Number },
    tags: { type: [String] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
export const ComboProduct = mongoose.models.ComboProduct || mongoose.model('ComboProduct', s, 'comboproducts');
