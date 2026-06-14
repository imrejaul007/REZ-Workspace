/**
 * CorpPerks Integration Service
 *
 * Employee targeting for AdBazaar.
 * Enables B2B advertising to verified employees of partner companies.
 *
 * Port: 4555
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// MODELS
// ============================================================================

/**
 * Company/Employer profile
 */
interface ICompany extends Document {
  companyId: string;
  name: string;
  industry: string;
  size: 'startup' | 'sme' | 'corporate' | 'enterprise';

  // Verification
  verified: boolean;
  verificationDate?: Date;

  // Location
  city: string;
  offices: Array<{
    name: string;
    address: string;
    employees: number;
  }>;

  // Benefits
  offeredBenefits: string[];

  // Targeting
  avgSalary: number;
  employeeAgeRange: { min: number; max: number };
  roles: string[];

  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
  companyId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  industry: { type: String, required: true, index: true },
  size: { type: String, enum: ['startup', 'sme', 'corporate', 'enterprise'] },

  verified: { type: Boolean, default: false },
  verificationDate: Date,

  city: { type: String, required: true, index: true },
  offices: [{
    name: String,
    address: String,
    employees: Number,
  }],

  offeredBenefits: [String],

  avgSalary: Number,
  employeeAgeRange: {
    min: Number,
    max: Number,
  },
  roles: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Company = model<ICompany>('Company', companySchema);

/**
 * Employee profile
 */
interface IEmployee extends Document {
  employeeId: string;
  userId?: string;
  email: string;

  // Company
  companyId: string;
  companyName: string;

  // Profile
  name: string;
  department?: string;
  role?: string;
  level?: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';

  // Demographics
  age?: number;
  city: string;

  // Verification
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Spending
  monthlySpend?: number;
  categories: string[];

  // Loyalty
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Engagement
  engagement: {
    emailsOpened: number;
    offersViewed: number;
    offersUsed: number;
    referrals: number;
  };

  // Targeting
  tags: string[];
  interests: string[];

  lastActive: Date;
  createdAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true, index: true },
  userId: String,
  email: { type: String, required: true, lowercase: true, index: true },

  companyId: { type: String, required: true, index: true },
  companyName: String,

  name: { type: String, required: true },
  department: String,
  role: String,
  level: String,

  age: Number,
  city: { type: String, required: true, index: true },

  verified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },

  monthlySpend: Number,
  categories: [String],

  loyaltyTier: String,

  engagement: {
    emailsOpened: { type: Number, default: 0 },
    offersViewed: { type: Number, default: 0 },
    offersUsed: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
  },

  tags: [String],
  interests: [String],

  lastActive: Date,
  createdAt: { type: Date, default: Date.now },
});

employeeSchema.index({ companyId: 1, level: 1 });

const Employee = model<IEmployee>('Employee', employeeSchema);

// ============================================================================
// SERVICES
// ============================================================================

class CorpPerksService {
  /**
   * Get company by ID
   */
  async getCompany(companyId: string): Promise<ICompany | null> {
    return Company.findOne({ companyId, verified: true });
  }

  /**
   * Get employees by company
   */
  async getEmployeesByCompany(companyId: string, options?: {
    department?: string;
    level?: string;
    limit?: number;
  }): Promise<IEmployee[]> {
    const query: Record<string, unknown> = { companyId, verified: true };

    if (options?.department) query.department = options.department;
    if (options?.level) query.level = options.level;

    return Employee.find(query).limit(options?.limit || 100);
  }

  /**
   * Get employees by industry
   */
  async getEmployeesByIndustry(industry: string): Promise<IEmployee[]> {
    const companies = await Company.find({ industry, verified: true });
    const companyIds = companies.map(c => c.companyId);

    return Employee.find({
      companyId: { $in: companyIds },
      verified: true,
    }).limit(500);
  }

  /**
   * Get employees by city
   */
  async getEmployeesByCity(city: string): Promise<IEmployee[]> {
    return Employee.find({ city, verified: true }).limit(500);
  }

