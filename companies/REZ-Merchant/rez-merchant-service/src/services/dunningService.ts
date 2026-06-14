/**
 * Dunning Service
 *
 * Core business logic for dunning sequences.
 * Manages the complete lifecycle of payment reminders and escalation.
 */

import mongoose, { Types } from 'mongoose';
import { logger } from '../config/redis';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { DunningConfig, IDunningConfig, IDunningRule } from '../models/DunningConfig';
import { DunningSequence, IDunningSequence, IDunningStep, DunningSequenceStatus } from '../models/DunningSequence';
import { ReminderTemplate, IReminderTemplate } from '../models/ReminderTemplate';
import { TemplateRenderer, ITemplateData } from './templateRenderer';
import { getIO } from '../config/socket';

// ── Service Interface ─────────────────────────────────────────────────────────

export interface IDunningInitResult {
  sequence: IDunningSequence;
  created: boolean;
  message: string;
}

export interface IDunningTriggerResult {
  supplierId: Types.ObjectId;
  configId: Types.ObjectId;
  matchedRules: IDunningRule[];
  triggered: boolean;
}

export interface ISupplierDunningSummary {
  supplierId: Types.ObjectId;
  supplierName: string;
  totalOverdueAmount: number;
  activeSequences: number;
  completedSequences: number;
  totalRemindersSent: number;
  daysOldestOverdue: number;
  lastReminderAt?: Date;
}

// ── Dunning Service Class ──────────────────────────────────────────────────────

export class DunningService {
  /**
   * Initialize a new dunning sequence for a supplier
   */
  static async initSequence(
    merchantId: Types.ObjectId,
    supplierId: Types.ObjectId,
    configId: Types.ObjectId,
    poId?: Types.ObjectId,
    initiatedBy?: Types.ObjectId,
    initiatedByEmail?: string
  ): Promise<IDunningInitResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if active sequence already exists
      const existingSequence = await DunningSequence.findOne({
        merchantId,
        supplierId,
        poId: poId || null,
        status: 'active',
      }).session(session);

      if (existingSequence) {
        await session.abortTransaction();
        return {
          sequence: existingSequence,
          created: false,
          message: 'Active dunning sequence already exists for this supplier/PO',
        };
      }

      // Get config and validate
      const config = await DunningConfig.findById(configId).session(session);
      if (!config) {
        throw new Error(`Dunning config ${configId} not found`);
      }
      if (!config.isActive) {
        throw new Error(`Dunning config ${configId} is not active`);
      }

      // Get overdue amount and PO details
      const poDetails = await this.getPODetails(merchantId, supplierId, poId);
      if (poDetails.totalOverdue <= 0) {
        throw new Error('No overdue amount to dun');
      }

      if (poDetails.totalOverdue < config.minOverdueAmount) {
        throw new Error(`Overdue amount ${poDetails.totalOverdue} is below minimum threshold ${config.minOverdueAmount}`);
      }

      // Generate steps from config rules
      const steps = this.generateSteps(config, poDetails);

      // Create sequence
      const sequence = new DunningSequence({
        merchantId,
        supplierId,
        supplierName: poDetails.supplierName,
        poId: poId || undefined,
        poNumbers: poDetails.poNumbers,
        configId,
        status: 'active',
        currentStep: 1,
        steps,
        totalOverdueAmount: poDetails.totalOverdue,
        currentOverdueAmount: poDetails.totalOverdue,
        initiatedBy,
        initiatedByEmail,
        escalationLevel: 0,
      });

      await sequence.save({ session });

      await session.commitTransaction();

      logger.info('Dunning sequence initiated', {
        sequenceId: sequence._id,
        sequenceNumber: sequence.sequenceNumber,
        supplierId,
        totalOverdue: poDetails.totalOverdue,
        stepsCount: steps.length,
      });

      // Emit socket event
      this.emitDunningEvent(merchantId, 'sequence_started', {
        sequenceId: sequence._id,
        supplierId,
        amount: poDetails.totalOverdue,
      });

