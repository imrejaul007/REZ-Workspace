import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  Campaign,
  DripCampaign,
  Sequence,
  EmailTemplate,
  SMSTemplate,
  DeliveryRecord,
  UnsubscribeRecord,
  QueuedMessage,
  SequenceEnrollment,
} from '../models/Automation';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import { templateService } from '../services/templateService';
import { ChannelType, CampaignStatus, CreateCampaignRequest, CreateSequenceRequest, CreateTemplateRequest, SendMessageRequest, CreateABTestRequest } from '../types';
import { generateId, validateEmail, validatePhone, normalizeEmail, normalizePhone } from '../utils/helpers';
import logger from '../utils/logger';

const router: Router = Router();

// Error handler wrapper
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== EMAIL TEMPLATE ROUTES ====================

/**
 * GET /api/templates/email
 * List all email templates
 */
router.get(
  '/templates/email',
  asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '50', includeInactive } = req.query;
    const result = await templateService.listEmailTemplates({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      includeInactive: includeInactive === 'true',
    });

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  })
);

/**
 * GET /api/templates/email/:id
 * Get email template by ID
 */
router.get(
  '/templates/email/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const template = await templateService.getEmailTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  })
);

/**
 * POST /api/templates/email
 * Create email template
 */
router.post(
  '/templates/email',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, subject, htmlContent, textContent, variables } = req.body;

    if (!name || !subject || !htmlContent) {
      res.status(400).json({ success: false, error: 'Name, subject, and htmlContent are required' });
      return;
    }

    const template = await templateService.createEmailTemplate({
      name,
      subject,
      htmlContent,
      textContent,
      variables,
      createdBy: req.body.createdBy,
    });

    logger.info('Email template created via API', { templateId: template._id });
    res.status(201).json({ success: true, data: template });
  })
);

/**
 * PUT /api/templates/email/:id
 * Update email template
 */
router.put(
  '/templates/email/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const template = await templateService.updateEmailTemplate(req.params.id, req.body);
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  })
);

/**
 * DELETE /api/templates/email/:id
 * Delete email template
 */
router.delete(
  '/templates/email/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const success = await templateService.deleteEmailTemplate(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, message: 'Template deleted' });
  })
);

/**
 * POST /api/templates/email/:id/preview
 * Preview email template with sample data
 */
router.post(
  '/templates/email/:id/preview',
  asyncHandler(async (req: Request, res: Response) => {
    const preview = await templateService.previewEmailTemplate(req.params.id);
    if (!preview) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, data: preview });
  })
);

// ==================== SMS TEMPLATE ROUTES ====================

/**
 * GET /api/templates/sms
 * List all SMS templates
 */
router.get(
  '/templates/sms',
  asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '50', includeInactive } = req.query;
    const result = await templateService.listSMSTemplates({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      includeInactive: includeInactive === 'true',
    });

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  })
);

/**
 * GET /api/templates/sms/:id
 * Get SMS template by ID
 */
router.get(
  '/templates/sms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const template = await templateService.getSMSTemplate(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  })
);

/**
 * POST /api/templates/sms
 * Create SMS template
 */
router.post(
  '/templates/sms',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, content, variables } = req.body;

    if (!name || !content) {
      res.status(400).json({ success: false, error: 'Name and content are required' });
      return;
    }

    const template = await templateService.createSMSTemplate({
      name,
      content,
      variables,
      createdBy: req.body.createdBy,
    });

    logger.info('SMS template created via API', { templateId: template._id });
    res.status(201).json({ success: true, data: template });
  })
);

/**
 * PUT /api/templates/sms/:id
 * Update SMS template
 */
router.put(
  '/templates/sms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const template = await templateService.updateSMSTemplate(req.params.id, req.body);
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  })
);

/**
 * DELETE /api/templates/sms/:id
 * Delete SMS template
 */
router.delete(
  '/templates/sms/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const success = await templateService.deleteSMSTemplate(req.params.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, message: 'Template deleted' });
  })
);

// ==================== CAMPAIGN ROUTES ====================

/**
 * GET /api/campaigns
 * List all campaigns
 */
router.get(
  '/campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, channel, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (channel) filter.channel = channel;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get(
  '/campaigns/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  })
);

/**
 * POST /api/campaigns
 * Create campaign
 */
