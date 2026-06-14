import { logger } from ;
// RisaCare Corporate Service - Main Entry Point
// With MongoDB support


declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}


import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const PORT = parseInt(process.env.PORT || '4709', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_corporate';

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Corporate Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// Mongoose Schemas
const CorporateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  industry: String,
  employeeCount: Number,
  address: {
    line1: String,
    city: String,
    state: String,
    pincode: String
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    designation: String
  },
  subscription: {
    plan: String,
    startDate: String,
    endDate: String,
    features: [String],
    employeeLimit: Number
  },
  settings: {
    allowAnonymousAggregates: Boolean,
    requireConsent: Boolean,
    notifyOnEnrollment: Boolean
  },
  isActive: { type: Boolean, default: true },
  createdAt: String,
  updatedAt: String
});

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  corporateId: { type: String, required: true, index: true },
  userId: String,
  employeeId: String,
  department: String,
  designation: String,
  enrolledAt: String,
  status: { type: String, default: 'active' },
  wellnessBenefits: [{
    type: String,
    remaining: Number,
    total: Number
  }]
});

// Models
const CorporateModel = mongoose.model('Corporate', CorporateSchema);
const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

// ============================================
// APP SETUP
// ============================================

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-corporate-service',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

// ============================================
// CORPORATE ROUTES
// ============================================

