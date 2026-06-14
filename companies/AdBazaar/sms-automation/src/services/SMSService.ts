import axios from 'axios';
import { Sequence, Step, ISequence, IStep } from '../models/Sequence';
import { Enrollment, Action, IEnrollment, IAction } from '../models/Enrollment';
import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';
import { smsSentTotal, activeSequencesGauge, enrollmentsGauge, smsDeliveredGauge, smsFailedGauge } from '../utils/metrics';

export class SMSService {
  private redisClient: RedisClientType | null = null;
  private smsProvider: 'twilio' | 'msg91' = 'twilio';

  async initialize(): Promise<void> {
    try {
      this.redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
      await this.redisClient.connect();
      logger.info('Redis connected for SMS automation');
    } catch (error) {
      logger.warn('Redis not available, continuing without Redis');
    }

    this.smsProvider = (process.env.SMS_PROVIDER as 'twilio' | 'msg91') || 'twilio';
  }

  async createSequence(data: {
    name: string;
    description?: string;
    trigger: ISequence['trigger'];
    ownerId: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<ISequence> {
    const sequence = new Sequence({
      ...data,
      status: 'draft',
      stats: {
        enrolled: 0,
        completed: 0,
        optedOut: 0,
        failed: 0,
        averageResponseRate: 0,
      },
    });

    await sequence.save();
    await this.updateActiveSequencesGauge();

    logger.info(`SMS Sequence created: ${sequence._id}`, { name: data.name });
    return sequence;
  }

  async getSequence(id: string): Promise<ISequence | null> {
    return Sequence.findById(id).populate('steps');
  }

  async getSequencesByOwner(ownerId: string, options: {
    status?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  } = {}): Promise<{ sequences: ISequence[]; total: number }> {
    const { status, tags, page = 1, limit = 50 } = options;
    const query: Record<string, unknown> = { ownerId };

    if (status) query.status = status;
    if (tags?.length) query.tags = { $all: tags };

    const [sequences, total] = await Promise.all([
      Sequence.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Sequence.countDocuments(query),
    ]);

    return { sequences, total };
  }

  async updateSequence(id: string, updates: Partial<ISequence>): Promise<ISequence | null> {
    return Sequence.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
  }

  async deleteSequence(id: string): Promise<boolean> {
    const result = await Sequence.findByIdAndDelete(id);
    if (result) {
      await Step.deleteMany({ sequenceId: id });
      await Enrollment.deleteMany({ sequenceId: id });
      await this.updateActiveSequencesGauge();
      return true;
    }
    return false;
  }

  async addStep(sequenceId: string, data: {
    name: string;
    smsContent: string;
    delayDays?: number;
    delayHours?: number;
    conditions?: IStep['conditions'];
    metadata?: Record<string, unknown>;
  }): Promise<IStep> {
    const sequence = await Sequence.findById(sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    const lastStep = await Step.findOne({ sequenceId }).sort({ order: -1 });
    const order = lastStep ? lastStep.order + 1 : 0;

    const step = new Step({
      sequenceId,
      order,
      ...data,
      delayDays: data.delayDays || 0,
      delayHours: data.delayHours || 0,
    });

    await step.save();

    sequence.steps.push(step._id);
    await sequence.save();

    return step;
  }

  async updateStep(stepId: string, updates: Partial<IStep>): Promise<IStep | null> {
    return Step.findByIdAndUpdate(stepId, { $set: updates }, { new: true, runValidators: true });
  }

  async deleteStep(stepId: string): Promise<boolean> {
    const step = await Step.findById(stepId);
    if (!step) return false;

    await Step.deleteOne({ _id: stepId });
    await Sequence.updateOne({ _id: step.sequenceId }, { $pull: { steps: stepId } });

    return true;
  }

  async reorderSteps(sequenceId: string, stepIds: string[]): Promise<void> {
    for (let i = 0; i < stepIds.length; i++) {
      await Step.findByIdAndUpdate(stepIds[i], { order: i });
    }
  }

  async enrollUser(data: {
    sequenceId: string;
    userId: string;
    phone: string;
    variables?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<IEnrollment> {
    const sequence = await Sequence.findById(data.sequenceId);
    if (!sequence || sequence.status !== 'active') {
      throw new Error('Sequence not found or not active');
    }

    const existing = await Enrollment.findOne({ sequenceId: data.sequenceId, userId: data.userId });
    if (existing) {
      throw new Error('User already enrolled in this sequence');
    }

    const steps = await Step.find({ sequenceId }).sort({ order: 1 });
    const stepHistory = steps.map(step => ({
      stepId: step._id,
      status: 'pending' as const,
    }));

    const enrollment = new Enrollment({
      sequenceId: data.sequenceId,
      userId: data.userId,
      phone: data.phone,
      status: 'active',
      currentStepIndex: 0,
      stepHistory,
      variables: data.variables || {},
      metadata: data.metadata,
    });

    await enrollment.save();
    await this.updateEnrollmentsGauge();

    await Sequence.updateOne({ _id: data.sequenceId }, { $inc: { 'stats.enrolled': 1 } });

    logger.info(`User enrolled in SMS sequence: ${data.sequenceId}`, { userId: data.userId });

    setTimeout(() => this.processEnrollment(enrollment._id as unknown as string), 1000);

    return enrollment;
  }

  async unenrollUser(enrollmentId: string): Promise<void> {
    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { status: 'opted_out' },
      { new: true }
    );

    if (enrollment) {
      await Sequence.updateOne(
        { _id: enrollment.sequenceId },
        { $inc: { 'stats.optedOut': 1 } }
      );
    }
  }

  async processEnrollment(enrollmentId: string): Promise<void> {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.status !== 'active') return;

    const steps = await Step.find({ sequenceId: enrollment.sequenceId }).sort({ order: 1 });
    const currentStep = steps[enrollment.currentStepIndex];

    if (!currentStep) {
      await Enrollment.findByIdAndUpdate(enrollmentId, {
        status: 'completed',
        completedAt: new Date(),
      });
      await Sequence.updateOne({ _id: enrollment.sequenceId }, { $inc: { 'stats.completed': 1 } });
      return;
    }

    const stepHistoryEntry = enrollment.stepHistory[enrollment.currentStepIndex];
    if (stepHistoryEntry) {
      stepHistoryEntry.status = 'sent';
      stepHistoryEntry.sentAt = new Date();
    }

    const smsContent = this.interpolateVariables(currentStep.smsContent, enrollment.variables as Record<string, unknown>);

    try {
      await this.sendSMS({
        to: enrollment.phone,
        content: smsContent,
        enrollmentId: enrollment._id as unknown as string,
        stepId: currentStep._id as unknown as string,
        userId: enrollment.userId,
      });

      enrollment.lastActivityAt = new Date();
      await enrollment.save();

      logger.info(`SMS sent for enrollment: ${enrollmentId}`, { stepIndex: enrollment.currentStepIndex });
    } catch (error) {
      logger.error(`Failed to send SMS for enrollment: ${enrollmentId}`, { error });
    }
  }

  private interpolateVariables(text: string, variables: Record<string, unknown>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  private async sendSMS(data: {
    to: string;
    content: string;
    enrollmentId: string;
    stepId: string;
    userId: string;
  }): Promise<void> {
    const enrollment = await Enrollment.findById(data.enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    if (this.smsProvider === 'twilio') {
      await this.sendViaTwilio(data);
    } else {
      await this.sendViaMsg91(data);
    }

    const action = new Action({
      enrollmentId: data.enrollmentId,
      userId: data.userId,
      sequenceId: enrollment.sequenceId,
      stepId: data.stepId,
      actionType: 'sent',
    });
    await action.save();

    smsSentTotal.labels(enrollment.sequenceId as unknown as string, 'sent').inc();
  }

  private async sendViaTwilio(data: { to: string; content: string }): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: data.to,
        From: fromNumber,
        Body: data.content,
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  private async sendViaMsg91(data: { to: string; content: string }): Promise<void> {
    logger.info('MSG91 SMS would be sent', { to: data.to, content: data.content });
  }

  async trackSMSAction(data: {
    enrollmentId: string;
    actionType: 'delivered' | 'failed' | 'replied';
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const enrollment = await Enrollment.findById(data.enrollmentId);
    if (!enrollment) return;

    const action = new Action({
      enrollmentId: data.enrollmentId,
      userId: enrollment.userId,
      sequenceId: enrollment.sequenceId,
      stepId: enrollment.stepHistory[enrollment.currentStepIndex]?.stepId,
      actionType: data.actionType,
      metadata: data.metadata,
    });
    await action.save();

    if (data.actionType === 'delivered') {
      smsDeliveredGauge.inc();
    } else if (data.actionType === 'failed') {
      smsFailedGauge.inc();
      await Enrollment.findByIdAndUpdate(data.enrollmentId, { status: 'failed' });
    }

    enrollment.lastActivityAt = new Date();
    await enrollment.save();
  }

  async getSequenceAnalytics(sequenceId: string): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    optedOut: number;
    failed: number;
    deliveryRate: number;
    responseRate: number;
    stepAnalytics: Array<{
      stepIndex: number;
      sent: number;
      delivered: number;
      failed: number;
      replied: number;
    }>;
  }> {
    const sequence = await Sequence.findById(sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    const enrollments = await Enrollment.find({ sequenceId });
    const actions = await Action.find({ sequenceId });

    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'active').length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      optedOut: enrollments.filter(e => e.status === 'opted_out').length,
      failed: enrollments.filter(e => e.status === 'failed').length,
      deliveryRate: 0,
      responseRate: 0,
      stepAnalytics: [] as Array<{
        stepIndex: number;
        sent: number;
        delivered: number;
        failed: number;
        replied: number;
      }>,
    };

    const sentActions = actions.filter(a => a.actionType === 'sent');
    const deliveredActions = actions.filter(a => a.actionType === 'delivered');
    const repliedActions = actions.filter(a => a.actionType === 'replied');

    if (sentActions.length > 0) {
      stats.deliveryRate = (deliveredActions.length / sentActions.length) * 100;
      stats.responseRate = (repliedActions.length / deliveredActions.length) * 100;
    }

    const steps = await Step.find({ sequenceId }).sort({ order: 1 });
    for (let i = 0; i < steps.length; i++) {
      const stepId = steps[i]._id;
      stats.stepAnalytics.push({
        stepIndex: i,
        sent: actions.filter(a => a.stepId.equals(stepId) && a.actionType === 'sent').length,
        delivered: actions.filter(a => a.stepId.equals(stepId) && a.actionType === 'delivered').length,
        failed: actions.filter(a => a.stepId.equals(stepId) && a.actionType === 'failed').length,
        replied: actions.filter(a => a.stepId.equals(stepId) && a.actionType === 'replied').length,
      });
    }

    return stats;
  }

  async getEnrollment(id: string): Promise<IEnrollment | null> {
    return Enrollment.findById(id);
  }

  async getEnrollmentsBySequence(sequenceId: string, options: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ enrollments: IEnrollment[]; total: number }> {
    const { status, page = 1, limit = 50 } = options;
    const query: Record<string, unknown> = { sequenceId };

    if (status) query.status = status;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query).sort({ enrolledAt: -1 }).skip((page - 1) * limit).limit(limit),
      Enrollment.countDocuments(query),
    ]);

    return { enrollments, total };
  }

  async processDueEnrollments(): Promise<void> {
    const dueEnrollments = await Enrollment.find({
      status: 'active',
      lastActivityAt: { $lt: new Date(Date.now() - 60000) },
    }).limit(100);

    for (const enrollment of dueEnrollments) {
      await this.processEnrollment(enrollment._id as unknown as string);
    }
  }

  private async updateActiveSequencesGauge(): Promise<void> {
    const count = await Sequence.countDocuments({ status: 'active' });
    activeSequencesGauge.set(count);
  }

  private async updateEnrollmentsGauge(): Promise<void> {
    const count = await Enrollment.countDocuments();
    enrollmentsGauge.set(count);
  }

  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

export const smsService = new SMSService();