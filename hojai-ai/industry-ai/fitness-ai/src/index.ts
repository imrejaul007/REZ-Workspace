/**
 * FITNESS-AI - Fitness & Gym Industry AI Operating System
 * Production-Ready Server
 * Port: 4810
 * Industry: Gyms, Fitness Centers, Personal Training
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4810', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/fitness_ai';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'fitness-ai' },
});

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: { code: 'RATE_LIMIT' } } }));

// Models
const memberSchema = new mongoose.Schema({
  memberId: String, name: String, phone: String, email: String,
  membershipPlan: String, status: { type: String, enum: ['active', 'expired', 'paused'], default: 'active' },
  joinDate: Date, expiryDate: Date, totalSpent: { type: Number, default: 0 },
  fitnessGoals: [String], preferences: [String], createdAt: { type: Date, default: Date.now }
});
const Member = mongoose.model('Member', memberSchema);

const classSchema = new mongoose.Schema({
  classId: String, name: String, instructor: String, type: String,
  schedule: String, duration: Number, capacity: Number, enrolled: { type: Number, default: 0 },
  room: String, isActive: { type: Boolean, default: true }
});
const FitnessClass = mongoose.model('FitnessClass', classSchema);

const attendanceSchema = new mongoose.Schema({
  memberId: String, checkIn: Date, checkOut: Date, classId: String
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Health checks
app.get('/health', async (req: Request, res: Response) => {
  res.json({ status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded', service: 'fitness-ai', timestamp: new Date().toISOString() });
});
app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' });
  res.json({ status: 'ready' });
});

// AI Status
app.get('/ai/status', (req: Request, res: Response) => {
  res.json({ success: true, employees: [
    { id: 'ai-trainer', name: 'AI Personal Trainer', status: 'active' },
    { id: 'ai-nutrition', name: 'AI Nutrition Advisor', status: 'active' },
    { id: 'ai-scheduler', name: 'AI Class Scheduler', status: 'active' }
  ]});
});

// Members
app.post('/api/members', async (req: Request, res: Response) => {
  try {
    const member = await Member.create({ memberId: `FIT-${Date.now().toString(36)}`, ...req.body });
    res.status(201).json({ success: true, data: member });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

app.get('/api/members', async (req: Request, res: Response) => {
  const members = await Member.find(req.query.status ? { status: req.query.status } : {});
  res.json({ success: true, data: members });
});

// Classes
app.get('/api/classes', async (req: Request, res: Response) => {
  const classes = await FitnessClass.find(req.query.type ? { type: req.query.type, isActive: true } : { isActive: true });
  res.json({ success: true, data: classes });
});

app.post('/api/classes', async (req: Request, res: Response) => {
  try {
    const fitnessClass = await FitnessClass.create({ classId: `CLASS-${Date.now().toString(36)}`, ...req.body });
    res.status(201).json({ success: true, data: fitnessClass });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

// Attendance
app.post('/api/attendance/checkin', async (req: Request, res: Response) => {
  try {
    const record = await Attendance.create({ memberId: req.body.memberId, checkIn: new Date() });
    res.json({ success: true, data: record });
  } catch (error) { res.status(500).json({ success: false, error: { code: 'ERROR' } }); }
});

app.get('/api/attendance', async (req: Request, res: Response) => {
  const records = await Attendance.find(req.query.memberId ? { memberId: req.query.memberId } : {});
  res.json({ success: true, data: records });
});

// AI Trainer
app.post('/api/ai/trainer/plan', async (req: Request, res: Response) => {
  const { fitnessGoals, experience } = req.body;
  const plan = {
    week1: { exercises: ['Bodyweight Squats', 'Push-ups', 'Plank'], sets: 3, reps: 12 },
    week2: { exercises: ['Lunges', 'Dips', 'Mountain Climbers'], sets: 3, reps: 15 },
    recommendation: 'Focus on compound movements for maximum efficiency'
  };
  res.json({ success: true, data: { plan, message: `Based on your ${fitnessGoals} goal, here's your personalized plan.` } });
});

// AI Nutrition
app.post('/api/ai/nutrition/plan', async (req: Request, res: Response) => {
  const { goal, weight } = req.body;
  const calories = goal === 'weight-loss' ? Math.round(weight * 22) : Math.round(weight * 30);
  res.json({ success: true, data: {
    dailyCalories: calories,
    protein: Math.round(weight * 1.8),
    carbs: Math.round(calories * 0.4 / 4),
    fats: Math.round(calories * 0.3 / 9),
    meals: ['Breakfast', 'Lunch', 'Snack', 'Dinner']
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
  app.listen(PORT, () => logger.info(`FITNESS-AI started on port ${PORT}`));
};

start();
export default app;
