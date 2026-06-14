import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    description: { type: String },
    ingredients: { type: [Schema.Types.Mixed] },
    instructions: { type: String },
    category: { type: String },
    images: { type: [String] },
    yield: { type: Schema.Types.Mixed },
    cost: { type: Number },
    status: { type: String },
    tags: { type: [String] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
export const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', s, 'recipes');