router.post(
  '/campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, channel, templateId, subject, scheduledAt } = req.body;

    if (!name || !channel || !templateId) {
      res.status(400).json({ success: false, error: 'Name, channel, and templateId are required' });
      return;
    }

    if (!['email', 'sms'].includes(channel)) {
      res.status(400).json({ success: false, error: 'Channel must be email or sms' });
      return;
    }

    if (channel === 'email' && !subject) {
      res.status(400).json({ success: false, error: 'Subject is required for email campaigns' });
      return;
    }

    const campaign = new Campaign({
      name,
      description,
      channel,
      templateId,
      subject,
      status: scheduledAt ? 'draft' : 'active',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy: req.body.createdBy,
    });

    await campaign.save();

    logger.info('Campaign created', { campaignId: campaign._id, name });
    res.status(201).json({ success: true, data: campaign });
  })
);

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put(
  '/campaigns/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    const allowedUpdates = ['name', 'description', 'status', 'scheduledAt', 'subject'];
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        (campaign as Record<string, unknown>)[field] = req.body[field];
      }
    }

    await campaign.save();
    res.json({ success: true, data: campaign });
  })
);

/**
 * POST /api/campaigns/:id/send
 * Send campaign immediately
 */
router.post(
  '/campaigns/:id/send',
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    if (campaign.status === 'completed') {
      res.status(400).json({ success: false, error: 'Campaign already completed' });
      return;
    }

    // Trigger campaign execution
    campaign.status = 'active';
    await campaign.save();

    logger.info('Campaign send triggered', { campaignId: campaign._id });
    res.json({ success: true, message: 'Campaign execution started', data: campaign });
  })
);

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
router.delete(
  '/campaigns/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    res.json({ success: true, message: 'Campaign deleted' });
  })
);

// ==================== DRIP CAMPAIGN ROUTES ====================

/**
 * GET /api/drip-campaigns
 * List all drip campaigns
 */
router.get(
  '/drip-campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, channel, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (channel) filter.channel = channel;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [campaigns, total] = await Promise.all([
      DripCampaign.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      DripCampaign.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

/**
 * POST /api/drip-campaigns
 * Create drip campaign
 */
router.post(
  '/drip-campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, channel, sequences, enrollmentCriteria, exitCriteria, reEnrollmentEnabled } = req.body;

    if (!name || !channel || !sequences || sequences.length === 0) {
      res.status(400).json({ success: false, error: 'Name, channel, and sequences are required' });
      return;
    }

    const campaign = new DripCampaign({
      name,
      description,
      channel,
      sequences,
      enrollmentCriteria,
      exitCriteria,
      reEnrollmentEnabled: reEnrollmentEnabled || false,
      status: 'draft',
    });

    await campaign.save();
    res.status(201).json({ success: true, data: campaign });
  })
);

/**
 * POST /api/drip-campaigns/:id/enroll
 * Enroll a contact in drip campaign
 */
router.post(
  '/drip-campaigns/:id/enroll',
  asyncHandler(async (req: Request, res: Response) => {
    const { contact } = req.body;
    const campaignId = req.params.id;

    if (!contact || (!contact.email && !contact.phone)) {
      res.status(400).json({ success: false, error: 'Contact with email or phone is required' });
      return;
    }

    const campaign = await DripCampaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Drip campaign not found' });
      return;
    }

    // Check if already enrolled
    const existingEnrollment = await SequenceEnrollment.findOne({
      sequenceId: campaignId,
      'contact.email': contact.email || undefined,
      'contact.phone': contact.phone || undefined,
    });

    if (existingEnrollment && !existingEnrollment.paused) {
      res.status(400).json({ success: false, error: 'Contact already enrolled' });
      return;
    }

    const enrollment = new SequenceEnrollment({
      sequenceId: campaignId,
      contact: {
        email: contact.email ? normalizeEmail(contact.email) : undefined,
        phone: contact.phone ? normalizePhone(contact.phone) : undefined,
        firstName: contact.firstName,
        lastName: contact.lastName,
        userId: contact.userId,
        metadata: contact.metadata,
      },
      currentStepIndex: 0,
      completedSteps: [],
      paused: false,
    });

    await enrollment.save();
    campaign.totalEnrolled++;
    await campaign.save();

    logger.info('Contact enrolled in drip campaign', {
      campaignId,
      contactEmail: contact.email,
      contactPhone: contact.phone ? '***' + contact.phone.slice(-4) : undefined,
    });

    res.status(201).json({ success: true, data: enrollment });
  })
);

// ==================== SEQUENCE ROUTES ====================

/**
 * GET /api/sequences
 * List all sequences
 */
router.get(
  '/sequences',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [sequences, total] = await Promise.all([
      Sequence.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Sequence.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: sequences,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  })
);

