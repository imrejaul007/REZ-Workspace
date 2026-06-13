const mongoose = require('mongoose');
const customerTwinSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  styleProfile: {
    preferredStyles: [String],
    preferredColors: [String],
    sizes: { top: String, bottom: String, shoes: String }
  },
  preferences: {
    brands: [String],
    priceRange: { min: Number, max: Number }
  },
  loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const CustomerTwin = mongoose.model('CustomerTwin', customerTwinSchema);
module.exports = { CustomerTwin };