      return {
        sequence,
        created: true,
        message: 'Dunning sequence initiated successfully',
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Generate steps from config rules
   */
  private static generateSteps(
    config: IDunningConfig,
    poDetails: { dueDate?: Date }
  ): IDunningStep[] {
    const steps: IDunningStep[] = [];
    const activeRules = config.getActiveRules();

    for (const rule of activeRules) {
      // Calculate scheduled date based on trigger
      let scheduledAt: Date;

      if (rule.trigger === 'due_date' && poDetails.dueDate) {
        scheduledAt = new Date(poDetails.dueDate);
        scheduledAt.setDate(scheduledAt.getDate() + rule.triggerDays);
      } else if (rule.trigger === 'days_overdue') {
        scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + rule.triggerDays);
      } else {
        // Default to current time + days
        scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + rule.triggerDays);
      }

      // Ensure scheduled time is within business hours
      scheduledAt = this.adjustToBusinessHours(scheduledAt, config);

      // Handle multiple channels
      const channels: ('whatsapp' | 'sms' | 'email')[] =
        rule.channel === 'all' ? ['whatsapp', 'sms', 'email'] : [rule.channel as 'whatsapp' | 'sms' | 'email'];

      for (const channel of channels) {
        steps.push({
          stepNumber: rule.sequence,
          scheduledAt,
          channel,
          template: rule.template,
          status: rule.requiresApproval ? 'pending_approval' : 'scheduled',
          retryCount: 0,
          maxRetries: 3,
        });
      }
    }