/**
 * POST /api/sequences
 * Create sequence
 */
router.post(
  '/sequences',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, steps, trigger } = req.body;

    if (!name || !steps || steps.length === 0 || !trigger) {
      res.status(400).json({ success: false, error: 'Name, steps, and trigger are required' });
      return;
    }

    // Add step IDs if missing
    const stepsWithIds = steps.map((step: Record<string, unknown>, index: number) => ({
      ...step,
      stepId: step.stepId || generateId(),
      order: step.order || index + 1,
    }));

    const sequence = new Sequence({
      name,
      description,
      steps: stepsWithIds,
      trigger,
      status: 'active',
    });

    await sequence.save();
    res.status(201).json({ success: true, data: sequence });
  })
);

// ==================== SEND MESSAGE ROUTES ====================

/**
 * POST /api/send
 * Send a single message (email or SMS)
 */
router.post(
  '/send',
  asyncHandler(async (req: Request, res: Response) => {
    const { contact, channel, templateId, variables, scheduledFor, subject } = req.body;

    if (!contact || (!contact.email && !contact.phone)) {
      res.status(400).json({ success: false, error: 'Contact with email or phone is required' });
      return;
    }

    if (!channel || !templateId) {
      res.status(400).json({ success: false, error: 'Channel and templateId are required' });
      return;
    }

    const normalizedContact = {
      ...contact,
      email: contact.email ? normalizeEmail(contact.email) : undefined,
      phone: contact.phone ? normalizePhone(contact.phone) : undefined,
    };

    if (channel === 'email') {
      if (!normalizedContact.email) {
        res.status(400).json({ success: false, error: 'Email address is required for email channel' });
        return;
      }

      if (scheduledFor) {
        // Queue for later
        await QueuedMessage.create({
          contact: normalizedContact,
          channel: 'email',
          templateId,
          subject,
          content: '',
          variables,
          scheduledFor: new Date(scheduledFor),
          priority: 0,
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        });
        res.json({ success: true, message: 'Email scheduled', scheduledFor });
      } else {
        const result = await emailService.sendWithTemplate(normalizedContact.email, templateId, variables || {}, {
          contact: normalizedContact,
        });

        if (result.success) {
          res.json({ success: true, message: 'Email sent', messageId: result.messageId });
        } else {
          res.status(500).json({ success: false, error: result.error });
        }
      }
    } else if (channel === 'sms') {
      if (!normalizedContact.phone) {
        res.status(400).json({ success: false, error: 'Phone number is required for SMS channel' });
        return;
      }

      if (scheduledFor) {
        await QueuedMessage.create({
          contact: normalizedContact,
          channel: 'sms',
          templateId,
          content: '',
          variables,
          scheduledFor: new Date(scheduledFor),
          priority: 0,
          retryCount: 0,
          maxRetries: 3,
          status: 'pending',
        });
        res.json({ success: true, message: 'SMS scheduled', scheduledFor });
      } else {
        const result = await smsService.sendWithTemplate(normalizedContact.phone, templateId, variables || {}, {
          contact: normalizedContact,
        });

        if (result.success) {
          res.json({ success: true, message: 'SMS sent', messageId: result.messageSid });
        } else {
          res.status(500).json({ success: false, error: result.error });
        }
      }
    } else {
      res.status(400).json({ success: false, error: 'Invalid channel' });
    }
  })
);

/**
 * POST /api/send/bulk
 * Send bulk messages
 */
router.post(
  '/send/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const { recipients, channel, templateId, campaignId } = req.body;

    if (!recipients || recipients.length === 0) {
      res.status(400).json({ success: false, error: 'Recipients array is required' });
      return;
    }

    if (!channel || !templateId) {
      res.status(400).json({ success: false, error: 'Channel and templateId are required' });
      return;
    }

    const normalizedRecipients = recipients.map((r: { email?: string; phone?: string; variables?: Record<string, unknown> }) => ({
      to: r.email || r.phone,
      variables: r.variables,
    }));

    if (channel === 'email') {
      const results = await emailService.sendBulk(
        normalizedRecipients.filter((r: { to?: string }) => r.to?.includes('@')).map((r: { to: string; variables?: Record<string, unknown> }) => ({
          to: normalizeEmail(r.to),
          variables: r.variables as Record<string, string | number | boolean | null | undefined>,
        })),
        templateId,
        { campaignId }
      );
      res.json({ success: true, data: results });
    } else {
      const results = await smsService.sendBulk(
        normalizedRecipients.filter((r: { to?: string }) => r.to && !r.to?.includes('@')).map((r: { to: string; variables?: Record<string, unknown> }) => ({
          to: normalizePhone(r.to),
          variables: r.variables as Record<string, string | number | boolean | null | undefined>,
        })),
        templateId,
        { campaignId }
      );
      res.json({ success: true, data: results });
    }
  })
);

