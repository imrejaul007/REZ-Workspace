/**
 * RisaCare Diagnostics Booking
 * Full diagnostic platform with lab tests, home collection
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4777', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_diagnostics';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

const TestSchema = new mongoose.Schema({
  testId: String, name: String, category: String, description: String,
  preparation: String, fasting: Boolean, reportTime: String, price: Number
});

const LabSchema = new mongoose.Schema({
  labId: String, name: String, address: String, city: String, pincode: String,
  phone: String, rating: Number, reportTime: String, homeCollection: Boolean, prices: mongoose.Schema.Types.Mixed
});

const BookingSchema = new mongoose.Schema({
  bookingId: String, userId: String, labId: String, tests: [String],
  date: Date, timeSlot: String, address: mongoose.Schema.Types.Mixed,
  type: String, status: String, amount: Number, reportUrl: String
});

const Test = mongoose.model('Test', TestSchema);
const Lab = mongoose.model('Lab', LabSchema);
const Booking = mongoose.model('Booking', BookingSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'diagnostics' }));

app.get('/api/tests', async (req, res) => {
  const { category, search } = req.query;
  const query: any = {};
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };
  const tests = await Test.find(query);
  res.json({ success: true, tests });
});

app.get('/api/tests/packages', async (req, res) => {
  const packages = [
    { id: 'basic_health', name: 'Basic Health Checkup', tests: ['CBC', 'BMP', 'LIPID'], price: 1500 },
    { id: 'full_body', name: 'Full Body Checkup', tests: ['CBC', 'BMP', 'LFT', 'LIPID', 'THYROID'], price: 3500 },
    { id: 'diabetes', name: 'Diabetes Screening', tests: ['HbA1c', 'GLUCOSE', 'BMP'], price: 1200 },
    { id: 'cardiac', name: 'Cardiac Risk Assessment', tests: ['LIPID', 'CPK', 'ECG'], price: 2000 }
  ];
  res.json({ success: true, packages });
});

app.get('/api/labs', async (req, res) => {
  const { city, pincode } = req.query;
  const query: any = {};
  if (city) query.city = city;
  if (pincode) query.pincode = pincode;
  const labs = await Lab.find(query);
  res.json({ success: true, labs });
});

app.get('/api/labs/:id/prices', async (req, res) => {
  const lab = await Lab.findOne({ labId: req.params.id });
  if (!lab) return res.status(404).json({ error: 'Lab not found' });
  const tests = await Test.find();
  const prices = tests.map(t => ({
    testId: t.testId,
    name: t.name,
    mrp: t.price,
    ourPrice: lab.prices?.[t.testId] || Math.round(t.price * 0.85)
  }));
  res.json({ success: true, prices });
});

app.post('/api/bookings', async (req, res) => {
  const { userId, labId, tests, date, timeSlot, address, type } = req.body;
  const booking = await Booking.create({
    bookingId: `diag_${uuidv4()}`,
    userId, labId, tests, date: new Date(date), timeSlot, address, type: type || 'home',
    status: 'confirmed', amount: tests.length * 300
  });
  ecosystem.rabtul.sendPushNotification(userId, 'Booking Confirmed', `Diagnostics booked for ${date}`).catch(() => {});
  res.status(201).json({ success: true, booking });
});

app.get('/api/bookings/:userId', async (req, res) => {
  const bookings = await Booking.find({ userId: req.params.userId }).sort({ date: -1 });
  res.json({ success: true, bookings });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Diagnostics started on port ${PORT}`));
}
start();
export default app;
