/**
 * Email Sender
 *
 * Sends emails via SendGrid with:
 * - Warmup management
 * - Bounce tracking
 * - Unsubscribe handling
 * - Open/click tracking
 * - Rate limiting
 */

const { v4: uuidv4 } = require('uuid');

// SendGrid SDK (optional - falls back to mock)
let sgMail = null;
try {
  const sg = require('@sendgrid/mail');
  sgMail = sg;
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
} catch (e) {
  console.log('SendGrid not configured, using mock mode');
}

// In-memory tracking
const emailLog = new Map();
const warmupAccounts = new Map();
const bounceList = new Set();
const unsubscribeList = new Set();

// Rate limiting
const rateLimits = {
  perMinute: 30,
  perHour: 1000,
  perDay: 10000
};
const sentThisMinute = new Map();
const sentThisHour = new Map();
const sentThisDay = new Map();

// Seed warmup accounts
const seedWarmup = () => {
  const accounts = [
    { id: 'w1', email: 'alex@rez.money', status: 'active', warmupDays: 45 },
    { id: 'w2', email: 'sales@rez.money', status: 'active', warmupDays: 30 },
    { id: 'w3', email: 'growth@rez.money', status: 'active', warmupDays: 20 }
  ];
  accounts.forEach(a => warmupAccounts.set(a.id, a));
};

seedWarmup();

/**
 * Check if email is bounced
 */
function isBounced(email) {
  return bounceList.has(email.toLowerCase());
}

/**
 * Check if contact is unsubscribed
 */
function isUnsubscribed(email) {
  return unsubscribeList.has(email.toLowerCase());
}

/**
 * Check rate limit
 */
function checkRateLimit(senderEmail) {
  const now = Date.now();

  // Clean old entries
  const minuteKey = Math.floor(now / 60000);
  const hourKey = Math.floor(now / 3600000);
  const dayKey = Math.floor(now / 86400000);

  // Check per-minute
  const minuteCount = sentThisMinute.get(`${senderEmail}:${minuteKey}`) || 0;
  if (minuteCount >= rateLimits.perMinute) {
    return { allowed: false, reason: 'per_minute', limit: rateLimits.perMinute };
  }

  // Check per-hour
  const hourCount = sentThisHour.get(`${senderEmail}:${hourKey}`) || 0;
  if (hourCount >= rateLimits.perHour) {
    return { allowed: false, reason: 'per_hour', limit: rateLimits.perHour };
  }

  // Check per-day
  const dayCount = sentThisDay.get(`${senderEmail}:${dayKey}`) || 0;
  if (dayCount >= rateLimits.perDay) {
    return { allowed: false, reason: 'per_day', limit: rateLimits.perDay };
  }

  // Increment counters
  sentThisMinute.set(`${senderEmail}:${minuteKey}`, minuteCount + 1);
  sentThisHour.set(`${senderEmail}:${hourKey}`, hourCount + 1);
  sentThisDay.set(`${senderEmail}:${dayKey}`, dayCount + 1);

  return { allowed: true };
}

/**
 * Personalize email content
 */
function personalize(content, data) {
  let personalized = content;

  // Replace tokens
  const tokens = {
    '{{firstName}}': data.firstName || 'there',
    '{{lastName}}': data.lastName || '',
    '{{company}}': data.company || '',
    '{{title}}': data.title || '',
    '{{painPoint}}': (data.painPoints && data.painPoints[0]) || '',
    '{{domain}}': data.domain || ''
  };

  Object.entries(tokens).forEach(([token, value]) => {
    personalized = personalized.replace(new RegExp(token, 'g'), value);
  });

  return personalized;
}

/**
 * Send email
 */
async function sendEmail(options) {
  const {
    to,
    from = 'alex@rez.money',
    subject,
    html,
    text,
    campaignId,
    prospectId,
    trackOpens = true,
    trackClicks = true
  } = options;

  const email = to.toLowerCase();

  // Check bounce
  if (isBounced(email)) {
    return {
      success: false,
      error: 'bounced',
      message: 'Email address has bounced'
    };
  }

  // Check unsubscribe
  if (isUnsubscribed(email)) {
    return {
      success: false,
      error: 'unsubscribed',
      message: 'Contact has unsubscribed'
    };
  }

  // Check rate limit
  const rateCheck = checkRateLimit(from);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: 'rate_limited',
      message: `Rate limit exceeded (${rateCheck.reason})`,
      retryAfter: rateCheck.reason === 'per_minute' ? 60 : 3600
    };
  }

  // Generate email ID
  const emailId = `em_${uuidv4().slice(0, 12)}`;

  // Track email
  const logEntry = {
    id: emailId,
    to: email,
    from,
    subject,
    campaignId,
    prospectId,
    status: 'sent',
    sentAt: new Date().toISOString(),
    opens: 0,
    clicks: 0,
    replies: 0,
    bounces: 0,
    trackOpens,
    trackClicks,
    headers: {
      'X-Email-ID': emailId,
      'X-Campaign-ID': campaignId,
      'X-Track-Opens': trackOpens ? 'true' : 'false'
    }
  };

  // Try to send via SendGrid
  if (sgMail && process.env.SENDGRID_API_KEY) {
    try {
      const msg = {
        to: email,
        from: from,
        subject: subject,
        text: text || html.replace(/<[^>]*>/g, ''),
        html: html,
        trackingSettings: {
          clickTracking: { enable: trackClicks },
          openTracking: { enable: trackOpens }
        },
        customArgs: {
          emailId,
          campaignId
        }
      };

      await sgMail.send(msg);
      logEntry.status = 'sent';
    } catch (error) {
      console.error('SendGrid error:', error.message);
      // Fall through to mock
      logEntry.status = 'mock_sent';
    }
  } else {
    // Mock mode
    console.log(`[MOCK EMAIL] To: ${email}, Subject: ${subject}`);
    logEntry.status = 'mock_sent';
  }

  emailLog.set(emailId, logEntry);
  return {
    success: true,
    emailId,
    status: logEntry.status
  };
}

