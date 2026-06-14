/**
 * CorpPerks HR Integration Service
 * Connects AdBazaar to CorpPerks for B2B and employee targeting advertising
 *
 * Port: 4954
 * Purpose: Enable B2B marketing, employee benefits advertising, and corporate campaigns
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4954;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/corpperks-integration.log' })
  ]
});

// Configuration
const CONFIG = {
  CORPPERKS_API: process.env.CORPPERKS_API || 'http://localhost:4700',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token'
};

// CorpPerks API Client
const corpperksClient = axios.create({
  baseURL: CONFIG.CORPPERKS_API,
  timeout: 10000,
  headers: {
    'X-Internal-Token': CONFIG.INTERNAL_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// MongoDB Schemas
const employeeIntentSchema = new mongoose.Schema({
  userId: String,
  corpperksUserId: String,
  companyId: String,
  company: {
    name: String,
    industry: String,
    size: String, // startup, smb, mid-market, enterprise
    tier: String // tier1, tier2, tier3
  },
  employee: {
    department: String,
    role: String,
    level: String, // junior, mid, senior, executive
    tenure: Number // years
  },
  intentSignals: {
    benefitsUsed: [String], // health, wellness, food, transport, learning
    spendingLevel: Number,
    interests: [String]
  }
}, { timestamps: true });

const EmployeeIntent = mongoose.model('EmployeeIntent', employeeIntentSchema);

const corporateAudienceSchema = new mongoose.Schema({
  segmentId: String,
  name: String,
  criteria: {
    industries: [String],
    companySizes: [String],
    departments: [String],
    levels: [String],
    benefitsUsed: [String]
  },
  size: Number,
  createdAt: Date
});

const CorporateAudience = mongoose.model('CorporateAudience', corporateAudienceSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    let corpperksStatus = 'disconnected';
    try {
      await corpperksClient.get('/health');
      corpperksStatus = 'connected';
    } catch (e) {
      corpperksStatus = 'unavailable';
    }

    res.json({
      status: 'healthy',
      service: 'corpperks-hr-integration',
      port: PORT,
      corpperksStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// ============================================
// HR DATA WEBHOOKS
// ============================================

/**
 * Receive employee activity events from CorpPerks
 * POST /api/webhooks/employee-event
 */
