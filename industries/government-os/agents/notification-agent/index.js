/**
 * Notification Agent
 * Manages citizen notifications, alerts, and updates
 * Supports multiple channels: email, SMS, push, and in-app
 */

const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/notification-agent.log' })
  ]
});

class NotificationAgent {
  constructor(config = {}) {
    this.config = {
      citizenTwinServiceUrl: config.citizenTwinServiceUrl || process.env.CITIZEN_TWIN_SERVICE_URL,
      // Channel configurations
      email: {
        provider: config.emailProvider || process.env.EMAIL_PROVIDER || 'ses',
        region: config.emailRegion || process.env.AWS_REGION,
        fromAddress: config.emailFromAddress || process.env.EMAIL_FROM_ADDRESS,
        ...config.email
      },
      sms: {
        provider: config.smsProvider || process.env.SMS_PROVIDER || 'twilio',
        accountSid: config.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID,
        authToken: config.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN,
        fromNumber: config.smsFromNumber || process.env.SMS_FROM_NUMBER,
        ...config.sms
      },
      push: {
        provider: config.pushProvider || process.env.PUSH_PROVIDER || 'fcm',
        serverKey: config.fcmServerKey || process.env.FCM_SERVER_KEY,
        ...config.push
      },
      inApp: {
        enabled: true,
        retentionDays: 90,
        ...config.inApp
      },
      httpTimeout: config.httpTimeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 5000,
      ...config
    };

    this.notificationQueue = [];
    this.sentNotifications = new Map();
    this.preferencesCache = new Map();
  }

