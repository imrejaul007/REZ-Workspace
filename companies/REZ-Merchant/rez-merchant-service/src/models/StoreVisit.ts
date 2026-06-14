import mongoose, { Schema } from 'mongoose';

// Shared collection: storevisits is primarily written by rez-backend/user app.
// The merchant service reads it for visit analytics only.
const s = new Schema(
  {
    storeId: { type: Schema.Types.Mixed, required: true },
    userId: { type: Schema.Types.Mixed },
    status: { type: String },
    visitedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, createdAt: -1 });
export const StoreVisit = mongoose.models.StoreVisit || mongoose.model('StoreVisit', s, 'storevisits');
