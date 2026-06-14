/**
 * RisaCare Provider Directory
 * Search doctors, hospitals, clinics
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4780', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_provider_directory';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

const DoctorSchema = new mongoose.Schema({
  doctorId: String, name: String, photo: String, specialization: String, qualifications: [String],
  experience: Number, languages: [String], registrationNumber: String,
  hospital: String, clinic: String, address: mongoose.Schema.Types.Mixed,
  consultationFee: Number, videoFee: Number, availability: mongoose.Schema.Types.Mixed,
  rating: Number, reviewCount: Number, services: [String]
});

const HospitalSchema = new mongoose.Schema({
  hospitalId: String, name: String, type: String, logo: String,
  address: mongoose.Schema.Types.Mixed, phone: String, email: String,
  specialties: [String], beds: Number, facilities: [String],
  rating: Number, reviewCount: Number, emergency: Boolean, ambulance: Boolean
});

const ClinicSchema = new mongoose.Schema({
  clinicId: String, name: String, photo: String,
  address: mongoose.Schema.Types.Mixed, phone: String,
  specialization: String, doctors: [String],
  rating: Number, timing: mongoose.Schema.Types.Mixed
});

const Doctor = mongoose.model('Doctor', DoctorSchema);
const Hospital = mongoose.model('Hospital', HospitalSchema);
const Clinic = mongoose.model('Clinic', ClinicSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'provider-directory' }));

// Search Doctors
app.get('/api/doctors', async (req, res) => {
  const { specialization, city, search, minFee, maxFee, sort = 'rating' } = req.query;
  const query: any = {};
  if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
  if (search) query.name = { $regex: search, $options: 'i' };
  if (minFee) query.consultationFee = { $gte: parseInt(minFee as string) };
  if (maxFee) query.consultationFee = { ...query.consultationFee, $lte: parseInt(maxFee as string) };

  let doctors = await Doctor.find(query);
  if (sort === 'fee_low') doctors.sort((a, b) => a.consultationFee - b.consultationFee);
  if (sort === 'fee_high') doctors.sort((a, b) => b.consultationFee - a.consultationFee);
  if (sort === 'rating') doctors.sort((a, b) => b.rating - a.rating);

  res.json({ success: true, doctors, total: doctors.length });
});

app.get('/api/doctors/:id', async (req, res) => {
  const doctor = await Doctor.findOne({ doctorId: req.params.id });
  if (!doctor) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, doctor });
});

// Search Hospitals
app.get('/api/hospitals', async (req, res) => {
  const { specialization, city, emergency, search } = req.query;
  const query: any = {};
  if (specialization) query.specialties = { $in: [specialization] };
  if (emergency === 'true') query.emergency = true;
  if (search) query.name = { $regex: search, $options: 'i' };

  const hospitals = await Hospital.find(query);
  res.json({ success: true, hospitals, total: hospitals.length });
});

app.get('/api/hospitals/:id', async (req, res) => {
  const hospital = await Hospital.findOne({ hospitalId: req.params.id });
  if (!hospital) return res.status(404).json({ error: 'Not found' });
  const doctors = await Doctor.find({ hospital: hospital.name });
  res.json({ success: true, hospital, doctors });
});

// Search Clinics
app.get('/api/clinics', async (req, res) => {
  const { specialization, city, search } = req.query;
  const query: any = {};
  if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
  if (search) query.name = { $regex: search, $options: 'i' };

  const clinics = await Clinic.find(query);
  res.json({ success: true, clinics });
});

// Specializations
app.get('/api/specializations', async (req, res) => {
  const specializations = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedic', 'Pediatrician',
    'Neurologist', 'Gastroenterologist', 'Pulmonologist', 'Endocrinologist', 'Nephrologist',
    'Urologist', 'Ophthalmologist', 'ENT', 'Psychiatrist', 'Physiotherapist',
    'Dentist', 'Gynecologist', 'Oncologist', 'Rheumatologist', 'Allergist'
  ];
  res.json({ success: true, specializations });
});

// Cities
app.get('/api/cities', async (req, res) => {
  const cities = await Hospital.distinct('address.city');
  res.json({ success: true, cities });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Provider Directory started on port ${PORT}`));
}
start();
export default app;