// ==================== UNSUBSCRIBE ROUTES ====================

/**
 * POST /api/unsubscribe
 * Unsubscribe a contact
 */
router.post(
  '/unsubscribe',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, channel, reason } = req.body;

    if (!email && !phone) {
      res.status(400).json({ success: false, error: 'Email or phone is required' });
      return;
    }

    const unsubscribeChannel = channel || (email ? 'email' : 'sms');

    if (email) {
      await emailService.handleUnsubscribe(email, reason);
    }

    if (phone) {
      await smsService.handleUnsubscribe(phone);
    }

    res.json({ success: true, message: 'Unsubscribed successfully' });
  })
);

/**
 * GET /api/unsubscribe/check
 * Check if contact is unsubscribed
 */
router.get(
  '/unsubscribe/check',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, phone, channel } = req.query;

    if (!email && !phone) {
      res.status(400).json({ success: false, error: 'Email or phone is required' });
      return;
    }

    let isUnsubscribed = false;

    if (email && (!channel || channel === 'email')) {
      const record = await UnsubscribeRecord.findOne({
        'contact.email': normalizeEmail(email as string),
        channel: 'email',
      });
      isUnsubscribed = !!record;
    }

    if (phone && (!channel || channel === 'sms')) {
      const record = await UnsubscribeRecord.findOne({
        'contact.phone': normalizePhone(phone as string),
        channel: 'sms',
      });
      isUnsubscribed = isUnsubscribed || !!record;
    }

    res.json({ success: true, data: { isUnsubscribed } });
  })
);

// ==================== DELIVERY TRACKING ROUTES ====================

/**
 * GET /api/delivery/:campaignId
 * Get delivery stats for a campaign
 */
router.get(
  '/delivery/:campaignId',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await DeliveryRecord.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(req.params.campaignId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      queued: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
      bounced: 0,
    };

    for (const stat of stats) {
      result.total += stat.count;
      if (stat._id in result) {
        (result as Record<string, number>)[stat._id] = stat.count;
      }
    }

    res.json({ success: true, data: result });
  })
);

/**
 * GET /api/delivery
 * Get delivery records with pagination
 */
router.get(
  '/delivery',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId, status, channel, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    if (campaignId) filter.campaignId = new mongoose.Types.ObjectId(campaignId as string);
    if (status) filter.status = status;
    if (channel) filter.channel = channel;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [records, total] = await Promise.all([
      DeliveryRecord.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      DeliveryRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  })
);

// ==================== A/B TEST ROUTES ====================

/**
 * POST /api/ab-tests
 * Create A/B test
 */
router.post(
  '/ab-tests',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId, channel, variants } = req.body;

    if (!campaignId || !channel || !variants || variants.length < 2) {
      res.status(400).json({ success: false, error: 'Campaign ID, channel, and at least 2 variants are required' });
      return;
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    // Ensure variants sum to 100%
    const totalPercentage = variants.reduce((sum: number, v: { sendPercentage: number }) => sum + v.sendPercentage, 0);
    if (totalPercentage !== 100) {
      res.status(400).json({ success: false, error: 'Variant percentages must sum to 100' });
      return;
    }

    // Add variant IDs
    const variantsWithIds = variants.map((v: Record<string, unknown>, index: number) => ({
      ...v,
      variantId: generateId(),
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
    }));

    campaign.abTest = {
      name: req.body.name || `A/B Test for ${campaign.name}`,
      campaignId: campaign._id,
      channel,
      variants: variantsWithIds,
      status: 'running',
      startDate: new Date(),
    };

    await campaign.save();
    res.status(201).json({ success: true, data: campaign });
  })
);

/**
 * GET /api/ab-tests/:campaignId
 * Get A/B test results for a campaign
 */
router.get(
  '/ab-tests/:campaignId',
  asyncHandler(async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign || !campaign.abTest) {
      res.status(404).json({ success: false, error: 'A/B test not found' });
      return;
    }

    res.json({ success: true, data: campaign.abTest });
  })
);

// ==================== STATS ROUTES ====================

/**
 * GET /api/stats/overview
 * Get automation stats overview
 */
