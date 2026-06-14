/**
 * Notification Service
 *
 * Handles notifications via:
 * - Email (SMTP)
 * - Push notifications (FCM)
 * - In-app notifications (stored in DB)
 * - SMS (optional)
 */

import fetch from 'node-fetch';

// Config
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

const PUSH_SERVICE_URL = process.env.PUSH_SERVICE_URL || 'http://localhost:4570';

// Types
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('email' | 'push' | 'inapp' | 'sms')[];
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  sentAt?: Date;
}

type NotificationType =
  | 'hire_request'
  | 'hire_approved'
  | 'hire_rejected'
  | 'twin_learned'
  | 'twin_milestone'
  | 'subscription_expiring'
  | 'password_reset'
  | 'email_verification'
  | 'welcome';

// Email templates
const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  hire_request: {
    subject: 'New Hire Request for Your Twin',
    body: `
      <h1>Hello {{name}},</h1>
      <p><strong>{{company}}</strong> wants to hire your <strong>{{twinType}} Twin</strong>.</p>
      <p>They want to use it for: {{accessType}}</p>
      <p>Login to approve or reject this request.</p>
      <a href="{{dashboardUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">View Request</a>
      <p>Best,<br>TwinOS Team</p>
    `
  },
  hire_approved: {
    subject: 'Your Hire Request Was Approved!',
    body: `
      <h1>Great news!</h1>
      <p><strong>{{employeeName}}</strong> has approved your hire request for their <strong>{{twinType}} Twin</strong>.</p>
      <p>You now have access to use their twin for your projects.</p>
      <a href="{{dashboardUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Start Using</a>
    `
  },
  hire_rejected: {
    subject: 'Your Hire Request Was Not Approved',
    body: `
      <h1>Hello {{name}},</h1>
      <p>Unfortunately, <strong>{{employeeName}}</strong> has declined your hire request for their <strong>{{twinType}} Twin</strong>.</p>
      <p>You can browse other twins in the marketplace.</p>
      <a href="{{marketplaceUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Browse Twins</a>
    `
  },
  twin_learned: {
    subject: 'Your Twin Learned Something New! 🎉',
    body: `
      <h1>Learning Update</h1>
      <p>Your <strong>{{twinType}} Twin</strong> just learned: <strong>{{skill}}</strong></p>
      <p>Training hours: {{trainingHours}}</p>
      <p>Current metrics:</p>
      <ul>
        <li>Knowledge Score: {{knowledgeScore}}</li>
        <li>Execution Score: {{executionScore}}</li>
        <li>Reliability: {{reliabilityScore}}%</li>
      </ul>
    `
  },
  twin_milestone: {
    subject: '🎯 Twin Milestone Achieved!',
    body: `
      <h1>Congratulations!</h1>
      <p>Your <strong>{{twinType}} Twin</strong> reached <strong>{{milestone}}</strong>!</p>
      <p>This is a significant achievement in your twin's development.</p>
      <a href="{{dashboardUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">View Progress</a>
    `
  },
  subscription_expiring: {
    subject: 'Your TwinOS Subscription is Expiring',
    body: `
      <h1>Subscription Reminder</h1>
      <p>Your <strong>{{plan}}</strong> subscription will expire on <strong>{{expiryDate}}</strong>.</p>
      <p>Renew now to continue using your twins.</p>
      <a href="{{billingUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Renew Now</a>
    `
  },
  password_reset: {
    subject: 'Reset Your TwinOS Password',
    body: `
      <h1>Password Reset</h1>
      <p>You requested a password reset for your TwinOS account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="{{resetUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  },
  email_verification: {
    subject: 'Verify Your TwinOS Email',
    body: `
      <h1>Verify Your Email</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="{{verifyUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Verify Email</a>
    `
  },
  welcome: {
    subject: 'Welcome to TwinOS! 🚀',
    body: `
      <h1>Welcome, {{name}}!</h1>
      <p>You're now part of the world's first Professional Twin Marketplace.</p>
      <p>Your twins are ready to start learning and growing with you.</p>
      <h2>Getting Started:</h2>
      <ol>
        <li>Create your professional twins</li>
        <li>Connect your skills and experience</li>
        <li>Browse the marketplace</li>
        <li>Start your AI-augmented career journey</li>
      </ol>
      <a href="{{dashboardUrl}}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Get Started</a>
    `
  }
};

// Push notification templates
const PUSH_TEMPLATES: Record<string, { title: string; body: string }> = {
  hire_request: {
    title: 'New Hire Request!',
    body: '{{company}} wants to hire your {{twinType}} Twin'
  },
  hire_approved: {
    title: 'Request Approved! 🎉',
    body: 'Your twin is now available to {{company}}'
  },
  twin_learned: {
    title: 'Twin Learning Progress',
    body: 'Your {{twinType}} Twin learned: {{skill}}'
  },
  twin_milestone: {
    title: 'Milestone Achieved! 🎯',
    body: 'Your {{twinType}} Twin reached: {{milestone}}'
  }
};

// =============================================================================
// NOTIFICATION STORAGE (in-memory, use DB in production)
// =============================================================================

const notifications: Notification[] = [];
const userNotifications = new Map<string, Notification[]>();

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Send notification
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>,
  channels: ('email' | 'push' | 'inapp' | 'sms')[] = ['inapp']
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const id = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const notification: Notification = {
    id,
    userId,
    type,
    title: PUSH_TEMPLATES[type]?.title || type,
    message: PUSH_TEMPLATES[type]?.body || '',
    data,
    channels,
    status: 'pending',
    createdAt: new Date()
  };

  // Store notification
  notifications.push(notification);
  if (!userNotifications.has(userId)) {
    userNotifications.set(userId, []);
  }
  userNotifications.get(userId)!.push(notification);

  // Send to each channel
  const results = [];
  for (const channel of channels) {
    try {
      switch (channel) {
        case 'email':
          await sendEmail(userId, type, data);
          results.push('email: sent');
          break;
        case 'push':
          await sendPush(userId, type, data);
          results.push('push: sent');
          break;
        case 'sms':
          await sendSMS(userId, type, data);
          results.push('sms: sent');
          break;
        case 'inapp':
          // Already stored
          results.push('inapp: stored');
          break;
      }
    } catch (error) {
      results.push(`${channel}: failed - ${(error as Error).message}`);
    }
  }

  notification.status = results.some(r => r.includes('sent') || r.includes('stored')) ? 'sent' : 'failed';

  return {
    success: notification.status === 'sent',
    notificationId: id
  };
}

/**
 * Send email
 */
async function sendEmail(userId: string, type: NotificationType, data: Record<string, any>): Promise<void> {
  if (!SMTP_USER || !SMTP_PASS) {
    logger.info(`📧 [MOCK] Email to ${userId}: ${type}`);
    return;
  }

  const template = EMAIL_TEMPLATES[type];
  if (!template) return;

  // Replace placeholders
  let body = template.body;
  let subject = template.subject;
  for (const [key, value] of Object.entries(data)) {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  // In production, use nodemailer
  // For now, log to console
  logger.info(`📧 Email to ${userId}:`);
  logger.info(`   Subject: ${subject}`);
  logger.info(`   Body: ${body.substring(0, 100)}...`);

  // TODO: Implement actual email sending
  // const transporter = nodemailer.createTransport({
  //   host: SMTP_HOST,
  //   port: SMTP_PORT,
  //   secure: SMTP_PORT === 465,
  //   auth: { user: SMTP_USER, pass: SMTP_PASS }
  // });
  // await transporter.sendMail({ ... });
}

/**
 * Send push notification
 */
async function sendPush(userId: string, type: NotificationType, data: Record<string, any>): Promise<void> {
  const template = PUSH_TEMPLATES[type];
  if (!template) return;

  // Replace placeholders
  let title = template.title;
  let body = template.body;
  for (const [key, value] of Object.entries(data)) {
    title = title.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }

  // Send to push service
  try {
    await fetch(`${PUSH_SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        notification: { title, body, data }
      })
    });
  } catch (error) {
    logger.info(`📱 [MOCK] Push to ${userId}: ${title} - ${body}`);
  }
}