  /**
   * Get employee by email
   */
  async getEmployeeByEmail(email: string): Promise<IEmployee | null> {
    return Employee.findOne({ email: email.toLowerCase() });
  }

  /**
   * Get verified employees count
   */
  async getVerifiedCount(params?: {
    companyId?: string;
    city?: string;
    industry?: string;
  }): Promise<number> {
    const query: Record<string, unknown> = { verified: true };
    if (params?.companyId) query.companyId = params.companyId;
    if (params?.city) query.city = params.city;

    if (params?.industry) {
      const companies = await Company.find({ industry: params.industry, verified: true });
      query.companyId = { $in: companies.map(c => c.companyId) };
    }

    return Employee.countDocuments(query);
  }

  /**
   * Get companies by size
   */
  async getCompaniesBySize(size: ICompany['size']): Promise<ICompany[]> {
    return Company.find({ size, verified: true });
  }

  /**
   * Get employee segment for targeting
   */
  async getEmployeeSegment(params: {
    companyIds?: string[];
    industries?: string[];
    cities?: string[];
    levels?: string[];
    interests?: string[];
    minEngagement?: number;
  }): Promise<{
    employees: string[];
    companies: string[];
    estimatedReach: number;
    demographics: {
      byCity: Record<string, number>;
      byLevel: Record<string, number>;
      byIndustry: Record<string, number>;
    };
  }> {
    const query: Record<string, unknown> = { verified: true };

    if (params.companyIds) query.companyId = { $in: params.companyIds };
    if (params.cities) query.city = { $in: params.cities };
    if (params.levels) query.level = { $in: params.levels };
    if (params.interests) query.interests = { $in: params.interests };

    if (params.minEngagement) {
      query['engagement.offersUsed'] = { $gte: params.minEngagement };
    }

    const employees = await Employee.find(query).limit(1000);
    const employeeIds = employees.map(e => e.employeeId);
    const companyIds = [...new Set(employees.map(e => e.companyId))];

    // Get companies
    const companies = await Company.find({ companyId: { $in: companyIds } });

    // Build demographics
    const byCity: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};

    for (const emp of employees) {
      byCity[emp.city] = (byCity[emp.city] || 0) + 1;

      if (emp.level) {
        byLevel[emp.level] = (byLevel[emp.level] || 0) + 1;
      }
    }

    for (const company of companies) {
      byIndustry[company.industry] = (byIndustry[company.industry] || 0) +
        employees.filter(e => e.companyId === company.companyId).length;
    }

    return {
      employees: employeeIds,
      companies: companyIds,
      estimatedReach: employeeIds.length,
      demographics: { byCity, byLevel, byIndustry },
    };
  }

  /**
   * Get high-value employees (for premium targeting)
   */
  async getHighValueEmployees(params?: {
    minSpend?: number;
    minEngagement?: number;
    cities?: string[];
  }): Promise<IEmployee[]> {
    const query: Record<string, unknown> = {
      verified: true,
      loyaltyTier: { $in: ['gold', 'platinum'] },
    };

    if (params?.minSpend) query.monthlySpend = { $gte: params.minSpend };
    if (params?.minEngagement) query['engagement.offersUsed'] = { $gte: params.minEngagement };
    if (params?.cities) query.city = { $in: params.cities };

    return Employee.find(query).limit(500);
  }

  /**
   * Get corporate spending insights
   */
  async getCorporateInsights(companyId?: string): Promise<{
    totalEmployees: number;
    avgMonthlySpend: number;
    topCategories: string[];
    engagementRate: number;
    topCompanies: Array<{
      id: string;
      name: string;
      employees: number;
      avgSpend: number;
    }>;
  }> {
    const match: Record<string, unknown> = { verified: true };

    if (companyId) {
      match.companyId = companyId;
    }

    const employees = await Employee.aggregate([
      { $match: match },
      { $group: {
        _id: '$companyId',
        companyName: { $first: '$companyName' },
        count: { $sum: 1 },
        avgSpend: { $avg: '$monthlySpend' },
        avgEngagement: { $avg: '$engagement.offersUsed' },
      }},
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const totalEmployees = employees.reduce((sum, c) => sum + c.count, 0);
    const avgMonthlySpend = employees.reduce((sum, c) => sum + (c.avgSpend || 0), 0) / employees.length;
    const engagementRate = (employees.reduce((sum, c) => sum + (c.avgEngagement || 0), 0) / employees.length) / 10;

    return {
      totalEmployees,
      avgMonthlySpend: Math.round(avgMonthlySpend),
      topCategories: ['Food & Dining', 'Shopping', 'Travel', 'Entertainment', 'Health'],
      engagementRate: Math.round(engagementRate * 100),
      topCompanies: employees.map(c => ({
        id: c._id,
        name: c.companyName,
        employees: c.count,
        avgSpend: Math.round(c.avgSpend || 0),
      })),
    };
  }
}

const corpPerksService = new CorpPerksService();

// ============================================================================
// APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4555', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-integration';

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'corpperks-integration', version: '1.0.0' });
});

