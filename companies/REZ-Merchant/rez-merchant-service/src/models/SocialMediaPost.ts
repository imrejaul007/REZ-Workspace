import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    storeId: { type: Schema.Types.Mixed, required: true },
    platform: { type: String },
    content: { type: String },
    mediaUrls: { type: [String] },
    status: { type: String },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.Mixed },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, status: 1 });
export const SocialMediaPost = mongoose.models.SocialMediaPost || mongoose.model('SocialMediaPost', s, 'socialmediaposts');
