/**
 * REZ Capital Service
 * Business lending and working capital for merchants
 *
 * Features:
 * - Capital application processing
 * - EMI calculation
 * - Interest rate calculation
 * - Merchant credit assessment
 * - Loan disbursement tracking
 *
 * Database: MongoDB with mongoose ODM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-capital';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// Capital Application Schema
const capitalApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  purpose: { type: String, required: true },
  tenure: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'],
    default: 'pending',
    index: true
  },
  interestRate: { type: Number, required: true },
  emi: { type: Number, required: true },
  processingFee: { type: Number, default: 0 },
  totalInterest: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  rejectionReason: String,
  approvedAt: Date,
  disbursedAt: Date,
  closedAt: Date,
  disbursementAmount: Number,
  documents: [{
    type: { type: String },
    url: String,
    verified: { type: Boolean, default: false }
  }],
  creditScore: Number,
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  remarks: String
}, { timestamps: true });

// EMI Schema for capital repayments
const capitalEMISchema = new mongoose.Schema({
  applicationId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  emiNumber: { type: Number, required: true },
  totalEMIs: { type: Number, required: true },
  amount: { type: Number, required: true },
  principal: { type: Number, required: true },
  interest: { type: Number, required: true },
  outstanding: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'skipped'],
    default: 'pending',
    index: true
  },
  lateFee: { type: Number, default: 0 },
  paymentMethod: String,
  transactionId: String
}, { timestamps: true });

// Merchant Credit Profile
const merchantCreditSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  businessName: String,
  businessType: String,
  creditLimit: { type: Number, default: 0 },
  creditUsed: { type: Number, default: 0 },
  creditAvailable: { type: Number, default: 0 },
  creditScore: { type: Number, default: 600 },
  totalBorrowed: { type: Number, default: 0 },
  totalRepaid: { type: Number, default: 0 },
  activeLoans: { type: Number, default: 0 },
  defaultedLoans: { type: Number, default: 0 },
  avgRepaymentDays: { type: Number, default: 0 },
  bankStatements: [{
    month: String,
    avgBalance: Number,
    totalCredits: Number,
    totalDebits: Number,
    bouncedCheques: { type: Number, default: 0 }
  }],
  gstReturns: [{
    month: String,
    filed: { type: Boolean, default: false },
    turnover: Number
  }],
  status: { type: String, enum: ['active', 'suspended', 'blacklisted'], default: 'active' }
}, { timestamps: true });

// Create models
const CapitalApplication = mongoose.model('CapitalApplication', capitalApplicationSchema);
const CapitalEMI = mongoose.model('CapitalEMI', capitalEMISchema);
const MerchantCredit = mongoose.model('MerchantCredit', merchantCreditSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateInterestRate(amount: number, tenure: number): number {
  // Base rate: 12%
  let rate = 12;

  // Amount-based adjustment
  if (amount > 10000000) rate -= 2; // Large loans get better rates
  else if (amount > 5000000) rate -= 1;

  // Tenure-based adjustment
  if (tenure > 24) rate += 1;

  return rate;
}

function calculateEMI(amount: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token-here';

function requireInternal(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  if (token !== INTERNAL_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const stats = {
      applications: await CapitalApplication.countDocuments(),
      activeApplications: await CapitalApplication.countDocuments({ status: 'approved' }),
      emis: await CapitalEMI.countDocuments(),
      merchants: await MerchantCredit.countDocuments()
    };

    res.json({
      status: 'ok',
      service: 'REZ-capital-service',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'REZ-capital-service',
      error: (error as Error).message
    });
  }
});

// ============================================
// MERCHANT CREDIT APIS
// ============================================

// Create merchant credit profile
app.post('/api/merchants/credit', requireInternal, async (req, res) => {
  try {
    const { merchantId, businessName, businessType } = req.body;

    if (!merchantId) {
      res.status(400).json({ error: 'merchantId is required' });
      return;
    }

    const existing = await MerchantCredit.findOne({ merchantId });
    if (existing) {
      res.status(400).json({ error: 'Merchant credit profile already exists' });
      return;
    }

    const profile = new MerchantCredit({
      merchantId,
      businessName,
      businessType,
      creditScore: 600,
      creditLimit: 100000 // Default limit
    });

    await profile.save();
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get merchant credit profile
app.get('/api/merchants/:merchantId/credit', requireInternal, async (req, res) => {
  try {
    const profile = await MerchantCredit.findOne({ merchantId: req.params.merchantId });

    if (!profile) {
      res.status(404).json({ error: 'Merchant credit profile not found' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update merchant credit score
app.patch('/api/merchants/:merchantId/credit-score', requireInternal, async (req, res) => {
  try {
    const { creditScore, creditLimit } = req.body;
    const profile = await MerchantCredit.findOne({ merchantId: req.params.merchantId });

    if (!profile) {
      res.status(404).json({ error: 'Merchant credit profile not found' });
      return;
    }

    if (creditScore !== undefined) profile.creditScore = creditScore;
    if (creditLimit !== undefined) {
      profile.creditLimit = creditLimit;
      profile.creditAvailable = creditLimit - profile.creditUsed;
    }

    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// CAPITAL APPLICATION APIS
// ============================================

// Apply for business capital
app.post('/api/capital/apply', requireInternal, async (req, res) => {
  try {
    const { merchantId, amount, purpose, tenure } = req.body;

    if (!merchantId || !amount || !purpose) {
      res.status(400).json({ error: 'Missing required fields: merchantId, amount, purpose' });
      return;
    }

    if (amount < 10000 || amount > 50000000) {
      res.status(400).json({ error: 'Amount must be between ₹10,000 and ₹5 Crore' });
      return;

    }

    // Check merchant credit profile
    const merchantProfile = await MerchantCredit.findOne({ merchantId });
    if (merchantProfile && amount > merchantProfile.creditAvailable) {
      res.status(400).json({
        error: `Exceeds credit limit. Available: ₹${merchantProfile.creditAvailable}`
      });
      return;
    }

    const applicationId = `cap_${uuidv4()}`;
    const interestRate = calculateInterestRate(amount, tenure);
    const emi = calculateEMI(amount, interestRate, tenure);
    const totalInterest = (emi * tenure) - amount;
    const processingFee = Math.round(amount * 0.01); // 1% processing fee

    const application = new CapitalApplication({
      applicationId,
      merchantId,
      amount,
      purpose,
      tenure,
      status: 'pending',
      interestRate,
      emi,
      processingFee,
      totalInterest,
      totalAmount: (emi * tenure) + processingFee,
      creditScore: merchantProfile?.creditScore || 600
    });

    await application.save();

    res.status(201).json({
      success: true,
      data: {
        applicationId,
        amount,
        interestRate,
        emi,
        tenure,
        processingFee,
        totalInterest,
        totalAmount: (emi * tenure) + processingFee,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get application status
app.get('/api/capital/:applicationId', requireInternal, async (req, res) => {
  try {
    const application = await CapitalApplication.findOne({ applicationId: req.params.applicationId });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Get EMIs for this application
    const emis = await CapitalEMI.find({ applicationId: req.params.applicationId }).sort({ emiNumber: 1 });

    res.json({
      success: true,
      data: {
        ...application.toObject(),
        emis,
        paidEMIs: emis.filter(e => e.status === 'paid').length,
        pendingEMIs: emis.filter(e => e.status === 'pending' || e.status === 'overdue').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all applications for a merchant
app.get('/api/capital/merchant/:merchantId', requireInternal, async (req, res) => {
  try {
    const { status } = req.query;
    const query: Record<string, unknown> = { merchantId: req.params.merchantId };

    if (status) {
      query.status = status;
    }

    const applications = await CapitalApplication.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Approve capital application
app.post('/api/capital/:applicationId/approve', requireInternal, async (req, res) => {
  try {
    const application = await CapitalApplication.findOne({ applicationId: req.params.applicationId });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const { disbursementAmount, remarks } = req.body;

    application.status = 'approved';
    application.approvedAt = new Date();
    application.disbursementAmount = disbursementAmount || application.amount;
    if (remarks) application.remarks = remarks;

    await application.save();

    // Update merchant credit
    const merchantProfile = await MerchantCredit.findOne({ merchantId: application.merchantId });
    if (merchantProfile) {
      merchantProfile.creditUsed += application.amount;
      merchantProfile.creditAvailable = merchantProfile.creditLimit - merchantProfile.creditUsed;
      merchantProfile.totalBorrowed += application.amount;
      merchantProfile.activeLoans += 1;
      await merchantProfile.save();
    }

    // Create EMIs
    const now = new Date();
    const emiDocuments = [];
    for (let i = 1; i <= application.tenure; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 15); // 15th of each month
      const emiPrincipal = Math.round((application.amount / application.tenure) * 100) / 100;
      const emiInterest = Math.round((application.totalInterest / application.tenure) * 100) / 100;

      emiDocuments.push({
        applicationId: application.applicationId,
        merchantId: application.merchantId,
        emiNumber: i,
        totalEMIs: application.tenure,
        amount: application.emi,
        principal: emiPrincipal,
        interest: emiInterest,
        outstanding: application.emi,
        dueDate,
        status: 'pending',
        lateFee: 0
      });
    }

    await CapitalEMI.insertMany(emiDocuments);

    res.json({
      success: true,
      data: {
        application,
        emisCreated: application.tenure,
        disbursementAmount: application.disbursementAmount
      }
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Reject capital application
app.post('/api/capital/:applicationId/reject', requireInternal, async (req, res) => {
  try {
    const { reason } = req.body;
    const application = await CapitalApplication.findOne({ applicationId: req.params.applicationId });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    application.status = 'rejected';
    application.rejectionReason = reason;
    await application.save();

    res.json({ success: true, data: application, reason });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Calculate EMI for given amount
app.get('/api/capital/calculate', async (req, res) => {
  try {
    const { amount, tenure } = req.query;

    if (!amount || !tenure) {
      res.status(400).json({ error: 'Amount and tenure required' });
      return;
    }

    const amountNum = parseFloat(amount as string);
    const tenureNum = parseInt(tenure as string);
    const interestRate = calculateInterestRate(amountNum, tenureNum);
    const emi = calculateEMI(amountNum, interestRate, tenureNum);
    const totalInterest = Math.round((emi * tenureNum - amountNum) * 100) / 100;
    const totalPayment = Math.round(emi * tenureNum * 100) / 100;
    const processingFee = Math.round(amountNum * 0.01);

    res.json({
      success: true,
      data: {
        amount: amountNum,
        tenure: tenureNum,
        interestRate,
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        processingFee,
        effectiveCost: Math.round(totalPayment + processingFee)
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// EMI APIS
// ============================================

// Pay EMI
app.post('/api/capital/emis/:emiId/pay', requireInternal, async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const emi = await CapitalEMI.findById(req.params.emiId);

    if (!emi) {
      res.status(404).json({ error: 'EMI not found' });
      return;
    }

    if (emi.status === 'paid') {
      res.status(400).json({ error: 'EMI already paid' });
      return;
    }

    emi.status = 'paid';
    emi.paidDate = new Date();
    emi.paymentMethod = paymentMethod;
    emi.transactionId = transactionId;
    await emi.save();

    // Update merchant credit
    const merchantProfile = await MerchantCredit.findOne({ merchantId: emi.merchantId });
    if (merchantProfile) {
      merchantProfile.creditUsed -= emi.principal;
      merchantProfile.creditAvailable = merchantProfile.creditLimit - merchantProfile.creditUsed;
      merchantProfile.totalRepaid += emi.amount;
      await merchantProfile.save();
    }

    // Check if all EMIs are paid
    const allEMIs = await CapitalEMI.find({ applicationId: emi.applicationId });
    const paidCount = allEMIs.filter(e => e.status === 'paid').length;
    if (paidCount === allEMIs.length) {
      const application = await CapitalApplication.findOne({ applicationId: emi.applicationId });
      if (application) {
        application.status = 'closed';
        application.closedAt = new Date();
        await application.save();

        if (merchantProfile) {
          merchantProfile.activeLoans = Math.max(0, merchantProfile.activeLoans - 1);
          await merchantProfile.save();
        }
      }
    }

    const nextEMI = await CapitalEMI.findOne({
      applicationId: emi.applicationId,
      status: 'pending'
    }).sort({ emiNumber: 1 });

    res.json({
      success: true,
      data: {
        emi,
        totalPaid: emi.amount + emi.lateFee,
        nextEMI
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get EMIs for application
app.get('/api/capital/:applicationId/emis', requireInternal, async (req, res) => {
  try {
    const emis = await CapitalEMI.find({ applicationId: req.params.applicationId }).sort({ emiNumber: 1 });
    res.json({ success: true, data: emis });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// DASHBOARD
// ============================================

app.get('/api/dashboard', requireInternal, async (_req, res) => {
  try {
    const applications = await CapitalApplication.find();
    const emis = await CapitalEMI.find();
    const merchants = await MerchantCredit.find();

    const activeApplications = applications.filter(a => a.status === 'approved');
    const disbursedAmount = activeApplications.reduce((sum, a) => sum + (a.disbursementAmount || 0), 0);
    const pendingEMIs = emis.filter(e => e.status === 'pending');
    const overdueEMIs = emis.filter(e => e.status === 'overdue');

    res.json({
      success: true,
      data: {
        applications: {
          total: applications.length,
          pending: applications.filter(a => a.status === 'pending').length,
          approved: activeApplications.length,
          rejected: applications.filter(a => a.status === 'rejected').length,
          closed: applications.filter(a => a.status === 'closed').length
        },
        financial: {
          totalDisbursed: disbursedAmount,
          totalOutstanding: pendingEMIs.reduce((sum, e) => sum + e.outstanding, 0),
          totalLateFees: overdueEMIs.reduce((sum, e) => sum + e.lateFee, 0)
        },
        merchants: {
          total: merchants.length,
          active: merchants.filter(m => m.status === 'active').length,
          suspended: merchants.filter(m => m.status === 'suspended').length,
          avgCreditScore: Math.round(merchants.reduce((sum, m) => sum + m.creditScore, 0) / merchants.length)
        },
        risk: {
          defaultRate: applications.length > 0
            ? Math.round(applications.filter(a => a.status === 'rejected').length / applications.length * 100)
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`REZ Capital Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;