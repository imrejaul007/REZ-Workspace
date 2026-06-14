/**
 * REZ Express Checkout Service
 *
 * 1-click checkout with saved payment methods
 * - Saved payment methods
 * - Express checkout tokens
 * - Payment pre-verification
 * - Auto-fill checkout
 *
 * Database: MongoDB
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-express-checkout';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// Express Checkout Profile
const expressCheckoutProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  defaultPaymentMethod: { type: String },
  savedPaymentMethods: [{
    methodId: { type: String, required: true },
    type: { type: String, enum: ['card', 'upi', 'wallet'], required: true },
    last4: String,
    expiry: String,
    isDefault: { type: Boolean, default: false },
    nickname: String,
    addedAt: { type: Date, default: Date.now }
  }],
  addresses: [{
    addressId: { type: String, required: true },
    type: { type: String, enum: ['home', 'office', 'other'], default: 'home' },
    isDefault: { type: Boolean, default: false },
    name: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  }],
  preferences: {
    savePaymentMethods: { type: Boolean, default: true },
    saveAddresses: { type: Boolean, default: true },
    autoApplyCoupons: { type: Boolean, default: false }
  },
  checkoutCount: { type: Number, default: 0 },
  lastCheckoutAt: Date
}, { timestamps: true });

// Express Checkout Token
const expressCheckoutTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  merchantId: String,
  cartId: String,
  amount: Number,
  currency: { type: String, default: 'INR' },
  paymentMethodId: String,
  expiresAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['pending', 'used', 'expired', 'cancelled'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Checkout Analytics
const checkoutAnalyticsSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  merchantId: { type: String, index: true },
  checkoutTime: { type: Number, required: true }, // ms
  paymentMethod: String,
  success: { type: Boolean, default: true },
  failureReason: String,
  cartValue: Number
}, { timestamps: true });

// Create models
const ExpressCheckoutProfile = mongoose.model('ExpressCheckoutProfile', expressCheckoutProfileSchema);
const ExpressCheckoutToken = mongoose.model('ExpressCheckoutToken', expressCheckoutTokenSchema);
const CheckoutAnalytics = mongoose.model('CheckoutAnalytics', checkoutAnalyticsSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateToken(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token-here';

function requireInternal(req: Request, res: Response, next: express.NextFunction) {
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
      profiles: await ExpressCheckoutProfile.countDocuments(),
      activeTokens: await ExpressCheckoutToken.countDocuments({ status: 'pending' }),
      checkouts: await CheckoutAnalytics.countDocuments()
    };

    res.json({
      status: 'ok',
      service: 'REZ-express-checkout',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    });
  }
});

// ============================================
// PROFILE APIs
// ============================================

// Get/create express checkout profile
app.post('/api/profiles', requireInternal, async (req: res) => {
  try {
    const { userId, paymentMethodId, type, last4, expiry } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    let profile = await ExpressCheckoutProfile.findOne({ userId });

    if (!profile) {
      profile = new ExpressCheckoutProfile({
        userId,
        preferences: { savePaymentMethods: true, saveAddresses: true }
      });
    }

    // Add payment method if provided
    if (paymentMethodId && type) {
      const existingIndex = profile.savedPaymentMethods.findIndex(m => m.methodId === paymentMethodId);
      if (existingIndex === -1) {
        profile.savedPaymentMethods.push({
          methodId: paymentMethodId,
          type,
          last4,
          expiry,
          isDefault: profile.savedPaymentMethods.length === 0
        });
      }
    }

    await profile.save();

    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get profile
app.get('/api/profiles/:userId', requireInternal, async (req: Request, res: Response) => {
  try {
    const profile = await ExpressCheckoutProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Add payment method
app.post('/api/profiles/:userId/payment-methods', requireInternal, async (req: Request, res: Response) => {
  try {
    const { methodId, type, last4, expiry, nickname, isDefault } = req.body;
    const profile = await ExpressCheckoutProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // Check if already exists
    const existingIndex = profile.savedPaymentMethods.findIndex(m => m.methodId === methodId);
    if (existingIndex !== -1) {
      res.status(400).json({ error: 'Payment method already exists' });
      return;
    }

    // If setting as default, unset others
    if (isDefault) {
      profile.savedPaymentMethods.forEach(m => m.isDefault = false);
    }

    profile.savedPaymentMethods.push({
      methodId,
      type,
      last4,
      expiry,
      nickname,
      isDefault: isDefault ?? false,
      addedAt: new Date()
    });

    await profile.save();

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Add address
app.post('/api/profiles/:userId/addresses', requireInternal, async (req: Request, res: Response) => {
  try {
    const { addressId, type, name, line1, line2, city, state, pincode, phone, isDefault } = req.body;
    const profile = await ExpressCheckoutProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    // If setting as default, unset others
    if (isDefault) {
      profile.addresses.forEach(a => a.isDefault = false);
    }

    profile.addresses.push({
      addressId: addressId || `addr_${Date.now()}`,
      type: type || 'home',
      name,
      line1,
      line2,
      city,
      state,
      pincode,
      phone,
      isDefault: isDefault ?? false
    });

    await profile.save();

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// EXPRESS CHECKOUT TOKEN APIs
// ============================================

// Create express checkout token
app.post('/api/tokens', requireInternal, async (req: Request, res: Response) => {
  try {
    const { userId, merchantId, cartId, amount, paymentMethodId } = req.body;

    if (!userId || !amount) {
      res.status(400).json({ error: 'userId and amount are required' });
      return;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const checkoutToken = new ExpressCheckoutToken({
      token,
      userId,
      merchantId,
      cartId,
      amount,
      paymentMethodId,
      expiresAt,
      status: 'pending'
    });

    await checkoutToken.save();

    res.status(201).json({
      success: true,
      data: {
        token,
        expiresAt,
        amount,
        paymentMethodId
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Use express checkout token
app.post('/api/tokens/:token/use', requireInternal, async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { paymentTransactionId } = req.body;

    const tokenDoc = await ExpressCheckoutToken.findOne({ token: req.params.token });

    if (!tokenDoc) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    if (tokenDoc.status !== 'pending') {
      res.status(400).json({ error: `Token already ${tokenDoc.status}` });
      return;
    }

    if (isTokenExpired(tokenDoc.expiresAt)) {
      tokenDoc.status = 'expired';
      await tokenDoc.save();

      await CheckoutAnalytics.create({
        userId: tokenDoc.userId,
        merchantId: tokenDoc.merchantId,
        checkoutTime: Date.now() - startTime,
        success: false,
        failureReason: 'Token expired',
        cartValue: tokenDoc.amount
      });

      res.status(400).json({ error: 'Token expired' });
      return;
    }

    // Mark token as used
    tokenDoc.status = 'used';
    tokenDoc.metadata = { paymentTransactionId };
    await tokenDoc.save();

    // Update user profile checkout count
    await ExpressCheckoutProfile.findOneAndUpdate(
      { userId: tokenDoc.userId },
      {
        $inc: { checkoutCount: 1 },
        $set: { lastCheckoutAt: new Date() }
      }
    );

    // Log analytics
    await CheckoutAnalytics.create({
      userId: tokenDoc.userId,
      merchantId: tokenDoc.merchantId,
      checkoutTime: Date.now() - startTime,
      paymentMethod: tokenDoc.paymentMethodId,
      success: true,
      cartValue: tokenDoc.amount
    });

    res.json({
      success: true,
      data: {
        token: tokenDoc.token,
        status: 'used',
        checkoutTime: Date.now() - startTime
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get token status
app.get('/api/tokens/:token', async (req: Request, res: Response) => {
  try {
    const tokenDoc = await ExpressCheckoutToken.findOne({ token: req.params.token });

    if (!tokenDoc) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    const status = tokenDoc.status === 'pending' && isTokenExpired(tokenDoc.expiresAt)
      ? 'expired'
      : tokenDoc.status;

    res.json({
      success: true,
      data: {
        token: tokenDoc.token,
        status,
        amount: tokenDoc.amount,
        expiresAt: tokenDoc.expiresAt,
        isValid: status === 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// ANALYTICS APIs
// ============================================

app.get('/api/analytics/performance', requireInternal, async (req: res) => {
  try {
    const { period = '7d' } = req.query;
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const checkouts = await CheckoutAnalytics.find({
      createdAt: { $gte: since }
    });

    const successful = checkouts.filter(c => c.success);
    const failed = checkouts.filter(c => !c.success);

    const avgCheckoutTime = checkouts.length > 0
      ? checkouts.reduce((sum, c) => sum + c.checkoutTime, 0) / checkouts.length
      : 0;

    res.json({
      success: true,
      data: {
        total: checkouts.length,
        successful: successful.length,
        failed: failed.length,
        successRate: checkouts.length > 0 ? Math.round((successful.length / checkouts.length) * 100) : 0,
        avgCheckoutTime: Math.round(avgCheckoutTime),
        totalValue: successful.reduce((sum, c) => sum + (c.cartValue || 0), 0),
        period
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await ExpressCheckoutProfile.createIndexes();
    await ExpressCheckoutToken.createIndexes();
    await CheckoutAnalytics.createIndexes();

    app.listen(PORT, () => {
      console.log(`REZ Express Checkout Service running on port ${PORT}`);
      console.log('🚀 1-click checkout with saved payment methods');
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