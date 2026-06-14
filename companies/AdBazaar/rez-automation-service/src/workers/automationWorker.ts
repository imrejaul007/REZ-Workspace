import cron from 'node-cron';
import {
  Campaign,
  DripCampaign,
  Sequence,
  SequenceEnrollment,
  QueuedMessage,
  DeliveryRecord,
  EmailTemplate,
  SMSTemplate,
  UnsubscribeRecord,
} from '../models/Automation';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import { CampaignStatus, ChannelType, DeliveryStatus } from '../types';
import { addDelayToDate, shouldIncludeInSample, chunkArray } from '../utils/helpers';
import logger from '../utils/logger';

interface WorkerConfig {
  checkIntervalSeconds: number;
  batchSize: number;
  maxRetries: number;
  abTestSampleSize: number;
}

const DEFAULT_CONFIG: WorkerConfig = {
  checkIntervalSeconds: 60,
  batchSize: 100,
  maxRetries: 3,
  abTestSampleSize: 0.2,
};

class AutomationWorker {
  private config: WorkerConfig;
  private isRunning: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the automation worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Automation worker is already running');
      return;
    }

    logger.info('Starting automation worker', { config: this.config });

    this.isRunning = true;

    // Run initial processing
    await this.processQueuedMessages();
    await this.processScheduledCampaigns();
    await this.processDripCampaigns();
    await this.processSequences();
    await this.processABTests();

    // Schedule recurring tasks using cron
    this.scheduleTasks();

    logger.info('Automation worker started successfully');
  }

  /**
   * Stop the automation worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Automation worker is not running');
      return;
    }

    logger.info('Stopping automation worker...');

    this.isRunning = false;

    // Clear cron job
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Automation worker stopped');
  }

  /**
   * Schedule recurring tasks
   */
  private scheduleTasks(): void {
    // Process queued messages every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.processQueuedMessages();
      } catch (error) {
        logger.error('Error processing queued messages', { error });
      }
    });

    // Process campaigns every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.processScheduledCampaigns();
      } catch (error) {
        logger.error('Error processing scheduled campaigns', { error });
      }
    });

    // Process drip campaigns every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.processDripCampaigns();
      } catch (error) {
        logger.error('Error processing drip campaigns', { error });
      }
    });

    // Process sequences every minute
    cron.schedule('* * * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.processSequences();
      } catch (error) {
        logger.error('Error processing sequences', { error });
      }
    });

    // Check A/B tests daily
    cron.schedule('0 0 * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.checkABTests();
      } catch (error) {
        logger.error('Error checking A/B tests', { error });
      }
    });

    // Clean up old records daily
    cron.schedule('0 1 * * *', async () => {
      if (!this.isRunning) return;

      try {
        await this.cleanupOldRecords();
      } catch (error) {
        logger.error('Error cleaning up old records', { error });
      }
    });
  }

  /**
   * Process queued messages
   */
  async processQueuedMessages(): Promise<void> {
    const now = new Date();

    // Get pending messages that are due
    const messages = await QueuedMessage.find({
      status: 'pending',
      $or: [
        { scheduledFor: { $lte: now } },
        { scheduledFor: { $exists: false } },
      ],
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(this.config.batchSize);

    if (messages.length === 0) {
      return;
    }

    logger.debug(`Processing ${messages.length} queued messages`);

    for (const message of messages) {
      try {
        // Mark as processing
        message.status = 'processing';
        await message.save();

        // Send based on channel
        if (message.channel === 'email') {
          await this.sendEmailMessage(message);
        } else {
          await this.sendSMSMessage(message);
        }

        // Mark as completed
        message.status = 'completed';
        await message.save();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Handle retry
        message.retryCount++;

        if (message.retryCount >= message.maxRetries) {
          message.status = 'failed';
          logger.error('Message failed after max retries', {
            messageId: message._id,
            retryCount: message.retryCount,
            error: errorMessage,
          });
        } else {
          message.status = 'pending';
          logger.warn('Message will be retried', {
            messageId: message._id,
            retryCount: message.retryCount,
            error: errorMessage,
          });
        }

        await message.save();
      }
    }
  }

  /**
   * Send email message
   */
  private async sendEmailMessage(message: InstanceType<typeof QueuedMessage>): Promise<void> {
    const template = await EmailTemplate.findById(message.templateId);
    if (!template || !template.isActive) {
      throw new Error('Email template not found or inactive');
    }

    if (!message.contact.email) {
      throw new Error('No email address provided');
    }

    const result = await emailService.sendEmail({
      to: message.contact.email,
      subject: message.subject || template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      contact: message.contact,
      templateId: template._id.toString(),
      variables: message.variables,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }
  }

  /**
   * Send SMS message
   */
  private async sendSMSMessage(message: InstanceType<typeof QueuedMessage>): Promise<void> {
    const template = await SMSTemplate.findById(message.templateId);
    if (!template || !template.isActive) {
      throw new Error('SMS template not found or inactive');
    }

    if (!message.contact.phone) {
      throw new Error('No phone number provided');
    }

    const result = await smsService.sendSMS({
      to: message.contact.phone,
      content: template.content,
      contact: message.contact,
      templateId: template._id.toString(),
      variables: message.variables,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send SMS');
    }
  }

  /**
   * Process scheduled campaigns
   */
  async processScheduledCampaigns(): Promise<void> {
    const now = new Date();

    // Find campaigns that are scheduled to start
    const campaigns = await Campaign.find({
      status: 'active',
      scheduledAt: { $lte: now },
    }).limit(this.config.batchSize);

    if (campaigns.length === 0) {
      return;
    }

    logger.debug(`Processing ${campaigns.length} scheduled campaigns`);

    for (const campaign of campaigns) {
      try {
        await this.executeCampaign(campaign);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to execute campaign', {
          campaignId: campaign._id,
          error: errorMessage,
        });

        campaign.status = 'paused';
        await campaign.save();
      }
    }
  }

  /**
   * Execute a campaign
   */
  async executeCampaign(campaign: InstanceType<typeof Campaign>): Promise<void> {
    logger.info('Executing campaign', {
      campaignId: campaign._id,
      name: campaign.name,
      channel: campaign.channel,
    });

    // Check if it's an A/B test campaign
    if (campaign.abTest && campaign.abTest.status === 'running') {
      await this.executeABTest(campaign);
    } else {
      // Regular campaign - get recipients and send
      const recipients = await this.getCampaignRecipients(campaign);

      for (const recipient of recipients) {
        await this.queueMessage(campaign, recipient);
      }
    }

    campaign.sentAt = new Date();
    campaign.status = 'completed';
    await campaign.save();

    logger.info('Campaign executed successfully', {
      campaignId: campaign._id,
      sentCount: campaign.sentCount,
    });
  }

  /**
   * Get campaign recipients (implement based on your subscriber list logic)
   */
  private async getCampaignRecipients(campaign: InstanceType<typeof Campaign>): Promise<
    Array<{ email?: string; phone?: string; firstName?: string; lastName?: string; metadata?: Record<string, unknown> }>
  > {
    // This is a placeholder - implement based on your subscriber/contact management
    // For now, return empty array - replace with actual implementation
    return [];
  }

  /**
   * Execute A/B test
   */
  private async executeABTest(campaign: InstanceType<typeof Campaign>): Promise<void> {
    if (!campaign.abTest) return;

    const variants = campaign.abTest.variants;
    const totalRecipients = campaign.totalRecipients;

    // Distribute recipients across variants based on percentages
    const chunks = chunkArray(
      await this.getCampaignRecipients(campaign),
      totalRecipients
    );

    let recipientIndex = 0;
    for (const variant of variants) {
      const recipientCount = Math.floor(
        (variant.sendPercentage / 100) * totalRecipients
      );

      for (let i = 0; i < recipientCount && recipientIndex < chunks.length; i++) {
        const recipient = chunks[recipientIndex];
        await this.queueABTestMessage(campaign, variant, recipient);
        recipientIndex++;
        variant.sentCount++;
      }
    }

    campaign.abTest.startDate = new Date();
    await campaign.save();
  }

  /**
   * Queue A/B test message
   */
  private async queueABTestMessage(
    campaign: InstanceType<typeof Campaign>,
    variant: { variantId: string; templateId: string; content: string; subject?: string },
    recipient: { email?: string; phone?: string; firstName?: string; lastName?: string }
  ): Promise<void> {
    await QueuedMessage.create({
      contact: recipient,
      channel: campaign.channel,
      templateId: variant.templateId as unknown as typeof campaign.templateId,
      subject: variant.subject,
      content: variant.content,
      priority: 0,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
      metadata: {
        abTestId: campaign.abTest?.name,
        variantId: variant.variantId,
        campaignId: campaign._id,
      },
    });
  }

  /**
   * Queue a message for sending
   */
  private async queueMessage(
    campaign: InstanceType<typeof Campaign>,
    recipient: { email?: string; phone?: string; firstName?: string; lastName?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    await QueuedMessage.create({
      contact: recipient,
      channel: campaign.channel,
      templateId: campaign.templateId,
      subject: campaign.subject,
      content: '', // Will be populated from template
      priority: 0,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'pending',
      metadata: {
        campaignId: campaign._id,
      },
    });

    campaign.sentCount++;
    await campaign.save();
  }

  /**
   * Process drip campaigns
   */
  async processDripCampaigns(): Promise<void> {
    const now = new Date();

    // Find active drip campaigns
    const dripCampaigns = await DripCampaign.find({
      status: 'active',
    }).limit(this.config.batchSize);

    if (dripCampaigns.length === 0) {
      return;
    }

    logger.debug(`Processing ${dripCampaigns.length} drip campaigns`);

    for (const dripCampaign of dripCampaigns) {
      try {
        // Check for new enrollments
        await this.enrollNewDripContacts(dripCampaign);

        // Process existing enrollments
        await this.processDripEnrollments(dripCampaign);
      } catch (error) {
        logger.error('Error processing drip campaign', {
          dripCampaignId: dripCampaign._id,
          error,
        });
      }
    }
  }

  /**
   * Enroll new contacts in drip campaign
   */
  private async enrollNewDripContacts(
    dripCampaign: InstanceType<typeof DripCampaign>
  ): Promise<void> {
    // This is a placeholder - implement based on your enrollment criteria
    // Check for contacts that match enrollment criteria and aren't already enrolled
    logger.debug('Checking for new drip enrollments', {
      dripCampaignId: dripCampaign._id,
    });
  }

  /**
   * Process drip campaign enrollments
   */
  private async processDripEnrollments(
    dripCampaign: InstanceType<typeof DripCampaign>
  ): Promise<void> {
    // Find enrollments ready for next step
    const enrollments = await SequenceEnrollment.find({
      sequenceId: dripCampaign._id,
      paused: false,
    }).limit(this.config.batchSize);

    for (const enrollment of enrollments) {
      try {
        // Get current step
        const currentStep = dripCampaign.sequences[enrollment.currentStepIndex];
        if (!currentStep) {
          // Sequence completed
          enrollment.paused = true;
          enrollment.exitReason = 'completed';
          dripCampaign.completedCount++;
          await enrollment.save();
          continue;
        }

        // Check if delay has passed
        const delayMs = currentStep.delayMinutes * 60 * 1000 +
          (currentStep.delayHours || 0) * 60 * 60 * 1000 +
          (currentStep.delayDays || 0) * 24 * 60 * 60 * 1000;

        const eligibleTime = addDelayToDate(enrollment.lastStepCompletedAt || enrollment.enrolledAt, delayMs / 60000);

        if (new Date() < eligibleTime) {
          continue;
        }

        // Send message for current step
        await this.sendDripStepMessage(dripCampaign, enrollment, currentStep);

        // Move to next step
        enrollment.lastStepCompletedAt = new Date();
        enrollment.completedSteps.push(currentStep.stepId);
        enrollment.currentStepIndex++;

        await enrollment.save();

      } catch (error) {
        logger.error('Error processing drip enrollment', {
          enrollmentId: enrollment._id,
          error,
        });
      }
    }

    await dripCampaign.save();
  }

  /**
   * Send drip step message
   */
  private async sendDripStepMessage(
    dripCampaign: InstanceType<typeof DripCampaign>,
    enrollment: InstanceType<typeof SequenceEnrollment>,
    step: { channel: ChannelType; templateId: unknown }
  ): Promise<void> {
    const contact = enrollment.contact;

    if (step.channel === 'email' && contact.email) {
      const result = await emailService.sendWithTemplate(
        contact.email,
        step.templateId as string,
        {
          firstName: contact.firstName,
          lastName: contact.lastName,
          ...(contact.metadata || {}),
        } as Record<string, string | number | boolean | null | undefined>,
        {
          campaignId: dripCampaign._id.toString(),
          contact,
        }
      );

      if (result.success) {
        await DeliveryRecord.create({
          campaignId: dripCampaign._id,
          sequenceId: dripCampaign._id,
          stepId: step.templateId as string,
          contact,
          channel: 'email',
          templateId: step.templateId as unknown as typeof dripCampaign.templateId,
          status: 'sent',
          sentAt: new Date(),
        });
      }
    } else if (step.channel === 'sms' && contact.phone) {
      const result = await smsService.sendWithTemplate(
        contact.phone,
        step.templateId as string,
        {
          firstName: contact.firstName,
          lastName: contact.lastName,
        } as Record<string, string | number | boolean | null | undefined>,
        {
          campaignId: dripCampaign._id.toString(),
          contact,
        }
      );

      if (result.success) {
        await DeliveryRecord.create({
          campaignId: dripCampaign._id,
          sequenceId: dripCampaign._id,
          stepId: step.templateId as string,
          contact,
          channel: 'sms',
          templateId: step.templateId as unknown as typeof dripCampaign.templateId,
          status: 'sent',
          sentAt: new Date(),
        });
      }
    }
  }

  /**
   * Process sequences
   */
  async processSequences(): Promise<void> {
    const now = new Date();

    // Find active sequences
    const sequences = await Sequence.find({
      status: 'active',
    }).limit(this.config.batchSize);

    if (sequences.length === 0) {
      return;
    }

    logger.debug(`Processing ${sequences.length} sequences`);

    for (const sequence of sequences) {
      try {
        // Find enrollments ready for processing
        const enrollments = await SequenceEnrollment.find({
          sequenceId: sequence._id,
          paused: false,
        }).limit(this.config.batchSize);

        for (const enrollment of enrollments) {
          await this.processSequenceEnrollment(sequence, enrollment);
        }
      } catch (error) {
        logger.error('Error processing sequence', {
          sequenceId: sequence._id,
          error,
        });
      }
    }
  }

  /**
   * Process a sequence enrollment
   */
  private async processSequenceEnrollment(
    sequence: InstanceType<typeof Sequence>,
    enrollment: InstanceType<typeof SequenceEnrollment>
  ): Promise<void> {
    const currentStep = sequence.steps[enrollment.currentStepIndex];
    if (!currentStep) {
      // Sequence completed
      enrollment.paused = true;
      enrollment.exitReason = 'completed';
      sequence.completedContacts++;
      await enrollment.save();
      await sequence.save();
      return;
    }

    // Check delay
    const delayMs = currentStep.delayMinutes * 60 * 1000;
    const eligibleTime = addDelayToDate(
      enrollment.lastStepCompletedAt || enrollment.enrolledAt,
      delayMs / 60000
    );

    if (new Date() < eligibleTime) {
      return;
    }

    // Send message
    const contact = enrollment.contact;

    if (currentStep.channel === 'email' && contact.email) {
      await emailService.sendWithTemplate(
        contact.email,
        currentStep.templateId.toString(),
        { firstName: contact.firstName, lastName: contact.lastName } as Record<string, string | number | boolean | null | undefined>,
        { campaignId: sequence._id.toString(), contact }
      );
    } else if (currentStep.channel === 'sms' && contact.phone) {
      await smsService.sendWithTemplate(
        contact.phone,
        currentStep.templateId.toString(),
        { firstName: contact.firstName, lastName: contact.lastName } as Record<string, string | number | boolean | null | undefined>,
        { campaignId: sequence._id.toString(), contact }
      );
    }

    // Update enrollment
    enrollment.lastStepCompletedAt = new Date();
    enrollment.completedSteps.push(currentStep.stepId);
    enrollment.currentStepIndex++;
    await enrollment.save();

    // Update sequence stats
    sequence.totalContacts = Math.max(sequence.totalContacts, enrollment.currentStepIndex);
    await sequence.save();
  }

  /**
   * Process A/B tests
   */
  async processABTests(): Promise<void> {
    await this.checkABTests();
  }

  /**
   * Check and update A/B test status
   */
  private async checkABTests(): Promise<void> {
    // Find running A/B tests
    const campaigns = await Campaign.find({
      'abTest.status': 'running',
    });

    for (const campaign of campaigns) {
      if (!campaign.abTest) continue;

      // Check if test should end (based on time or sample size)
      const minSampleSize = parseInt(process.env.AB_TEST_MIN_SAMPLE_SIZE || '100');
      const totalSent = campaign.abTest.variants.reduce((sum, v) => sum + v.sentCount, 0);

      if (totalSent >= minSampleSize) {
        // Determine winning variant
        this.determineWinningVariant(campaign);
      }
    }
  }

  /**
   * Determine winning variant based on metrics
   */
  private determineWinningVariant(campaign: InstanceType<typeof Campaign>): void {
    if (!campaign.abTest) return;

    const variants = campaign.abTest.variants;
    let winningVariant = variants[0];
    let bestScore = 0;

    for (const variant of variants) {
      // Calculate score based on delivery and engagement
      const deliveryRate = variant.sentCount > 0 ? variant.deliveredCount / variant.sentCount : 0;
      const openRate = variant.deliveredCount > 0 ? variant.openedCount / variant.deliveredCount : 0;
      const clickRate = variant.deliveredCount > 0 ? variant.clickedCount / variant.deliveredCount : 0;

      // Weighted score
      const score = (deliveryRate * 0.2) + (openRate * 0.4) + (clickRate * 0.4);

      if (score > bestScore) {
        bestScore = score;
        winningVariant = variant;
      }
    }

    // Update campaign with winning variant
    campaign.abTest.winningVariantId = winningVariant.variantId;
    campaign.abTest.status = 'completed';
    campaign.abTest.endDate = new Date();
    campaign.abTest.metrics = {
      openRate: winningVariant.sentCount > 0 ? winningVariant.openedCount / winningVariant.sentCount : 0,
      clickRate: winningVariant.sentCount > 0 ? winningVariant.clickedCount / winningVariant.sentCount : 0,
    };

    // Send winning variant to remaining recipients
    // (Implementation would go here)

    campaign.save();

    logger.info('A/B test completed', {
      campaignId: campaign._id,
      winningVariant: winningVariant.variantId,
      score: bestScore,
    });
  }

  /**
   * Cleanup old records
   */
  async cleanupOldRecords(): Promise<void> {
    const retentionDays = parseInt(process.env.RECORD_RETENTION_DAYS || '90');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Clean up old delivery records
    const deliveryResult = await DeliveryRecord.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'] },
    });

    logger.info('Cleaned up old records', {
      deliveryRecords: deliveryResult.deletedCount,
      cutoffDate,
    });
  }

  /**
   * Get worker status
   */
  getStatus(): {
    running: boolean;
    config: WorkerConfig;
    queuedMessageCount: number;
    activeCampaignCount: number;
    activeSequenceCount: number;
  } {
    return {
      running: this.isRunning,
      config: this.config,
      queuedMessageCount: 0, // Would query DB in production
      activeCampaignCount: 0,
      activeSequenceCount: 0,
    };
  }
}

// Export singleton instance
export const automationWorker = new AutomationWorker();
export default automationWorker;
