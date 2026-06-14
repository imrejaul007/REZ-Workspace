import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Merchant', index: true },
    userId: { type: String, required: true, index: true },
    notes: { type: String, maxlength: 1000, default: '' },
    internalTags: [{ type: String, trim: true }],
    healthProfile: {
      allergies: { type: String, maxlength: 500, default: '' },
      medicalConditions: { type: String, maxlength: 500, default: '' },
      medicalNotes: { type: String, maxlength: 500, default: '' },
      dietaryPreferences: { type: String, maxlength: 500, default: '' },
      preferredProducts: { type: String, maxlength: 500, default: '' },
      skinHairType: { type: String, maxlength: 100, default: '' },
      freeTextNotes: { type: String, maxlength: 1000, default: '' },
    },
  },
  { timestamps: true },
);

schema.index({ merchantId: 1, userId: 1 }, { unique: true });

export const CustomerMeta =
  mongoose.models.CustomerMeta || mongoose.model('CustomerMeta', schema);