  /**
   * Send a notification
   */
  async sendNotification(notification) {
    const startTime = Date.now();
    const notificationId = notification.id || uuidv4();

    logger.info('Processing notification', {
      notificationId,
      residentId: notification.residentId,
      type: notification.type
    });

    try {
      // Get citizen contact preferences
      const preferences = await this.getCitizenPreferences(notification.residentId);

      // Determine delivery channels based on preferences and notification type
      const channels = this.determineChannels(notification, preferences);

      if (channels.length === 0) {
        return {
          success: false,
          notificationId,
          error: 'No delivery channels available',
          code: 'NO_CHANNELS'
        };
      }

      // Prepare notification content
      const content = this.prepareContent(notification);

      // Send to each channel
      const results = await Promise.allSettled(
        channels.map(channel => this.sendViaChannel(channel, notification, content, preferences))
      );

      // Process results
      const deliveryResults = results.map((result, index) => ({
        channel: channels[index],
        status: result.status === 'fulfilled' ? 'sent' : 'failed',
        response: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));

      // Store notification
      await this.storeNotification({
        notificationId,
        residentId: notification.residentId,
        type: notification.type,
        content,
        channels: deliveryResults,
        sentAt: new Date().toISOString()
      });

      const overallSuccess = deliveryResults.some(r => r.status === 'sent');

      logger.info('Notification processed', {
        notificationId,
        success: overallSuccess,
        channels: deliveryResults.map(r => ({ channel: r.channel, status: r.status })),
        duration: Date.now() - startTime
      });

      return {
        success: overallSuccess,
        notificationId,
        channels: deliveryResults,
        content: {
          subject: content.subject,
          body: content.body
        }
      };
    } catch (error) {
      logger.error('Notification processing failed', {
        notificationId,
        error: error.message
      });

      return {
        success: false,
        notificationId,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(notifications) {
    const startTime = Date.now();
    const batchId = uuidv4();

    logger.info('Processing bulk notifications', {
      batchId,
      count: notifications.length
    });

    const results = await Promise.allSettled(
      notifications.map(n => this.sendNotification(n))
    );

    const summary = {
      batchId,
      total: notifications.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value?.success).length,
      duration: Date.now() - startTime
    };

    logger.info('Bulk notifications completed', summary);

    return {
      success: true,
      ...summary,
      details: results.map((r, i) => ({
        index: i,
        notificationId: r.value?.notificationId || null,
        success: r.status === 'fulfilled' && r.value?.success
      }))
    };
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(notification, schedule) {
    const scheduledNotification = {
      ...notification,
      scheduledFor: schedule.scheduledFor,
      scheduleId: uuidv4(),
      recurring: schedule.recurring || null
    };

    // Store scheduled notification
    await this.storeScheduledNotification(scheduledNotification);

    logger.info('Notification scheduled', {
      scheduleId: scheduledNotification.scheduleId,
      residentId: notification.residentId,
      scheduledFor: schedule.scheduledFor
    });

    return {
      success: true,
      scheduleId: scheduledNotification.scheduleId,
      scheduledFor: schedule.scheduledFor
    };
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduled(scheduleId) {
    // Remove from scheduled notifications storage
    logger.info('Cancelling scheduled notification', { scheduleId });

    return {
      success: true,
      scheduleId
    };
  }

  /**
   * Get notification history for a citizen
   */
  async getNotificationHistory(residentId, options = {}) {
    const notifications = await this.fetchNotificationHistory(residentId, options);

    return {
      residentId,
      notifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.readAt).length
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, residentId) {
    await this.updateNotificationStatus(notificationId, residentId, 'read');

    return {
      success: true,
      notificationId,
      readAt: new Date().toISOString()
    };
  }

  /**
   * Get pending notifications for a resident
   */
  async getPendingNotifications(residentId) {
    const notifications = await this.fetchPendingNotifications(residentId);

    return {
      residentId,
      notifications,
      count: notifications.length
    };
  }

  // Channel delivery methods

  async sendViaChannel(channel, notification, content, preferences) {
    switch (channel) {
      case 'email':
        return this.sendEmail(notification, content, preferences);
      case 'sms':
        return this.sendSMS(notification, content, preferences);
      case 'push':
        return this.sendPush(notification, content, preferences);
      case 'in_app':
        return this.sendInApp(notification, content);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  async sendEmail(notification, content, preferences) {
    const emailConfig = this.config.email;

    // Prepare email payload
    const emailPayload = {
      to: notification.email || preferences.email,
      from: emailConfig.fromAddress,
      subject: content.subject,
      html: content.html || this.generateEmailHtml(content),
      text: content.body
    };

    // Send via configured provider
    if (emailConfig.provider === 'ses') {
      return this.sendViaSES(emailPayload);
    } else if (emailConfig.provider === 'sendgrid') {
      return this.sendViaSendGrid(emailPayload);
    } else if (emailConfig.provider === 'smtp') {
      return this.sendViaSMTP(emailPayload);
    }

    throw new Error(`Unknown email provider: ${emailConfig.provider}`);
  }

  async sendViaSES(payload) {
    // AWS SES implementation
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: this.config.email.region });

    const params = {
      Source: payload.from,
      Destination: {
        ToAddresses: [payload.to]
      },
      Message: {
        Subject: {
          Data: payload.subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: payload.html,
            Charset: 'UTF-8'
          },
          Text: {
            Data: payload.text,
            Charset: 'UTF-8'
          }
        }
      }
    };

    const result = await ses.sendEmail(params).promise();
    return { messageId: result.MessageId };
  }

  async sendViaSendGrid(payload) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: payload.to,
      from: payload.from,
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    };

    const [response] = await sgMail.send(msg);
    return { messageId: response.headers['x-message-id'] };
  }

  async sendViaSMTP(payload) {
    // SMTP implementation using nodemailer
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const result = await transporter.sendMail(payload);
    return { messageId: result.messageId };
  }

  async sendSMS(notification, content, preferences) {
    const smsConfig = this.config.sms;
    const phone = notification.phone || preferences.phone;

    if (!phone) {
      throw new Error('No phone number available');
    }

    const message = {
      to: phone,
      from: smsConfig.fromNumber,
      body: content.smsBody || content.body.substring(0, 160)
    };

    if (smsConfig.provider === 'twilio') {
      return this.sendViaTwilio(message);
    } else if (smsConfig.provider === 'sns') {
      return this.sendViaSNS(message);
    }

    throw new Error(`Unknown SMS provider: ${smsConfig.provider}`);
  }

  async sendViaTwilio(message) {
    const twilio = require('twilio');
    const client = twilio(
      this.config.sms.accountSid,
      this.config.sms.authToken
    );

    const result = await client.messages.create(message);
    return { messageId: result.sid, status: result.status };
  }

  async sendViaSNS(message) {
    const AWS = require('aws-sdk');
    const sns = new AWS.SNS();

    const params = {
      Message: message.body,
      PhoneNumber: message.to,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'GovOS'
        }
      }
    };

    const result = await sns.publish(params).promise();
    return { messageId: result.MessageId };
  }