/**
 * Send SMS
 */
async function sendSMS(userId: string, type: NotificationType, data: Record<string, any>): Promise<void> {
  logger.info(`📱 [MOCK] SMS to ${userId}: ${type} - ${JSON.stringify(data)}`);
}

// =============================================================================
// SPECIFIC NOTIFICATIONS
// =============================================================================

/**
 * Notify employee of new hire request
 */
export async function notifyHireRequest(
  employeeCorpId: string,
  companyName: string,
  twinId: string,
  twinType: string,
  accessType: string
): Promise<void> {
  await sendNotification(employeeCorpId, 'hire_request', {
    companyName,
    twinId,
    twinType,
    accessType,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4762'
  }, ['email', 'push', 'inapp']);
}

/**
 * Notify company of approval
 */
export async function notifyHireApproved(
  companyId: string,
  employeeName: string,
  twinId: string,
  twinType: string
): Promise<void> {
  await sendNotification(companyId, 'hire_approved', {
    employeeName,
    twinId,
    twinType,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4762'
  }, ['email', 'push', 'inapp']);
}

/**
 * Notify company of rejection
 */
export async function notifyHireRejected(
  companyId: string,
  employeeName: string,
  twinId: string,
  twinType: string
): Promise<void> {
  await sendNotification(companyId, 'hire_rejected', {
    employeeName,
    twinId,
    twinType,
    marketplaceUrl: `${process.env.DASHBOARD_URL || 'http://localhost:4762'}/marketplace`
  }, ['email', 'inapp']);
}

