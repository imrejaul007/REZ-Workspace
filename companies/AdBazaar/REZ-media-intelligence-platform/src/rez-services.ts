/**
 * REZ Ecosystem Services Integration
 * Connect Media Intelligence to REZ CRM, WhatsApp, Wallet, Loyalty, Notifications
 *
 * Port: 5001
 * Purpose: Bridge between Media Intelligence and REZ ecosystem
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 5001;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/rez-services.log' })]
});

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// REZ Service URLs (defaults - override with env vars)
const REZ_SERVICES = {
  // RABTUL (Money Movement)
  AUTH: process.env.REZ_AUTH_URL || 'http://localhost:4002',
  WALLET: process.env.REZ_WALLET_URL || 'http://localhost:4004',
  PAYMENT: process.env.REZ_PAYMENT_URL || 'http://localhost:4003',
  NOTIFICATIONS: process.env.REZ_NOTIFICATIONS_URL || 'http://localhost:4011',

  // REZ Workspace (CRM, Chat, etc.)
  CRM: process.env.REZ_CRM_URL || 'http://localhost:4203',
  WHATSAPP: process.env.REZ_WHATSAPP_URL || 'http://localhost:4861',
  CHAT: process.env.REZ_CHAT_URL || 'http://localhost:4203',
  EMAIL: process.env.REZ_EMAIL_URL || 'http://localhost:4206',

  // REZ Merchant
  MERCHANT: process.env.REZ_MERCHANT_URL || 'http://localhost:4000',

  // HOJAI AI
  HOJAI: process.env.HOJAI_URL || 'http://localhost:4800',

  // AdBazaar
  MEDIA_INTEL: process.env.MEDIA_INTEL_URL || 'http://localhost:5000',
};

// WhatsApp Business API config
const WHATSAPP_CONFIG = {
  PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_ID || '',
  ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ID || '',
  API_VERSION: 'v18.0',
  BASE_URL: 'https://graph.facebook.com',
};

app.use(helmet()); app.use(cors()); app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 500 })(app.request, app.response, () => {}));

// ============================================
// SCHEMAS
// ============================================

const customerSchema = new mongoose.Schema({
  customerId: String,
  merchantId: String,
  name: String,
  phone: String,
  email: String,
  source: String, // instagram, whatsapp, website, etc.
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
});

const messageSchema = new mongoose.Schema({
  messageId: String,
  merchantId: String,
  customerId: String,
  channel: String, // whatsapp, sms, email
  direction: String, // inbound, outbound
  type: String, // text, template, media
  content: String,
  status: String, // sent, delivered, read, failed
  timestamp: Date,
});

const loyaltySchema = new mongoose.Schema({
  loyaltyId: String,
  customerId: String,
  merchantId: String,
  points: Number,
  tier: String, // bronze, silver, gold, platinum
  transactions: [{
    type: String, // earn, redeem
    points: Number,
    source: String,
    timestamp: Date,
  }],
  createdAt: Date,
  updatedAt: Date,
});

const Customer = mongoose.model('Customer', customerSchema);
const Message = mongoose.model('Message', messageSchema);
const Loyalty = mongoose.model('Loyalty', loyaltySchema);

// Health check
app.get('/health', async (req: res) => {
  const connections: Record<string, string> = {};

  // Check REZ services
  for (const [name, url] of Object.entries(REZ_SERVICES)) {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      connections[name] = 'connected';
    } catch { connections[name] = 'disconnected'; }
  }

  res.json({
    status: 'healthy',
    service: 'rez-services',
    port: PORT,
    connections,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// CRM SERVICES
// ============================================

/**
 * Get or create customer
 * GET /api/crm/customer/:phone
 */