/**
 * Send bulk emails
 */
async function sendBulkEmails(campaign, prospects, templates) {
  const results = {
    sent: [],
    failed: [],
    rateLimited: [],
    bounced: [],
    unsubscribed: []
  };

  for (const prospect of prospects) {
    const email = prospect.email || `${prospect.firstName}@${prospect.domain}`;

    // Personalize template
    const personalizedHtml = personalize(templates.html, prospect);
    const personalizedText = personalize(templates.text || '', prospect);
    const personalizedSubject = personalize(templates.subject, prospect);

    const result = await sendEmail({
      to: email,
      subject: personalizedSubject,
      html: personalizedHtml,
      text: personalizedText,
      campaignId: campaign.id,
      prospectId: prospect.id,
      trackOpens: true,
      trackClicks: true
    });

    if (result.success) {
      results.sent.push({ email, emailId: result.emailId });
    } else if (result.error === 'rate_limited') {
      results.rateLimited.push({ email, reason: result.message });
      // Wait before continuing
      await new Promise(r => setTimeout(r, 2000));
    } else if (result.error === 'bounced') {
      results.bounced.push(email);
    } else if (result.error === 'unsubscribed') {
      results.unsubscribed.push(email);
    } else {
      results.failed.push({ email, error: result.message });
    }
  }

  return results;
}

/**
 * Track email open (webhook)
 */
async function trackOpen(emailId, recipientIp) {
  const log = emailLog.get(emailId);
  if (log) {
    log.opens++;
    log.lastOpenAt = new Date().toISOString();
    log.lastOpenIp = recipientIp;
  }
  return log;
}

/**
 * Track email click (webhook)
 */
async function trackClick(emailId, url, recipientIp) {
  const log = emailLog.get(emailId);
  if (log) {
    log.clicks++;
    log.clickedUrls = log.clickedUrls || [];
    log.clickedUrls.push({ url, clickedAt: new Date().toISOString() });
  }
  return log;
}

/**
 * Track bounce
 */
async function trackBounce(emailId, bounceType, bounceReason) {
  const log = emailLog.get(emailId);
  if (log) {
    log.bounces++;
    log.bounceType = bounceType;
    log.bounceReason = bounceReason;
    log.bouncedAt = new Date().toISOString();

    // Add to bounce list
    bounceList.add(log.to);
  }
  return log;
}

/**
 * Track delivery
 */
async function trackDelivery(emailId) {
  const log = emailLog.get(emailId);
  if (log) {
    log.status = 'delivered';
    log.deliveredAt = new Date().toISOString();
  }
  return log;
}

/**
 * Track reply
 */
async function trackReply(emailId, replyText) {
  const log = emailLog.get(emailId);
  if (log) {
    log.replies++;
    log.lastReplyAt = new Date().toISOString();
    log.replyText = replyText;
  }
  return log;
}

/**
 * Unsubscribe contact
 */
function unsubscribe(email) {
  unsubscribeList.add(email.toLowerCase());
  return { success: true };
}

/**
 * Add to bounce list
 */
function addBounce(email) {
  bounceList.add(email.toLowerCase());
  return { success: true };
}

/**
 * Get email stats
 */
function getEmailStats(campaignId) {
  const stats = {
    sent: 0,
    delivered: 0,
    opens: 0,
    clicks: 0,
    replies: 0,
    bounces: 0,
    unsubscribes: 0,
    openRate: 0,
    clickRate: 0,
    replyRate: 0
  };

  emailLog.forEach(log => {
    if (campaignId && log.campaignId !== campaignId) return;

    stats.sent++;
    if (log.status === 'delivered') stats.delivered++;
    stats.opens += log.opens;
    stats.clicks += log.clicks;
    stats.replies += log.replies;
    if (log.bounces) stats.bounces++;
  });

  if (stats.sent > 0) {
    stats.openRate = ((stats.opens / stats.sent) * 100).toFixed(1) + '%';
    stats.clickRate = ((stats.clicks / stats.sent) * 100).toFixed(1) + '%';
    stats.replyRate = ((stats.replies / stats.sent) * 100).toFixed(1) + '%';
  }

  return stats;
}

/**
 * Get warmup accounts
 */
function getWarmupAccounts() {
  return Array.from(warmupAccounts.values());
}

/**
 * Rotate warmup sender
 */
function getNextWarmupSender() {
  const accounts = Array.from(warmupAccounts.values())
    .filter(a => a.status === 'active')
    .sort((a, b) => b.warmupDays - a.warmupDays);

  if (accounts.length === 0) return 'alex@rez.money';

  // Round-robin based on warmup days
  const index = Math.floor(Date.now() / 3600000) % accounts.length;
  return accounts[index].email;
}

/**
 * Get email log
 */
function getEmailLog(limit = 100) {
  return Array.from(emailLog.values())
    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
    .slice(0, limit);
}

/**
 * Get email by ID
 */
function getEmailById(emailId) {
  return emailLog.get(emailId);
}

module.exports = {
  sendEmail,
  sendBulkEmails,
  trackOpen,
  trackClick,
  trackBounce,
  trackDelivery,
  trackReply,
  unsubscribe,
  addBounce,
  getEmailStats,
  getWarmupAccounts,
  getNextWarmupSender,
  getEmailLog,
  getEmailById,
  isBounced,
  isUnsubscribed
};