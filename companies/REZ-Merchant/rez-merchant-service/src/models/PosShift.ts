import mongoose, { Schema } from 'mongoose';

// Minimal POS shift model — shares the `posshifts` collection with rez-backend.
// Uses strict:false so reads from rez-backend's richer schema continue to work.
const PosShiftSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, required: true, index: true },
    staffName: { type: String },
    openingCash: { type: Number, default: 0 },
    closingCash: { type: Number },
    countedCash: { type: Number },
    cashRevenue: { type: Number, default: 0 },
    upiRevenue: { type: Number, default: 0 },
    cardRevenue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalBills: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    notes: { type: String },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true, strict: true, strictQuery: true, collection: 'posshifts' },
);

PosShiftSchema.index({ merchantId: 1, storeId: 1, status: 1 });

export const PosShift = mongoose.models.PosShift || mongoose.model('PosShift', PosShiftSchema);