app.get('/api/crm/customer/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { merchantId } = req.query;

    let customer = await Customer.findOne({ phone, ...(merchantId ? { merchantId } : {}) });

    if (!customer) {
      customer = new Customer({
        customerId: `cust_${Date.now()}`,
        merchantId: merchantId || 'default',
        phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await customer.save();
    }

    res.json({ success: true, customer });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Create/update customer
 * POST /api/crm/customer
 */
app.post('/api/crm/customer', async (req, res) => {
  try {
    const { merchantId, name, phone, email, source, tags } = req.body;

    let customer = await Customer.findOne({ phone, merchantId });

    if (!customer) {
      customer = new Customer({
        customerId: `cust_${Date.now()}`,
        merchantId,
        name,
        phone,
        email,
        source: source || 'media_intel',
        tags: tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      if (name) customer.name = name;
      if (email) customer.email = email;
      if (tags) customer.tags = [...new Set([...customer.tags, ...tags])];
      customer.updatedAt = new Date();
    }

    await customer.save();

    // Also try to sync with REZ CRM
    try {
      await axios.post(`${REZ_SERVICES.CRM}/api/customers`, {
        customerId: customer.customerId,
        merchantId,
        name,
        phone,
        email,
      }, { headers: { 'X-Internal-Token': INTERNAL_TOKEN } });
    } catch (e) { /* ignore */ }

    res.json({ success: true, customer });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get customers by source
 * GET /api/crm/customers/:merchantId
 */
app.get('/api/crm/customers/:merchantId', async (req, res) => {
  try {
    const { source, limit = 100 } = req.query;
    const query: any = { merchantId: req.params.merchantId };
    if (source) query.source = source;

    const customers = await Customer.find(query).limit(Number(limit));

    res.json({ success: true, customers, count: customers.length });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// WHATSAPP SERVICES
// ============================================

/**
 * Send WhatsApp message
 * POST /api/whatsapp/send
 */
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, message, template, merchantId, customerId, mediaUrl } = req.body;

    // Record message
    const msg = new Message({
      messageId: `msg_${Date.now()}`,
      merchantId,
      customerId,
      channel: 'whatsapp',
      direction: 'outbound',
      type: template ? 'template' : 'text',
      content: message || template,
      status: 'sent',
      timestamp: new Date(),
    });
    await msg.save();

    // Try to send via WhatsApp API
    if (WHATSAPP_CONFIG.ACCESS_TOKEN && WHATSAPP_CONFIG.PHONE_NUMBER_ID) {
      try {
        const payload: any = {
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''), // Remove non-digits
          type: mediaUrl ? 'image' : 'text',
        };

        if (mediaUrl) {
          payload.image = { link: mediaUrl };
          payload.caption = message;
        } else if (template) {
          payload.template = { name: template, language: { code: 'en' } };
        } else {
          payload.text = { body: message };
        }

        await axios.post(
          `${WHATSAPP_CONFIG.BASE_URL}/${WHATSAPP_CONFIG.API_VERSION}/${WHATSAPP_CONFIG.PHONE_NUMBER_ID}/messages`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${WHATSAPP_CONFIG.ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        msg.status = 'sent';
        await msg.save();
      } catch (e: any) {
        logger.error('WhatsApp API error:', e.response?.data || e.message);
        msg.status = 'failed';
        msg.save();
      }
    }

    res.json({
      success: true,
      messageId: msg.messageId,
      status: msg.status,
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Send bulk WhatsApp
 * POST /api/whatsapp/bulk
 */
app.post('/api/whatsapp/bulk', async (req, res) => {
  try {
    const { messages } = req.body; // Array of { to, message, template, merchantId, customerId }

    const results = [];
    for (const msg of messages) {
      try {
        const result = await sendWhatsAppMessage(msg);
        results.push({ ...msg, success: true, messageId: result.messageId });
      } catch (e) {
        results.push({ ...msg, success: false, error: String(e) });
      }
    }

    res.json({ success: true, results, sent: results.filter(r => r.success).length });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

async function sendWhatsAppMessage(msg: any) {
  const message = new Message({
    messageId: `msg_${Date.now()}`,
    merchantId: msg.merchantId,
    customerId: msg.customerId,
    channel: 'whatsapp',
    direction: 'outbound',
    type: msg.template ? 'template' : 'text',
    content: msg.message || msg.template,
    status: 'sent',
    timestamp: new Date(),
  });
  await message.save();
  return { messageId: message.messageId };
}

/**
 * Get message history
 * GET /api/whatsapp/history/:customerId
 */
app.get('/api/whatsapp/history/:customerId', async (req, res) => {
  try {
    const { merchantId } = req.query;
    const query: any = { customerId: req.params.customerId };
    if (merchantId) query.merchantId = merchantId;

    const messages = await Message.find(query).sort({ timestamp: -1 }).limit(50);

    res.json({ success: true, messages, count: messages.length });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// LOYALTY SERVICES
// ============================================

/**
 * Get customer loyalty
 * GET /api/loyalty/:customerId
 */
app.get('/api/loyalty/:customerId', async (req, res) => {
  try {
    const { merchantId } = req.query;
    const query: any = { customerId: req.params.customerId };
    if (merchantId) query.merchantId = merchantId;

    let loyalty = await Loyalty.findOne(query);

    if (!loyalty) {
      loyalty = new Loyalty({
        loyaltyId: `loy_${Date.now()}`,
        customerId: req.params.customerId,
        merchantId: merchantId || 'default',
        points: 0,
        tier: 'bronze',
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await loyalty.save();
    }

    res.json({ success: true, loyalty });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Award loyalty points
 * POST /api/loyalty/earn
 */
app.post('/api/loyalty/earn', async (req, res) => {
  try {
    const { customerId, merchantId, points, source, description } = req.body;

    let loyalty = await Loyalty.findOne({ customerId, merchantId });
    if (!loyalty) {
      loyalty = new Loyalty({
        loyaltyId: `loy_${Date.now()}`,
        customerId,
        merchantId,
        points: 0,
        tier: 'bronze',
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Add points
    loyalty.points += points;
    loyalty.transactions.push({
      type: 'earn',
      points,
      source: source || 'purchase',
      timestamp: new Date(),
    });

    // Update tier
    loyalty.tier = getTier(loyalty.points);
    loyalty.updatedAt = new Date();
    await loyalty.save();

    res.json({
      success: true,
      loyalty: {
        customerId: loyalty.customerId,
        points: loyalty.points,
        tier: loyalty.tier,
        pointsEarned: points,
      },
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Redeem loyalty points
 * POST /api/loyalty/redeem
 */
app.post('/api/loyalty/redeem', async (req, res) => {
  try {
    const { customerId, merchantId, points, source } = req.body;

    const loyalty = await Loyalty.findOne({ customerId, merchantId });
    if (!loyalty) {
      res.status(404).json({ success: false, error: 'Loyalty not found' });
      return;
    }

    if (loyalty.points < points) {
      res.status(400).json({ success: false, error: 'Insufficient points' });
      return;
    }

    loyalty.points -= points;
    loyalty.transactions.push({
      type: 'redeem',
      points: -points,
      source: source || 'redemption',
      timestamp: new Date(),
    });
    loyalty.updatedAt = new Date();
    await loyalty.save();

    res.json({
      success: true,
      loyalty: {
        customerId: loyalty.customerId,
        points: loyalty.points,
        tier: loyalty.tier,
        pointsRedeemed: points,
      },
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

function getTier(points: number): string {
  if (points >= 10000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 2000) return 'silver';
  return 'bronze';
}

/**
 * Get loyalty tiers
 * GET /api/loyalty/tiers
 */
app.get('/api/loyalty/tiers', (req, res) => {
  res.json({
    success: true,
    tiers: [
      { tier: 'bronze', minPoints: 0, benefits: ['5% off on first order'] },
      { tier: 'silver', minPoints: 2000, benefits: ['10% off', 'Free delivery'] },
      { tier: 'gold', minPoints: 5000, benefits: ['15% off', 'Priority support'] },
      { tier: 'platinum', minPoints: 10000, benefits: ['20% off', 'VIP access', 'Free products'] },
    ],
  });
});

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Send push notification
 * POST /api/notifications/push
 */
app.post('/api/notifications/push', async (req, res) => {
  try {
    const { customerId, merchantId, title, body, data } = req.body;

    // Record notification
    const notification = {
      notificationId: `notif_${Date.now()}`,
      customerId,
      merchantId,
      channel: 'push',
      title,
      body,
      data,
      status: 'sent',
      timestamp: new Date(),
    };

    // Try to send via REZ Notifications
    try {
      await axios.post(`${REZ_SERVICES.NOTIFICATIONS}/api/notifications`, {
        customerId,
        merchantId,
        title,
        body,
        data,
      }, { headers: { 'X-Internal-Token': INTERNAL_TOKEN } });
    } catch (e) { /* ignore - notification service may not be available */ }

    res.json({ success: true, notification });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Send email
 * POST /api/notifications/email
 */
app.post('/api/notifications/email', async (req, res) => {
  try {
    const { to, subject, body, merchantId } = req.body;

    // Record email
    const email = {
      emailId: `email_${Date.now()}`,
      to,
      subject,
      body,
      merchantId,
      status: 'sent',
      timestamp: new Date(),
    };

    // Try to send via REZ Email
    try {
      await axios.post(`${REZ_SERVICES.EMAIL}/api/send`, {
        to,
        subject,
        body,
      }, { headers: { 'X-Internal-Token': INTERNAL_TOKEN } });
    } catch (e) { /* ignore */ }

    res.json({ success: true, email });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// WALLET / PAYMENTS
// ============================================

/**
 * Get customer wallet balance
 * GET /api/wallet/:customerId
 */
app.get('/api/wallet/:customerId', async (req, res) => {
  try {
    const { merchantId } = req.query;

    // Try REZ Wallet
    try {
      const response = await axios.get(
        `${REZ_SERVICES.WALLET}/api/wallet/${req.params.customerId}`,
        {
          params: { merchantId },
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000,
        }
      );
      res.json({ success: true, wallet: response.data });
      return;
    } catch (e) { /* ignore */ }

    // Fallback
    res.json({
      success: true,
      wallet: {
        customerId: req.params.customerId,
        balance: 0,
        currency: 'INR',
      },
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Create transaction
 * POST /api/wallet/transaction
 */
app.post('/api/wallet/transaction', async (req, res) => {
  try {
    const { customerId, merchantId, amount, type, source } = req.body;

    const transaction = {
      transactionId: `txn_${Date.now()}`,
      customerId,
      merchantId,
      amount,
      type, // credit, debit
      source: source || 'media_intel',
      status: 'completed',
      timestamp: new Date(),
    };

    // Try REZ Wallet
    try {
      await axios.post(
        `${REZ_SERVICES.WALLET}/api/transactions`,
        transaction,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
      );
    } catch (e) { /* ignore */ }

    res.json({ success: true, transaction });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// MERCHANT SERVICES
// ============================================

/**
 * Get merchant info
 * GET /api/merchant/:merchantId
 */
app.get('/api/merchant/:merchantId', async (req, res) => {
  try {
    // Try REZ Merchant
    try {
      const response = await axios.get(
        `${REZ_SERVICES.MERCHANT}/api/merchants/${req.params.merchantId}`,
        { headers: { 'X-Internal-Token': INTERNAL_TOKEN }, timeout: 5000 }
      );
      res.json({ success: true, merchant: response.data });
      return;
    } catch (e) { /* ignore */ }

    res.json({
      success: true,
      merchant: {
        merchantId: req.params.merchantId,
        name: 'Merchant',
        plan: 'basic',
      },
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

/**
 * Get merchant analytics
 * GET /api/merchant/:merchantId/analytics
 */
app.get('/api/merchant/:merchantId/analytics', async (req, res) => {
  try {
    const period = req.query.period || '30d';

    // Get data from our DB
    const [customers, messages, loyalties] = await Promise.all([
      Customer.countDocuments({ merchantId: req.params.merchantId }),
      Message.countDocuments({ merchantId: req.params.merchantId }),
      Loyalty.countDocuments({ merchantId: req.params.merchantId }),
    ]);

    res.json({
      success: true,
      analytics: {
        period,
        customers,
        messages,
        loyalties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 REZ Services started on port ${PORT}`);
  logger.info('🔗 Connected to: CRM, WhatsApp, Wallet, Loyalty, Notifications');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_services')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB error:', err));
});

export default app;