app.get('/corporates', async (req: Request, res: Response) => {
  try {
    const allCorporates = await CorporateModel.find({}).lean();
    res.json({
      success: true,
      data: allCorporates,
      meta: { requestId: req.requestId, timestamp: now() }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch corporates' } });
  }
});

app.get('/corporates/:id', async (req: Request, res: Response) => {
  try {
    const corporate = await CorporateModel.findOne({ id: req.params.id }).lean();
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }
    res.json({ success: true, data: corporate, meta: { requestId: req.requestId, timestamp: now() } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch corporate' } });
  }
});

app.post('/corporates', async (req: Request, res: Response) => {
  try {
    const corporateId = generateId('corp');
    const corporateData = {
      ...req.body,
      id: corporateId,
      subscription: {
        ...req.body.subscription,
        startDate: now().split('T')[0]
      },
      settings: req.body.settings || {
        allowAnonymousAggregates: true,
        requireConsent: true,
        notifyOnEnrollment: true
      },
      isActive: true,
      createdAt: now(),
      updatedAt: now()
    };

    const corporate = new CorporateModel(corporateData);
    await corporate.save();

    logger.info(`Created corporate ${corporateId}: ${corporate.name}`);

    res.status(201).json({
      success: true,
      data: corporate.toObject(),
      meta: { requestId: req.requestId, timestamp: now() }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create corporate' } });
  }
});

app.put('/corporates/:id', async (req: Request, res: Response) => {
  try {
    const corporate = await CorporateModel.findOne({ id: req.params.id });
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }

    Object.assign(corporate, req.body, { updatedAt: now() });
    await corporate.save();

    res.json({ success: true, data: corporate.toObject(), meta: { requestId: req.requestId, timestamp: now() } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update corporate' } });
  }
});

// ============================================
// EMPLOYEE ROUTES
// ============================================

app.get('/corporates/:id/employees', async (req: Request, res: Response) => {
  try {
    const corporate = await CorporateModel.findOne({ id: req.params.id });
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }

    const corpEmployees = await EmployeeModel.find({ corporateId: req.params.id }).lean();

    res.json({
      success: true,
      data: corpEmployees,
      meta: {
        pagination: { page: 1, limit: 50, total: corpEmployees.length, totalPages: 1 },
        requestId: req.requestId,
        timestamp: now()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch employees' } });
  }
});

app.post('/corporates/:id/employees', async (req: Request, res: Response) => {
  try {
    const corporate = await CorporateModel.findOne({ id: req.params.id });
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }

    const employeeCount = await EmployeeModel.countDocuments({ corporateId: req.params.id });
    if (employeeCount >= corporate.subscription.employeeLimit) {
      res.status(403).json({
        success: false,
        error: { code: 'EMPLOYEE_LIMIT_EXCEEDED', message: `Employee limit (${corporate.subscription.employeeLimit}) reached` }
      });
      return;
    }

    const employeeId = generateId('emp');
    const employeeData = {
      id: employeeId,
      corporateId: req.params.id,
      userId: req.body.userId,
      employeeId: req.body.employeeId,
      department: req.body.department,
      designation: req.body.designation,
      enrolledAt: now(),
      status: 'active',
      wellnessBenefits: corporate.subscription.features.includes('health_checkups')
        ? [{ type: 'health_checkup', remaining: 1, total: 1 }]
        : []
    };

    const employee = new EmployeeModel(employeeData);
    await employee.save();

    logger.info(`Enrolled employee ${employeeId} to corporate ${req.params.id}`);

    res.status(201).json({
      success: true,
      data: employee.toObject(),
      meta: { requestId: req.requestId, timestamp: now() }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to enroll employee' } });
  }
});

app.get('/corporates/:id/analytics', async (req: Request, res: Response) => {
  try {
    const corporate = await CorporateModel.findOne({ id: req.params.id });
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }

    const enrolledCount = await EmployeeModel.countDocuments({ corporateId: req.params.id, status: 'active' });

    // Generate analytics
    const analytics = {
      overview: {
        totalEmployees: corporate.employeeCount,
        enrolledCount,
        activeUsers: Math.floor(enrolledCount * 0.7),
        engagementRate: enrolledCount > 0 ? Math.round((enrolledCount / corporate.employeeCount) * 100) : 0
      },
      healthMetrics: {
        averageHealthScore: 72,
        topConcerns: ['stress', 'sleep', 'back_pain'],
        commonConditions: ['hypertension', 'diabetes', 'obesity']
      },
      wellnessParticipation: {
        checkupCompleted: Math.floor(enrolledCount * 0.6),
        teleconsultUsed: Math.floor(enrolledCount * 0.3),
        challengesJoined: Math.floor(enrolledCount * 0.4),
        wellnessScore: 68
      },
      trends: {
        monthOverMonthEngagement: 15,
        healthScoreImprovement: 8
      },
      disclaimer: 'Analytics are anonymized and aggregated per corporate policy.'
    };

    res.json({ success: true, data: analytics, meta: { requestId: req.requestId, timestamp: now() } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate analytics' } });
  }
});

// ============================================
// WELLNESS PROGRAM ROUTES
// ============================================

app.get('/corporates/:id/wellness-programs', async (req: Request, res: Response) => {
  try {
    const corporate = await CorporateModel.findOne({ id: req.params.id });
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }

    const programs = [
      {
        id: 'wp_001',
        name: 'Annual Health Checkup',
        description: 'Comprehensive health checkup for all employees',
        type: 'preventive',
        frequency: 'annual',
        benefits: ['Full body checkup', 'Lab tests', 'Doctor consultation'],
        eligibility: 'All enrolled employees',
        participationRate: 52,
        status: 'active'
      },
      {
        id: 'wp_002',
        name: 'Mental Wellness Program',
        description: 'Counseling and stress management',
        type: 'mental_health',
        frequency: 'ongoing',
        benefits: ['Free counseling sessions', 'Stress workshops', 'Meditation resources'],
        eligibility: 'All enrolled employees',
        participationRate: 35,
        status: 'active'
      },
      {
        id: 'wp_003',
        name: 'Fitness Challenge',
        description: 'Company-wide fitness competition',
        type: 'fitness',
        frequency: 'quarterly',
        benefits: ['Step tracking', 'Team competitions', 'Rewards'],
        eligibility: 'All enrolled employees',
        participationRate: 45,
        status: 'upcoming'
      }
    ];

    res.json({ success: true, data: programs, meta: { requestId: req.requestId, timestamp: now() } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch programs' } });
  }
});

app.post('/corporates/:id/enroll', async (req: Request, res: Response) => {
  try {
    const { userId, employeeId, department, designation } = req.body;
    const corporateId = req.params.id;

    const corporate = await CorporateModel.findOne({ id: corporateId });
    if (!corporate) {
      res.status(404).json({ success: false, error: { code: 'CORPORATE_NOT_FOUND', message: 'Corporate not found' } });
      return;
    }

    // Check if already enrolled
    const existingEmployee = await EmployeeModel.findOne({ corporateId, userId });
    if (existingEmployee) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_ENROLLED', message: 'Employee already enrolled' }
      });
      return;
    }

    const employee = new EmployeeModel({
      id: generateId('emp'),
      corporateId,
      userId,
      employeeId,
      department,
      designation,
      enrolledAt: now(),
      status: 'active',
      wellnessBenefits: [
        { type: 'health_checkup', remaining: 1, total: 1 },
        { type: 'teleconsult', remaining: 6, total: 6 },
        { type: 'wellness_program', remaining: 99, total: 99 }
      ]
    });
    await employee.save();

    logger.info(`Enrolled user ${userId} to corporate ${corporateId}`);

    res.status(201).json({
      success: true,
      data: {
        enrollmentId: employee.id,
        corporateName: corporate.name,
        plan: corporate.subscription.plan,
        benefits: employee.wellnessBenefits,
        enrolledAt: employee.enrolledAt
      },
      meta: { requestId: req.requestId, timestamp: now() }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to enroll' } });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ============================================
// START SERVER
// ============================================

async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    logger.info(`RisaCare Corporate Service started on port ${PORT}`);
    logger.info(`Database: ${dbConnected ? 'connected' : 'disconnected'}`);
  });
}

startServer().catch(console.error);

export default app;