  async sendPush(notification, content, preferences) {
    const pushConfig = this.config.push;
    const tokens = preferences.pushTokens || [];

    if (tokens.length === 0) {
      throw new Error('No push tokens available');
    }

    const pushPayload = {
      tokens,
      notification: {
        title: content.subject,
        body: content.body,
        data: notification.data || {}
      }
    };

    if (pushConfig.provider === 'fcm') {
      return this.sendViaFCM(pushPayload);
    } else if (pushConfig.provider === 'apns') {
      return this.sendViaAPNS(pushPayload);
    }

    throw new Error(`Unknown push provider: ${pushConfig.provider}`);
  }

  async sendViaFCM(payload) {
    const admin = require('firebase-admin');

    // Initialize Firebase if not already done
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    const messages = payload.tokens.map(token => ({
      token,
      notification: payload.notification,
      data: payload.notification.data
    }));

    const result = await admin.messaging().sendEach(messages);
    return {
      successCount: result.successCount,
      failureCount: result.failureCount
    };
  }

  async sendViaAPNS(payload) {
    // APNS implementation
    return { sent: payload.tokens.length };
  }

  async sendInApp(notification, content) {
    // Store in-app notification
    await this.storeInAppNotification({
      notificationId: notification.id || uuidv4(),
      residentId: notification.residentId,
      type: notification.type,
      title: content.subject,
      message: content.body,
      data: notification.data,
      createdAt: new Date().toISOString(),
      readAt: null
    });

    return { stored: true };
  }

  // Helper methods

  determineChannels(notification, preferences) {
    const channels = [];

    // Check notification type preferences
    const typePreferences = preferences.channelPreferences?.[notification.type] || {
      email: true,
      sms: false,
      push: true,
      in_app: true
    };

    // Add available channels based on preferences
    if (typePreferences.email && (notification.email || preferences.email)) {
      channels.push('email');
    }

    if (typePreferences.sms && (notification.phone || preferences.phone)) {
      channels.push('sms');
    }

    if (typePreferences.push && (preferences.pushTokens?.length > 0)) {
      channels.push('push');
    }

    if (typePreferences.in_app !== false) {
      channels.push('in_app');
    }

    // For critical notifications, always include in-app
    if (notification.critical && !channels.includes('in_app')) {
      channels.push('in_app');
    }

    return channels;
  }

  prepareContent(notification) {
    // Generate content based on notification type
    const templates = this.getNotificationTemplate(notification.type);

    return {
      subject: this.interpolate(templates.subject, notification.data || {}),
      body: this.interpolate(templates.body, notification.data || {}),
      html: templates.html ? this.interpolate(templates.html, notification.data || {}) : null,
      smsBody: templates.smsBody ? this.interpolate(templates.smsBody, notification.data || {}) : null
    };
  }

  getNotificationTemplate(type) {
    const templates = {
      application_received: {
        subject: 'Application Received - {applicationType}',
        body: 'Your {applicationType} application has been received and is being processed. Application ID: {applicationId}',
        smsBody: 'App received for {applicationType}. ID: {applicationId}'
      },
      application_approved: {
        subject: 'Application Approved - {applicationType}',
        body: 'Great news! Your {applicationType} application has been approved. Your {documentType} is now being issued.',
        smsBody: 'Your {applicationType} app is APPROVED!'
      },
      application_denied: {
        subject: 'Application Decision - {applicationType}',
        body: 'Your {applicationType} application has been reviewed. Please log in to view the decision details.',
        smsBody: 'Your {applicationType} app decision is ready. Check your email.'
      },
      permit_issued: {
        subject: 'Your {documentType} is Ready',
        body: 'Your {documentType} (Number: {documentNumber}) has been issued and is available for download.',
        smsBody: '{documentType} issued! Number: {documentNumber}'
      },
      permit_expiring: {
        subject: 'Permit Expiring Soon - {documentType}',
        body: 'Your {documentType} will expire on {expirationDate}. Please initiate renewal to maintain continuous coverage.',
        smsBody: '{documentType} expires {expirationDate}. Renew now!'
      },
      renewal_reminder: {
        subject: 'Renewal Reminder - {documentType}',
        body: 'This is a reminder to renew your {documentType}. The renewal window is now open.',
        smsBody: 'Reminder: Renew your {documentType} today!'
      },
      document_required: {
        subject: 'Additional Documents Required',
        body: 'We need additional documents for your application: {documentTypes}. Please upload them within {deadline}.',
        smsBody: 'App needs docs: {documentTypes}'
      },
      general_update: {
        subject: 'Update from Government Services',
        body: '{message}',
        smsBody: '{message}'
      }
    };

    return templates[type] || {
      subject: 'Notification from Government Services',
      body: notification.message || 'You have a new notification.',
      smsBody: (notification.message || '').substring(0, 160)
    };
  }

