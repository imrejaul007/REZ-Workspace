/**
 * RABTUL Integration
 *
 * Connect Atlas GTM with RABTUL services for:
 * - Payment processing (REZ Payment Service)
 * - Wallet & Coins (REZ Wallet Service)
 * - BNPL & Capital
 * - Notifications (Push/SMS)
 * - Auth Service
 * - QR Cloud Service
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// RABTUL Configuration
const rabtulConfig = {
  // Auth Service
  authUrl: process.env.REZ_AUTH_URL || 'http://localhost:4002',
  authApiKey: process.env.REZ_AUTH_API_KEY || null,

  // Wallet Service
  walletUrl: process.env.REZ_WALLET_URL || 'http://localhost:4004',
  walletApiKey: process.env.REZ_WALLET_API_KEY || null,

  // Payment Service
  paymentUrl: process.env.REZ_PAYMENT_URL || 'http://localhost:4003',
  paymentApiKey: process.env.REZ_PAYMENT_API_KEY || null,

  // Notification Service
  notificationUrl: process.env.REZ_NOTIFICATION_URL || 'http://localhost:4011',
  notificationApiKey: process.env.REZ_NOTIFICATION_API_KEY || null,

  // QR Cloud Service
  qrCloudUrl: process.env.REZ_QR_CLOUD_URL || 'http://localhost:4300',
  qrCloudApiKey: process.env.REZ_QR_CLOUD_API_KEY || null
};

// In-memory storage
const transactions = new Map();
const wallets = new Map();
const notifications = new Map();
const paymentLinks = new Map();

/**
 * Create RABTUL API client for a specific service
 */
class RABTULClient {
  constructor(service) {
    const config = {
      auth: { url: rabtulConfig.authUrl, key: rabtulConfig.authApiKey },
      wallet: { url: rabtulConfig.walletUrl, key: rabtulConfig.walletApiKey },
      payment: { url: rabtulConfig.paymentUrl, key: rabtulConfig.paymentApiKey },
      notification: { url: rabtulConfig.notificationUrl, key: rabtulConfig.notificationApiKey },
      qrCloud: { url: rabtulConfig.qrCloudUrl, key: rabtulConfig.qrCloudApiKey }
    };

    this.service = service;
    this.baseUrl = config[service]?.url || 'http://localhost:4000';
    this.apiKey = config[service]?.key || null;
    this.mockMode = !config[service]?.key;
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      'X-Service': 'atlas-gtm'
    };
  }

  async request(method, endpoint, data = null) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: this.headers,
        data,
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      if (this.mockMode || error.code === 'ECONNREFUSED') {
        return this.getMockResponse(endpoint, method);
      }
      console.error(`RABTUL ${this.service} API Error: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  getMockResponse(endpoint, method) {
    const mockResponses = {
      // Auth
      '/auth/verify': { valid: true, userId: 'user_' + Date.now() },
      '/auth/token': { token: 'mock_token_' + Date.now(), expiresIn: 3600 },

      // Wallet
      '/wallet/balance': { balance: 1000, coins: 500, currency: 'INR' },
      '/wallet/transactions': { transactions: [], total: 0 },
      '/wallet/add': { success: true, newBalance: 1100 },

      // Payment
      '/payments/create': { paymentId: 'pay_' + Date.now(), status: 'pending' },
      '/payments/status': { status: 'completed', amount: 100 },
      '/payments/link': { linkId: 'link_' + Date.now(), url: 'https://pay.rez.money/link' },

      // Notification
      '/notifications/send': { notificationId: 'notif_' + Date.now(), status: 'sent' },
      '/notifications/templates': { templates: [] },

      // QR Cloud
      '/qr/generate': { qrId: 'qr_' + Date.now(), url: 'https://qr.rez.money/qr', dataUrl: '' },
      '/qr/scan': { scanId: 'scan_' + Date.now(), verified: true }
    };

    return mockResponses[endpoint] || { success: true, mock: true };
  }
}

// ============================================
// AUTH SERVICE
// ============================================

const authClient = new RABTULClient('auth');

async function verifyToken(token) {
  try {
    return await authClient.request('POST', '/auth/verify', { token });
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function createServiceToken(userId) {
  try {
    return await authClient.request('POST', '/auth/token', {
      userId,
      service: 'atlas-gtm',
      permissions: ['read', 'write', 'campaigns', 'analytics']
    });
  } catch (error) {
    return { token: 'mock_token_' + Date.now(), expiresIn: 3600 };
  }
}

// ============================================
// WALLET SERVICE
// ============================================

const walletClient = new RABTULClient('wallet');

async function getWalletBalance(userId) {
  try {
    const balance = await walletClient.request('GET', `/wallet/balance?userId=${userId}`);
    wallets.set(userId, balance);
    return balance;
  } catch (error) {
    return { balance: 1000, coins: 500, currency: 'INR', mock: true };
  }
}

async function addCoins(userId, amount, reason) {
  const transaction = {
    id: uuidv4(),
    userId,
    type: 'credit',
    amount,
    coins: amount,
    reason: reason || 'GTM Campaign Reward',
    timestamp: new Date().toISOString()
  };

  transactions.set(transaction.id, transaction);

  try {
    await walletClient.request('POST', '/wallet/add', {
      userId,
      amount,
      coins: amount,
      reason: transaction.reason
    });
  } catch (error) {
    console.log('RABTUL Wallet (mock mode): Transaction stored locally');
  }

  return transaction;
}

async function deductCoins(userId, amount, reason) {
  const transaction = {
    id: uuidv4(),
    userId,
    type: 'debit',
    amount,
    coins: amount,
    reason: reason || 'GTM Service Fee',
    timestamp: new Date().toISOString()
  };

  transactions.set(transaction.id, transaction);

  try {
    await walletClient.request('POST', '/wallet/deduct', {
      userId,
      amount,
      reason: transaction.reason
    });
  } catch (error) {
    console.log('RABTUL Wallet (mock mode): Transaction stored locally');
  }

  return transaction;
}

async function getTransactions(userId, filters = {}) {
  let result = Array.from(transactions.values())
    .filter(t => t.userId === userId);

  if (filters.type) {
    result = result.filter(t => t.type === filters.type);
  }
  if (filters.from) {
    result = result.filter(t => new Date(t.timestamp) >= new Date(filters.from));
  }
  if (filters.to) {
    result = result.filter(t => new Date(t.timestamp) <= new Date(filters.to));
  }

  return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ============================================
// PAYMENT SERVICE
// ============================================

const paymentClient = new RABTULClient('payment');

async function createPaymentLink(data) {
  const link = {
    id: uuidv4(),
    amount: data.amount,
    currency: data.currency || 'INR',
    description: data.description || 'GTM Campaign Payment',
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    metadata: {
      campaignId: data.campaignId,
      prospectId: data.prospectId,
      source: 'atlas-gtm'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: data.expiresAt || null,
    url: `https://pay.rez.money/${uuidv4().slice(0, 8)}`
  };

  paymentLinks.set(link.id, link);

  try {
    const result = await paymentClient.request('POST', '/payments/link', link);
    return { ...link, ...result };
  } catch (error) {
    return link;
  }
}

