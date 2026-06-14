/**
 * REZ Verify QR - Notification Service
 * Handles push notifications, SMS, and email notifications
 */

import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// ============================================
// FIREBASE CONFIGURATION
// ============================================

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || '';

// ============================================
// TYPES
// ============================================

interface NotificationPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  click_action?: string;
}

interface SMSPayload {
  phone: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

/**
 * POST /api/notifications/push
 * Send push notification via Firebase Cloud Messaging
 */
router.post('/push', async (req: Request, res: Response) => {
  const { user_id, title, body, data, image, click_action } = req.body as NotificationPayload;

  if (!user_id || !title || !body) {
    return res.status(400).json({ error: 'user_id, title, and body are required' });
  }

  try {
    // Get user's FCM token from profile service
    const tokenResponse = await axios.get(
      `${process.env.PROFILE_API_URL || 'https://rez-profile.onrender.com'}/api/profile/${user_id}/fcm_token`,
      { timeout: 5000 }
    ).catch(() => ({ data: null }));

    const fcmToken = tokenResponse?.data?.fcm_token;

    if (!fcmToken) {
      return res.status(404).json({ error: 'User FCM token not found' });
    }

    // Send via FCM
    const fcmResponse = await axios.post(
      `https://fcm.googleapis.com/fcm/send`,
      {
        to: fcmToken,
        notification: {
          title,
          body,
          image: image || undefined
        },
        data: {
          ...data,
          click_action: click_action || 'FLUTTER_NOTIFICATION_CLICK',
          user_id
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'verify_qr_channel',
            icon: 'ic_notification',
            color: '#10B981'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `key=${FIREBASE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    res.json({
      success: true,
      message_id: fcmResponse.data.results?.[0]?.message_id,
      multicast_id: fcmResponse.data.multicast_id
    });

  } catch (error) {
    console.error('Push notification error:', error.response?.data || error);

    // If FCM fails, try via REZ notifications service
    try {
      await axios.post(
        `${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send`,
        {
          user_id,
          type: 'push',
          title,
          body,
          data
        },
        { timeout: 5000 }
      );

      res.json({ success: true, via: 'rez_notifications' });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to send push notification' });
    }
  }
});

/**
 * POST /api/notifications/push-multicast
 * Send push notification to multiple users
 */
router.post('/push-multicast', async (req: Request, res: Response) => {
  const { user_ids, title, body, data } = req.body;

  if (!user_ids?.length || !title || !body) {
    return res.status(400).json({ error: 'user_ids, title, and body are required' });
  }

  try {
    // Get all FCM tokens
    const tokens = await Promise.all(
      user_ids.map((user_id: string) =>
        axios.get(
          `${process.env.PROFILE_API_URL || 'https://rez-profile.onrender.com'}/api/profile/${user_id}/fcm_token`,
          { timeout: 5000 }
        ).catch(() => ({ data: { fcm_token: null } }))
      )
    );

    const validTokens = tokens
      .map((t) => t.data?.fcm_token)
      .filter(Boolean);

    if (validTokens.length === 0) {
      return res.status(404).json({ error: 'No valid FCM tokens found' });
    }

    // Send multicast
    const response = await axios.post(
      `https://fcm.googleapis.com/fcm/send`,
      {
        registration_ids: validTokens,
        notification: { title, body },
        data,
        android: {
          priority: 'high',
          notification: { channel_id: 'verify_qr_channel' }
        }
      },
      {
        headers: {
          'Authorization': `key=${FIREBASE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      success_count: response.data.success,
      failure_count: response.data.failure,
      multicast_id: response.data.multicast_id
    });

  } catch (error) {
    console.error('Push multicast error:', error);
    res.status(500).json({ error: 'Failed to send multicast notification' });
  }
});

// ============================================
// SMS NOTIFICATIONS
// ============================================

/**
 * POST /api/notifications/sms
 * Send SMS via REZ Notifications service
 */
router.post('/sms', async (req: Request, res: Response) => {
  const { phone, message, template, variables } = req.body as SMSPayload;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  try {
    const response = await axios.post(
      `${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/sms/send`,
      {
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        message,
        template,
        variables
      },
      { timeout: 10000 }
    );

    res.json({
      success: true,
      message_id: response.data.message_id
    });

  } catch (error) {
    console.error('SMS error:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to send SMS',
      details: error.response?.data?.error
    });
  }
});

/**
 * POST /api/notifications/sms/otp
 * Send OTP via SMS
 */
router.post('/sms/otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'phone and otp are required' });
  }

  try {
    const response = await axios.post(
      `${process.env.AUTH_API || 'https://rez-auth.onrender.com'}/api/sms/send-otp`,
      {
        phone: phone.startsWith('+') ? phone : `+91${phone}`,
        otp
      },
      { timeout: 10000 }
    );

    res.json({
      success: true,
      message_id: response.data.message_id
    });

  } catch (error) {
    console.error('OTP SMS error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

/**
 * POST /api/notifications/email
 * Send email notification
 */
router.post('/email', async (req: Request, res: Response) => {
  const { to, subject, body, html } = req.body as EmailPayload;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  try {
    const response = await axios.post(
      `${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/email/send`,
      {
        to,
        subject,
        text: body,
        html: html || `<html><body>${body}</body></html>`
      },
      { timeout: 15000 }
    );

    res.json({
      success: true,
      message_id: response.data.message_id
    });

  } catch (error) {
    console.error('Email error:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.response?.data?.error
    });
  }
});

// ============================================
// BUILT-IN NOTIFICATIONS
// ============================================

/**
 * POST /api/notifications/verify-success
 * Notify user after successful verification
 */
router.post('/verify-success', async (req: Request, res: Response) => {
  const { user_id, phone, serial, brand, model, warranty_status } = req.body;

  // Push notification
  if (user_id) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send`, {
      user_id,
      type: 'push',
      title: '✅ Product Verified',
      body: `${brand} ${model} verified successfully`,
      data: { serial, screen: 'warranty' }
    }).catch(console.error);
  }

  // SMS
  if (phone) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/sms/send`, {
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      template: 'verification_success',
      variables: { brand, model, warranty_status }
    }).catch(console.error);
  }

  res.json({ success: true });
});

/**
 * POST /api/notifications/claim-update
 * Notify user about claim status change
 */
router.post('/claim-update', async (req: Request, res: Response) => {
  const { user_id, phone, claim_id, status, message } = req.body;

  const title = status === 'approved' ? '✅ Claim Approved!'
    : status === 'rejected' ? '⚠️ Claim Update'
    : '📋 Claim Update';

  const body = message || `Your claim #${claim_id} has been updated to: ${status}`;

  // Push
  if (user_id) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send`, {
      user_id,
      type: 'push',
      title,
      body,
      data: { claim_id, screen: 'claims' }
    }).catch(console.error);
  }

  // SMS
  if (phone) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/sms/send`, {
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      message: `Verify QR: ${body}`
    }).catch(console.error);
  }

  res.json({ success: true });
});

/**
 * POST /api/notifications/service-reminder
 * Send service appointment reminder
 */
router.post('/service-reminder', async (req: Request, res: Response) => {
  const { user_id, phone, booking_id, date, time, center_name } = req.body;

  // Push
  if (user_id) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send`, {
      user_id,
      type: 'push',
      title: '📅 Service Reminder',
      body: `Your appointment at ${center_name} is scheduled for ${date} at ${time}`,
      data: { booking_id, screen: 'bookings' }
    }).catch(console.error);
  }

  // SMS
  if (phone) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/sms/send`, {
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      template: 'service_reminder',
      variables: { date, time, center: center_name }
    }).catch(console.error);
  }

  res.json({ success: true });
});

/**
 * POST /api/notifications/ownership-passport
 * Notify user about passport/ownership
 */
router.post('/ownership-passport', async (req: Request, res: Response) => {
  const { user_id, phone, serial, passport_id, action } = req.body;

  const messages: Record<string, { title: string; body: string }> = {
    created: {
      title: '📜 Passport Created',
      body: `Your ownership passport for this product is ready`
    },
    transferred: {
      title: '🔄 Ownership Transferred',
      body: `Ownership has been transferred successfully`
    },
    certificate: {
      title: '📄 Certificate Ready',
      body: `Your ownership certificate is ready to view`
    }
  };

  const msg = messages[action] || messages.created;

  if (user_id) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send`, {
      user_id,
      type: 'push',
      title: msg.title,
      body: msg.body,
      data: { serial, passport_id, screen: 'passport' }
    }).catch(console.error);
  }

  res.json({ success: true });
});

/**
 * POST /api/notifications/warranty-expiry
 * Send warranty expiry warning
 */
router.post('/warranty-expiry', async (req: Request, res: Response) => {
  const { user_id, phone, serial, brand, model, days_remaining, plan_url } = req.body;

  const title = days_remaining <= 7 ? '⚠️ Warranty Expiring Soon!'
    : '📅 Warranty Expiring';

  const body = days_remaining <= 7
    ? `Your ${brand} ${model} warranty expires in ${days_remaining} days!`
    : `Your ${brand} ${model} warranty expires in ${days_remaining} days. Extend now!`;

  if (user_id) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send`, {
      user_id,
      type: 'push',
      title,
      body,
      data: { serial, screen: 'extend-warranty', url: plan_url }
    }).catch(console.error);
  }

  if (phone) {
    await axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/sms/send`, {
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      template: 'warranty_expiry_reminder',
      variables: { brand, days: days_remaining, url: plan_url }
    }).catch(console.error);
  }

  res.json({ success: true });
});

/**
 * POST /api/notifications/recall-alert
 * Send product recall notification
 */
router.post('/recall-alert', async (req: Request, res: Response) => {
  const { user_ids, product, title, description, severity, action_url } = req.body;

  const urgency = severity === 'critical' ? '🚨 URGENT: ' : severity === 'urgent' ? '⚠️ ' : '📢 ';

  const pushPromise = axios.post(`${process.env.NOTIF_API || 'https://rez-notifications.onrender.com'}/api/send-bulk`, {
    user_ids,
    type: 'push',
    title: `${urgency}Product Recall`,
    body: `${product}: ${description}`,
    data: { screen: 'recall', url: action_url },
    priority: severity === 'critical' ? 'high' : 'normal'
  }).catch(console.error);

  await pushPromise;

  res.json({ success: true, notified: user_ids?.length || 0 });
});

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/**
 * GET /api/notifications/preferences/:user_id
 * Get user's notification preferences
 */
router.get('/preferences/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    const response = await axios.get(
      `${process.env.PROFILE_API_URL || 'https://rez-profile.onrender.com'}/api/profile/${user_id}/notification_preferences`,
      { timeout: 5000 }
    );

    res.json(response.data);
  } catch {
    // Return defaults
    res.json({
      push: { enabled: true },
      sms: { enabled: true },
      email: { enabled: true },
      channels: {
        warranty: true,
        claims: true,
        service: true,
        promotions: false
      }
    });
  }
});

/**
 * PUT /api/notifications/preferences/:user_id
 * Update notification preferences
 */
router.put('/preferences/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const preferences = req.body;

  try {
    await axios.put(
      `${process.env.PROFILE_API_URL || 'https://rez-profile.onrender.com'}/api/profile/${user_id}/notification_preferences`,
      preferences,
      { timeout: 5000 }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