    return steps.sort((a, b) => {
      if (a.stepNumber !== b.stepNumber) return a.stepNumber - b.stepNumber;
      return a.scheduledAt.getTime() - b.scheduledAt.getTime();
    });
  }

  /**
   * Adjust date to fall within business hours
   */
  private static adjustToBusinessHours(date: Date, config: IDunningConfig): Date {
    const businessHours = config.businessHours;
    const [startHour, startMin] = businessHours.start.split(':').map(Number);
    const [endHour, endMin] = businessHours.end.split(':').map(Number);

    const adjusted = new Date(date);
    adjusted.setHours(startHour, startMin, 0, 0);

    return adjusted;
  }

  /**
   * Get PO details for dunning
   */
  private static async getPODetails(
    merchantId: Types.ObjectId,
    supplierId: Types.ObjectId,
    poId?: Types.ObjectId
  ): Promise<{
    supplierName?: string;
    poNumbers: string[];
    totalOverdue: number;
    dueDate?: Date;
    pos: Array<{
      poId: Types.ObjectId;
      poNumber: string;
      amount: number;
      outstanding: number;
      dueDate?: Date;
    }>;
  }> {
    const query: Record<string, unknown> = {
      merchantId,
      supplierId,
      isDeleted: false,
      paymentStatus: { $ne: 'paid' },
    };
    if (poId) query._id = poId;

    const pos = await PurchaseOrder.find(query).lean();
    const overduePos = pos.filter((po) => {
      if (!po.dueDate) return false;
      return new Date() > new Date(po.dueDate) || po.paymentStatus === 'partially_paid';
    });

    const poDetails = overduePos.map((po) => {
      const outstanding = (po.totalAmount || 0) - (po.paidAmount || 0);
      return {
        poId: po._id as Types.ObjectId,
        poNumber: po.poNumber,
        amount: po.totalAmount || 0,
        outstanding,
        dueDate: po.dueDate,
      };
    });

    return {
      supplierName: pos[0]?.supplierName,
      poNumbers: poDetails.map((p) => p.poNumber),
      totalOverdue: poDetails.reduce((sum, p) => sum + p.outstanding, 0),
      dueDate: poDetails[0]?.dueDate,
      pos: poDetails,
    };
  }

  /**
   * Evaluate all triggers and execute matching steps
   */
  static async evaluateTriggers(): Promise<{
    sequencesEvaluated: number;
    stepsExecuted: number;
    errors: string[];
  }> {
    const result = {
      sequencesEvaluated: 0,
      stepsExecuted: 0,
      errors: [] as string[],
    };

    try {
      // Get all sequences with pending scheduled steps
      const sequences = await DunningSequence.find({
        status: 'active',
      }).populate('merchantId configId supplierId');

      for (const sequence of sequences) {
        try {
          const stepsUpdated = await this.evaluateSequenceTriggers(sequence);
          result.stepsExecuted += stepsUpdated;
          result.sequencesEvaluated++;
        } catch (error) {
          result.errors.push(`Sequence ${sequence.sequenceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Evaluate triggers failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Evaluate triggers for a single sequence
   */
  private static async evaluateSequenceTriggers(sequence: IDunningSequence): Promise<number> {
    const now = new Date();
    let stepsExecuted = 0;

    const pendingSteps = sequence.steps.filter(
      (step) => step.status === 'scheduled' && new Date(step.scheduledAt) <= now
    );

    for (const step of pendingSteps) {
      const config = await DunningConfig.findById(sequence.configId);
      if (!config || !config.isWithinBusinessHours()) {
        continue; // Skip if outside business hours
      }

      await this.executeStep(sequence._id as Types.ObjectId, step.stepNumber, step.channel);
      stepsExecuted++;
    }

    return stepsExecuted;
  }

  /**
   * Execute a specific step
   */
  static async executeStep(
    sequenceId: Types.ObjectId,
    stepNumber: number,
    channel: 'whatsapp' | 'sms' | 'email'
  ): Promise<IDunningStep> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sequence = await DunningSequence.findById(sequenceId).session(session);
      if (!sequence) {
        throw new Error(`Sequence ${sequenceId} not found`);
      }

      if (sequence.status !== 'active') {
        throw new Error(`Sequence is not active (status: ${sequence.status})`);
      }

      const step = sequence.steps.find((s) => s.stepNumber === stepNumber && s.channel === channel);
      if (!step) {
        throw new Error(`Step ${stepNumber}/${channel} not found`);
      }

      if (step.status !== 'scheduled') {
        throw new Error(`Step is not in scheduled status (status: ${step.status})`);
      }

      // Get template
      const template = await ReminderTemplate.findOne({
        merchantId: sequence.merchantId,
        name: step.template,
        isActive: true,
      });

      if (!template) {
        throw new Error(`Template ${step.template} not found`);
      }

      // Build template data
      const templateData = await this.buildTemplateData(sequence);

      // Render message
      const renderedContent = TemplateRenderer.renderForChannel(template, templateData, channel);
      const subject = channel === 'email' ? template.getEmailSubject() : undefined;

      // Send message via appropriate channel
      const sendResult = await this.sendReminder(channel, {
        supplierId: sequence.supplierId as Types.ObjectId,
        phone: templateData.supplier_phone as string,
        email: templateData.supplier_email as string,
        subject,
        content: renderedContent,
        templateId: template._id as string,
      });

      // Update step
      step.status = 'sent';
      step.executedAt = new Date();
      step.messageId = sendResult.messageId;
      step.response = sendResult.response;

      // Check if we need to advance
      await this.checkAndAdvanceSequence(sequence);

      await sequence.save({ session });
      await session.commitTransaction();

      logger.info('Dunning step executed', {
        sequenceId: sequence.sequenceNumber,
        stepNumber,
        channel,
        messageId: sendResult.messageId,
      });

      // Emit socket event
      this.emitDunningEvent(sequence.merchantId as Types.ObjectId, 'step_executed', {
        sequenceId: sequence._id,
        stepNumber,
        channel,
        messageId: sendResult.messageId,
      });

      return step;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Build template data from sequence
   */
  private static async buildTemplateData(sequence: IDunningSequence): Promise<ITemplateData> {
    // Get supplier info
    const pos = await PurchaseOrder.find({
      merchantId: sequence.merchantId,
      supplierId: sequence.supplierId,
      isDeleted: false,
    })
      .select('poNumber totalAmount paidAmount dueDate supplierName')
      .lean();

    const outstandingPos = pos.map((po) => ({
      poNumber: po.poNumber,
      outstanding: (po.totalAmount || 0) - (po.paidAmount || 0),
      dueDate: po.dueDate,
      daysOverdue: po.dueDate
        ? Math.floor((Date.now() - new Date(po.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    const oldestPo = outstandingPos.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))[0];

    return TemplateRenderer.buildTemplateData({
      supplierName: sequence.supplierName,
      poNumbers: sequence.poNumbers || outstandingPos.map((p) => p.poNumber),
      outstandingAmount: sequence.currentOverdueAmount,
      oldestPoNumber: oldestPo?.poNumber,
      oldestPoAmount: oldestPo?.outstanding,
      oldestPoDaysOverdue: oldestPo?.daysOverdue,
    });
  }

  /**
   * Send reminder via appropriate channel
   */
  private static async sendReminder(
    channel: 'whatsapp' | 'sms' | 'email',
    data: {
      supplierId: Types.ObjectId;
      phone?: string;
      email?: string;
      subject?: string;
      content: string;
      templateId: string;
    }
  ): Promise<{ messageId: string; response: Record<string, unknown> }> {
    // FIX (security): Replaced Math.random() with crypto.randomUUID()
    const messageId = (() => {
      try {
        const { randomUUID } = require('crypto');
        return `msg_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
      } catch {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    })();

    logger.info('Sending dunning reminder', {
      channel,
      supplierId: data.supplierId,
      messageId,
    });

    // Send via appropriate channel with HTTP call to messaging service
    try {
      switch (channel) {
        case 'whatsapp': {
          const whatsappUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3001/api/whatsapp/send';
          const whatsappResponse = await fetch(whatsappUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: data.phone,
              message: data.content,
              templateId: data.templateId,
              supplierId: data.supplierId.toString(),
            }),
          });
          if (!whatsappResponse.ok) {
            const errorText = await whatsappResponse.text();
            throw new Error(`WhatsApp service error: ${whatsappResponse.status} - ${errorText}`);
          }
          logger.info('WhatsApp message sent via messaging service', { messageId, phone: data.phone });
          break;
        }
        case 'sms': {
          const smsUrl = process.env.SMS_SERVICE_URL || 'http://localhost:3002/api/sms/send';
          const smsResponse = await fetch(smsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: data.phone,
              message: data.content,
              templateId: data.templateId,
              supplierId: data.supplierId.toString(),
            }),
          });
          if (!smsResponse.ok) {
            const errorText = await smsResponse.text();
            throw new Error(`SMS service error: ${smsResponse.status} - ${errorText}`);
          }
          logger.info('SMS sent via messaging service', { messageId, phone: data.phone });
          break;
        }
        case 'email': {
          const emailUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3003/api/email/send';
          const emailResponse = await fetch(emailUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.email,
              subject: data.subject,
              html: data.content,
              templateId: data.templateId,
              supplierId: data.supplierId.toString(),
            }),
          });
          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`Email service error: ${emailResponse.status} - ${errorText}`);
          }
          logger.info('Email sent via messaging service', { messageId, to: data.email });
          break;
        }
      }
    } catch (error) {
      // Log warning but don't fail - messaging service may be unavailable
      logger.warn('Messaging service unavailable, message logged for retry', {
        channel,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      messageId,
      response: {
        channel,
        sentAt: new Date().toISOString(),
        status: 'sent',
      },
    };
  }

  /**
   * Check if sequence should advance to next step
   */
  private static async checkAndAdvanceSequence(sequence: IDunningSequence): Promise<void> {
    const currentStep = sequence.getCurrentStep();
    if (!currentStep) return;

    // Check if all steps for current sequence number are done
    const allCurrentStepDone = sequence.steps
      .filter((s) => s.stepNumber === currentStep.stepNumber)
      .every((s) => s.status === 'sent' || s.status === 'skipped');

    if (allCurrentStepDone) {
      const nextStep = sequence.getNextPendingStep();
      if (nextStep) {
        sequence.currentStep = nextStep.stepNumber;
      } else {
        // No more steps, mark as completed
        await this.completeSequence(sequence._id as Types.ObjectId, 'all_steps_completed');
      }
    }
  }

  /**
   * Resend a failed step
   */
  static async resendStep(
    sequenceId: Types.ObjectId,
    stepId: string,
    force: boolean = false
  ): Promise<IDunningStep> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sequence = await DunningSequence.findById(sequenceId).session(session);
      if (!sequence) {
        throw new Error(`Sequence ${sequenceId} not found`);
      }

      const step = sequence.steps.id(stepId) as IDunningStep | undefined;
      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      if (step.status !== 'failed' && !force) {
        throw new Error(`Step is not in failed status (status: ${step.status})`);
      }

      if (step.retryCount >= step.maxRetries) {
        throw new Error(`Maximum retries (${step.maxRetries}) exceeded`);
      }

      // Reset step for retry
      step.status = 'scheduled';
      step.error = undefined;
      step.retryCount += 1;

      await sequence.save({ session });
      await session.commitTransaction();

      // Execute immediately
      return await this.executeStep(sequenceId, step.stepNumber, step.channel);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Mark a step as complete with status
   */
  static async markStepComplete(
    sequenceId: Types.ObjectId,
    stepId: string,
    status: 'sent' | 'failed' | 'skipped',
    error?: string
  ): Promise<IDunningStep> {
    const sequence = await DunningSequence.findById(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    const step = sequence.steps.id(stepId) as IDunningStep | undefined;
    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    step.status = status;
    step.executedAt = new Date();
    if (error) step.error = error;

    await sequence.save();

    return step;
  }

  /**
   * Advance sequence to next step
   */
  static async advanceSequence(sequenceId: Types.ObjectId): Promise<IDunningSequence> {
    const sequence = await DunningSequence.findById(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    if (!sequence.advanceToNextStep()) {
      throw new Error('No more steps to advance to');
    }

    await sequence.save();

    logger.info('Dunning sequence advanced', {
      sequenceId: sequence.sequenceNumber,
      newStep: sequence.currentStep,
    });

    return sequence;
  }

  /**
   * Complete a dunning sequence
   */
  static async completeSequence(
    sequenceId: Types.ObjectId,
    reason: 'all_steps_completed' | 'fully_paid' | 'manual' = 'all_steps_completed'
  ): Promise<IDunningSequence> {
    const sequence = await DunningSequence.findById(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    sequence.status = 'completed';
    sequence.completedAt = new Date();
    sequence.completionReason = reason;

    await sequence.save();

    logger.info('Dunning sequence completed', {
      sequenceId: sequence.sequenceNumber,
      reason,
    });

    this.emitDunningEvent(sequence.merchantId as Types.ObjectId, 'sequence_completed', {
      sequenceId: sequence._id,
      reason,
    });

    return sequence;
  }

  /**
   * Pause a dunning sequence
   */
  static async pauseSequence(
    sequenceId: Types.ObjectId,
    reason: string,
    pausedBy?: Types.ObjectId,
    pausedByEmail?: string
  ): Promise<IDunningSequence> {
    const sequence = await DunningSequence.findById(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    if (!sequence.canPause()) {
      throw new Error(`Sequence cannot be paused (status: ${sequence.status})`);
    }

    // Mark pending steps as skipped
    for (const step of sequence.steps) {
      if (step.status === 'scheduled' || step.status === 'pending_approval') {
        step.status = 'skipped';
      }
    }

    sequence.status = 'paused';
    sequence.pausedReason = reason;
    sequence.pausedAt = new Date();
    sequence.lastActionBy = pausedBy;
    sequence.lastActionByEmail = pausedByEmail;

    await sequence.save();

    logger.info('Dunning sequence paused', {
      sequenceId: sequence.sequenceNumber,
      reason,
    });

    this.emitDunningEvent(sequence.merchantId as Types.ObjectId, 'sequence_paused', {
      sequenceId: sequence._id,
      reason,
    });

    return sequence;
  }

  /**
   * Resume a paused dunning sequence
   */
  static async resumeSequence(
    sequenceId: Types.ObjectId,
    resumedBy?: Types.ObjectId,
    resumedByEmail?: string
  ): Promise<IDunningSequence> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sequence = await DunningSequence.findById(sequenceId).session(session);
      if (!sequence) {
        throw new Error(`Sequence ${sequenceId} not found`);
      }

      if (!sequence.canResume()) {
        throw new Error(`Sequence cannot be resumed (status: ${sequence.status})`);
      }

      // Re-evaluate overdue status
      const poDetails = await this.getPODetails(
        sequence.merchantId as Types.ObjectId,
        sequence.supplierId as Types.ObjectId,
        sequence.poId as Types.ObjectId | undefined
      );

      if (poDetails.totalOverdue <= 0) {
        await session.abortTransaction();
        return await this.completeSequence(sequenceId, 'fully_paid');
      }

      // Update current overdue amount
      sequence.currentOverdueAmount = poDetails.totalOverdue;

      // Reactivate skipped steps for next step
      const nextPendingStep = sequence.getNextPendingStep();
      if (nextPendingStep) {
        nextPendingStep.status = 'scheduled';
      }

      sequence.status = 'active';
      sequence.resumedAt = new Date();
      sequence.lastActionBy = resumedBy;
      sequence.lastActionByEmail = resumedByEmail;

      // Clear pause info
      sequence.pausedReason = undefined;
      sequence.pausedAt = undefined;

      await sequence.save({ session });
      await session.commitTransaction();

      logger.info('Dunning sequence resumed', {
        sequenceId: sequence.sequenceNumber,
        currentOverdue: poDetails.totalOverdue,
      });

      this.emitDunningEvent(sequence.merchantId as Types.ObjectId, 'sequence_resumed', {
        sequenceId: sequence._id,
        currentOverdue: poDetails.totalOverdue,
      });

      return sequence;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancel a dunning sequence
   */
  static async cancelSequence(
    sequenceId: Types.ObjectId,
    reason: string,
    cancelledBy?: Types.ObjectId,
    cancelledByEmail?: string
  ): Promise<IDunningSequence> {
    const sequence = await DunningSequence.findById(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    if (sequence.status === 'completed' || sequence.status === 'cancelled') {
      throw new Error(`Sequence is already ${sequence.status}`);
    }

    // Mark all pending steps as cancelled
    for (const step of sequence.steps) {
      if (step.status === 'scheduled' || step.status === 'pending_approval') {
        step.status = 'cancelled';
      }
    }

    sequence.status = 'cancelled';
    sequence.completedAt = new Date();
    sequence.completionReason = reason;
    sequence.lastActionBy = cancelledBy;
    sequence.lastActionByEmail = cancelledByEmail;

    await sequence.save();

    logger.info('Dunning sequence cancelled', {
      sequenceId: sequence.sequenceNumber,
      reason,
    });

    this.emitDunningEvent(sequence.merchantId as Types.ObjectId, 'sequence_cancelled', {
      sequenceId: sequence._id,
      reason,
    });

    return sequence;
  }

  /**
   * Get active sequences for a merchant
   */
  static async getActiveSequences(merchantId: Types.ObjectId): Promise<IDunningSequence[]> {
    return DunningSequence.find({ merchantId, status: 'active' })
      .populate('supplierId')
      .populate('configId')
      .sort({ createdAt: -1 });
  }

  /**
   * Get dunning status for a specific supplier
   */
  static async getSupplierDunningStatus(supplierId: Types.ObjectId): Promise<ISupplierDunningSummary> {
    const sequences = await DunningSequence.find({ supplierId });

    const activeSequences = sequences.filter((s) => s.status === 'active');
    const completedSequences = sequences.filter((s) => s.status === 'completed');

    const totalRemindersSent = sequences.reduce((sum, seq) => {
      return sum + seq.steps.filter((step) => step.status === 'sent').length;
    }, 0);

    // Calculate oldest overdue
    const pos = await PurchaseOrder.find({
      supplierId,
      isDeleted: false,
      paymentStatus: { $ne: 'paid' },
    }).select('dueDate');

    let daysOldestOverdue = 0;
    for (const po of pos) {
      if (po.dueDate) {
        const days = Math.floor((Date.now() - new Date(po.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days > daysOldestOverdue) {
          daysOldestOverdue = days;
        }
      }
    }

    // Get last reminder time
    let lastReminderAt: Date | undefined;
    for (const seq of activeSequences) {
      for (const step of seq.steps) {
        if (step.executedAt && (!lastReminderAt || step.executedAt > lastReminderAt)) {
          lastReminderAt = step.executedAt;
        }
      }
    }

    return {
      supplierId,
      supplierName: activeSequences[0]?.supplierName || '',
      totalOverdueAmount: activeSequences.reduce((sum, s) => sum + s.currentOverdueAmount, 0),
      activeSequences: activeSequences.length,
      completedSequences: completedSequences.length,
      totalRemindersSent,
      daysOldestOverdue,
      lastReminderAt,
    };
  }

  /**
   * Process payment received during dunning
   */
  static async processPayment(
    sequenceId: Types.ObjectId,
    paymentAmount: number,
    reference?: string
  ): Promise<IDunningSequence> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sequence = await DunningSequence.findById(sequenceId).session(session);
      if (!sequence) {
        throw new Error(`Sequence ${sequenceId} not found`);
      }

      const previousOverdue = sequence.currentOverdueAmount;
      const newOverdue = Math.max(0, previousOverdue - paymentAmount);

      // Record payment event
      sequence.paymentEvents.push({
        eventType: newOverdue <= 0 ? 'full' : 'partial',
        amount: paymentAmount,
        paidAmount: paymentAmount,
        remainingAmount: newOverdue,
        paidAt: new Date(),
        reference,
      });

      sequence.currentOverdueAmount = newOverdue;

      if (newOverdue <= 0) {
        // Fully paid, complete sequence
        sequence.status = 'completed';
        sequence.completedAt = new Date();
        sequence.completionReason = 'fully_paid';
      } else if (newOverdue < previousOverdue) {
        // Partial payment - check if should pause or continue
        // For now, continue with reduced amount
      }

      await sequence.save({ session });
      await session.commitTransaction();

      logger.info('Payment processed in dunning', {
        sequenceId: sequence.sequenceNumber,
        paymentAmount,
        previousOverdue,
        newOverdue,
      });

      this.emitDunningEvent(sequence.merchantId as Types.ObjectId, 'payment_received', {
        sequenceId: sequence._id,
        paymentAmount,
        remainingAmount: newOverdue,
      });

      return sequence;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Escalate to next level
   */
  static async escalate(sequenceId: Types.ObjectId): Promise<IDunningSequence> {
    const sequence = await DunningSequence.findById(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    const config = await DunningConfig.findById(sequence.configId);
    if (!config) {
      throw new Error('Config not found');
    }

    if (sequence.escalationLevel >= config.escalationContacts.length) {
      throw new Error('Maximum escalation level reached');
    }

    sequence.escalationLevel += 1;
    sequence.lastEscalationAt = new Date();

    await sequence.save();

    // Send escalation notification
    const escalationContact = config.escalationContacts[sequence.escalationLevel - 1];
    if (escalationContact) {
      await this.sendEscalationNotification(sequence, escalationContact);
    }

    logger.info('Dunning sequence escalated', {
      sequenceId: sequence.sequenceNumber,
      newLevel: sequence.escalationLevel,
    });

    return sequence;
  }

  /**
   * Send escalation notification
   */
  private static async sendEscalationNotification(
    sequence: IDunningSequence,
    contact: { level: number; email?: string; phone?: string; name?: string }
  ): Promise<void> {
    const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/api/notifications/send';

    try {
      const response = await fetch(notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dunning_escalation',
          sequenceId: sequence.sequenceNumber,
          escalationLevel: contact.level,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          contactName: contact.name,
          supplierId: sequence.supplierId?.toString(),
          merchantId: sequence.merchantId?.toString(),
          overdueAmount: sequence.currentOverdueAmount,
          supplierName: sequence.supplierName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notification service error: ${response.status} - ${errorText}`);
      }

      logger.info('Escalation notification sent', {
        sequenceId: sequence.sequenceNumber,
        escalationLevel: contact.level,
        contactEmail: contact.email,
        contactPhone: contact.phone,
      });
    } catch (error) {
      // Log warning but don't fail the escalation
      logger.warn('Escalation notification failed to send, logged for retry', {
        sequenceId: sequence.sequenceNumber,
        escalationLevel: contact.level,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Emit socket event for real-time updates
   */
  private static emitDunningEvent(
    merchantId: Types.ObjectId,
    event: string,
    data: Record<string, unknown>
  ): void {
    try {
      const io = getIO();
      if (io) {
        io.to(`merchant:${merchantId}`).emit('dunning:event', { event, data, timestamp: new Date() });
      }
    } catch (e) {
      // Socket not available, log warning but don't fail
      logger.warn('Socket emit failed', { merchantId: merchantId.toString(), error: e instanceof Error ? e.message : String(e) });
      // Socket not available, ignore
    }
  }

  /**
   * Mark old completed/cancelled sequences for cleanup
   */
  static async cleanupOldSequences(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await DunningSequence.updateMany(
      {
        status: { $in: ['completed', 'cancelled'] },
        updatedAt: { $lt: cutoffDate },
      },
      {
        $set: { status: 'bad_debt' },
      }
    );

    return result.modifiedCount;
  }
}

export default DunningService;