async function getPaymentStatus(paymentId) {
  try {
    return await paymentClient.request('GET', `/payments/status?paymentId=${paymentId}`);
  } catch (error) {
    const link = paymentLinks.get(paymentId);
    return link ? { paymentId, status: link.status } : { status: 'unknown' };
  }
}

async function createPaymentIntent(data) {
  const intent = {
    id: uuidv4(),
    amount: data.amount,
    currency: data.currency || 'INR',
    method: data.method || 'upi',
    customerId: data.customerId,
    metadata: data.metadata || {},
    status: 'created',
    createdAt: new Date().toISOString()
  };

  try {
    const result = await paymentClient.request('POST', '/payments/create', intent);
    return { ...intent, ...result };
  } catch (error) {
    return intent;
  }
}

// ============================================
// NOTIFICATION SERVICE
// ============================================

const notificationClient = new RABTULClient('notification');

async function sendNotification(data) {
  const notification = {
    id: uuidv4(),
    userId: data.userId,
    channel: data.channel || 'push', // push, sms, email, whatsapp
    title: data.title,
    body: data.body,
    data: data.data || {},
    status: 'pending',
    sentAt: null,
    createdAt: new Date().toISOString()
  };

  notifications.set(notification.id, notification);

  try {
    const result = await notificationClient.request('POST', '/notifications/send', {
      userId: data.userId,
      channel: data.channel,
      title: data.title,
      body: data.body,
      data: data.data
    });

    notification.status = 'sent';
    notification.sentAt = new Date().toISOString();
    return { ...notification, ...result };
  } catch (error) {
    notification.status = 'sent_mock';
    return notification;
  }
}

async function sendBulkNotifications(recipients, notification) {
  const results = [];

  for (const userId of recipients) {
    const result = await sendNotification({ ...notification, userId });
    results.push(result);
  }

  return {
    total: recipients.length,
    sent: results.filter(r => r.status === 'sent').length,
    failed: results.filter(r => r.status !== 'sent').length,
    results
  };
}

async function sendCampaignNotification(campaignId, message) {
  // Get all prospects associated with campaign
  const prospects = []; // Would come from prospect database

  return sendBulkNotifications(
    prospects.map(p => p.userId),
    {
      channel: 'push',
      title: message.title || 'New Campaign Update',
      body: message.body,
      data: { campaignId }
    }
  );
}

async function getNotificationTemplates() {
  try {
    return await notificationClient.request('GET', '/notifications/templates');
  } catch (error) {
    return {
      templates: [
        { id: 'welcome', name: 'Welcome', title: 'Welcome to REZ GTM!' },
        { id: 'campaign_update', name: 'Campaign Update', title: 'Campaign Update' },
        { id: 'payment_success', name: 'Payment Success', title: 'Payment Received' },
        { id: 'reward_earned', name: 'Reward Earned', title: 'You earned REZ Coins!' }
      ]
    };
  }
}

