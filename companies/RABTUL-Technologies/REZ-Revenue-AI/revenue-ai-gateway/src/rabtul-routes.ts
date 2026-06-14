/**
 * REZ Revenue AI - RABTUL Routes
 *
 * Add these routes to the gateway for RABTUL integration
 *
 * To add to gateway:
 * 1. Import this file in index.ts
 * 2. Add: app.use(rabtulRoutes);
 */

import { Router } from 'express';
import axios from 'axios';

const router = Router();

// RABTUL Service URLs
const RABTUL = {
  wallet: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  auth: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': INTERNAL_TOKEN,
  };
}

// ============================================================
// WALLET ROUTES
// ============================================================

/**
 * POST /api/v1/rabtul/wallet/credit
 * Credit cashback to user wallet
 */
router.post('/api/v1/rabtul/wallet/credit', async (req, res) => {
  try {
    const { userId, amount, reason, merchantId, orderId } = req.body;

    const response = await axios.post(
      `${RABTUL.wallet}/api/wallet/credit`,
      {
        userId,
        amount,
        type: 'cashback',
        reason,
        metadata: {
          merchantId,
          orderId,
          source: 'revenue_ai',
        },
      },
      { headers: getHeaders(), timeout: 10000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Wallet credit failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'WALLET_ERROR', message: 'Failed to credit wallet' },
    });
  }
});

/**
 * POST /api/v1/rabtul/wallet/debit
 * Debit from user wallet
 */
router.post('/api/v1/rabtul/wallet/debit', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    const response = await axios.post(
      `${RABTUL.wallet}/api/wallet/debit`,
      { userId, amount, reason },
      { headers: getHeaders(), timeout: 10000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Wallet debit failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'WALLET_ERROR', message: 'Failed to debit wallet' },
    });
  }
});

/**
 * GET /api/v1/rabtul/wallet/balance/:userId
 * Get user wallet balance
 */
router.get('/api/v1/rabtul/wallet/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const response = await axios.get(
      `${RABTUL.wallet}/api/wallet/balance/${userId}`,
      { headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Wallet balance failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'WALLET_ERROR', message: 'Failed to get balance' },
    });
  }
});

/**
 * GET /api/v1/rabtul/wallet/transactions/:userId
 * Get user transactions
 */
router.get('/api/v1/rabtul/wallet/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const response = await axios.get(
      `${RABTUL.wallet}/api/wallet/transactions/${userId}`,
      { params: { limit }, headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Wallet transactions failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'WALLET_ERROR', message: 'Failed to get transactions' },
    });
  }
});

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

/**
 * POST /api/v1/rabtul/notifications/push
 * Send push notification
 */
router.post('/api/v1/rabtul/notifications/push', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    const response = await axios.post(
      `${RABTUL.notification}/api/notifications/push`,
      { userId, notification: { title, body, data } },
      { headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Push notification failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_ERROR', message: 'Failed to send push' },
    });
  }
});

/**
 * POST /api/v1/rabtul/notifications/sms
 * Send SMS
 */
router.post('/api/v1/rabtul/notifications/sms', async (req, res) => {
  try {
    const { phone, message } = req.body;

    const response = await axios.post(
      `${RABTUL.notification}/api/notifications/sms`,
      { phone, message },
      { headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] SMS failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_ERROR', message: 'Failed to send SMS' },
    });
  }
});

/**
 * POST /api/v1/rabtul/notifications/whatsapp
 * Send WhatsApp message
 */
router.post('/api/v1/rabtul/notifications/whatsapp', async (req, res) => {
  try {
    const { phone, template, variables } = req.body;

    const response = await axios.post(
      `${RABTUL.notification}/api/notifications/whatsapp`,
      { phone, template, variables },
      { headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] WhatsApp failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATION_ERROR', message: 'Failed to send WhatsApp' },
    });
  }
});

// ============================================================
// AUTH ROUTES
// ============================================================

/**
 * POST /api/v1/rabtul/auth/verify
 * Verify JWT token
 */
