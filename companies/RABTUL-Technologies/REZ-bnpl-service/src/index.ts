/**
 * REZ BNPL Service - Buy Now Pay Later Infrastructure
 *
 * Features:
 * - Credit limit calculation
 * - EMI plans
 * - Deferred payments
 * - Auto-debit
 * - Credit scoring
 * - Late fee calculation
 * - Merchant settlement
 *
 * Database: MongoDB with mongoose ODM
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireInternal } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4300;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-bnpl';

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// BNPL User Schema
const bnplUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  creditLimit: { type: Number, default: 5000 },
  creditUsed: { type: Number, default: 0 },
  creditAvailable: { type: Number, default: 5000 },
  creditScore: { type: Number, default: 700 },
  tier: { type: String, enum: ['basic', 'silver', 'gold', 'platinum'], default: 'basic' },
  status: { type: String, enum: ['active', 'suspended', 'blocked'], default: 'active' },
  kycStatus: { type: String, enum: ['pending', 'partial', 'verified'], default: 'pending' },
  monthlyIncome: { type: Number },
  tenure: { type: Number, default: 3 },
  lateFeeRate: { type: Number, default: 2 },
  interestRate: { type: Number, default: 2.5 },
}, { timestamps: true });

// BNPL Order Schema
const bnplOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  tenure: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  processingFee: { type: Number, required: true },
  interestAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  downPayment: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'],
    default: 'pending',
    index: true
  },
  rejectionReason: String,
  approvedAt: Date,
  completedAt: Date,
}, { timestamps: true });

// EMI Schema
const emiSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  emiNumber: { type: Number, required: true },
  totalEMIs: { type: Number, required: true },
  amount: { type: Number, required: true },
  principal: { type: Number, required: true },
  interest: { type: Number, required: true },
  outstanding: { type: Number, required: true },
  dueDate: { type: Date, required: true, index: true },
  paidDate: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'skipped'],
    default: 'pending',
    index: true
  },
  lateFee: { type: Number, default: 0 },
  paymentMethod: String,
  transactionId: String,
}, { timestamps: true });

// Merchant Config Schema
const merchantConfigSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  merchantName: { type: String, required: true },
  minAmount: { type: Number, default: 500 },
  maxAmount: { type: Number, default: 50000 },
  maxTenure: { type: Number, default: 6 },
  processingFeeRate: { type: Number, default: 2 },
  interestRate: { type: Number, default: 2 },
  merchantCommission: { type: Number, default: 1 },
  settlementDays: { type: Number, default: 3 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

// Create models
const BNPLUser = mongoose.model('BNPLUser', bnplUserSchema);
const BNPLOrder = mongoose.model('BNPLOrder', bnplOrderSchema);
const EMI = mongoose.model('EMI', emiSchema);
const MerchantConfig = mongoose.model('MerchantConfig', merchantConfigSchema);

// Interest rates by tier
const INTEREST_RATES = {
  basic: 2.5,
  silver: 2.0,
  gold: 1.5,
  platinum: 1.0
};

// Credit limits by tier
const CREDIT_LIMITS = {
  basic: 5000,
  silver: 15000,
  gold: 35000,
  platinum: 100000
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateEMI(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi * 100) / 100;
}

function determineTier(creditScore: number): 'basic' | 'silver' | 'gold' | 'platinum' {
  if (creditScore >= 750) return 'platinum';
  if (creditScore >= 650) return 'gold';
  if (creditScore >= 550) return 'silver';
  return 'basic';
}

async function calculateCreditScore(userId: string): Promise<number> {
  let score = 700; // Base score

  // Payment history (40%)
  const paidEMIs = await EMI.countDocuments({ userId, status: 'paid' });
  const overdueEMIs = await EMI.countDocuments({ userId, status: 'overdue' });
  const totalEMIs = paidEMIs + overdueEMIs;
  if (totalEMIs > 0) {
    const paymentRate = paidEMIs / totalEMIs;
    score += Math.round((paymentRate - 0.8) * 200);
  }

  // Credit utilization (30%)
  const user = await BNPLUser.findOne({ userId });
  if (user) {
    const utilizationRate = user.creditUsed / user.creditLimit;
    score -= Math.round(utilizationRate * 100);

    // KYC status (20%)
    if (user.kycStatus === 'verified') score += 50;
    else if (user.kycStatus === 'partial') score += 20;

    // Tenure (10%)
    const tenureMonths = (Date.now() - user.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000);
    score += Math.min(Math.round(tenureMonths * 2), 30);
  }

  return Math.max(300, Math.min(900, score));
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());
app.use(cors());
app.use(helmet());

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const stats = {
      users: await BNPLUser.countDocuments(),
      orders: await BNPLOrder.countDocuments(),
      emis: await EMI.countDocuments(),
      activeOrders: await BNPLOrder.countDocuments({ status: 'active' })
    };

    res.json({
      service: 'rez-bnpl-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({
      service: 'rez-bnpl-service',
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
});

// ============================================
// USER APIs
// ============================================

// Create/Register BNPL user
app.post('/api/users', requireInternal, async (req, res) => {
  try {
    const { userId, monthlyIncome, kycStatus } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
      });
      return;
    }

    // Check if already exists
    const existing = await BNPLUser.findOne({ userId });
    if (existing) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'BNPL user already exists' }
      });
      return;
    }

    // Calculate initial credit limit based on income
    const baseLimit = monthlyIncome ? Math.min(monthlyIncome * 2, CREDIT_LIMITS.basic) : CREDIT_LIMITS.basic;

    const user = new BNPLUser({
      userId,
      creditLimit: baseLimit,
      creditUsed: 0,
      creditAvailable: baseLimit,
      creditScore: 700,
      tier: 'basic',
      status: 'active',
      kycStatus: kycStatus || 'pending',
      monthlyIncome,
      tenure: 3,
      lateFeeRate: 2,
      interestRate: INTEREST_RATES.basic
    });

    await user.save();

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Get BNPL user
app.get('/api/users/:userId', requireAuth, async (req, res) => {
  try {
    const user = await BNPLUser.findOne({ userId: req.params.userId });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'BNPL user not found' }
      });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Update user KYC
app.patch('/api/users/:userId/kyc', requireInternal, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await BNPLUser.findOne({ userId: req.params.userId });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'BNPL user not found' }
      });
      return;
    }

    user.kycStatus = status;
    user.creditScore = await calculateCreditScore(user.userId);
    user.tier = determineTier(user.creditScore);
    user.creditLimit = CREDIT_LIMITS[user.tier];
    user.interestRate = INTEREST_RATES[user.tier];

    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Get credit limit
app.get('/api/users/:userId/credit', requireAuth, async (req, res) => {
  try {
    const user = await BNPLUser.findOne({ userId: req.params.userId });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'BNPL user not found' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        creditLimit: user.creditLimit,
        creditUsed: user.creditUsed,
        creditAvailable: user.creditAvailable,
        creditScore: user.creditScore,
        tier: user.tier,
        utilization: `${Math.round((user.creditUsed / user.creditLimit) * 100)}%`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// ============================================
// ORDER APIs
// ============================================

// Create BNPL order (pre-check/calculate)
app.post('/api/orders/calculate', requireAuth, async (req, res) => {
  try {
    const { userId, amount, tenure } = req.body;

    if (!userId || !amount) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and amount are required' }
      });
      return;
    }

    const user = await BNPLUser.findOne({ userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'BNPL user not found' }
      });
      return;
    }

    if (amount > user.creditAvailable) {
      res.status(400).json({
        success: false,
        error: { code: 'CREDIT_LIMIT_EXCEEDED', message: `Maximum credit available: ₹${user.creditAvailable}` }
      });
      return;
    }

    const t = tenure || 3;
    const monthlyInterestRate = user.interestRate;
    const processingFeeRate = 2;
    const downPaymentRate = 0;

    const processingFee = Math.round(amount * processingFeeRate / 100);
    const downPayment = Math.round(amount * downPaymentRate / 100);
    const principal = amount - downPayment;
    const emiAmount = calculateEMI(principal, monthlyInterestRate * 12, t);
    const totalEMIsAmount = emiAmount * t;
    const totalInterest = totalEMIsAmount - principal;
    const totalAmount = totalEMIsAmount + processingFee + downPayment;

    res.json({
      success: true,
      data: {
        eligible: true,
        amount,
        tenure: t,
        emiAmount,
        totalEMIs: t,
        processingFee,
        downPayment,
        principal,
        totalInterest,
        totalAmount,
        monthlyInterestRate,
        interestRate: monthlyInterestRate,
        effectiveCost: totalAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Create BNPL order
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { userId, merchantId, orderId, amount, tenure } = req.body;

    if (!userId || !merchantId || !amount) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId, merchantId, and amount are required' }
      });
      return;
    }

    const user = await BNPLUser.findOne({ userId });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'BNPL user not found' }
      });
      return;
    }

    if (amount > user.creditAvailable) {
      res.status(400).json({
        success: false,
        error: { code: 'CREDIT_LIMIT_EXCEEDED', message: 'Insufficient credit limit' }
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(400).json({
        success: false,
        error: { code: 'USER_SUSPENDED', message: 'BNPL is not active for this user' }
      });
      return;
    }

    const t = tenure || user.tenure;
    const monthlyInterestRate = user.interestRate;
    const processingFeeRate = 2;
    const processingFee = Math.round(amount * processingFeeRate / 100);
    const downPayment = 0;
    const principal = amount - downPayment;
    const emiAmount = calculateEMI(principal, monthlyInterestRate * 12, t);
    const totalInterest = Math.round((emiAmount * t - principal) * 100) / 100;
    const totalAmount = Math.round((emiAmount * t + processingFee + downPayment) * 100) / 100;

    const orderIdFinal = orderId || `order-${uuidv4().slice(0, 8)}`;

    // Create order
    const order = new BNPLOrder({
      orderId: orderIdFinal,
      userId,
      merchantId,
      amount,
      tenure: t,
      emiAmount,
      processingFee,
      interestAmount: totalInterest,
      totalAmount,
      downPayment,
      status: 'approved',
      approvedAt: new Date()
    });

    await order.save();

    // Update user credit
    user.creditUsed += amount;
    user.creditAvailable = user.creditLimit - user.creditUsed;
    await user.save();

    // Create EMIs
    const now = new Date();
    const emiDocuments = [];
    for (let i = 1; i <= t; i++) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const emiInterest = Math.round((totalInterest / t) * 100) / 100;
      const emiPrincipal = Math.round((emiAmount - emiInterest) * 100) / 100;

      emiDocuments.push({
        orderId: order._id.toString(),
        userId,
        emiNumber: i,
        totalEMIs: t,
        amount: emiAmount,
        principal: emiPrincipal,
        interest: emiInterest,
        outstanding: emiAmount,
        dueDate,
        status: 'pending',
        lateFee: 0
      });
    }

    await EMI.insertMany(emiDocuments);

    res.status(201).json({
      success: true,
      data: {
        order,
        emisCount: t,
        firstEMIDue: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Get order
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await BNPLOrder.findById(req.params.id);

    if (!order) {
      // Try finding by orderId
      const orderById = await BNPLOrder.findOne({ orderId: req.params.id });
      if (!orderById) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Order not found' }
        });
        return;
      }
      const orderIdFinal = orderById._id;
      const orderEMIs = await EMI.find({ orderId: orderIdFinal.toString() });

      res.json({
        success: true,
        data: {
          ...orderById.toObject(),
          emis: orderEMIs,
          paidEMIs: orderEMIs.filter(e => e.status === 'paid').length,
          pendingEMIs: orderEMIs.filter(e => e.status === 'pending' || e.status === 'overdue').length,
          overdueEMIs: orderEMIs.filter(e => e.status === 'overdue').length
        }
      });
      return;
    }

    const orderEMIs = await EMI.find({ orderId: order._id.toString() });

    res.json({
      success: true,
      data: {
        ...order.toObject(),
        emis: orderEMIs,
        paidEMIs: orderEMIs.filter(e => e.status === 'paid').length,
        pendingEMIs: orderEMIs.filter(e => e.status === 'pending' || e.status === 'overdue').length,
        overdueEMIs: orderEMIs.filter(e => e.status === 'overdue').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Get user's orders
app.get('/api/users/:userId/orders', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query: Record<string, unknown> = { userId: req.params.userId };

    if (status) {
      query.status = status;
    }

    const orders = await BNPLOrder.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// ============================================
// EMI APIs
// ============================================

// Get EMIs for order
app.get('/api/orders/:orderId/emis', requireAuth, async (req, res) => {
  try {
    const order = await BNPLOrder.findById(req.params.orderId) || await BNPLOrder.findOne({ orderId: req.params.orderId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
      return;
    }

    const orderEMIs = await EMI.find({ orderId: order._id.toString() }).sort({ emiNumber: 1 });

    res.json({ success: true, data: orderEMIs });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// Pay EMI
app.post('/api/emis/:id/pay', requireAuth, async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const emi = await EMI.findById(req.params.id);

    if (!emi) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'EMI not found' }
      });
      return;
    }

    if (emi.status === 'paid') {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_PAID', message: 'EMI already paid' }
      });
      return;
    }

    const totalAmount = emi.amount + emi.lateFee;

    emi.status = 'paid';
    emi.paidDate = new Date();
    emi.paymentMethod = paymentMethod;
    emi.transactionId = transactionId;
    await emi.save();

    // Update user credit
    const user = await BNPLUser.findOne({ userId: emi.userId });
    if (user) {
      user.creditUsed -= emi.principal;
      user.creditAvailable = user.creditLimit - user.creditUsed;
      user.creditScore = await calculateCreditScore(user.userId);
      await user.save();
    }

    // Update order status
    const order = await BNPLOrder.findById(emi.orderId);
    if (order) {
      const orderEMIs = await EMI.find({ orderId: order._id.toString() });
      const paidCount = orderEMIs.filter(e => e.status === 'paid').length;
      if (paidCount === orderEMIs.length) {
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();
      }
    }

    const nextEMI = await EMI.findOne({
      orderId: emi.orderId,
      status: 'pending'
    }).sort({ emiNumber: 1 });

    res.json({
      success: true,
      data: {
        emi,
        totalPaid: totalAmount,
        nextEMI
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// ============================================
// DASHBOARD / ANALYTICS
// ============================================

app.get('/api/dashboard', requireInternal, async (_req, res) => {
  try {
    const allUsers = await BNPLUser.find();
    const allOrders = await BNPLOrder.find();
    const allEMIs = await EMI.find();

    const activeOrders = allOrders.filter(o => o.status === 'active');
    const completedOrders = allOrders.filter(o => o.status === 'completed');
    const overdueEMIs = allEMIs.filter(e => e.status === 'overdue');
    const pendingEMIs = allEMIs.filter(e => e.status === 'pending');

    const totalDisbursed = activeOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOutstanding = pendingEMIs.reduce((sum, e) => sum + e.outstanding + e.lateFee, 0);
    const totalLateFees = overdueEMIs.reduce((sum, e) => sum + e.lateFee, 0);

    res.json({
      success: true,
      data: {
        users: {
          total: allUsers.length,
          active: allUsers.filter(u => u.status === 'active').length,
          tierDistribution: {
            basic: allUsers.filter(u => u.tier === 'basic').length,
            silver: allUsers.filter(u => u.tier === 'silver').length,
            gold: allUsers.filter(u => u.tier === 'gold').length,
            platinum: allUsers.filter(u => u.tier === 'platinum').length
          }
        },
        orders: {
          total: allOrders.length,
          active: activeOrders.length,
          completed: completedOrders.length,
          defaulted: allOrders.filter(o => o.status === 'defaulted').length,
          approvalRate: allOrders.length > 0
            ? Math.round((allOrders.filter(o => o.status === 'approved').length / allOrders.length * 100))
            : 0
        },
        emis: {
          total: allEMIs.length,
          pending: pendingEMIs.length,
          paid: allEMIs.filter(e => e.status === 'paid').length,
          overdue: overdueEMIs.length
        },
        financial: {
          totalDisbursed,
          totalOutstanding,
          totalLateFees,
          collectionRate: totalOutstanding + allEMIs.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0) > 0
            ? Math.round(allEMIs.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0) / (totalOutstanding + allEMIs.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)) * 100)
            : 0
        },
        risk: {
          defaultRate: allOrders.length > 0
            ? Math.round(allOrders.filter(o => o.status === 'defaulted').length / allOrders.length * 100)
            : 0,
          overdueRate: allEMIs.length > 0
            ? Math.round(overdueEMIs.length / allEMIs.length * 100)
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// ============================================
// MERCHANT APIs
// ============================================

app.post('/api/merchants', requireInternal, async (req, res) => {
  try {
    const { merchantId, merchantName, config } = req.body;

    if (!merchantId || !merchantName) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'merchantId and merchantName are required' }
      });
      return;
    }

    const merchantConfig = new MerchantConfig({
      merchantId,
      merchantName,
      minAmount: config?.minAmount || 500,
      maxAmount: config?.maxAmount || 50000,
      maxTenure: config?.maxTenure || 6,
      processingFeeRate: config?.processingFeeRate || 2,
      interestRate: config?.interestRate || 2,
      merchantCommission: config?.merchantCommission || 1,
      settlementDays: config?.settlementDays || 3,
      status: 'active'
    });

    await merchantConfig.save();
    res.status(201).json({ success: true, data: merchantConfig });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

app.get('/api/merchants/:merchantId/config', async (req, res) => {
  try {
    const config = await MerchantConfig.findOne({ merchantId: req.params.merchantId });

    if (!config) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Merchant config not found' }
      });
      return;
    }

    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
    });
  }
});

// ============================================
// WEBHOOKS
// ============================================

app.post('/webhooks/payment', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'emi_paid') {
      const { emiId, transactionId } = data;
      const emi = await EMI.findById(emiId);
      if (emi) {
        emi.status = 'paid';
        emi.paidDate = new Date();
        emi.transactionId = transactionId;
        await emi.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message }
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`REZ BNPL Service running on port ${PORT}`);
      console.log(`💳 Database: MongoDB (${MONGODB_URI})`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;