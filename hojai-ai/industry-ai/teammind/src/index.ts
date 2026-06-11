/**
 * TEAMMIND - HR AI Operating System
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
import { z } from 'zod';
import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 4803;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teammind';
const JWT_SECRET = process.env.JWT_SECRET || 'hojai-dev-secret';
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
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
  defaultMeta: { service: 'TEAMMIND', port: PORT },
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
      { event, payload, source: 'teammind' },
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
      { entityType, action, source: 'teammind', data, timestamp: new Date().toISOString() },
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

import { Employee, Department, Leave, Payroll, Candidate, Attendance } from './models/index';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", "data:", "https:"] } } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'], credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, error: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT_EXCEEDED' } });

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// JWT AUTHENTICATION
// ============================================

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  isInternal?: boolean;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === INTERNAL_SERVICE_TOKEN) { req.isInternal = true; return next(); }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Token required', code: 'UNAUTHORIZED' });

    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string };
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Auth error', { error });
    res.status(500).json({ success: false, error: 'Auth error', code: 'AUTH_ERROR' });
  }
};

const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: string; role: string };
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
  logger.error('Request error', { error: err.message, stack: err.stack, path: req.path });
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal error', code: err.code || 'INTERNAL_ERROR', timestamp: new Date().toISOString() });
};

// ============================================
// REQUEST LOGGING
// ============================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  const start = Date.now();
  res.on('finish', () => logger.info('Request completed', { requestId, method: req.method, path: req.path, statusCode: res.statusCode, duration: `${Date.now() - start}ms` }));
  next();
});

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const activeEmployees = await Employee.countDocuments({ status: 'active' }).catch(() => 0);
  const pendingCandidates = await Candidate.countDocuments({ status: 'applied' }).catch(() => 0);
  const pendingLeaves = await Leave.countDocuments({ status: 'pending' }).catch(() => 0);

  res.json({
    status: 'healthy', service: 'TEAMMIND', version: '1.0.0', port: PORT, environment: process.env.NODE_ENV || 'development', uptime: process.uptime(), mongo: mongoStatus,
    aiEmployees: ['Recruiter AI', 'Interview AI', 'Payroll Agent', 'HR Helpdesk', 'ExpertOS'],
    stats: { activeEmployees, totalEmployees: await Employee.countDocuments().catch(() => 0), pendingApplications: pendingCandidates, pendingLeaves },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req: Request, res: Response) => res.json({ status: 'alive', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  if (!mongoReady) return res.status(503).json({ status: 'not ready', checks: { mongodb: 'not ready' }, timestamp: new Date().toISOString() });
  res.json({ status: 'ready', checks: { mongodb: 'ready' }, timestamp: new Date().toISOString() });
});

// ============================================
// AI ENDPOINTS - RECRUITER AI
// ============================================

app.post('/api/ai/recruiter/screen', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { candidateId, position, requirements } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' });

    const screeningResult = screenCandidate(candidate, requirements);
    logger.info('Candidate screened', { candidateId, score: screeningResult.score });

    res.json({ success: true, candidateId, screeningResult, recommendation: screeningResult.score >= 70 ? 'Proceed to interview' : 'Consider other candidates' });
  } catch (error) { next(error); }
});

function screenCandidate(candidate: any, requirements?: any): any {
  let score = 50;
  if (requirements?.minExperience && candidate.experience >= requirements.minExperience) score += 20;
  else if (candidate.experience >= 2) score += 10;
  if (candidate.position.toLowerCase().includes(requirements?.position?.toLowerCase() || '')) score += 15;
  if (candidate.source === 'referral') score += 15;
  else if (candidate.source === 'linkedin') score += 10;

  const issues: string[] = [];
  if (candidate.experience < (requirements?.minExperience || 2)) issues.push('Below required experience');
  if (!candidate.resumeUrl) issues.push('Missing resume');

  return { score: Math.min(score, 100), issues, strengths: score > 60 ? ['Good experience', 'Relevant background'] : [] };
}

app.post('/api/ai/recruiter/jd', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { position, department, requirements } = req.body;
    const skills = requirements?.skills || ['Communication', 'Problem Solving', 'Teamwork'];
    const jd = {
      title: position, department,
      summary: `We are looking for a talented ${position} to join our ${department} team.`,
      responsibilities: [`Lead ${position.toLowerCase()} initiatives`, 'Collaborate with cross-functional teams', 'Maintain quality standards', 'Report on progress and metrics'],
      requirements: [`${requirements?.minExperience || 2}+ years of experience`, `Experience with ${skills.slice(0, 2).join(' and ')}`, 'Strong communication skills', 'Problem-solving mindset'],
      benefits: ['Competitive salary', 'Health insurance', 'Flexible work hours', 'Learning opportunities']
    };
    logger.info('Job description generated', { position, department });
    res.json({ success: true, jobDescription: jd });
  } catch (error) { next(error); }
});

// ============================================
// AI ENDPOINTS - INTERVIEW AI
// ============================================

app.post('/api/ai/interview/schedule', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { candidateId, interviewType, availableSlots } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' });

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(10, 0, 0, 0);
    const slot = availableSlots?.[0] || tomorrow.toISOString();
    candidate.status = 'interview';
    await candidate.save();

    const prep = ['Review candidate\'s resume and portfolio', 'Prepare role-specific technical questions', 'Set up video conferencing link'];
    if (interviewType === 'technical') prep.push('Prepare coding challenge');
    else if (interviewType === 'hr') prep.push('Prepare compensation discussion points');

    logger.info('Interview scheduled', { candidateId, slot });
    res.json({ success: true, candidateId, interview: { scheduledAt: slot, type: interviewType || 'technical', candidateName: candidate.name, position: candidate.position }, preparation: prep });
  } catch (error) { next(error); }
});

app.post('/api/ai/interview/feedback', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { candidateId, interviewerNotes, rating } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' });

    const categories = [
      { name: 'Technical Skills', score: rating - 0.2 + Math.random() * 0.4 },
      { name: 'Communication', score: rating + Math.random() * 0.3 },
      { name: 'Culture Fit', score: rating - 0.1 + Math.random() * 0.2 },
      { name: 'Problem Solving', score: rating + Math.random() * 0.2 }
    ];
    const averageScore = Math.min(5, Math.max(1, categories.reduce((sum, c) => sum + c.score, 0) / categories.length)).toFixed(1);

    logger.info('Interview feedback analyzed', { candidateId, averageScore });
    res.json({ success: true, analysis: { categories, averageScore, keyStrengths: ['Strong communication', 'Good technical knowledge'], areasForGrowth: ['Could improve on leadership'] }, recommendation: Number(averageScore) >= 3.5 ? 'Move to offer stage' : 'Need more evaluation' });
  } catch (error) { next(error); }
});

// ============================================
// AI ENDPOINTS - PAYROLL AGENT
// ============================================

app.post('/api/ai/payroll/process', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.body;
    const period = `${year}-${(month as string).padStart(2, '0')}`;
    const activeEmployees = await Employee.find({ status: 'active' });
    const payrollResults = await Promise.all(activeEmployees.map(emp => calculatePayroll(emp, period)));

    logger.info('Payroll processed', { period, employeeCount: payrollResults.length });
    res.json({ success: true, period, totalEmployees: payrollResults.length, totalPayroll: payrollResults.reduce((sum, p) => sum + p.netSalary, 0), breakdown: payrollResults });
  } catch (error) { next(error); }
});

async function calculatePayroll(employee: any, month: string): Promise<any> {
  const basic = employee.salary * 0.6;
  const hra = employee.salary * 0.2;
  const allowances = employee.salary * 0.2;
  const deductions = basic * 0.12;
  const tax = (basic + hra) * 0.1;
  const netSalary = basic + hra + allowances - deductions - tax;

  const payroll = await Payroll.create({ employeeId: employee._id, month, basic, hra, allowances, deductions, tax, netSalary, status: 'calculated' });
  return payroll;
}

app.get('/api/ai/payroll/slip/:employeeId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' });

    const payroll = await Payroll.findOne({ employeeId, month });
    if (!payroll) return res.status(404).json({ success: false, error: 'Payroll record not found', code: 'NOT_FOUND' });

    res.json({ success: true, employee: { id: employee.id, name: employee.name, department: employee.department }, payroll: { ...payroll.toObject(), earnings: { basic: payroll.basic, hra: payroll.basic * 0.33, allowances: payroll.allowances }, deductions: { pf: payroll.deductions, tax: payroll.tax } } });
  } catch (error) { next(error); }
});

// ============================================
// AI ENDPOINTS - HR HELPDESK
// ============================================

app.post('/api/ai/helpdesk/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, query } = req.body;
    const response = processHRQuery(query, employeeId);
    res.json({ success: true, response });
  } catch (error) { next(error); }
});

function processHRQuery(query: string, employeeId?: string): any {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('leave') || lowerQuery.includes('holiday')) {
    return {
      type: 'leave_info',
      message: 'To apply for leave: POST /api/leaves with startDate, endDate, and reason.',
      holidays: ['Republic Day (Jan 26)', 'Holi (Mar 14)', 'Independence Day (Aug 15)'],
      leaveBalance: employeeId ? { casual: 12, earned: 15, sick: 10, used: { casual: 3, earned: 5, sick: 2 } } : null
    };
  }
  if (lowerQuery.includes('salary') || lowerQuery.includes('payroll')) return { type: 'salary_info', message: 'Your salary is processed on the last working day of each month.', action: 'Contact payroll@company.com' };
  if (lowerQuery.includes('policy') || lowerQuery.includes('rules')) return { type: 'policy_info', message: 'Our HR policies cover attendance, leave, code of conduct, and benefits.', documents: ['Employee Handbook', 'Leave Policy', 'Code of Conduct'] };
  if (lowerQuery.includes('benefits') || lowerQuery.includes('insurance')) return { type: 'benefits_info', message: 'You have access to:', benefits: ['Health Insurance', 'Life Insurance', 'Meal Coupons', 'Transport Allowance', 'Learning & Development Budget'] };

  return { type: 'general', message: 'I can help with leave applications, salary queries, policy information, and benefits.' };
}

// ============================================
// AI ENDPOINTS - LEAVE MANAGEMENT
// ============================================

app.post('/api/ai/leave/recommend', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' });

    const leaveBalance = { casual: 12, earned: 15, sick: 10, used: { casual: 3, earned: 5, sick: 2 } };
    const recommended = [];
    if (leaveBalance.casual - leaveBalance.used.casual > 5) recommended.push('Take a casual leave - you have plenty');
    if (leaveBalance.earned - leaveBalance.used.earned > 5) recommended.push('Consider using earned leave before it expires');

    logger.info('Leave recommendation generated', { employeeId });
    res.json({ success: true, employee: { id: employee._id, name: employee.name }, leaveBalance, recommendations: recommended });
  } catch (error) { next(error); }
});

// ============================================
// WORKER ROUTES - ATTENDANCE
// ============================================

app.post('/api/workers/attendance/checkin', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' });

    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.create({ employeeId: employee._id, date: today, checkIn: new Date(), status: 'present' });

    logger.info('Employee checked in', { employeeId });
    res.json({ success: true, record, message: `Checked in at ${new Date().toLocaleTimeString()}` });
  } catch (error) { next(error); }
});

app.post('/api/workers/attendance/checkout', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ employeeId, date: today });

    if (!record) return res.status(404).json({ success: false, error: 'No check-in record found', code: 'NOT_FOUND' });

    record.checkOut = new Date();
    const hoursWorked = (record.checkOut.getTime() - record.checkIn!.getTime()) / (1000 * 60 * 60);
    if (hoursWorked > 9) record.overtime = hoursWorked - 9;
    await record.save();

    logger.info('Employee checked out', { employeeId, hoursWorked });
    res.json({ success: true, record, hoursWorked: hoursWorked.toFixed(1), overtime: record.overtime || 0 });
  } catch (error) { next(error); }
});

app.get('/api/workers/attendance/report', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;
    const period = `${year}-${(month as string).padStart(2, '0')}`;
    const records = await Attendance.find({ date: { $regex: `^${period}` } });

    const summary = {
      totalDays: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      leave: records.filter(r => r.status === 'leave').length,
      totalOvertime: records.reduce((sum, r) => sum + (r.overtime || 0), 0)
    };

    res.json({ success: true, period, summary });
  } catch (error) { next(error); }
});

// ============================================
// API ROUTES - EMPLOYEES
// ============================================

app.post('/api/employees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, department, designation, salary } = req.body;
    const employee = await Employee.create({ name, email, phone, department, designation, salary, joiningDate: new Date(), status: 'onboarding' });
    logger.info('Employee created', { employeeId: employee._id, name });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('teammind.employee.created', { employeeId: employee._id.toString(), name, email, department, designation });
    await syncToHOJAI('employee', 'created', { employeeId: employee._id.toString(), name, email, department, designation });

    res.json({ success: true, employee, onboardingTasks: ['Complete documentation', 'IT setup', 'Team introduction'] });
  } catch (error) { next(error); }
});

app.get('/api/employees', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, status } = req.query;
    const query: any = {};
    if (department) query.department = department;
    if (status) query.status = status;
    const employees = await Employee.find(query);
    res.json({ employees, total: employees.length });
  } catch (error) { next(error); }
});

app.get('/api/employees/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found', code: 'EMPLOYEE_NOT_FOUND' });
    res.json({ employee });
  } catch (error) { next(error); }
});

// ============================================
// API ROUTES - CANDIDATES
// ============================================

app.post('/api/candidates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, position, experience, resumeUrl, source } = req.body;
    const candidate = await Candidate.create({ name, email, phone, position, experience, resumeUrl, source: source || 'website', status: 'applied', appliedAt: new Date() });
    logger.info('Candidate applied', { candidateId: candidate._id, name });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('teammind.candidate.applied', { candidateId: candidate._id.toString(), name, email, position, source });
    await syncToHOJAI('candidate', 'applied', { candidateId: candidate._id.toString(), name, email, position, source });

    res.json({ success: true, candidate, message: 'Application received. We will review and get back to you.' });
  } catch (error) { next(error); }
});

app.get('/api/candidates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, position } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (position) query.position = { $regex: position, $options: 'i' };
    const candidates = await Candidate.find(query);
    res.json({ candidates, total: candidates.length });
  } catch (error) { next(error); }
});

// ============================================
// API ROUTES - LEAVES
// ============================================

app.post('/api/leaves', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;
    const leave = await Leave.create({ employeeId, type, startDate: new Date(startDate), endDate: new Date(endDate), reason, status: 'pending' });
    logger.info('Leave application submitted', { leaveId: leave._id, employeeId });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('teammind.leave.created', { leaveId: leave._id.toString(), employeeId, type, startDate, endDate });
    await syncToHOJAI('leave', 'created', { leaveId: leave._id.toString(), employeeId, type, startDate, endDate });

    res.json({ success: true, leave, message: 'Leave application submitted for approval.' });
  } catch (error) { next(error); }
});

app.get('/api/leaves', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { employeeId, status } = req.query;
    const query: any = {};
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    const leaves = await Leave.find(query).populate('employeeId', 'name department');
    res.json({ leaves });
  } catch (error) { next(error); }
});

app.post('/api/leaves/:id/approve', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, error: 'Leave not found', code: 'LEAVE_NOT_FOUND' });

    leave.status = 'approved';
    leave.approvedBy = req.body.approvedBy || 'HR Manager';
    leave.approvedAt = new Date();
    await leave.save();

    logger.info('Leave approved', { leaveId: leave._id });
    res.json({ success: true, leave, message: 'Leave approved.' });
  } catch (error) { next(error); }
});

// ============================================
// API ROUTES - DEPARTMENTS
// ============================================

app.get('/api/departments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await Department.find();
    const employees = await Employee.find();
    const enriched = departments.map(d => ({ ...d.toObject(), employeeCount: employees.filter(e => e.department === d.name).length }));
    res.json({ departments: enriched });
  } catch (error) { next(error); }
});

// ============================================
// AI STATUS
// ============================================

app.get('/ai/status', (req: Request, res: Response) => {
  res.json({ active: true, aiEmployees: 4, features: { recruiter: true, interview: true, payroll: true, helpdesk: true } });
});

// ============================================
// MONGODB CONNECTION
// ============================================

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info('MongoDB connected successfully');

    await Promise.all([Employee.createIndexes(), Department.createIndexes(), Leave.createIndexes(), Payroll.createIndexes(), Candidate.createIndexes(), Attendance.createIndexes()]);

    // Seed default departments
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      await Department.insertMany([
        { name: 'Engineering', employeeCount: 0 },
        { name: 'Marketing', employeeCount: 0 },
        { name: 'Sales', employeeCount: 0 },
        { name: 'Operations', employeeCount: 0 },
        { name: 'HR', employeeCount: 0 }
      ]);
      logger.info('Default departments seeded');
    }

    // Seed sample employees
    const empCount = await Employee.countDocuments();
    if (empCount === 0) {
      await Employee.insertMany([
        { name: 'Priya Sharma', email: 'priya@company.com', phone: '9876543210', department: 'Engineering', designation: 'Senior Developer', joiningDate: new Date('2023-01-15'), salary: 85000, status: 'active' },
        { name: 'Rahul Verma', email: 'rahul@company.com', phone: '9876543211', department: 'Engineering', designation: 'Tech Lead', joiningDate: new Date('2022-06-01'), salary: 120000, status: 'active' },
        { name: 'Sneha Patel', email: 'sneha@company.com', phone: '9876543212', department: 'Marketing', designation: 'Marketing Manager', joiningDate: new Date('2023-03-10'), salary: 75000, status: 'active' },
        { name: 'Amit Kumar', email: 'amit@company.com', phone: '9876543213', department: 'Sales', designation: 'Sales Executive', joiningDate: new Date('2024-01-05'), salary: 45000, status: 'active' }
      ]);
      logger.info('Sample employees seeded');
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
    try { await mongoose.connection.close(); logger.info('MongoDB connection closed'); } catch {}
    process.exit(0);
  });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 30000);
};

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await connectMongoDB();
    server = app.listen(PORT, () => {
      logger.info('╔══════════════════════════════════════════════════════════════╗');
      logger.info('║                    TEAMMIND v1.0.0                        ║');
      logger.info('║              HR AI Operating System                        ║');
      logger.info(`║  Port: ${PORT}                                               ║`);
      logger.info('║  AI Employees: Recruiter AI, Interview AI, Payroll Agent, HR Helpdesk ║');
      logger.info('╚══════════════════════════════════════════════════════════════╝');
      logger.info('Production features: MongoDB, JWT Auth, Rate Limiting, Helmet, CORS, Winston, Health Checks, Graceful Shutdown');
    });
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// ============================================
// EXPERTOS - Professional AI Twin for HR Professionals
// ============================================

const expertOSRouter = registerExpertOS('teammind');
app.use('/api/expert-os', expertOSRouter);

app.use(errorHandler);
startServer();

export default app;