router.post('/api/v1/rabtul/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;

    const response = await axios.post(
      `${RABTUL.auth}/api/auth/verify`,
      { token },
      { headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Auth verify failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Failed to verify token' },
    });
  }
});

/**
 * GET /api/v1/rabtul/auth/user/:userId
 * Get user by ID
 */
router.get('/api/v1/rabtul/auth/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const response = await axios.get(
      `${RABTUL.auth}/api/auth/user/${userId}`,
      { headers: getHeaders(), timeout: 5000 }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('[RABTUL] Auth user lookup failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Failed to get user' },
    });
  }
});

// ============================================================
// CAMPAIGN ROUTES
// ============================================================

/**
 * POST /api/v1/rabtul/campaign/send
 * Send campaign to multiple users
 */
router.post('/api/v1/rabtul/campaign/send', async (req, res) => {
  try {
    const { userIds, title, body, channels, offer, campaignId } = req.body;

    const results = {
      push: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 },
      whatsapp: { sent: 0, failed: 0 },
    };

    for (const userId of userIds) {
      if (channels.includes('push')) {
        try {
          await axios.post(
            `${RABTUL.notification}/api/notifications/push`,
            {
              userId,
              notification: {
                title,
                body,
                data: { campaignId, offer: JSON.stringify(offer) },
              },
            },
            { headers: getHeaders(), timeout: 5000 }
          );
          results.push.sent++;
        } catch {
          results.push.failed++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        campaignId,
        results,
        totalSent: results.push.sent + results.sms.sent + results.whatsapp.sent,
        totalFailed: results.push.failed + results.sms.failed + results.whatsapp.failed,
      },
    });
  } catch (error: any) {
    console.error('[RABTUL] Campaign send failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'CAMPAIGN_ERROR', message: 'Failed to send campaign' },
    });
  }
});

// ============================================================
// CASHBACK FLOW
// ============================================================

/**
 * POST /api/v1/rabtul/cashback/execute
 * Execute complete cashback flow: Calculate + Credit + Notify
 */
router.post('/api/v1/rabtul/cashback/execute', async (req, res) => {
  try {
    const { userId, phone, amount, reason, merchantId, orderId, channels } = req.body;

    // Step 1: Credit wallet
    const creditResponse = await axios.post(
      `${RABTUL.wallet}/api/wallet/credit`,
      {
        userId,
        amount,
        type: 'cashback',
        reason,
        metadata: { merchantId, orderId, source: 'revenue_ai' },
      },
      { headers: getHeaders(), timeout: 10000 }
    );

    if (!creditResponse.data.success) {
      throw new Error('Wallet credit failed');
    }

    const notifications = {};

    // Step 2: Send notifications
    if (channels?.includes('sms') && phone) {
      try {
        await axios.post(
          `${RABTUL.notification}/api/notifications/sms`,
          {
            phone,
            message: `🎉 Cashback credited! ₹${amount} added to your wallet. ${reason}.`,
          },
          { headers: getHeaders(), timeout: 5000 }
        );
        notifications.sms = 'sent';
      } catch {
        notifications.sms = 'failed';
      }
    }

    if (channels?.includes('push') && phone) {
      try {
        await axios.post(
          `${RABTUL.notification}/api/notifications/push`,
          {
            userId,
            notification: {
              title: 'Cashback Credited! 🎉',
              body: `₹${amount} added to your wallet. ${reason}.`,
              data: { type: 'cashback', orderId },
            },
          },
          { headers: getHeaders(), timeout: 5000 }
        );
        notifications.push = 'sent';
      } catch {
        notifications.push = 'failed';
      }
    }

    res.json({
      success: true,
      data: {
        transactionId: creditResponse.data.data.transactionId,
        newBalance: creditResponse.data.data.newBalance,
        notifications,
      },
    });
  } catch (error: any) {
    console.error('[RABTUL] Cashback execute failed:', error.message);
    res.status(500).json({
      success: false,
      error: { code: 'CASHBACK_ERROR', message: error.message || 'Failed to execute cashback' },
    });
  }
});

export default router;
