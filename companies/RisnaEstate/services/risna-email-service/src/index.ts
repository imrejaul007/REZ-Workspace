import { logger } from './logger';
/**
 * RisnaEstate - Email Campaign Service
 *
 * Nurture leads with automated email sequences.
 * Uses RABTUL Notifications for email delivery.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 4122;

app.use(express.json());
app.use(cors());
app.use(helmet());

// RABTUL Notification
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://localhost:4011';

// =============================================
// SCHEMAS
// =============================================

interface IEmailTemplate {
  templateId: string;
  name: string;
  subject: string;
  body: string;
  type: 'welcome' | 'nurture' | 'followup' | 'reminder' | 'promotion';
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate & Document>('EmailTemplate', {
  templateId: { type: String, unique: true, index: true },
  name: String,
  subject: String,
  body: String,
  type: { type: String, enum: ['welcome', 'nurture', 'followup', 'reminder', 'promotion'] },
  variables: [String]
}, { timestamps: true });

const EmailTemplate = mongoose.model<IEmailTemplate & Document>('EmailTemplate', EmailTemplateSchema);

interface ICampaign {
  campaignId: string;
  name: string;
  templateId: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  schedule?: Date;
  audience: {
    segments: string[];
    filters: any;
  };
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  createdAt: Date;
  sentAt?: Date;
}

const CampaignSchema = new Schema<ICampaign & Document>('Campaign', {
  campaignId: { type: String, unique: true, index: true },
  name: String,
  templateId: String,
  subject: String,
  status: { type: String, enum: ['draft', 'scheduled', 'sending', 'completed', 'paused'], default: 'draft' },
  schedule: Date,
  audience: {
    segments: [String],
    filters: Schema.Types.Mixed
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 }
  },
  sentAt: Date
}, { timestamps: true });

const Campaign = mongoose.model<ICampaign & Document>('Campaign', CampaignSchema);

interface IEmailLog {
  emailLogId: string;
  campaignId?: string;
  leadId?: string;
  userId?: string;
  email: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
}

const EmailLogSchema = new Schema<IEmailLog & Document>('EmailLog', {
  emailLogId: { type: String, unique: true, index: true },
  campaignId: String,
  leadId: String,
  userId: String,
  email: String,
  subject: String,
  status: { type: String, enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'] },
  sentAt: Date,
  openedAt: Date,
  clickedAt: Date
}, { timestamps: true });

const EmailLog = mongoose.model<IEmailLog & Document>('EmailLog', EmailLogSchema);

// =============================================
// EMAIL TEMPLATES
// =============================================

const DEFAULT_TEMPLATES: Partial<IEmailTemplate>[] = [
  {
    templateId: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to RisnaEstate! 🏠',
    type: 'welcome',
    body: `
      <h1>Welcome to RisnaEstate!</h1>
      <p>Hi {{name}},</p>
      <p>Thank you for joining RisnaEstate. Your journey to finding your dream property starts here.</p>
      <p>We've sent this email to verify your address. Please click the link below to confirm:</p>
      <a href="{{verifyLink}}" style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Best regards,<br/>The RisnaEstate Team</p>
    `,
    variables: ['name', 'verifyLink']
  },
  {
    templateId: 'lead-nurture-1',
    name: 'Lead Nurture - Day 1',
    subject: '{{propertyName}} - Perfect match for you!',
    type: 'nurture',
    body: `
      <h2>Hi {{name}},</h2>
      <p>We found a property that matches your preferences:</p>
      <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 10px;">
        <h3>{{propertyName}}</h3>
        <p>{{propertyLocation}}</p>
        <p style="font-size: 24px; color: #059669; font-weight: bold;">{{propertyPrice}}</p>
        <a href="{{propertyLink}}" style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Property</a>
      </div>
    `,
    variables: ['name', 'propertyName', 'propertyLocation', 'propertyPrice', 'propertyLink']
  },
  {
    templateId: 'site-visit-reminder',
    name: 'Site Visit Reminder',
    subject: 'Reminder: Site visit tomorrow at {{time}}',
    type: 'reminder',
    body: `
      <h2>Hi {{name}},</h2>
      <p>This is a reminder for your site visit:</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 10px;">
        <p><strong>📍 Property:</strong> {{propertyName}}</p>
        <p><strong>📅 Date:</strong> {{date}}</p>
        <p><strong>⏰ Time:</strong> {{time}}</p>
        <p><strong>👤 Agent:</strong> {{agentName}}</p>
        <p><strong>📞 Phone:</strong> {{agentPhone}}</p>
      </div>
      <p>Need to reschedule? <a href="{{rescheduleLink}}">Click here</a></p>
    `,
    variables: ['name', 'propertyName', 'date', 'time', 'agentName', 'agentPhone', 'rescheduleLink']
  },
  {
    templateId: 'golden-visa-promo',
    name: 'Golden Visa Promotion',
    subject: '🌟 Invest in Dubai - Golden Visa Starting at AED 2M',
    type: 'promotion',
    body: `
      <h2>Exclusive Golden Visa Opportunity</h2>
      <p>Hi {{name}},</p>
      <p>You're eligible for UAE Golden Visa with property investment starting at just AED 2 Million!</p>
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 10px;">
        <h3>Benefits:</h3>
        <ul>
          <li>✓ 10-year residency</li>
          <li>✓ Family sponsorship</li>
          <li>✓ Business setup support</li>
          <li>✓ 100% property ownership</li>
        </ul>
      </div>
      <a href="{{ctaLink}}" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Check Eligibility</a>
    `,
    variables: ['name', 'ctaLink']
  }
];

// =============================================
// HELPER FUNCTIONS
// =============================================

function replaceVariables(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function sendEmail(to: string, subject: string, body: string, data: any): Promise<boolean> {
  try {
    const response = await fetch(`${NOTIFICATION_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.userId || data.leadId,
        type: 'email',
        title: subject,
        message: body,
        data
      })
    });

    return response.ok;
  } catch (error) {
    logger.error('Email send error:', error);
    return false;
  }
}

async function getLeadsForAudience(audience: ICampaign['audience']): Promise<any[]> {
  // Would integrate with lead service
  // For now, return empty array
  return [];
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'risna-email-service', status: 'healthy' });
});

/**
 * Initialize default templates
 * POST /api/templates/init
 */