router.get(
  '/stats/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const [campaignCount, emailTemplates, smsTemplates, queuedMessages, unsubscribes] = await Promise.all([
      Campaign.countDocuments(),
      EmailTemplate.countDocuments({ isActive: true }),
      SMSTemplate.countDocuments({ isActive: true }),
      QueuedMessage.countDocuments({ status: 'pending' }),
      UnsubscribeRecord.countDocuments(),
    ]);

    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        campaigns: {
          total: campaignCount,
          byStatus: Object.fromEntries(campaignStats.map((s) => [s._id, s.count])),
        },
        templates: {
          email: emailTemplates,
          sms: smsTemplates,
        },
        queuedMessages,
        unsubscribes,
        emailServiceStatus: emailService.getStatus(),
        smsServiceStatus: smsService.getStatus(),
      },
    });
  })
);

// ==================== EXCEPTION HANDLING ====================

import { exceptionHandler } from '../services/exceptionHandler';

/**
 * GET /api/exceptions
 * List automation exceptions
 */
router.get(
  '/exceptions',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, errorType, ruleId, startDate, endDate, page, limit } = req.query;

    const result = await exceptionHandler.listExceptions({
      status: status as string,
      errorType: errorType as 'validation' | 'api_error' | 'timeout' | 'rate_limit' | 'invalid_data' | 'auth_error' | 'unknown',
      ruleId: ruleId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.exceptions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  })
);

/**
 * GET /api/exceptions/stats
 * Get exception statistics
 */
router.get(
  '/exceptions/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const stats = await exceptionHandler.getExceptionStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/exceptions/:id
 * Get exception details
 */
router.get(
  '/exceptions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const exception = await exceptionHandler.getException(req.params.id);

    if (!exception) {
      res.status(404).json({ success: false, error: 'Exception not found' });
      return;
    }

    res.json({ success: true, data: exception });
  })
);

/**
 * POST /api/exceptions/:id/retry
 * Manually retry an exception
 */
router.post(
  '/exceptions/:id/retry',
  asyncHandler(async (req: Request, res: Response) => {
    const { adjustedParams } = req.body;

    try {
      const exception = await exceptionHandler.retryException(req.params.id, adjustedParams);

      if (!exception) {
        res.status(404).json({ success: false, error: 'Exception not found' });
        return;
      }

      logger.info('Exception retry initiated via API', { exceptionId: exception._id });
      res.json({ success: true, data: exception, message: 'Retry initiated' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry exception';
      res.status(400).json({ success: false, error: message });
    }
  })
);

/**
 * POST /api/exceptions/:id/resolve
 * Mark exception as resolved
 */
router.post(
  '/exceptions/:id/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const { resolvedBy, resolution } = req.body;

    if (!resolvedBy || !resolution) {
      res.status(400).json({ success: false, error: 'resolvedBy and resolution are required' });
      return;
    }

    const exception = await exceptionHandler.resolveException(req.params.id, resolvedBy, resolution);

    if (!exception) {
      res.status(404).json({ success: false, error: 'Exception not found' });
      return;
    }

    logger.info('Exception resolved via API', { exceptionId: exception._id, resolvedBy });
    res.json({ success: true, data: exception, message: 'Exception resolved' });
  })
);

/**
 * POST /api/exceptions/:id/ignore
 * Ignore an exception
 */
router.post(
  '/exceptions/:id/ignore',
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: 'Reason is required' });
      return;
    }

    const exception = await exceptionHandler.ignoreException(req.params.id, reason);

    if (!exception) {
      res.status(404).json({ success: false, error: 'Exception not found' });
      return;
    }

    logger.info('Exception ignored via API', { exceptionId: exception._id, reason });
    res.json({ success: true, data: exception, message: 'Exception ignored' });
  })
);

/**
 * POST /api/exceptions/cleanup
 * Clean up old resolved exceptions
 */
router.post(
  '/exceptions/cleanup',
  asyncHandler(async (req: Request, res: Response) => {
    const { retentionDays } = req.body;
    const days = retentionDays ? parseInt(retentionDays as string) : 30;

    const deletedCount = await exceptionHandler.cleanupResolved(days);

    logger.info('Exception cleanup completed via API', { deletedCount, retentionDays: days });
    res.json({ success: true, message: `Cleaned up ${deletedCount} exceptions`, deletedCount });
  })
);

// ==================== HEALTH CHECK ====================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        email: emailService.getStatus(),
        sms: smsService.getStatus(),
      },
    });
  })
);

export default router;
