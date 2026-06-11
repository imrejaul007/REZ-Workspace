/**
 * FITMIND - Fitness AI Operating System
 * Production-Ready Server with MongoDB, JWT, Security & Logging
 *
 * ExpertOS Integration: Individual Fitness Trainer Features
 * - Expert Profile (Trainer credentials, specializations)
 * - Client Management (Member relationships)
 * - Reviews & Ratings
 * - AI Suggestions
 * - Appointment Scheduling
 * - Marketplace Listing
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 4801;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitmind';
const JWT_SECRET = process.env.JWT_SECRET || 'hojai-dev-secret';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';
const INTERNAL_TOKEN = INTERNAL_SERVICE_TOKEN;

// SDK & Webhook Service URLs
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095';

// ============================================
// WINSTON LOGGER
// ============================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'FITMIND', port: PORT },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

// ============================================
// SDK & WEBHOOK HELPERS
// ============================================

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'fitmind' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'fitmind', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

async function sendNotification(phone: string, message: string, channel: 'sms' | 'whatsapp' = 'sms') {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error(`Notification error:`, error.message);
  }
}

// ============================================
// MONGODB MODELS
// ============================================

import {
  Member,
  MembershipPlan,
  Class,
  Attendance,
  WorkoutPlan,
  NutritionPlan,
  Subscription,
  IMember,
  IMembershipPlan,
  IClass,
  IAttendance,
  IWorkoutPlan,
  INutritionPlan,
  ISubscription
} from './models/index';
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many authentication attempts.', code: 'AUTH_RATE_LIMIT_EXCEEDED' }
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  isInternal?: boolean;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === INTERNAL_SERVICE_TOKEN) {
      req.isInternal = true;
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
    return res.status(500).json({ success: false, error: 'Authentication error', code: 'AUTH_ERROR' });
  }
};

const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {}
  }
  next();
};

// ============================================
// ERROR HANDLER
// ============================================

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

// ============================================
// REQUEST LOGGING
// ============================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', { requestId, method: req.method, path: req.path, statusCode: res.statusCode, duration: `${duration}ms` });
  });
  next();
});

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memberCount = await Member.countDocuments({ status: 'active' }).catch(() => 0);
  const classCount = await Class.countDocuments({ isActive: true }).catch(() => 0);

  res.json({
    status: 'healthy',
    service: 'FITMIND',
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    mongo: mongoStatus,
    expertOS: 'enabled',
    expertType: 'fitness_coach',
    aiEmployees: ['Fitness Coach AI', 'Nutrition Advisor AI', 'Membership Advisor AI', 'Retention Manager AI'],
    stats: { activeMembers: memberCount, classes: classCount },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  if (!mongoReady) {
    return res.status(503).json({ status: 'not ready', checks: { mongodb: 'not ready' }, timestamp: new Date().toISOString() });
  }
  res.json({ status: 'ready', checks: { mongodb: 'ready' }, timestamp: new Date().toISOString() });
});

// ============================================
// AI ENDPOINTS - FITNESS COACH
// ============================================

app.post('/api/ai/fitness-coach/plan', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId, goals, fitnessLevel, daysPerWeek } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }

    const plan = await WorkoutPlan.create(generateWorkoutPlan(member, goals, fitnessLevel, daysPerWeek));
    logger.info('Workout plan generated', { memberId, planId: plan._id });

    res.json({
      success: true,
      plan,
      aiMessage: `Hi ${member.name}! Based on your ${goals?.join(' & ') || 'fitness'} goals, I've created a ${plan.duration}-week workout plan.`
    });
  } catch (error) {
    next(error);
  }
});

function generateWorkoutPlan(member: any, goals?: string[], fitnessLevel?: string, daysPerWeek?: number): any {
  const exerciseLibrary: Record<string, any[]> = {
    weightLoss: [
      { name: 'Burpees', sets: 3, reps: 15, restSeconds: 30, equipment: 'None' },
      { name: 'Mountain Climbers', sets: 3, reps: 20, restSeconds: 30, equipment: 'None' },
      { name: 'Jump Squats', sets: 4, reps: 12, restSeconds: 45, equipment: 'None' },
      { name: 'Kettlebell Swings', sets: 3, reps: 15, restSeconds: 30, equipment: 'Kettlebell' },
    ],
    muscleGain: [
      { name: 'Bench Press', sets: 4, reps: 10, restSeconds: 90, equipment: 'Barbell' },
      { name: 'Deadlift', sets: 4, reps: 8, restSeconds: 120, equipment: 'Barbell' },
      { name: 'Shoulder Press', sets: 3, reps: 10, restSeconds: 90, equipment: 'Dumbbells' },
      { name: 'Bicep Curls', sets: 3, reps: 12, restSeconds: 60, equipment: 'Dumbbells' },
    ],
    flexibility: [
      { name: 'Sun Salutation', sets: 3, reps: 1, restSeconds: 30, equipment: 'Yoga Mat' },
      { name: 'Hip Flexor Stretch', sets: 2, reps: 1, restSeconds: 15, equipment: 'None' },
      { name: 'Hamstring Stretch', sets: 2, reps: 1, restSeconds: 15, equipment: 'None' },
    ]
  };

  const primaryGoal = goals?.[0]?.toLowerCase() || 'weightLoss';
  const exercises = exerciseLibrary[primaryGoal] || exerciseLibrary.weightLoss;

  return {
    memberId: member._id,
    trainer: member.assignedTrainer || 'Vikram',
    focus: goals?.join(', ') || 'General Fitness',
    duration: 8,
    exercises,
    status: 'active'
  };
}

app.post('/api/ai/fitness-coach/exercise-demo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { exerciseName } = req.body;
    const demo = generateExerciseDemo(exerciseName);
    res.json({ success: true, demo, aiMessage: `Here's how to perform ${exerciseName} with proper form!` });
  } catch (error) {
    next(error);
  }
});

function generateExerciseDemo(exerciseName: string): any {
  const demos: Record<string, any> = {
    'Burpees': {
      steps: ['Start in standing position', 'Drop into a squat, hands on floor', 'Jump feet back to plank position', 'Do a push-up (optional)', 'Jump feet forward to squat', 'Jump up with arms overhead'],
      tips: ['Keep core tight throughout', 'Land softly', 'Breathe out on exertion'],
      commonMistakes: ['Sagging hips in plank', 'Not going low enough', 'Holding breath'],
      duration: '45-60 seconds per set'
    },
    'Deadlift': {
      steps: ['Stand with feet hip-width apart, bar over mid-foot', 'Bend at hips and knees, grip bar outside legs', 'Straighten back, engage core', 'Drive through heels, extend hips and knees', 'Stand tall, bar close to body', 'Lower with control'],
      tips: ['Keep bar close to body', 'Neutral spine throughout', 'Squeeze glutes at top'],
      commonMistakes: ['Rounding lower back', 'Bar drifting forward', 'Hyperextending at top'],
      duration: '45-60 seconds per set'
    }
  };
  return demos[exerciseName] || { steps: ['Position yourself correctly', 'Perform the movement', 'Return to starting position'], tips: ['Focus on form', 'Control the movement'], duration: '30-60 seconds per set' };
}

// ============================================
// AI ENDPOINTS - NUTRITION ADVISOR
// ============================================

app.post('/api/ai/nutrition/advisor', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId, goal, dietaryRestrictions, preferences } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }

    const plan = await NutritionPlan.create(generateNutritionPlan(member, goal, dietaryRestrictions, preferences));
    logger.info('Nutrition plan generated', { memberId, planId: plan._id });

    res.json({
      success: true,
      plan,
      aiMessage: `${member.name}, here's your personalized ${goal} nutrition plan with ${plan.calories} calories/day.`
    });
  } catch (error) {
    next(error);
  }
});

function generateNutritionPlan(member: any, goal?: string, dietaryRestrictions?: string[], preferences?: string[]): any {
  const calorieTargets: Record<string, number> = {
    weightLoss: 1500, muscleGain: 2500, maintenance: 2000, toning: 1800
  };

  const baseCalories = calorieTargets[goal?.toLowerCase() || 'maintenance'] || 2000;
  const proteinRatio = goal?.toLowerCase() === 'muscleGain' ? 2.0 : goal?.toLowerCase() === 'weightLoss' ? 2.2 : 1.6;
  const isJain = dietaryRestrictions?.includes('jain');

  return {
    memberId: member._id,
    calories: baseCalories,
    macros: {
      protein: Math.round(baseCalories * proteinRatio / 4),
      carbs: Math.round(baseCalories * 0.4 / 4),
      fat: Math.round(baseCalories * 0.25 / 9)
    },
    meals: [
      { name: 'Breakfast (7:00 AM)', items: isJain ? [{ food: 'Sabudana Khichdi', calories: 300, protein: 8 }, { food: 'Fruit Bowl', calories: 150, protein: 2 }] : [{ food: 'Oatmeal with Berries', calories: 280, protein: 12 }, { food: 'Greek Yogurt', calories: 150, protein: 15 }] },
      { name: 'Lunch (1:00 PM)', items: isJain ? [{ food: 'Paneer Bhurji + Roti', calories: 450, protein: 22 }, { food: 'Salad', calories: 50, protein: 2 }] : [{ food: 'Chicken/Roti + Dal', calories: 500, protein: 30 }, { food: 'Curd', calories: 100, protein: 6 }] },
      { name: 'Dinner (8:00 PM)', items: isJain ? [{ food: 'Vegetable Khichdi', calories: 400, protein: 15 }, { food: 'Buttermilk', calories: 50, protein: 3 }] : [{ food: 'Grilled Paneer/Fish + Salad', calories: 400, protein: 28 }, { food: 'Soup', calories: 80, protein: 3 }] }
    ]
  };
}

app.get('/api/ai/nutrition/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { height, weight, age, gender, activityLevel, goal } = req.query;

    const bmr = gender === 'male'
      ? 88.362 + (13.397 * Number(weight)) + (4.799 * Number(height)) - (5.677 * Number(age))
      : 447.593 + (9.247 * Number(weight)) + (3.098 * Number(height)) - (4.330 * Number(age));

    const activityMultipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
    const tdee = bmr * (activityMultipliers[activityLevel as string] || 1.55);
    const goalAdjustment = goal === 'weightLoss' ? -500 : goal === 'muscleGain' ? 300 : 0;

    res.json({
      success: true,
      calculations: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(tdee + goalAdjustment),
        macros: { protein: Math.round(Number(weight) * 2), carbs: Math.round((tdee * 0.4) / 4), fat: Math.round((tdee * 0.25) / 9) }
      },
      aiMessage: `Based on your stats, your daily calorie target is ${Math.round(tdee + goalAdjustment)} calories for ${goal}.`
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI ENDPOINTS - MEMBERSHIP ADVISOR
// ============================================

app.post('/api/ai/membership/advise', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, budget, goals, preferredClasses } = req.body;
    const member = memberId ? await Member.findById(memberId) : null;
    const plans = await MembershipPlan.find({ isActive: true });

    const scoredPlans = plans.map(plan => ({
      ...plan.toObject(),
      aiScore: calculatePlanScore(plan, budget, goals, preferredClasses),
      recommendation: generateRecommendation(plan, member)
    })).sort((a: any, b: any) => b.aiScore - a.aiScore);

    res.json({
      success: true,
      recommendations: scoredPlans.slice(0, 3),
      aiMessage: member ? `Hi ${member.name}, based on your ${member.fitnessGoals.join(' & ')} goals, I recommend:` : 'Based on your requirements, here are the best plans for you:'
    });
  } catch (error) {
    next(error);
  }
});

function calculatePlanScore(plan: any, budget?: number, goals?: string[], preferredClasses?: string[]): number {
  let score = 50;
  if (budget && plan.price <= budget) score += 20;
  if (goals?.includes('muscleGain') && plan.features.some((f: string) => f.includes('PT'))) score += 20;
  if (preferredClasses?.length && plan.features.some((f: string) => f.includes('classes'))) score += 10;
  return Math.min(score, 100);
}

function generateRecommendation(plan: any, member?: any): string {
  if (plan.category === 'elite') return 'Best for serious fitness enthusiasts who want comprehensive coaching and nutrition support.';
  if (plan.category === 'premium') return 'Great value! Perfect for regular gym-goers who want variety in their workouts.';
  return 'Ideal for beginners or those with a tight budget. Upgrade anytime!';
}

app.post('/api/ai/membership/upgrade', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId, newPlanId } = req.body;
    const member = await Member.findById(memberId);
    const newPlan = await MembershipPlan.findById(newPlanId);

    if (!member || !newPlan) {
      return res.status(404).json({ success: false, error: 'Member or plan not found', code: 'NOT_FOUND' });
    }

    const oldPlan = await MembershipPlan.findById(member.membershipPlan);
    const upgradeBenefits = newPlan.features.filter((f: string) => !oldPlan?.features.includes(f));

    member.membershipPlan = newPlan._id;
    await member.save();

    logger.info('Membership upgraded', { memberId, newPlanId });

    res.json({
      success: true,
      member: { id: member.id, name: member.name },
      upgrade: { from: oldPlan?.name, to: newPlan.name, priceDiff: newPlan.price - (oldPlan?.price || 0), newBenefits: upgradeBenefits },
      aiMessage: `Upgrade successful! You now have access to ${upgradeBenefits.join(', ')}.`
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI ENDPOINTS - RETENTION MANAGER
// ============================================

app.post('/api/ai/retention/analyze', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }

    const analysis = analyzeRetention(member);
    logger.info('Retention analysis completed', { memberId, riskLevel: analysis.riskLevel });

    res.json({
      success: true,
      member: { id: member.id, name: member.name },
      analysis,
      aiMessage: generateRetentionMessage(member, analysis)
    });
  } catch (error) {
    next(error);
  }
});

function analyzeRetention(member: any): any {
  const daysSinceLastVisit = member.lastVisit ? Math.floor((Date.now() - new Date(member.lastVisit).getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const attendanceRate = member.attendanceCount / 30;
  let churnRisk = 20;

  if (daysSinceLastVisit > 14) churnRisk += 40;
  else if (daysSinceLastVisit > 7) churnRisk += 20;
  if (attendanceRate < 0.3) churnRisk += 30;
  else if (attendanceRate < 0.5) churnRisk += 15;
  if (member.status === 'inactive') churnRisk += 20;

  return {
    riskLevel: churnRisk > 70 ? 'high' : churnRisk > 40 ? 'medium' : 'low',
    churnProbability: Math.min(churnRisk, 100),
    daysSinceLastVisit,
    attendanceRate: Math.round(attendanceRate * 100),
    recommendedActions: churnRisk > 70 ? ['Send personalized re-engagement message', 'Offer complimentary PT session'] : churnRisk > 40 ? ['Send workout reminder', 'Share progress achievements'] : ['Continue engagement with regular updates']
  };
}

function generateRetentionMessage(member: any, analysis: any): string {
  if (analysis.riskLevel === 'high') return `Hey ${member.name}, we miss you! It's been ${analysis.daysSinceLastVisit} days. We have exciting new classes and a special offer!`;
  if (analysis.riskLevel === 'medium') return `Hi ${member.name}! Your attendance has been a bit low. Check out our new HIIT sessions!`;
  return `Great to have you, ${member.name}! Keep up the amazing work!`;
}

// ============================================
// WORKER ROUTES - ATTENDANCE
// ============================================

app.post('/api/workers/attendance/checkin', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId, classId } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }

    const classSession = classId ? await Class.findById(classId) : null;
    const record = await Attendance.create({
      memberId: member._id,
      memberName: member.name,
      checkIn: new Date(),
      classAttended: classSession?.name
    });

    member.attendanceCount += 1;
    member.lastVisit = new Date();
    member.status = 'active';
    await member.save();

    logger.info('Member checked in', { memberId, classId });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('fitmind.attendance.checked_in', { memberId: member._id.toString(), memberName: member.name, classId, className: classSession?.name, checkInTime: new Date().toISOString() });
    await syncToHOJAI('attendance', 'checked_in', { memberId: member._id.toString(), memberName: member.name, classId, className: classSession?.name });

    res.json({
      success: true,
      record,
      aiMessage: `Welcome, ${member.name}! ${classSession ? `Enjoy your ${classSession.name} class!` : 'Have a great workout!'}`
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/workers/attendance/checkout', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ memberId: memberId, checkIn: { $gte: new Date(today) } });

    if (!record) {
      return res.status(404).json({ success: false, error: 'No active check-in found', code: 'NOT_FOUND' });
    }

    record.checkOut = new Date();
    record.duration = Math.round((record.checkOut.getTime() - record.checkIn.getTime()) / 60000);
    await record.save();

    res.json({ success: true, record, duration: record.duration, aiMessage: `Thanks for working out, ${record.memberName}! You trained for ${record.duration} minutes.` });
  } catch (error) {
    next(error);
  }
});

app.get('/api/workers/attendance/daily', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];

    const dayRecords = await Attendance.find({ checkIn: { $gte: new Date(targetDate + 'T00:00:00'), $lte: new Date(targetDate + 'T23:59:59') } });
    const peakHours = calculatePeakHours(dayRecords);

    res.json({
      success: true,
      date: targetDate,
      totalVisits: dayRecords.length,
      uniqueMembers: new Set(dayRecords.map(r => r.memberId.toString())).size,
      peakHours,
      breakdown: {
        morning: dayRecords.filter(r => { const h = new Date(r.checkIn).getHours(); return h >= 5 && h < 12; }).length,
        afternoon: dayRecords.filter(r => { const h = new Date(r.checkIn).getHours(); return h >= 12 && h < 17; }).length,
        evening: dayRecords.filter(r => { const h = new Date(r.checkIn).getHours(); return h >= 17 && h < 22; }).length
      }
    });
  } catch (error) {
    next(error);
  }
});

function calculatePeakHours(records: any[]): { hour: number; count: number }[] {
  const hourCounts: Record<number, number> = {};
  records.forEach(r => { const h = new Date(r.checkIn).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
  return Object.entries(hourCounts).map(([h, c]) => ({ hour: Number(h), count: c })).sort((a, b) => b.count - a.count).slice(0, 3);
}

// ============================================
// WORKER ROUTES - CLASS SCHEDULER
// ============================================

app.post('/api/workers/scheduler/class', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, instructor, type, schedule, duration, capacity, room } = req.body;
    const classSession = await Class.create({ name, instructor, type, schedule, duration, capacity, room });

    logger.info('Class scheduled', { classId: classSession._id, name });

    res.json({ success: true, classSession, aiMessage: `Class "${name}" scheduled with ${instructor} at ${schedule}.` });
  } catch (error) {
    next(error);
  }
});

app.post('/api/workers/scheduler/enroll', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { classId, memberId } = req.body;
    const classSession = await Class.findById(classId);
    const member = await Member.findById(memberId);

    if (!classSession || !member) {
      return res.status(404).json({ success: false, error: 'Class or member not found', code: 'NOT_FOUND' });
    }

    if (classSession.enrolled >= classSession.capacity) {
      return res.status(400).json({ success: false, error: 'Class is full', code: 'CLASS_FULL', waitlistPosition: classSession.enrolled - classSession.capacity + 1 });
    }

    classSession.enrolled += 1;
    await classSession.save();

    res.json({ success: true, class: classSession, aiMessage: `${member.name}, you're enrolled in ${classSession.name} at ${classSession.schedule}!` });
  } catch (error) {
    next(error);
  }
});

app.get('/api/workers/scheduler/optimize', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allClasses = await Class.find({ isActive: true });

    res.json({
      success: true,
      analysis: {
        underutilized: allClasses.filter(c => c.enrolled < c.capacity * 0.5),
        optimal: allClasses.filter(c => c.enrolled >= c.capacity * 0.5 && c.enrolled < c.capacity),
        full: allClasses.filter(c => c.enrolled >= c.capacity)
      },
      aiMessage: `Schedule optimization complete.`
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SERVICE ROUTES - MEMBERS
// ============================================

app.get('/api/services/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const members = await Member.find(query);
    res.json({ members, total: members.length });
  } catch (error) {
    next(error);
  }
});

app.get('/api/services/members/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }
    const workoutPlans = await WorkoutPlan.find({ memberId: member._id });
    const nutritionPlan = await NutritionPlan.findOne({ memberId: member._id });
    res.json({ member, workoutPlans, nutritionPlan });
  } catch (error) {
    next(error);
  }
});

app.post('/api/services/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, email, fitnessGoals, preferences, membershipPlan } = req.body;
    const member = await Member.create({ name, phone, email, fitnessGoals: fitnessGoals || [], preferences: preferences || [], membershipPlan, joinDate: new Date(), status: 'active', attendanceCount: 0 });
    logger.info('Member registered', { memberId: member._id, name });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('fitmind.member.registered', { memberId: member._id.toString(), name, phone, email, fitnessGoals });
    await syncToHOJAI('member', 'registered', { memberId: member._id.toString(), name, phone, email, fitnessGoals });

    res.json({ success: true, member, aiMessage: `Welcome to FITMIND, ${name}! Your membership is now active.` });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SERVICE ROUTES - PLANS
// ============================================

app.get('/api/services/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const query = category ? { category, isActive: true } : { isActive: true };
    const plans = await MembershipPlan.find(query);
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SERVICE ROUTES - ATTENDANCE
// ============================================

app.get('/api/services/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, date } = req.query;
    const query: any = {};
    if (memberId) query.memberId = memberId;
    if (date) query.checkIn = { $gte: new Date(date as string + 'T00:00:00'), $lte: new Date(date as string + 'T23:59:59') };
    const records = await Attendance.find(query);
    res.json({ attendance: records });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SERVICE ROUTES - CLASSES
// ============================================

app.get('/api/services/classes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const query = type ? { type, isActive: true } : { isActive: true };
    const classList = await Class.find(query);
    res.json({
      classes: classList,
      stats: { total: classList.length, totalCapacity: classList.reduce((sum, c) => sum + c.capacity, 0), totalEnrolled: classList.reduce((sum, c) => sum + c.enrolled, 0) }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI BRAIN - REAL AI ENDPOINTS
// ============================================

import {
  recommendWorkouts,
  planNutrition,
  analyzeProgress,
  preventInjury,
  motivate,
  checkAIHealth
} from './services/aiBrain';

// POST /api/ai/workout/recommend - AI-powered workout recommendations
app.post('/api/ai/workout/recommend', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId, memberName, goal, fitness, daysPerWeek, injuries, equipment } = req.body;

    if (!goal) {
      return res.status(400).json({ success: false, error: 'Goal is required', code: 'VALIDATION_ERROR' });
    }

    logger.info('AI workout recommendation requested', { memberId, goal, fitness });

    const result = await recommendWorkouts({
      memberId,
      memberName,
      goal,
      fitness: fitness || 'intermediate',
      daysPerWeek,
      injuries,
      equipment
    });

    res.json({
      success: true,
      workouts: result.workouts,
      schedule: result.schedule,
      aiMessage: result.aiMessage
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/nutrition/plan - AI-powered nutrition planning
app.post('/api/ai/nutrition/plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goal, weight, height, age, dietary, allergies, mealsPerDay } = req.body;

    if (!goal || !weight || !dietary) {
      return res.status(400).json({
        success: false,
        error: 'Goal, weight, and dietary preferences are required',
        code: 'VALIDATION_ERROR'
      });
    }

    logger.info('AI nutrition plan requested', { goal, weight, dietary });

    const result = await planNutrition({
      goal,
      weight,
      height,
      age,
      dietary,
      allergies,
      mealsPerDay
    });

    res.json({
      success: true,
      calories: result.calories,
      macros: result.macros,
      meals: result.meals,
      restrictions: result.restrictions,
      aiMessage: result.aiMessage
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/progress/analyze - AI-powered progress analysis
app.post('/api/ai/progress/analyze', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId, memberName, progressData } = req.body;

    if (!memberId || !progressData || !Array.isArray(progressData)) {
      return res.status(400).json({
        success: false,
        error: 'MemberId and progressData array are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }

    logger.info('AI progress analysis requested', { memberId, dataPoints: progressData.length });

    const result = await analyzeProgress({
      memberId,
      memberName: member.name,
      progressData
    });

    res.json({
      success: true,
      trends: result.trends,
      improvements: result.improvements,
      concerns: result.concerns,
      suggestions: result.suggestions,
      confidence: result.confidence,
      aiMessage: result.aiMessage
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/injury/prevent - AI-powered injury prevention
app.post('/api/ai/injury/prevent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { exercise, form, memberHistory } = req.body;

    if (!exercise || !form) {
      return res.status(400).json({
        success: false,
        error: 'Exercise name and form description are required',
        code: 'VALIDATION_ERROR'
      });
    }

    logger.info('AI injury prevention analysis', { exercise, form: form.substring(0, 50) });

    const result = await preventInjury({
      exercise,
      form,
      memberHistory
    });

    res.json({
      success: true,
      risk: result.risk,
      corrections: result.corrections,
      warmup: result.warmup,
      alternative: result.alternative,
      aiMessage: result.aiMessage
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/motivate - AI-powered motivation
app.post('/api/ai/motivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, memberName, mood, streak, recentAchievements } = req.body;

    if (!mood) {
      return res.status(400).json({
        success: false,
        error: 'Mood is required',
        code: 'VALIDATION_ERROR'
      });
    }

    logger.info('AI motivation requested', { memberId, mood, streak });

    const result = await motivate({
      memberId,
      memberName,
      mood,
      streak,
      recentAchievements
    });

    res.json({
      success: true,
      message: result.message,
      challenge: result.challenge,
      reward: result.reward,
      streakMessage: result.streakMessage,
      tip: result.tip
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/health - Check AI Brain health
app.get('/api/ai/health', async (req: Request, res: Response) => {
  const health = await checkAIHealth();
  res.json({
    success: true,
    aiAvailable: health.available,
    model: health.model,
    latency: health.latency,
    service: 'FitMind AI Brain'
  });
});

// ============================================
// AI STATUS
// ============================================

app.get('/ai/status', (req: Request, res: Response) => {
  res.json({
    active: true,
    aiEmployees: 4,
    workers: 4,
    voiceAgents: 3,
    serviceStatus: 'operational',
    features: {
      fitnessCoach: true,
      nutritionAdvisor: true,
      membershipAdvisor: true,
      retentionManager: true,
      workoutRecommendation: true,
      nutritionPlanning: true,
      progressAnalysis: true,
      injuryPrevention: true,
      motivation: true
    }
  });
});

// ============================================
// EXPERTOS INTEGRATION - Individual Trainer Features
// ============================================

/**
 * ExpertOS Routes for FitMind:
 * - /api/fitmind/expert/profile - Trainer profile
 * - /api/fitmind/expert/clients - Member relationships
 * - /api/fitmind/expert/appointments - Booking
 * - /api/fitmind/expert/reviews - Ratings
 * - /api/fitmind/expert/suggestions - AI recommendations
 * - /api/fitmind/marketplace - Client discovery
 */
