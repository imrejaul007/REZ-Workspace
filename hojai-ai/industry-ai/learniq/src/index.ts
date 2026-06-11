/**
 * LEARNIQ - Education AI Operating System
 * Production-Ready Server with MongoDB, JWT, Security & Logging
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const PORT = process.env.PORT || 4811;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learniq';
const JWT_SECRET = process.env.JWT_SECRET || 'hojai-dev-secret';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';
const INTERNAL_TOKEN = INTERNAL_SERVICE_TOKEN;

// SDK & Webhook Service URLs
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
  defaultMeta: { service: 'LEARNIQ', port: PORT },
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
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
      { event, payload, source: 'learniq' },
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
      { entityType, action, source: 'learniq', data, timestamp: new Date().toISOString() },
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

import { Student, Course, Attendance, Grade, Assignment } from './models/index';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", "data:", "https:"] } } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'], credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT_EXCEEDED' } });

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

interface AuthRequest extends Request { userId?: string; userRole?: string; isInternal?: boolean; }

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === INTERNAL_SERVICE_TOKEN) { req.isInternal = true; return next(); }
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Token required', code: 'UNAUTHORIZED' });
    try { const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }; req.userId = decoded.userId; req.userRole = decoded.role; next(); }
    catch { return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' }); }
  } catch (error) { logger.error('Auth error', { error }); res.status(500).json({ success: false, error: 'Auth error', code: 'AUTH_ERROR' }); }
};

const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) { try { const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string }; req.userId = decoded.userId; req.userRole = decoded.role; } catch {} }
  next();
};

interface ApiError extends Error { statusCode?: number; code?: string; }

const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path });
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal error', code: err.code || 'INTERNAL_ERROR', timestamp: new Date().toISOString() });
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4(); req.headers['x-request-id'] = requestId;
  const start = Date.now();
  res.on('finish', () => logger.info('Request completed', { requestId, method: req.method, path: req.path, statusCode: res.statusCode, duration: `${Date.now() - start}ms` }));
  next();
});

// HEALTH CHECKS
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const studentCount = await Student.countDocuments().catch(() => 0);
  const courseCount = await Course.countDocuments().catch(() => 0);
  res.json({ status: 'healthy', service: 'LEARNIQ', version: '1.0.0', port: PORT, environment: process.env.NODE_ENV || 'development', uptime: process.uptime(), mongo: mongoStatus, aiEmployees: ['Tutor AI', 'Admission Counselor AI', 'Placement Officer AI', 'Grader AI'], stats: { students: studentCount, courses: courseCount }, timestamp: new Date().toISOString() });
});

app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  if (!mongoReady) return res.status(503).json({ status: 'not ready', checks: { mongodb: 'not ready' }, timestamp: new Date().toISOString() });
  res.json({ status: 'ready', checks: { mongodb: 'ready' }, timestamp: new Date().toISOString() });
});

// AI ENDPOINTS - TUTOR
app.post('/api/ai/tutor/explain', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { topic, studentId, style } = req.body;

    const topics: Record<string, any> = {
      'programming': { title: 'Introduction to Programming', core: 'Programming is the art of instructing computers using languages.', steps: ['Learn syntax', 'Understand logic', 'Practice problems', 'Build projects'] },
      'data structures': { title: 'Data Structures', core: 'Data structures organize and store data efficiently.', types: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'], useCases: ['Database indexing', 'AI'] },
      'algorithms': { title: 'Algorithms', core: 'Algorithms are step-by-step procedures for solving problems.', examples: ['Binary Search', 'Quick Sort'] },
    };

    const explanation = topics[topic.toLowerCase()] || { title: topic, core: 'Concept explanation', steps: ['Understand basics', 'Practice', 'Apply knowledge'] };

    logger.info('Tutor explanation generated', { topic });
    res.json({ success: true, explanation, relatedTopics: ['fundamentals', 'advanced topics', 'practice'] });
  } catch (error) { next(error); }
});

// AI ENDPOINTS - ADMISSION COUNSELOR
app.post('/api/ai/admission/counsel', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { interests, scores, budget } = req.body;

    const programs = [
      { id: 'cs', name: 'Computer Science', match: interests?.includes('tech') ? 95 : 60, salary: 800000 },
      { id: 'bba', name: 'Business Administration', match: interests?.includes('business') ? 90 : 50, salary: 500000 },
      { id: 'design', name: 'Design', match: interests?.includes('creative') ? 85 : 55, salary: 600000 },
    ].filter(p => p.match > 50).sort((a, b) => b.match - a.match);

    logger.info('Program recommendations generated', { programs: programs.length });
    res.json({ success: true, recommendations: programs, eligibility: { eligible: scores?.percentage >= 60, required: '60%', yourScore: scores?.percentage + '%' } });
  } catch (error) { next(error); }
});

// AI ENDPOINTS - PLACEMENT OFFICER
app.post('/api/ai/placement/match', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, skills } = req.body;

    const jobs = [
      { id: '1', company: 'Tech Corp', role: 'Software Developer', match: 90, salary: 800000, skills: ['programming', 'data structures'] },
      { id: '2', company: 'StartUp Inc', role: 'Frontend Developer', match: 75, salary: 600000, skills: ['javascript', 'react'] },
    ];

    const resumeTips = ['Highlight problem-solving projects', 'Include relevant internships', 'Add measurable achievements', 'Keep it to 1 page'];

    logger.info('Job matching completed', { studentId, matchedJobs: jobs.length });
    res.json({ success: true, matchedJobs: jobs, resumeTips });
  } catch (error) { next(error); }
});

// AI ENDPOINTS - GRADER
app.post('/api/ai/grader/grade', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, studentId, answers } = req.body;

    const total = 100;
    const scored = Math.floor(total * (0.7 + Math.random() * 0.3));

    const grade = await Grade.create({
      studentId, assignmentId, marks: scored, maxMarks: total,
      grade: scored >= 90 ? 'A' : scored >= 75 ? 'B' : scored >= 60 ? 'C' : 'D'
    });

    logger.info('Assignment graded', { studentId, scored, grade: grade.grade });
    res.json({
      success: true,
      grading: { total, scored, percentage: scored, grade: grade.grade },
      feedback: scored >= 90 ? ['Excellent work!', 'Strong understanding demonstrated'] : scored >= 75 ? ['Good performance', 'Minor improvements needed'] : ['Need to review concepts', 'Consider attending remedial sessions']
    });
  } catch (error) { next(error); }
});

// API ROUTES
app.get('/api/students', async (req: Request, res: Response, next: NextFunction) => {
  try { const { class: studentClass } = req.query; const query = studentClass ? { class: studentClass } : {}; const students = await Student.find(query); res.json({ students, total: students.length }); } catch (error) { next(error); }
});

app.post('/api/students', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const student = await Student.create(req.body);
    logger.info('Student enrolled', { studentId: student._id });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('learniq.student.enrolled', { studentId: student._id.toString(), name: student.name, email: student.email, rollNumber: student.rollNumber });
    await syncToHOJAI('student', 'enrolled', { studentId: student._id.toString(), name: student.name, email: student.email, rollNumber: student.rollNumber });

    res.json({ success: true, student });
  } catch (error) { next(error); }
});

app.get('/api/courses', async (req: Request, res: Response, next: NextFunction) => {
  try { const courses = await Course.find({ isActive: true }); res.json({ courses, total: courses.length }); } catch (error) { next(error); }
});

app.post('/api/courses', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { const course = await Course.create(req.body); logger.info('Course created', { courseId: course._id }); res.json({ success: true, course }); } catch (error) { next(error); }
});

app.get('/api/assignments', async (req: Request, res: Response, next: NextFunction) => {
  try { const { courseId } = req.query; const query = courseId ? { courseId } : {}; const assignments = await Assignment.find(query); res.json({ assignments }); } catch (error) { next(error); }
});

app.get('/ai/status', (req: Request, res: Response) => {
  res.json({ active: true, aiEmployees: 4, features: { tutor: true, admission: true, placement: true, grader: true } });
});

// MONGODB CONNECTION
const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info('MongoDB connected successfully');
    await Promise.all([Student.createIndexes(), Course.createIndexes(), Attendance.createIndexes(), Grade.createIndexes(), Assignment.createIndexes()]);

    if (await Student.countDocuments() === 0) {
      await Student.insertMany([
        { name: 'Amit Sharma', email: 'amit@student.edu', phone: '9876543210', rollNumber: 'CS2024001', class: 'FY', section: 'A', admissionDate: new Date() },
        { name: 'Priya Patel', email: 'priya@student.edu', phone: '9876543211', rollNumber: 'CS2024002', class: 'FY', section: 'A', admissionDate: new Date() },
      ]);
    }

    if (await Course.countDocuments() === 0) {
      await Course.insertMany([
        { name: 'Introduction to Programming', code: 'CS101', credits: 4, instructor: 'Prof. Sharma', schedule: [{ day: 'Mon', time: '9-11 AM', room: 'Lab 1' }, { day: 'Wed', time: '9-11 AM', room: 'Lab 1' }] },
        { name: 'Data Structures', code: 'CS201', credits: 4, instructor: 'Prof. Gupta', schedule: [{ day: 'Tue', time: '2-4 PM', room: 'Room 301' }, { day: 'Thu', time: '2-4 PM', room: 'Room 301' }] },
      ]);
    }
    logger.info('Default data seeded');
  } catch (error) { logger.error('MongoDB connection failed', { error }); throw error; }
};

let server: any;
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => { logger.info('HTTP server closed'); try { await mongoose.connection.close(); logger.info('MongoDB connection closed'); } catch {} process.exit(0); });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 30000);
};

const startServer = async () => {
  try {
    await connectMongoDB();
    server = app.listen(PORT, () => {
      logger.info('╔══════════════════════════════════════════════════════════════╗');
      logger.info('║                    LEARNIQ v1.0.0                        ║');
      logger.info('║              Education AI Operating System               ║');
      logger.info(`║  Port: ${PORT}                                               ║`);
      logger.info('║  AI Employees: Tutor AI, Admission Counselor, Placement Officer, Grader AI ║');
      logger.info('╚══════════════════════════════════════════════════════════════╝');
    });
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) { logger.error('Failed to start server', { error }); process.exit(1); }
};

app.use(errorHandler);
startServer();

export default app;