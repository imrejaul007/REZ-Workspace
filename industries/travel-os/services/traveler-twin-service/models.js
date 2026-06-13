const mongoose = require('mongoose');
const travelerTwinSchema = new mongoose.Schema({
  travelerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: String,
  preferences: {
    seatPreference: String,
    mealPreference: String,
    hotelPreference: String
  },
  passportInfo: {
    number: String,
    expiry: Date,
    nationality: String
  },
  loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  travelHistory: [{ destination: String, date: Date }],
  tripPatterns: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const TravelerTwin = mongoose.model('TravelerTwin', travelerTwinSchema);
module.exports = { TravelerTwin };