const expertOSRouter = registerExpertOS('fitmind');
app.use(expertOSRouter);

// ============================================
// MONGODB CONNECTION
// ============================================

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info('MongoDB connected successfully');

    await Promise.all([Member.createIndexes(), MembershipPlan.createIndexes(), Class.createIndexes(), Attendance.createIndexes(), WorkoutPlan.createIndexes(), NutritionPlan.createIndexes(), Subscription.createIndexes()]);

    // Seed default data
    const planCount = await MembershipPlan.countDocuments();
    if (planCount === 0) {
      await MembershipPlan.insertMany([
        { name: 'Basic Fit', duration: '1 month', price: 999, features: ['Gym access', 'Basic classes'], category: 'basic' },
        { name: 'Premium Plus', duration: '3 months', price: 2499, features: ['Gym access', 'All classes', '1 PT session/week'], category: 'premium' },
        { name: 'Elite Pro', duration: '6 months', price: 4499, features: ['24/7 access', 'Unlimited classes', '4 PT sessions/month', 'Nutrition plan'], category: 'elite' },
      ]);
      logger.info('Default plans seeded');
    }

    const classCount = await Class.countDocuments();
    if (classCount === 0) {
      await Class.insertMany([
        { name: 'Morning Yoga', instructor: 'Neha', type: 'yoga', schedule: '06:00', duration: 60, capacity: 20, enrolled: 0, room: 'Studio A' },
        { name: 'Power HIIT', instructor: 'Vikram', type: 'hiit', schedule: '07:00', duration: 45, capacity: 15, enrolled: 0, room: 'Ground Floor' },
        { name: 'Spinning', instructor: 'Arjun', type: 'spinning', schedule: '18:00', duration: 45, capacity: 12, enrolled: 0, room: 'Cycling Studio' },
        { name: 'Zumba Party', instructor: 'Maria', type: 'zumba', schedule: '19:00', duration: 60, capacity: 25, enrolled: 0, room: 'Studio B' },
      ]);
      logger.info('Default classes seeded');
    }
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: any;

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB', { error });
    }
    process.exit(0);
  });
  setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 30000);
};

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await connectMongoDB();
    server = app.listen(PORT, () => {
      logger.info('');
      logger.info('╔══════════════════════════════════════════════════════════════╗');
      logger.info('║                    FITMIND v1.0.0                        ║');
      logger.info('║               Fitness AI Operating System                ║');
      logger.info(`║  Port: ${PORT}                                               ║`);
      logger.info('║  AI Employees: Fitness Coach, Nutrition Advisor, Membership Advisor, Retention Manager ║');
      logger.info('║  ExpertOS: Enabled (Individual Trainer Features)         ║');
      logger.info('╚══════════════════════════════════════════════════════════════╝');
      logger.info('Production features enabled: MongoDB, JWT Auth, Rate Limiting, Helmet, CORS, Winston, Health Checks, Graceful Shutdown');
      logger.info('ExpertOS enabled - Individual Fitness Trainer features available');
    });
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

app.use(errorHandler);
startServer();

export default app;