/**
 * Notify user of twin learning progress
 */
export async function notifyTwinLearned(
  userId: string,
  twinId: string,
  twinType: string,
  skill: string,
  metrics: any
): Promise<void> {
  await sendNotification(userId, 'twin_learned', {
    twinId,
    twinType,
    skill,
    ...metrics,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4762'
  }, ['inapp']);
}

/**
 * Notify user of milestone
 */
export async function notifyTwinMilestone(
  userId: string,
  twinId: string,
  twinType: string,
  milestone: string
): Promise<void> {
  await sendNotification(userId, 'twin_milestone', {
    twinId,
    twinType,
    milestone,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4762'
  }, ['email', 'push', 'inapp']);
}

/**
 * Send welcome email
 */
export async function notifyWelcome(
  userId: string,
  name: string,
  email: string
): Promise<void> {
  await sendNotification(userId, 'welcome', {
    name,
    email,
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:4762'
  }, ['email', 'push', 'inapp']);
}

/**
 * Send password reset
 */
export async function notifyPasswordReset(
  userId: string,
  email: string,
  resetToken: string
): Promise<void> {
  await sendNotification(userId, 'password_reset', {
    email,
    resetUrl: `${process.env.DASHBOARD_URL || 'http://localhost:4762'}/auth/reset/${resetToken}`
  }, ['email']);
}

/**
 * Send email verification
 */
export async function notifyEmailVerification(
  userId: string,
  email: string,
  verifyToken: string
): Promise<void> {
  await sendNotification(userId, 'email_verification', {
    email,
    verifyUrl: `${process.env.DASHBOARD_URL || 'http://localhost:4762'}/auth/verify/${verifyToken}`
  }, ['email']);
}

/**
 * Subscription expiring
 */
export async function notifySubscriptionExpiring(
  userId: string,
  plan: string,
  expiryDate: string
): Promise<void> {
  await sendNotification(userId, 'subscription_expiring', {
    plan,
    expiryDate,
    billingUrl: `${process.env.DASHBOARD_URL || 'http://localhost:4762'}/billing`
  }, ['email', 'push', 'inapp']);
}

// =============================================================================
// GET NOTIFICATIONS
// =============================================================================

/**
 * Get user notifications
 */
export function getUserNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Notification[] {
  let userNotifs = userNotifications.get(userId) || [];

  if (options.unreadOnly) {
    userNotifs = userNotifs.filter(n => n.status === 'pending');
  }

  const offset = options.offset || 0;
  const limit = options.limit || 50;

  return userNotifs
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
}

/**
 * Get unread count
 */
export function getUnreadCount(userId: string): number {
  const userNotifs = userNotifications.get(userId) || [];
  return userNotifs.filter(n => n.status === 'pending').length;
}

/**
 * Mark notification as read
 */
export function markAsRead(notificationId: string): boolean {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.status = 'sent';
    return true;
  }
  return false;
}

/**
 * Mark all as read for user
 */
export function markAllAsRead(userId: string): number {
  const userNotifs = userNotifications.get(userId) || [];
  let count = 0;
  for (const n of userNotifs) {
    if (n.status === 'pending') {
      n.status = 'sent';
      count++;
    }
  }
  return count;
}

export default {
  sendNotification,
  notifyHireRequest,
  notifyHireApproved,
  notifyHireRejected,
  notifyTwinLearned,
  notifyTwinMilestone,
  notifyWelcome,
  notifyPasswordReset,
  notifyEmailVerification,
  notifySubscriptionExpiring,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
