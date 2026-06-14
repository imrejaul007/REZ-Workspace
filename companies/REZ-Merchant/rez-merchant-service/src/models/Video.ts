import mongoose, { Schema } from 'mongoose';

// Shared collection: videos is primarily owned by rez-backend.
// The merchant service reads this collection for store gallery display.
const schema = new Schema(
  {
    stores: { type: [Schema.Types.Mixed] },
    contentType: { type: String },
    creator: { type: Schema.Types.Mixed },
    url: { type: String },
    thumbnail: { type: String },
    title: { type: String },
    description: { type: String },
    isActive: { type: Boolean },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'videos' },
);
schema.index({ stores: 1, contentType: 1, createdAt: -1 });
schema.index({ creator: 1 });

export const Video = mongoose.models.Video || mongoose.model('Video', schema);
