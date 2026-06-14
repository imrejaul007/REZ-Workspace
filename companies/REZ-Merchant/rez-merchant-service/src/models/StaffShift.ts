import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed, required: true },
    staffId: { type: Schema.Types.Mixed },
    staffName: { type: String },
    weekStartDate: { type: Date },
    shifts: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1, weekStartDate: 1 });
export const StaffShift = mongoose.models.StaffShift as unknown || mongoose.model('StaffShift', s, 'staffshifts');