app.post('/api/templates/init', async (req: Request, res: Response) => {
  try {
    for (const template of DEFAULT_TEMPLATES) {
      await EmailTemplate.findOneAndUpdate(
        { templateId: template.templateId },
        template,
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: `${DEFAULT_TEMPLATES.length} templates created` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all templates
 * GET /api/templates
 */
app.get('/api/templates', async (req: Request, res: Response) => {
  try {
    const templates = await EmailTemplate.find();
    res.json({ templates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create template
 * POST /api/templates
 */
app.post('/api/templates', async (req: Request, res: Response) => {
  try {
    const template = new EmailTemplate({
      templateId: `template_${Date.now()}`,
      ...req.body
    });
    await template.save();
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create campaign
 * POST /api/campaigns
 */
app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { name, templateId, subject, audience, schedule } = req.body;

    const campaign = new Campaign({
      campaignId: `campaign_${Date.now()}`,
      name,
      templateId,
      subject,
      audience,
      schedule: schedule ? new Date(schedule) : undefined,
      status: schedule ? 'scheduled' : 'draft'
    });

    await campaign.save();
    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get campaigns
 * GET /api/campaigns
 */
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send campaign
 * POST /api/campaigns/:id/send
 */
app.post('/api/campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const template = await EmailTemplate.findOne({ templateId: campaign.templateId });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    campaign.status = 'sending';
    await campaign.save();

    // Get leads for audience
    const leads = await getLeadsForAudience(campaign.audience);

    let sent = 0;
    for (const lead of leads) {
      const body = replaceVariables(template.body, {
        name: lead.name,
        propertyName: lead.propertyName || 'Your Dream Property',
        propertyLocation: lead.propertyLocation || '',
        propertyPrice: lead.propertyPrice || '',
        propertyLink: `${process.env.FRONTEND_URL}/property/${lead.propertyId}`,
        verifyLink: `${process.env.FRONTEND_URL}/verify?email=${lead.email}`,
        ctaLink: `${process.env.FRONTEND_URL}/visa`
      });

      const success = await sendEmail(lead.email, campaign.subject, body, {
        campaignId: campaign.campaignId,
        leadId: lead._id
      });

      if (success) sent++;

      // Log email
      await new EmailLog({
        emailLogId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId: campaign.campaignId,
        leadId: lead._id,
        email: lead.email,
        subject: campaign.subject,
        status: success ? 'sent' : 'failed',
        sentAt: new Date()
      }).save();
    }

    campaign.stats.sent = sent;
    campaign.status = 'completed';
    campaign.sentAt = new Date();
    await campaign.save();

    res.json({ success: true, campaign, sent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send single email
 * POST /api/send
 */
app.post('/api/send', async (req: Request, res: Response) => {
  try {
    const { to, subject, body, templateId, variables, userId, leadId } = req.body;

    let emailBody = body;

    if (templateId) {
      const template = await EmailTemplate.findOne({ templateId });
      if (template) {
        emailBody = replaceVariables(template.body, variables || {});
        subject = replaceVariables(template.subject, variables || {});
      }
    }

    const success = await sendEmail(to, subject, emailBody, { userId, leadId });

    // Log
    await new EmailLog({
      emailLogId: `log_${Date.now()}`,
      email: to,
      subject,
      status: success ? 'sent' : 'failed',
      sentAt: new Date(),
      userId,
      leadId
    }).save();

    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track email open
 * GET /api/track/open/:logId
 */
app.get('/api/track/open/:logId', async (req: Request, res: Response) => {
  try {
    const log = await EmailLog.findOneAndUpdate(
      { emailLogId: req.params.logId },
      { status: 'opened', openedAt: new Date() },
      { new: true }
    );

    // Return 1x1 transparent GIF
    res.set('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    res.status(500).send('Error');
  }
});

/**
 * Get email stats
 * GET /api/stats
 */
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await EmailLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentLogs = await EmailLog.find()
      .sort({ sentAt: -1 })
      .limit(20);

    res.json({
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      recent: recentLogs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-email');
    logger.info('✅ Connected to MongoDB');

    await EmailTemplate.createIndexes();
    await Campaign.createIndexes();
    await EmailLog.createIndexes();

    app.listen(PORT, () => {
      logger.info(`🚀 RisnaEstate Email Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
