const mongoose = require('mongoose');

const clientBeautyTwinSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  skinType: { type: String, enum: ['normal', 'dry', 'oily', 'combination', 'sensitive'] },
  hairType: String,
  allergies: [String],
  preferences: {
    stylist: String,
    services: [String],
    products: [String]
  },
  serviceHistory: [{
    date: Date,
    service: String,
    stylist: String,
    rating: Number
  }],
  productReactions: [{
    product: String,
    reaction: String
  }],
  loyaltyPoints: { type: Number, default: 0 },
  lastVisit: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const appointmentTwinSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientBeautyTwin', required: true },
  stylist: String,
  service: String,
  dateTime: { type: Date, required: true },
  duration: Number,
  status: { type: String, enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const treatmentTwinSchema = new mongoose.Schema({
  treatmentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: String,
  description: String,
  duration: Number,
  price: Number,
  commission: Number,
  products: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ClientBeautyTwin = mongoose.model('ClientBeautyTwin', clientBeautyTwinSchema);
const AppointmentTwin = mongoose.model('AppointmentTwin', appointmentTwinSchema);
const TreatmentTwin = mongoose.model('TreatmentTwin', treatmentTwinSchema);

module.exports = { ClientBeautyTwin, AppointmentTwin, TreatmentTwin };
