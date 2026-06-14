/**
 * WhatsApp Business API Integration
 *
 * Sends WhatsApp messages via WhatsApp Business API
 * Supports: text, templates, images, documents, interactive buttons
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// WhatsApp Business API Configuration
const whatsappConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_ID || null,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || null,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ID || null,
  apiVersion: 'v18.0'
};

const WHATSAPP_API_URL = `https://graph.facebook.com/${whatsappConfig.apiVersion}`;

// In-memory message storage
const messageLog = new Map();
const templates = new Map();
const contacts = new Map();
const campaigns = new Map();
const optIns = new Set();

// Rate limiting
const RATE_LIMITS = {
  perSecond: 5,
  perMinute: 100,
  perHour: 1000,
  perDay: 10000
};
const sentHistory = {
  second: [],
  minute: [],
  hour: [],
  day: []
};

/**
 * Seed default templates
 */
const seedTemplates = () => {
  const defaultTemplates = [
    {
      id: 'tmpl_intro',
      name: 'intro_message',
      category: 'MARKETING',
      language: 'en',
      status: 'approved',
      components: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, I noticed {{2}} is growing fast in the {{3}} space. We help companies like yours {{4}}. Would you be open to a quick 15-min call this week?'
        },
        {
          type: 'FOOTER',
          text: 'Reply STOP to unsubscribe'
        }
      ]
    },
    {
      id: 'tmpl_followup',
      name: 'follow_up',
      category: 'MARKETING',
      language: 'en',
      status: 'approved',
      components: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, just following up on my message about {{2}}. Happy to work around your schedule. Let me know what works best!'
        },
        {
          type: 'FOOTER',
          text: 'Reply STOP to unsubscribe'
        }
      ]
    },
    {
      id: 'tmpl_demo',
      name: 'demo_invite',
      category: 'MARKETING',
      language: 'en',
      status: 'approved',
      components: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, thanks for your interest! I\'d love to show you how {{2}} can help {{3}}. When would you be free for a quick demo?'
        },
        {
          type: 'BUTTONS',
          buttons: [
            { type: 'QUICK_REPLY', payload: 'demo_morning', text: 'Morning' },
            { type: 'QUICK_REPLY', payload: 'demo_afternoon', text: 'Afternoon' },
            { type: 'QUICK_REPLY', payload: 'demo_evening', text: 'Evening' }
          ]
        }
      ]
    },
    {
      id: 'tmpl_meeting',
      name: 'meeting_confirm',
      category: 'UTILITY',
      language: 'en',
      status: 'approved',
      components: [
        {
          type: 'BODY',
          text: 'Your meeting is confirmed! 📅\n\nTopic: {{1}}\nDate: {{2}}\nTime: {{3}}\n\nJoin: {{4}}'
        }
      ]
    },
    {
      id: 'tmpl_reminder',
      name: 'meeting_reminder',
      category: 'UTILITY',
      language: 'en',
      status: 'approved',
      components: [
        {
          type: 'BODY',
          text: 'Reminder: You have a meeting in {{1}}! ⏰\n\nTopic: {{2}}\nJoin: {{3}}'
        }
      ]
    }
  ];

  defaultTemplates.forEach(t => templates.set(t.id, t));
};

seedTemplates();

/**
 * Check rate limit
 */
function checkRateLimit() {
  const now = Date.now();
  const windows = {
    second: now - 1000,
    minute: now - 60000,
    hour: now - 3600000,
    day: now - 86400000
  };

  // Clean old entries
  Object.keys(windows).forEach(key => {
    sentHistory[key] = sentHistory[key].filter(ts => ts > windows[key]);
  });

  if (sentHistory.second.length >= RATE_LIMITS.perSecond) return false;
  if (sentHistory.minute.length >= RATE_LIMITS.perMinute) return false;
  if (sentHistory.hour.length >= RATE_LIMITS.perHour) return false;
  if (sentHistory.day.length >= RATE_LIMITS.perDay) return false;

  return true;
}

/**
 * Send WhatsApp message
 */
async function sendMessage(options = {}) {
  const {
    to,
    templateId,
    templateData = {},
    type = 'text',
    content = '',
    campaignId = null,
    prospectId = null
  } = options;

  // Rate limit check
  if (!checkRateLimit()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Check opt-in
  if (!optIns.has(to)) {
    throw new Error('Contact has not opted in to WhatsApp messages');
  }

  const messageId = uuidv4();
  const timestamp = new Date().toISOString();

  if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
    // Mock mode - simulate sending
    const mockMessage = {
      id: messageId,
      messaging_product: 'whatsapp',
      to,
      type,
      status: 'sent',
      timestamp,
      mock: true
    };

    messageLog.set(messageId, mockMessage);
    recordSend();
    return mockMessage;
  }

  try {
    let payload;

    if (type === 'template' && templateId) {
      const template = templates.get(templateId);
      if (!template) throw new Error('Template not found');

      // Format template with data
      const formattedComponents = template.components.map(comp => {
        if (comp.type === 'BODY') {
          let text = comp.text;
          Object.keys(templateData).forEach((key, idx) => {
            text = text.replace(`{{${idx + 1}}}`, templateData[key]);
          });
          return { type: 'BODY', text };
        }
        return comp;
      });

      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
          components: formattedComponents
        }
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type,
        ...(type === 'text' ? {
          text: { body: content, preview_url: content.includes('http') }
        } : {})
      };
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${whatsappConfig.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const sentMessage = {
      id: response.data.messages[0].id,
      messaging_product: 'whatsapp',
      to,
      type,
      status: 'sent',
      timestamp,
      campaignId,
      prospectId,
      wamid: response.data.messages[0].id
    };

    messageLog.set(sentMessage.id, sentMessage);
    recordSend();
    return sentMessage;

  } catch (error) {
    const errorMessage = {
      id: messageId,
      to,
      type,
      status: 'failed',
      error: error.response?.data?.error?.message || error.message,
      timestamp
    };
    messageLog.set(messageId, errorMessage);
    throw error;
  }
}

