import mongoose, { Schema } from 'mongoose';

// Shared collection: servicecategories is owned by rez-backend. Merchant service
// reads it for service category display/selection only.
const schema = new Schema(
  {
    name: { type: String },
    slug: { type: String },
    description: { type: String },
    icon: { type: String },
    image: { type: String },
    isActive: { type: Boolean },
    sortOrder: { type: Number },
    parentId: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'servicecategories' },
);
schema.index({ isActive: 1, sortOrder: 1 });

export const ServiceCategory = mongoose.models.ServiceCategory || mongoose.model('ServiceCategory', schema);