function getNotificationHistory(userId, filters = {}) {
  let result = Array.from(notifications.values())
    .filter(n => n.userId === userId);

  if (filters.channel) {
    result = result.filter(n => n.channel === filters.channel);
  }
  if (filters.status) {
    result = result.filter(n => n.status === filters.status);
  }

  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ============================================
// QR CLOUD SERVICE
// ============================================

const qrClient = new RABTULClient('qrCloud');

async function generateQRCodes(data) {
  const qrCodes = [];

  for (const item of data.items || []) {
    const qr = {
      id: uuidv4(),
      type: data.type || 'campaign', // campaign, product, loyalty, payment
      content: item.content,
      metadata: {
        campaignId: item.campaignId,
        prospectId: item.prospectId,
        source: 'atlas-gtm'
      },
      settings: {
        size: data.size || 300,
        format: data.format || 'png',
        logo: data.logo || null,
        foregroundColor: data.foregroundColor || '#000000',
        backgroundColor: data.backgroundColor || '#ffffff'
      },
      stats: {
        scans: 0,
        uniqueScans: 0,
        conversions: 0
      },
      createdAt: new Date().toISOString(),
      url: `https://qr.rez.money/${uuidv4().slice(0, 8)}`
    };

    qrCodes.push(qr);

    try {
      const result = await qrClient.request('POST', '/qr/generate', qr);
      Object.assign(qr, result);
    } catch (error) {
      console.log('RABTUL QR Cloud (mock mode): QR stored locally');
    }
  }

  return qrCodes;
}

async function trackQRScan(qrId, scanData) {
  const scan = {
    id: uuidv4(),
    qrId,
    timestamp: new Date().toISOString(),
    location: scanData.location,
    device: scanData.device,
    userId: scanData.userId,
    metadata: scanData.metadata || {}
  };

  try {
    await qrClient.request('POST', '/qr/track', scan);
  } catch (error) {
    console.log('RABTUL QR Cloud (mock mode): Scan tracked locally');
  }

  return scan;
}

async function getQRAnalytics(qrId) {
  try {
    return await qrClient.request('GET', `/qr/analytics?qrId=${qrId}`);
  } catch (error) {
    return {
      qrId,
      totalScans: 0,
      uniqueUsers: 0,
      conversions: 0,
      conversionRate: '0%'
    };
  }
}

// ============================================
// KARMA & LOYALTY
// ============================================

async function awardKarma(userId, amount, reason) {
  const karmaEntry = {
    id: uuidv4(),
    userId,
    type: 'award',
    amount,
    reason: reason || 'GTM Campaign Engagement',
    campaignId: null,
    timestamp: new Date().toISOString()
  };

  // In real implementation, this would sync with RABTUL Karma Service
  return karmaEntry;
}

async function getKarmaBalance(userId) {
  return {
    userId,
    karma: 100,
    level: 'silver',
    totalEarned: 500,
    totalRedeemed: 400
  };
}

// ============================================
// BNPL & CAPITAL (Lead to Deal)
// ============================================

async function createBNPLApplication(data) {
  const application = {
    id: uuidv4(),
    prospectId: data.prospectId,
    companyName: data.companyName,
    amount: data.amount,
    purpose: data.purpose || 'business_capital',
    status: 'pending',
    metadata: {
      campaignId: data.campaignId,
      source: 'atlas-gtm'
    },
    createdAt: new Date().toISOString()
  };

  // In real implementation, this would create application in RABTUL BNPL Service
  return application;
}

async function getBNPLStatus(applicationId) {
  return {
    applicationId,
    status: 'under_review',
    eligibilityAmount: 50000,
    interestRate: 1.5,
    tenure: 12
  };
}

// ============================================
// HELPERS
// ============================================

function getTransactionsByType(type) {
  return Array.from(transactions.values())
    .filter(t => t.type === type);
}

function getPaymentLinksByCampaign(campaignId) {
  return Array.from(paymentLinks.values())
    .filter(p => p.metadata?.campaignId === campaignId);
}

function getAllNotifications(filters = {}) {
  let result = Array.from(notifications.values());

  if (filters.status) {
    result = result.filter(n => n.status === filters.status);
  }
  if (filters.channel) {
    result = result.filter(n => n.channel === filters.channel);
  }

  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  // Auth
  verifyToken,
  createServiceToken,

  // Wallet
  getWalletBalance,
  addCoins,
  deductCoins,
  getTransactions,

  // Payment
  createPaymentLink,
  getPaymentStatus,
  createPaymentIntent,

  // Notification
  sendNotification,
  sendBulkNotifications,
  sendCampaignNotification,
  getNotificationTemplates,
  getNotificationHistory,

  // QR Cloud
  generateQRCodes,
  trackQRScan,
  getQRAnalytics,

  // Karma & Loyalty
  awardKarma,
  getKarmaBalance,

  // BNPL & Capital
  createBNPLApplication,
  getBNPLStatus,

  // Helpers
  getTransactionsByType,
  getPaymentLinksByCampaign,
  getAllNotifications
};
