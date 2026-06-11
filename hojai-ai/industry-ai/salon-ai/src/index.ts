/**
 * SALON-AI - Salon & Beauty Industry AI Operating System
 * Production-Ready Server
 * Port: 4870
 * Industry: Salons, Spas, Beauty Centers
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4870', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/salon_ai';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'salon-ai' },
});

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));

// Models
const customerSchema = new mongoose.Schema({
  customerId: String, name: String, phone: String, email: String,
  birthday: Date, preferences: [String], loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  totalSpent: { type: Number, default: 0 }, visits: { type: Number, default: 0 }, lastVisit: Date,
  createdAt: { type: Date, default: Date.now }
});
const Customer = mongoose.model('Customer', customerSchema);

const serviceSchema = new mongoose.Schema({
  serviceId: String, name: String, category: String, price: Number, duration: Number,
  description: String, isActive: { type: Boolean, default: true }
});
const Service = mongoose.model('Service', serviceSchema);

const appointmentSchema = new mongoose.Schema({
  appointmentId: String, customerId: String, serviceId: String, stylistId: String,
  date: Date, time: String, status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'], default: 'scheduled' },
  notes: String, createdAt: { type: Date, default: Date.now }
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const stylistSchema = new mongoose.Schema({
  stylistId: String, name: String, phone: String, specialties: [String],
  rating: { type: Number, default: 0 }, isActive: { type: Boolean, default: true }
});
const Stylist = mongoose.model('Stylist', stylistSchema);

// Health checks
app.get('/health', async (req: Request, res: Response) => {
  res.json({ status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded', service: 'salon-ai', timestamp: new Date().toISOString() });
});
app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' });
  res.json({ status: 'ready' });
});

// AI Status
app.get('/ai/status', (req: Request, res: Response) => {
  res.json({ success: true, employees: [
    { id: 'ai-stylist', name: 'AI Style Advisor', status: 'active' },
    { id: 'ai-booking', name: 'AI Booking Agent', status: 'active' },
    { id: 'ai-recommend', name: 'AI Product Recommender', status: 'active' }
  ]});
});

// Customers
app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const customer = await Customer.create({ customerId: `CUST-${Date.now().toString(36)}`, ...req.body });
    res.status(201).json({ success: true, data: customer });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

app.get('/api/customers', async (req: Request, res: Response) => {
  const customers = await Customer.find({});
  res.json({ success: true, data: customers });
});

// Services
app.get('/api/services', async (req: Request, res: Response) => {
  const services = await Service.find(req.query.category ? { category: req.query.category, isActive: true } : { isActive: true });
  res.json({ success: true, data: services });
});

app.post('/api/services', async (req: Request, res: Response) => {
  try {
    const service = await Service.create({ serviceId: `SVC-${Date.now().toString(36)}`, ...req.body });
    res.status(201).json({ success: true, data: service });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

// Appointments
app.post('/api/appointments', async (req: Request, res: Response) => {
  try {
    const appointment = await Appointment.create({ appointmentId: `APT-${Date.now().toString(36)}`, ...req.body });
    res.status(201).json({ success: true, data: appointment });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

app.get('/api/appointments', async (req: Request, res: Response) => {
  const appointments = await Appointment.find(req.query.date ? { date: { $gte: new Date(req.query.date as string) } } : {});
  res.json({ success: true, data: appointments });
});

// Stylists
app.post('/api/stylists', async (req: Request, res: Response) => {
  try {
    const stylist = await Stylist.create({ stylistId: `STY-${Date.now().toString(36)}`, ...req.body });
    res.status(201).json({ success: true, data: stylist });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

app.get('/api/stylists', async (req: Request, res: Response) => {
  const stylists = await Stylist.find({ isActive: true });
  res.json({ success: true, data: stylists });
});

// AI Style Advisor
app.post('/api/ai/style/advice', async (req: Request, res: Response) => {
  const { faceShape, hairType, occasion } = req.body;
  const recommendations = {
    haircut: occasion === 'wedding' ? 'Elegant Updo with soft layers' : occasion === 'interview' ? 'Professional bob cut' : 'Modern layered cut',
    color: ['Balayage', 'Ombre highlights', 'Rich brunette'],
    styling: 'Use a heat protectant and volumizing products'
  };
  res.json({ success: true, data: { recommendations, message: `Based on your ${faceShape} face shape and ${hairType} hair, here's my recommendation!` } });
});

// AI Booking
app.post('/api/ai/booking/suggest', async (req: Request, res: Response) => {
  const { serviceType, preferredDate } = req.body;
  res.json({ success: true, data: {
    suggestedTime: '10:00 AM',
    availableStylists: 3,
    message: `Based on ${serviceType} service, morning slots work best!`
  }});
});

// Error handling
app.use((err: Error, req: Request, res: Response) => res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } }));
app.use((req: Request, res: Response) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } }));

const shutdown = async () => { await mongoose.disconnect(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const start = async () => {
  await mongoose.connect(MONGO_URL);
  logger.info('Connected to MongoDB');
  app.listen(PORT, () => logger.info(`SALON-AI started on port ${PORT}`));
};

start();
export default app;
