import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    employeeId: { type: Schema.Types.Mixed },
    date: { type: String },
    clockIn: { type: Date },
    clockOut: { type: Date },
    shift: { type: Schema.Types.Mixed },
    notes: { type: String },
    location: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, date: -1 });
export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', s, 'attendances');
