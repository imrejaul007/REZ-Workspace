const mongoose = require('mongoose');

const patientTwinSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  demographics: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: String,
    ssn: String
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: String
    }
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    copay: Number
  },
  medicalHistory: {
    allergies: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    conditions: [String],
    surgeries: [{
      procedure: String,
      date: Date,
      notes: String
    }]
  },
  emergencyContacts: [{
    name: String,
    relationship: String,
    phone: String
  }],
  status: { type: String, enum: ['active', 'inactive', 'deceased'], default: 'active' },
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentTwin' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const appointmentTwinSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientTwin', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderTwin', required: true },
  dateTime: { type: Date, required: true },
  duration: { type: Number, default: 30 },
  type: { type: String, enum: ['checkup', 'followup', 'consultation', 'procedure', 'emergency'] },
  status: { type: String, enum: ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
  reason: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const providerTwinSchema = new mongoose.Schema({
  providerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  npi: String,
  license: String,
  availability: [{
    dayOfWeek: Number,
    startTime: String,
    endTime: String
  }],
  rating: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const prescriptionTwinSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientTwin', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderTwin', required: true },
  medication: {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    quantity: Number,
    refills: Number
  },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  startDate: Date,
  endDate: Date,
  instructions: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PatientTwin = mongoose.model('PatientTwin', patientTwinSchema);
const AppointmentTwin = mongoose.model('AppointmentTwin', appointmentTwinSchema);
const ProviderTwin = mongoose.model('ProviderTwin', providerTwinSchema);
const PrescriptionTwin = mongoose.model('PrescriptionTwin', prescriptionTwinSchema);

module.exports = { PatientTwin, AppointmentTwin, ProviderTwin, PrescriptionTwin };