app.post('/api/webhooks/employee-event', async (req: Request, res: Response) => {
  try {
    const { eventType, userId, corpperksUserId, data } = req.body;

    logger.info(`Received employee event: ${eventType}`, { userId, corpperksUserId });

    if (eventType === 'benefit_used') {
      // Track benefit usage
      await EmployeeIntent.findOneAndUpdate(
        { corpperksUserId },
        {
          $set: {
            userId,
            company: data.company,
            employee: data.employee
          },
          $push: {
            'intentSignals.benefitsUsed': data.benefit
          },
          $inc: {
            'intentSignals.spendingLevel': data.amount || 0
          }
        },
        { upsert: true, new: true }
      );

      // Send to Intent Signal Aggregator
      await sendToIntentAggregator({
        source: 'corpperks',
        userId,
        intent: {
          type: 'b2b_employee',
          benefit: data.benefit,
          category: data.category,
          companyTier: data.company?.tier
        },
        timestamp: new Date()
      });
    }

    if (eventType === 'onboarding') {
      // New employee - high intent for various benefits
      await EmployeeIntent.findOneAndUpdate(
        { corpperksUserId },
        {
          $set: {
            userId,
            company: data.company,
            employee: data.employee,
            intentSignals: {
              benefitsUsed: [],
              spendingLevel: 0,
              interests: ['health', 'wellness', 'learning']
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    logger.error('Webhook error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Receive company events
 * POST /api/webhooks/company-event
 */
app.post('/api/webhooks/company-event', async (req: Request, res: Response) => {
  try {
    const { eventType, companyId, data } = req.body;

    if (eventType === 'new_benefit_added') {
      // Company added new benefit - opportunity for benefit provider ads
      await sendToIntentAggregator({
        source: 'corpperks_company',
        userId: companyId,
        intent: {
          type: 'b2b_company',
          category: 'benefit_procurement',
          companyTier: data.tier,
          industry: data.industry
        },
        timestamp: new Date()
      });
    }

    if (eventType === 'renewal_due') {
      // Company renewal approaching - B2B sales opportunity
      await sendToIntentAggregator({
        source: 'corpperks_renewal',
        companyId,
        intent: {
          type: 'b2b_renewal',
          category: 'benefits_renewal',
          currentSpend: data.currentSpend
        },
        timestamp: new Date()
      });
    }

    res.json({ success: true, processed: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CORPORATE AUDIENCE API
// ============================================

/**
 * Get corporate audience segments
 * GET /api/audiences
 */
app.get('/api/audiences', async (req: Request, res: Response) => {
  try {
    const audiences = await CorporateAudience.find();
    res.json({ success: true, audiences });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Create corporate audience segment
 * POST /api/audiences
 */
app.post('/api/audiences', async (req: Request, res: Response) => {
  try {
    const { name, criteria } = req.body;

    const audience = new CorporateAudience({
      segmentId: `corp_${Date.now()}`,
      name,
      criteria,
      size: await calculateAudienceSize(criteria),
      createdAt: new Date()
    });

    await audience.save();
    res.json({ success: true, audience });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get company-level audiences
 * GET /api/audiences/companies
 */
app.get('/api/audiences/companies', async (req: Request, res: Response) => {
  try {
    const { industry, size } = req.query;

    const companies = await EmployeeIntent.aggregate([
      {
        $group: {
          _id: '$companyId',
          companyName: { $first: '$company.name' },
          industry: { $first: '$company.industry' },
          size: { $first: '$company.size' },
          tier: { $first: '$company.tier' },
          employeeCount: { $sum: 1 },
          avgSpending: { $avg: '$intentSignals.spendingLevel' },
          topBenefits: { $push: '$intentSignals.benefitsUsed' }
        }
      },
      {
        $match: {
          ...(industry ? { industry: industry as string } : {}),
          ...(size ? { size: size as string } : {})
        }
      },
      { $sort: { employeeCount: -1 } }
    ]);

    res.json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get department-level audiences
 * GET /api/audiences/departments
 */
app.get('/api/audiences/departments', async (req: Request, res: Response) => {
  try {
    const { industry } = req.query;

    const departments = await EmployeeIntent.aggregate([
      {
        $match: industry ? { 'company.industry': industry as string } : {}
      },
      {
        $group: {
          _id: {
            department: '$employee.department',
            level: '$employee.level'
          },
          count: { $sum: 1 },
          avgSpending: { $avg: '$intentSignals.spendingLevel' },
          benefits: { $push: '$intentSignals.benefitsUsed' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      departments
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get benefit preference insights
 * GET /api/insights/benefits
 */
app.get('/api/insights/benefits', async (req: Request, res: Response) => {
  try {
    const insights = await EmployeeIntent.aggregate([
      { $unwind: '$intentSignals.benefitsUsed' },
      {
        $group: {
          _id: '$intentSignals.benefitsUsed',
          count: { $sum: 1 },
          avgSpending: { $avg: '$intentSignals.spendingLevel' },
          industries: { $addToSet: '$company.industry' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// B2B CAMPAIGN TARGETING
// ============================================

/**
 * Get companies for B2B targeting
 * GET /api/b2b/targets
 */
app.get('/api/b2b/targets', async (req: Request, res: Response) => {
  try {
    const { industry, size, tier } = req.query;

    const companies = await EmployeeIntent.aggregate([
      {
        $group: {
          _id: '$companyId',
          company: { $first: '$company' },
          employeeCount: { $sum: 1 },
          totalSpend: { $sum: '$intentSignals.spendingLevel' },
          topBenefits: { $push: '$intentSignals.benefitsUsed' }
        }
      },
      {
        $match: {
          ...(industry ? { 'company.industry': industry as string } : {}),
          ...(size ? { 'company.size': size as string } : {}),
          ...(tier ? { 'company.tier': tier as string } : {})
        }
      },
      {
        $project: {
          companyId: '$_id',
          company: 1,
          employeeCount: 1,
          totalSpend: 1,
          benefitCount: { $size: { $setUnion: '$topBenefits' } }
        }
      },
      { $sort: { employeeCount: -1 } }
    ]);

    res.json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get employee segments for benefit campaigns
 * GET /api/b2b/employees
 */
app.get('/api/b2b/employees', async (req: Request, res: Response) => {
  try {
    const { department, level, benefit } = req.query;

    const query: any = {};
    if (department) query['employee.department'] = department;
    if (level) query['employee.level'] = level;
    if (benefit) query['intentSignals.benefitsUsed'] = benefit;

    const employees = await EmployeeIntent.find(query)
      .select('userId employee department role level company intentSignals')
      .limit(1000);

    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// EXECUTIVE TARGETING
// ============================================

/**
 * Get C-suite executives for enterprise campaigns
 * GET /api/b2b/executives
 */
app.get('/api/b2b/executives', async (req: Request, res: Response) => {
  try {
    const { industry } = req.query;

    const executives = await EmployeeIntent.aggregate([
      {
        $match: {
          'employee.level': { $in: ['executive', 'senior', 'director', 'vp', 'cxo'] }
        }
      },
      {
        $group: {
          _id: {
            company: '$company',
            name: '$employee.role'
          },
          count: { $sum: 1 },
          avgSpending: { $avg: '$intentSignals.spendingLevel' }
        }
      },
      {
        $match: industry ? { '_id.company.industry': industry as string } : {}
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      count: executives.length,
      executives
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get decision makers for B2B campaigns
 * GET /api/b2b/decision-makers
 */
app.get('/api/b2b/decision-makers', async (req: Request, res: Response) => {
  try {
    // HR, Finance, and Admin decision makers
    const decisionMakers = await EmployeeIntent.find({
      'employee.department': { $in: ['HR', 'Finance', 'Admin', 'Operations'] },
      'employee.level': { $in: ['senior', 'executive', 'director'] }
    })
      .select('userId company employee')
      .limit(500);

    res.json({
      success: true,
      count: decisionMakers.length,
      decisionMakers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AD SERVING
// ============================================

/**
 * Serve corporate ad
 * POST /api/ad/serve
 */
app.post('/api/ad/serve', async (req: Request, res: Response) => {
  try {
    const { placementType, userId, context, campaignId } = req.body;

    // Get contextual ad based on corporate context
    const ad = await getCorporateAd(placementType, context);

    res.json({
      success: true,
      ad: {
        id: ad.id,
        content: ad.content,
        type: ad.type,
        cta: ad.cta
      }
    });
  } catch (error) {
    logger.error('Ad serve error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Track ad interaction
 * POST /api/ad/track
 */
app.post('/api/ad/track', async (req: Request, res: Response) => {
  try {
    const { userId, adId, action, metadata } = req.body;

    logger.info('Corporate ad track', { userId, adId, action, metadata });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function calculateAudienceSize(criteria: any): Promise<number> {
  const query: any = {};

  if (criteria.industries) {
    query['company.industry'] = { $in: criteria.industries };
  }
  if (criteria.companySizes) {
    query['company.size'] = { $in: criteria.companySizes };
  }
  if (criteria.departments) {
    query['employee.department'] = { $in: criteria.departments };
  }
  if (criteria.levels) {
    query['employee.level'] = { $in: criteria.levels };
  }

  return EmployeeIntent.countDocuments(query);
}

async function sendToIntentAggregator(data: any) {
  try {
    await axios.post('http://localhost:4800/api/signals', data, {
      headers: { 'X-Internal-Token': CONFIG.INTERNAL_TOKEN }
    });
  } catch (error) {
    logger.error('Failed to send to intent aggregator:', { error: error instanceof Error ? error.message : String(error) });
  }
}

async function getCorporateAd(placementType: string, context: any) {
  const ads: Record<string, any> = {
    employee_app: {
      content: 'Upgrade your health benefits - Special rates for employees',
      type: 'banner'
    },
    hr_dashboard: {
      content: 'Simplify benefits management - Book a demo',
      type: 'banner'
    },
    company_portal: {
      content: 'Corporate wellness program - Free trial for your team',
      type: 'banner'
    },
    email: {
      content: 'Exclusive corporate discount - Limited time offer',
      type: 'email'
    }
  };

  return {
    id: `corp_ad_${Date.now()}`,
    ...(ads[placementType] || { content: 'Corporate benefits solution', type: 'banner' }),
    cta: 'Learn More'
  };
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 CorpPerks HR Integration started on port ${PORT}`);
  logger.info(`💼 Connected to CorpPerks API: ${CONFIG.CORPPERKS_API}`);

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_integration')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;