/**
 * GET /api/company/:id
 * Get company by ID
 */
app.get('/api/company/:id', async (req, res) => {
  try {
    const company = await corpPerksService.getCompany(req.params.id);

    if (!company) {
      res.status(404).json({ success: false, error: 'COMPANY_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Get company error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/employees
 * Get employees by filters
 */
app.get('/api/employees', async (req, res) => {
  try {
    const { companyId, city, industry, level, limit } = req.query;

    let employees: IEmployee[];

    if (companyId) {
      employees = await corpPerksService.getEmployeesByCompany(companyId as string, {
        level: level as string,
        limit: limit ? parseInt(limit as string) : 100,
      });
    } else if (city) {
      employees = await corpPerksService.getEmployeesByCity(city as string);
    } else if (industry) {
      employees = await corpPerksService.getEmployeesByIndustry(industry as string);
    } else {
      res.status(400).json({ success: false, error: 'FILTER_REQUIRED' });
      return;
    }

    res.json({
      success: true,
      data: {
        count: employees.length,
        employees: employees.map(e => ({
          id: e.employeeId,
          name: e.name,
          email: e.email,
          companyName: e.companyName,
          city: e.city,
          level: e.level,
          loyaltyTier: e.loyaltyTier,
          verified: e.verified,
        })),
      },
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/audience/segment
 * Get employee segment for targeting
 */
app.get('/api/audience/segment', async (req, res) => {
  try {
    const { cities, levels, industries, minEngagement } = req.query;

    const segment = await corpPerksService.getEmployeeSegment({
      cities: cities ? (cities as string).split(',') : undefined,
      levels: levels ? (levels as string).split(',') : undefined,
      industries: industries ? (industries as string).split(',') : undefined,
      minEngagement: minEngagement ? parseInt(minEngagement as string) : undefined,
    });

    res.json({ success: true, data: segment });
  } catch (error) {
    logger.error('Get segment error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/audience/premium
 * Get high-value employees
 */
app.get('/api/audience/premium', async (req, res) => {
  try {
    const { cities, minSpend, minEngagement } = req.query;

    const employees = await corpPerksService.getHighValueEmployees({
      cities: cities ? (cities as string).split(',') : undefined,
      minSpend: minSpend ? parseInt(minSpend as string) : undefined,
      minEngagement: minEngagement ? parseInt(minEngagement as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        count: employees.length,
        employees: employees.map(e => ({
          id: e.employeeId,
          name: e.name,
          companyName: e.companyName,
          city: e.city,
          monthlySpend: e.monthlySpend,
          loyaltyTier: e.loyaltyTier,
        })),
      },
    });
  } catch (error) {
    logger.error('Get premium error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/insights
 * Get corporate insights
 */
app.get('/api/insights', async (req, res) => {
  try {
    const { companyId } = req.query;
    const insights = await corpPerksService.getCorporateInsights(companyId as string);

    res.json({ success: true, data: insights });
  } catch (error) {
    logger.error('Get insights error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('[CorpPerks Integration] Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`[CorpPerks Integration] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('[CorpPerks Integration] Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
