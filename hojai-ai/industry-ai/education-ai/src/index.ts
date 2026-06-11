/**
 * EDUCATION-AI - Educational Institutions AI Operating System
 * Production-Ready Server with MongoDB, JWT, Security& Graceful Shutdown
 * Port: 4050
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { createLogger, format, transports } from 'winston';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const config = {
  port: parseInt(process.env.PORT || '4050', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/education_ai',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

// ============================================
// WINSTON LOGGER
// ============================================

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/education-ai.log' })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app: Express = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
}));

// ============================================
// MONGOOSE MODELS
// ============================================

// Student Schema
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  gpa: { type: Number, default: 0 },
  attendance: { type: Map, of: Boolean, default: {} },
  enrolledCourses: [{ type: String }],
  fitnessGoals: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

// Course Schema
const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  instructor: { type: String, required: true },
  credits: { type: Number, required: true },
  enrolledStudents: [{ type: String }],
  schedule: { type: String, default: 'TBD' },
  capacity: { type: Number, default: 30 },
  materials: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', courseSchema);

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  enrollmentId: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  grade: { type: String },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

// Assignment Schema
const assignmentSchema = new mongoose.Schema({
  assignmentId: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  maxPoints: { type: Number, default: 100 },
  submissions: { type: Map, of: {
    submittedAt: Date,
    points: Number,
    feedback: String
  }, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

// Announcement Schema
const announcementSchema = new mongoose.Schema({
  announcementId: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  postedAt: { type: Date, default: Date.now }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

const createStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  gradeLevel: z.string().min(1)
});

const createCourseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  instructor: z.string().min(1),
  credits: z.number().int().min(1),
  schedule: z.string().optional(),
  capacity: z.number().int().min(1).optional()
});

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1)
});

const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().or(z.date()),
  maxPoints: z.number().int().positive().optional()
});

const createAnnouncementSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const publicPaths = ['/health', '/', '/api/auth/login', '/api/stats'];

  if (publicPaths.includes(req.path) || req.path.startsWith('/health')) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

app.use(authMiddleware);

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
  const [studentCount, courseCount, enrollmentCount] = await Promise.all([
    Student.countDocuments().catch(() => 0),
    Course.countDocuments().catch(() => 0),
    Enrollment.countDocuments().catch(() => 0)
  ]);

  res.json({
    status: mongoStatus,
    service: 'education-ai',
    version: '1.0.0',
    port: config.port,
    mongodb: mongoStatus,
    stats: { students: studentCount, courses: courseCount, enrollments: enrollmentCount },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'not_ready', reason: 'MongoDB not connected' });
  }
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username && password) {
    const token = jwt.sign({ userId: username, role: 'admin' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    logger.info({ action: 'login', userId: username });
    res.json({ success: true, token, expiresIn: config.jwtExpiresIn });
  } else {
    res.status(400).json({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
  }
});

// ============================================
// STUDENT ROUTES
// ============================================

app.get('/api/students', async (req: Request, res: Response) => {
  try {
    const students = await Student.find();
    res.json({ success: true, data: students, count: students.length });
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/students', async (req: Request, res: Response) => {
  try {
    const validatedData = createStudentSchema.parse(req.body);
    const studentId = `student_${Date.now()}`;
    const student = await Student.create({ studentId, ...validatedData });
    logger.info({ action: 'student_created', id: studentId, name: validatedData.name });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating student:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

app.get('/api/students/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    logger.error('Error fetching student:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.get('/api/students/:id/report', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
    }

    const enrollments = await Enrollment.find({ studentId: req.params.id });
    const activeCourses = enrollments.filter(e => e.status === 'active');
    const completedCourses = enrollments.filter(e => e.status === 'completed');

    res.json({
      success: true,
      data: {
        student: {
          id: student.studentId,
          name: student.name,
          email: student.email,
          gradeLevel: student.gradeLevel
        },
        academicSummary: {
          currentGPA: student.gpa,
          activeCourses: activeCourses.length,
          completedCourses: completedCourses.length,
          attendanceRate: calculateAttendanceRate(student.attendance)
        },
        courseProgress: activeCourses.map(e => ({ courseId: e.courseId, status: e.status }))
      }
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ success: false, error: { code: 'REPORT_ERROR' } });
  }
});

app.put('/api/students/:id/attendance', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
    }

    const { date, present } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Date is required' } });
    }

    student.attendance.set(date, present);
    await student.save();

    logger.info({ action: 'attendance_updated', studentId: student.studentId, date, present });
    res.json({ success: true, attendance: Object.fromEntries(student.attendance) });
  } catch (error) {
    logger.error('Error updating attendance:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } });
  }
});

// ============================================
// COURSE ROUTES
// ============================================

app.get('/api/courses', async (req: Request, res: Response) => {
  try {
    const courses = await Course.find({ isActive: true });
    res.json({ success: true, data: courses, count: courses.length });
  } catch (error) {
    logger.error('Error fetching courses:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/courses', async (req: Request, res: Response) => {
  try {
    const validatedData = createCourseSchema.parse(req.body);
    const courseId = `course_${Date.now()}`;
    const course = await Course.create({ courseId, ...validatedData });
    logger.info({ action: 'course_created', id: courseId, name: validatedData.name });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating course:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

app.get('/api/courses/:id', async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({ courseId: req.params.id });
    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }
    res.json({ success: true, data: course });
  } catch (error) {
    logger.error('Error fetching course:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.put('/api/courses/:id/materials', async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({ courseId: req.params.id });
    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    const { material } = req.body;
    if (!material) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Material is required' } });
    }

    course.materials.push(material);
    await course.save();

    res.json({ success: true, materials: course.materials });
  } catch (error) {
    logger.error('Error adding material:', error);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } });
  }
});

// ============================================
// ENROLLMENT ROUTES
// ============================================

app.get('/api/enrollments', async (req: Request, res: Response) => {
  try {
    const enrollments = await Enrollment.find();
    res.json({ success: true, data: enrollments, count: enrollments.length });
  } catch (error) {
    logger.error('Error fetching enrollments:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/enrollments', async (req: Request, res: Response) => {
  try {
    const validatedData = createEnrollmentSchema.parse(req.body);

    const [student, course] = await Promise.all([
      Student.findOne({ studentId: validatedData.studentId }),
      Course.findOne({ courseId: validatedData.courseId })
    ]);

    if (!student) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
    }
    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }
    if (course.enrolledStudents.length >= course.capacity) {
      return res.status(400).json({ success: false, error: { code: 'CAPACITY_FULL', message: 'Course is at full capacity' } });
    }

    const enrollmentId = `enroll_${Date.now()}`;
    const enrollment = await Enrollment.create({
      enrollmentId,
      studentId: validatedData.studentId,
      courseId: validatedData.courseId
    });

    student.enrolledCourses.push(validatedData.courseId);
    course.enrolledStudents.push(validatedData.studentId);
    await Promise.all([student.save(), course.save()]);

    logger.info({ action: 'enrollment_created', id: enrollmentId, studentId: validatedData.studentId, courseId: validatedData.courseId });
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating enrollment:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

app.get('/api/students/:studentId/courses', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } });
    }

    const courses = await Course.find({ courseId: { $in: student.enrolledCourses } });
    res.json({ success: true, data: courses });
  } catch (error) {
    logger.error('Error fetching student courses:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.get('/api/courses/:courseId/students', async (req: Request, res: Response) => {
  try {
    const course = await Course.findOne({ courseId: req.params.courseId });
    if (!course) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } });
    }

    const students = await Student.find({ studentId: { $in: course.enrolledStudents } });
    res.json({ success: true, data: students });
  } catch (error) {
    logger.error('Error fetching course students:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

// ============================================
// ASSIGNMENT ROUTES
// ============================================

app.get('/api/assignments', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find();
    res.json({ success: true, data: assignments, count: assignments.length });
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/assignments', async (req: Request, res: Response) => {
  try {
    const validatedData = createAssignmentSchema.parse(req.body);
    const assignmentId = `assign_${Date.now()}`;
    const assignment = await Assignment.create({
      assignmentId,
      courseId: validatedData.courseId,
      title: validatedData.title,
      description: validatedData.description || '',
      dueDate: new Date(validatedData.dueDate),
      maxPoints: validatedData.maxPoints || 100
    });
    logger.info({ action: 'assignment_created', id: assignmentId, title: validatedData.title });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating assignment:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

app.get('/api/courses/:courseId/assignments', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find({ courseId: req.params.courseId });
    res.json({ success: true, data: assignments });
  } catch (error) {
    logger.error('Error fetching course assignments:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/assignments/:id/submit', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findOne({ assignmentId: req.params.id });
    if (!assignment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Student ID is required' } });
    }

    assignment.submissions.set(studentId, { submittedAt: new Date() });
    await assignment.save();

    logger.info({ action: 'assignment_submitted', assignmentId: assignment.assignmentId, studentId });
    res.json({ success: true, submission: assignment.submissions.get(studentId) });
  } catch (error) {
    logger.error('Error submitting assignment:', error);
    res.status(500).json({ success: false, error: { code: 'SUBMIT_ERROR' } });
  }
});

// ============================================
// ANNOUNCEMENT ROUTES
// ============================================

app.get('/api/announcements', async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find().sort({ postedAt: -1 });
    res.json({ success: true, data: announcements, count: announcements.length });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } });
  }
});

app.post('/api/announcements', async (req: Request, res: Response) => {
  try {
    const validatedData = createAnnouncementSchema.parse(req.body);
    const announcementId = `announce_${Date.now()}`;
    const announcement = await Announcement.create({ announcementId, ...validatedData });
    logger.info({ action: 'announcement_created', id: announcementId, title: validatedData.title });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    } else {
      logger.error('Error creating announcement:', error);
      res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
    }
  }
});

// ============================================
// STATISTICS ROUTE
// ============================================

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [totalStudents, totalCourses, totalEnrollments, totalAssignments] = await Promise.all([
      Student.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Assignment.countDocuments()
    ]);

    const avgGPA = await Student.aggregate([
      { $group: { _id: null, avgGPA: { $avg: '$gpa' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalEnrollments,
        totalAssignments,
        averageGPA: avgGPA[0]?.avgGPA || 0,
        enrollmentRate: totalStudents > 0 ? Math.round((totalEnrollments / totalStudents) * 100) : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR' } });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateAttendanceRate(attendance: Map<string, boolean>): number {
  if (attendance.size === 0) return 100;
  let present = 0;
  attendance.forEach(value => { if (value) present++; });
  return Math.round((present / attendance.size) * 100);
}

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Education AI',
    description: 'Educational Institutions AI Operating System',
    version: '1.0.0',
    port: config.port,
    endpoints: {
      health: '/health',
      students: '/api/students',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      assignments: '/api/assignments',
      announcements: '/api/announcements',
      stats: '/api/stats'
    },
    features: {
      aiEmployees: ['AI Tutor', 'Grade Advisor', 'Attendance Tracker', 'ExpertOS'],
      capabilities: ['Student Management', 'Course Tracking', 'Assessments', 'Announcements', 'Professional AI Twin']
    }
  });
});

// ============================================
// EXPERTOS - Professional AI Twin for Educators
// ============================================

const expertOSRouter = registerExpertOS('education-ai');
app.use('/api/expert-os', expertOSRouter);

// ============================================
// ERROR HANDLERS
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', path: req.path }
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'production' ? 'An internal error occurred' : err.message }
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    if (server) {
      server.close(() => logger.info('HTTP server closed'));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', { error });
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

async function startServer(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('Connected to MongoDB');

    server = app.listen(config.port, () => {
      logger.info(`Education AI started on port ${config.port}`, { port: config.port, env: config.nodeEnv });
      console.log(`\nEducation AI running on port ${config.port}\n`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      throw error;
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
}

startServer();

export default app;