function recordSend() {
  const now = Date.now();
  sentHistory.second.push(now);
  sentHistory.minute.push(now);
  sentHistory.hour.push(now);
  sentHistory.day.push(now);
}

/**
 * Send template message
 */
async function sendTemplate(to, templateId, templateData = {}, options = {}) {
  return sendMessage({
    to,
    templateId,
    templateData,
    type: 'template',
    ...options
  });
}

/**
 * Send bulk WhatsApp messages
 */
async function sendBulkMessages(recipients, templateId, templateDataFn, options = {}) {
  const results = [];
  const errors = [];

  for (const recipient of recipients) {
    try {
      const data = typeof templateDataFn === 'function' ?
        templateDataFn(recipient) : templateDataFn;

      const result = await sendMessage({
        to: recipient.phone || recipient,
        templateId,
        templateData: data,
        ...options,
        prospectId: recipient.id
      });

      results.push({ success: true, message: result });
    } catch (error) {
      errors.push({
        phone: recipient.phone || recipient,
        error: error.message
      });
    }

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  return { results, errors, total: recipients.length };
}

/**
 * Handle incoming webhook
 */
async function handleWebhook(payload) {
  const { entry } = payload;
  const events = [];

  for (const e of entry) {
    for (const change of e.changes) {
      const { value } = change;

      if (value.messages) {
        for (const msg of value.messages) {
          events.push({
            type: 'message_received',
            from: msg.from,
            id: msg.id,
            text: msg.text?.body || '',
            timestamp: msg.timestamp
          });
        }
      }

      if (value.statuses) {
        for (const status of value.statuses) {
          events.push({
            type: 'status_update',
            id: status.id,
            status: status.status,
            recipient: status.recipient_id,
            timestamp: status.timestamp
          });

          // Update message log
          const message = messageLog.get(status.id);
          if (message) {
            message.status = status.status;
            message.deliveredAt = status.status === 'delivered' ? new Date().toISOString() : null;
            message.readAt = status.status === 'read' ? new Date().toISOString() : null;
          }
        }
      }
    }
  }

  return events;
}

/**
 * Add contact to opt-in list
 */
function addOptIn(phone) {
  optIns.add(phone);
  contacts.set(phone, {
    phone,
    optedInAt: new Date().toISOString(),
    lastMessage: null
  });
}

/**
 * Remove opt-in
 */
function removeOptIn(phone) {
  optIns.delete(phone);
  const contact = contacts.get(phone);
  if (contact) {
    contact.optedOutAt = new Date().toISOString();
  }
}

/**
 * Create campaign
 */
function createCampaign(options = {}) {
  const {
    name,
    templateId,
    segment = [],
    schedule = null,
    options: campaignOptions = {}
  } = options;

  const campaign = {
    id: uuidv4(),
    name,
    templateId,
    segment,
    schedule,
    ...campaignOptions,
    status: 'draft',
    stats: {
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      failed: 0
    },
    createdAt: new Date().toISOString()
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Execute campaign
 */
async function executeCampaign(campaignId, recipientList) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) throw new Error('Campaign not found');

  campaign.status = 'running';
  campaign.startedAt = new Date().toISOString();

  const result = await sendBulkMessages(
    recipientList,
    campaign.templateId,
    (r) => ({
      firstName: r.firstName || 'there',
      company: r.company || '',
      product: r.product || ''
    }),
    { campaignId }
  );

  campaign.stats.sent = result.results.length;
  campaign.stats.failed = result.errors.length;
  campaign.completedAt = new Date().toISOString();
  campaign.status = 'completed';

  return { campaign, ...result };
}

/**
 * Get message analytics
 */
function getAnalytics(timeRange = '30d') {
  const now = new Date();
  const rangeMs = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  }[timeRange] || 30 * 24 * 60 * 60 * 1000;

  const startDate = new Date(now.getTime() - rangeMs);

  const messages = Array.from(messageLog.values())
    .filter(m => new Date(m.timestamp) >= startDate);

  const sent = messages.filter(m => m.status === 'sent');
  const delivered = messages.filter(m => ['delivered', 'read'].includes(m.status));
  const read = messages.filter(m => m.status === 'read');
  const failed = messages.filter(m => m.status === 'failed');

  return {
    total: messages.length,
    sent: sent.length,
    delivered: delivered.length,
    read: read.length,
    failed: failed.length,
    deliveryRate: sent.length ? ((delivered.length / sent.length) * 100).toFixed(1) + '%' : '0%',
    openRate: delivered.length ? ((read.length / delivered.length) * 100).toFixed(1) + '%' : '0%',
    optIns: optIns.size,
    campaigns: campaigns.size,
    templates: templates.size
  };
}

/**
 * Get templates
 */
function getTemplates() {
  return Array.from(templates.values());
}

/**
 * Get message log for contact
 */
function getContactMessages(phone) {
  return Array.from(messageLog.values())
    .filter(m => m.to === phone)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = {
  // Sending
  sendMessage,
  sendTemplate,
  sendBulkMessages,

  // Webhook
  handleWebhook,

  // Opt-in management
  addOptIn,
  removeOptIn,

  // Campaigns
  createCampaign,
  executeCampaign,

  // Templates
  getTemplates,
  templates,

  // Analytics
  getAnalytics,
  getContactMessages,
  messageLog,
  contacts
};