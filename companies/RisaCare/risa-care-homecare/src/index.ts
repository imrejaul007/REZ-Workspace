/**
 * RisaCare Homecare Platform
 * Home nursing, caregivers, medical equipment
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4776', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_homecare';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

// Schemas
const ServiceSchema = new mongoose.Schema({
  serviceId: String, name: String, category: String, description: String, duration: Number,
  price: Number, provider: String, rating: Number, available: Boolean
});

const CaregiverSchema = new mongoose.Schema({
  caregiverId: String, userId: String, name: String, photo: String, gender: String,
  services: [String], experience: Number, qualifications: [String], languages: [String],
  availability: mongoose.Schema.Types.Mixed, rating: Number, reviewCount: Number, pricePerHour: Number
});

const BookingSchema = new mongoose.Schema({
  bookingId: String, userId: String, caregiverId: String, serviceId: String,
  date: Date, time: String, duration: Number, address: mongoose.Schema.Types.Mixed,
  status: String, amount: Number, notes: String
});

const EquipmentSchema = new mongoose.Schema({
  equipmentId: String, name: String, category: String, description: String,
  pricePerDay: Number, pricePerMonth: Number, images: [String], available: Boolean
});

const RentalSchema = new mongoose.Schema({
  rentalId: String, userId: String, equipmentId: String, startDate: Date,
  endDate: Date, status: String, amount: Number
});

const Service = mongoose.model('Service', ServiceSchema);
const Caregiver = mongoose.model('Caregiver', CaregiverSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Equipment = mongoose.model('Equipment', EquipmentSchema);
const Rental = mongoose.model('Rental', RentalSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'homecare' }));

// Caregivers
app.get('/api/caregivers', async (req, res) => {
  const { service, city } = req.query;
  const query: any = {};
  if (service) query.services = service;
  const caregivers = await Caregiver.find(query);
  res.json({ success: true, caregivers });
});

app.get('/api/caregivers/:id', async (req, res) => {
  const caregiver = await Caregiver.findOne({ caregiverId: req.params.id });
  if (!caregiver) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, caregiver });
});

// Services
app.get('/api/services', async (req, res) => {
  const { category } = req.query;
  const query: any = {};
  if (category) query.category = category;
  const services = await Service.find(query);
  res.json({ success: true, services });
});

// Bookings
app.post('/api/bookings', async (req, res) => {
  const booking = await Booking.create({
    bookingId: `book_${uuidv4()}`,
    status: 'confirmed',
    ...req.body
  });
  ecosystem.rabtul.sendPushNotification(req.body.userId, 'Booking Confirmed', 'Your caregiver has been booked').catch(() => {});
  res.status(201).json({ success: true, booking });
});

app.get('/api/bookings/user/:userId', async (req, res) => {
  const bookings = await Booking.find({ userId: req.params.userId }).sort({ date: -1 });
  res.json({ success: true, bookings });
});

// Equipment
app.get('/api/equipment', async (req, res) => {
  const { category } = req.query;
  const query: any = { available: true };
  if (category) query.category = category;
  const equipment = await Equipment.find(query);
  res.json({ success: true, equipment });
});

app.post('/api/rentals', async (req, res) => {
  const rental = await Rental.create({
    rentalId: `rent_${uuidv4()}`,
    status: 'active',
    ...req.body
  });
  res.status(201).json({ success: true, rental });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Homecare started on port ${PORT}`));
}
start();
export default app;