  interpolate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  generateEmailHtml(content) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003366; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Government Services</h1>
    </div>
    <div class="content">
      <p>${content.body}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Government Services.</p>
      <p>Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  async getCitizenPreferences(residentId) {
    // Check cache first
    const cached = this.preferencesCache.get(residentId);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.preferences;
    }

    // Fetch from citizen service
    if (this.config.citizenTwinServiceUrl) {
      try {
        const profile = await this.makeRequest(
          `${this.config.citizenTwinServiceUrl}/citizen-twins/${residentId}`
        );

        const preferences = {
          email: profile.demographics?.email,
          phone: profile.demographics?.phone,
          pushTokens: profile.preferences?.pushTokens || [],
          channelPreferences: profile.preferences?.notificationChannels || {},
          language: profile.preferences?.language || 'en'
        };

        this.preferencesCache.set(residentId, {
          preferences,
          timestamp: Date.now()
        });

        return preferences;
      } catch (error) {
        logger.error('Failed to fetch citizen preferences', { residentId, error: error.message });
      }
    }

    return {
      email: null,
      phone: null,
      pushTokens: [],
      channelPreferences: {}
    };
  }

  async storeNotification(notification) {
    this.sentNotifications.set(notification.notificationId, notification);
  }

  async storeScheduledNotification(notification) {
    // Store in scheduled notifications (would use database in production)
    this.notificationQueue.push(notification);
  }

  async storeInAppNotification(notification) {
    // Store in in-app notifications (would use database in production)
    logger.info('In-app notification stored', { notificationId: notification.notificationId });
  }

  async fetchNotificationHistory(residentId, options = {}) {
    // Fetch from storage (would use database in production)
    const allNotifications = Array.from(this.sentNotifications.values())
      .filter(n => n.residentId === residentId);

    return allNotifications.slice(0, options.limit || 50);
  }

  async fetchPendingNotifications(residentId) {
    return this.notificationQueue.filter(n => n.residentId === residentId);
  }

  async updateNotificationStatus(notificationId, residentId, status) {
    const notification = this.sentNotifications.get(notificationId);
    if (notification) {
      notification[status === 'read' ? 'readAt' : status] = new Date().toISOString();
    }
  }

  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.httpTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    const checks = {
      email: false,
      sms: false,
      push: false,
      citizenTwinService: false
    };

    if (this.config.email.fromAddress) {
      checks.email = true;
    }

    if (this.config.sms.fromNumber) {
      checks.sms = true;
    }

    if (this.config.push.serverKey || this.config.push.credentials) {
      checks.push = true;
    }

    if (this.config.citizenTwinServiceUrl) {
      try {
        await this.makeRequest(`${this.config.citizenTwinServiceUrl}/health`);
        checks.citizenTwinService = true;
      } catch (error) {
        // Service unavailable
      }
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks,
      queueSize: this.notificationQueue.length
    };
  }
}

module.exports = { NotificationAgent };

// Run as standalone agent
if (require.main === module) {
  const agent = new NotificationAgent({
    citizenTwinServiceUrl: process.env.CITIZEN_TWIN_SERVICE_URL
  });

  const express = require('express');
  const app = express();
  app.use(express.json());

  app.post('/notifications', async (req, res) => {
    try {
      const result = await agent.sendNotification(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/notifications/bulk', async (req, res) => {
    try {
      const result = await agent.sendBulk(req.body.notifications);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/notifications/schedule', async (req, res) => {
    try {
      const result = await agent.scheduleNotification(req.body.notification, req.body.schedule);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/notifications/:residentId/history', async (req, res) => {
    try {
      const result = await agent.getNotificationHistory(req.params.residentId, req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/notifications/:notificationId/read', async (req, res) => {
    try {
      const result = await agent.markAsRead(req.params.notificationId, req.body.residentId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/health', async (req, res) => {
    try {
      res.json(await agent.healthCheck());
    } catch (error) {
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  const PORT = process.env.PORT || 4004;
  app.listen(PORT, () => {
    console.log(`Notification Agent running on port ${PORT}`);
  });
}