/**
 * SMS Integration
 *
 * Supports:
 * - Twilio
 * - MSG91
 * - Textlocal
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Configuration
const smsConfig = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || null,
    authToken: process.env.TWILIO_AUTH_TOKEN || null,
    from: process.env.TWILIO_PHONE_NUMBER || null
  },
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || null,
    senderId: process.env.MSG91_SENDER_ID || 'REZGTM',
    route: process.env.MSG91_ROUTE || '4'
  }
};

// In-memory storage
const smsLog = new Map();
const templates = new Map();
const optIns = new Set();

// Rate limits
const RATE_LIMITS = {
  perSecond: 10,
  perMinute: 100,
  perHour: 1000,
  perDay: 10000
};
const sentHistory = [];

/**
 * Send SMS
 */
async function sendSMS(options = {}) {
  const { to, message, templateId = null, from = null } = options;

  if (!to || !message) {
    throw new Error('Phone number and message are required');
  }

  // Check rate limit
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded');
  }

  const messageId = uuidv4();
  const timestamp = new Date().toISOString();

  let result;

  if (smsConfig.twilio.accountSid) {
    result = await sendViaTwilio({ to, message, from: from || smsConfig.twilio.from });
  } else if (smsConfig.msg91.authKey) {
    result = await sendViaMSG91({ to, message });
  } else {
    // Mock mode
    result = {
      id: messageId,
      to,
      message,
      status: 'sent',
      mock: true,
      timestamp
    };
  }

  const log = {
    id: messageId,
    ...result,
    to,
    message: message.substring(0, 160),
    templateId,
    sentAt: timestamp
  };

  smsLog.set(messageId, log);
  recordSend();

  return log;
}

async function sendViaTwilio({ to, message, from }) {
  const { accountSid, authToken } = smsConfig.twilio;

  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: to,
        From: from,
        Body: message
      }),
      {
        auth: { username: accountSid, password: authToken },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return {
      id: response.data.sid,
      status: response.data.status,
      to: response.data.to,
      price: response.data.price
    };
  } catch (error) {
    throw new Error(`Twilio error: ${error.response?.data?.message || error.message}`);
  }
}

async function sendViaMSG91({ to, message }) {
  const { authKey, senderId, route } = smsConfig.msg91;

  try {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow/',
      {
        sender: senderId,
        mobiles: to.replace(/\D/g, ''),
        message,
        route
      },
      {
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      id: response.data.id,
      status: response.data.type === 'success' ? 'sent' : 'failed',
      to
    };
  } catch (error) {
    throw new Error(`MSG91 error: ${error.message}`);
  }
}

function checkRateLimit() {
  const now = Date.now();
  const windows = {
    second: now - 1000,
    minute: now - 60000,
    hour: now - 3600000,
    day: now - 86400000
  };

  sentHistory.length = 0;
  const recent = sentHistory.filter(ts => ts > windows.second);
  recent.length = 0;

  if (recent.length >= RATE_LIMITS.perSecond) return false;

  const minute = sentHistory.filter(ts => ts > windows.minute).length;
  if (minute >= RATE_LIMITS.perMinute) return false;

  const hour = sentHistory.filter(ts => ts > windows.hour).length;
  if (hour >= RATE_LIMITS.perHour) return false;

  return true;
}

function recordSend() {
  sentHistory.push(Date.now());
}

/**
 * Send bulk SMS
 */
async function sendBulkSMS(recipients, message, options = {}) {
  const results = [];
  const errors = [];

  for (const recipient of recipients) {
    try {
      const phone = typeof recipient === 'string' ? recipient : recipient.phone;
      const result = await sendSMS({ to: phone, message, ...options });
      results.push({ success: true, ...result });
    } catch (error) {
      errors.push({ phone: typeof recipient === 'string' ? recipient : recipient.phone, error: error.message });
    }

    await new Promise(r => setTimeout(r, 100));
  }

  return { results, errors, total: recipients.length };
}

/**
 * Create SMS template
 */
function createTemplate(data) {
  const id = uuidv4();
  const template = {
    id,
    name: data.name,
    message: data.message,
    variables: (data.message.match(/{{(\d+)}}/g) || []).map(v => v),
    createdAt: new Date().toISOString()
  };
  templates.set(id, template);
  return template;
}

/**
 * Send from template
 */
async function sendFromTemplate(to, templateId, variables = {}) {
  const template = templates.get(templateId);
  if (!template) throw new Error('Template not found');

  let message = template.message;
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  return sendSMS({ to, message, templateId });
}

/**
 * Get SMS analytics
 */
function getAnalytics(timeRange = '30d') {
  const now = new Date();
  const rangeMs = { '7d': 7, '30d': 30, '90d': 90 }[timeRange] || 30;
  const startDate = new Date(now.getTime() - rangeMs * 24 * 60 * 60 * 1000);

  const messages = Array.from(smsLog.values())
    .filter(m => new Date(m.sentAt) >= startDate);

  return {
    total: messages.length,
    sent: messages.filter(m => m.status === 'sent').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    failed: messages.filter(m => m.status === 'failed').length,
    templates: templates.size
  };
}

/**
 * Get message log
 */
function getMessageLog(limit = 100) {
  return Array.from(smsLog.values())
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, limit);
}

module.exports = {
  sendSMS,
  sendBulkSMS,
  sendFromTemplate,
  createTemplate,
  getTemplates: () => Array.from(templates.values()),
  getAnalytics,
  getMessageLog,
  smsLog
};