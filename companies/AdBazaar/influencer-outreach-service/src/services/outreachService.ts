import { Outreach, IOutreach } from '../models/Outreach';
import { Sequence } from '../models/Sequence';
import { Email } from '../models/Email';
import { Response } from '../models/Response';
import { logger } from 'utils/logger.js';
import { outreachMessagesSent, outreachResponses } from '../utils/metrics';

export class OutreachService {
  /**
   * Create outreach message
   */
  async createOutreach(data: Partial<IOutreach>): Promise<IOutreach> {
    try {
      const outreach = new Outreach(data);
      await outreach.save();
      logger.info('Outreach created', { outreachId: outreach._id });
      return outreach;
    } catch (error) {
      logger.error('Failed to create outreach', { error, data });
      throw error;
    }
  }

  /**
   * Get outreach by ID
   */
  async getOutreachById(id: string): Promise<IOutreach | null> {
    return Outreach.findById(id).exec();
  }

  /**
   * Get outreach by influencer
   */
  async getOutreachByInfluencer(influencerId: string): Promise<IOutreach[]> {
    return Outreach.find({ influencerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Send outreach message
   */
  async sendOutreach(id: string): Promise<IOutreach | null> {
    try {
      const outreach = await Outreach.findById(id).exec();
      if (!outreach) throw new Error('Outreach not found');

      const updatedOutreach = await Outreach.findByIdAndUpdate(
        id,
        {
          status: 'sent',
          sentAt: new Date(),
          attemptCount: outreach.attemptCount + 1,
          lastAttemptAt: new Date()
        },
        { new: true }
      ).exec();

      // Create email record if email channel
      if (outreach.channel === 'email') {
        await Email.create({
          outreachId: id,
          from: { email: 'outreach@adbazaar.com', name: 'AdBazaar' },
          to: { email: 'influencer@example.com' },
          subject: outreach.subject || 'Collaboration Opportunity',
          body: outreach.content,
          sentAt: new Date()
        });
      }

      outreachMessagesSent.inc();
      logger.info('Outreach sent', { outreachId: id });

      return updatedOutreach;
    } catch (error) {
      logger.error('Failed to send outreach', { error, outreachId: id });
      throw error;
    }
  }

  /**
   * Get outreach responses
   */
  async getOutreachResponses(outreachId: string): Promise<any[]> {
    return Response.find({ outreachId })
      .sort({ respondedAt: -1 })
      .exec();
  }

  /**
   * Record response
   */
  async recordResponse(
    outreachId: string,
    responseData: {
      influencerId: string;
      type: string;
      message: string;
      source?: string;
      sentiment?: string;
    }
  ): Promise<any> {
    try {
      const response = await Response.create({
        ...responseData,
        respondedAt: new Date()
      });

      // Update outreach status
      await Outreach.findByIdAndUpdate(outreachId, {
        status: 'replied',
        repliedAt: new Date(),
        response: {
          type: responseData.type,
          message: responseData.message,
          respondedAt: new Date()
        }
      });

      outreachResponses.inc({ type: responseData.type });
      logger.info('Response recorded', { responseId: response._id });

      return response;
    } catch (error) {
      logger.error('Failed to record response', { error });
      throw error;
    }
  }

  /**
   * Get sequences
   */
  async getSequences(brandId?: string): Promise<any[]> {
    const query = brandId ? { brandId } : {};
    return Sequence.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Create sequence
   */
  async createSequence(data: {
    name: string;
    brandId: string;
    description?: string;
    steps: any[];
    targetCriteria?: any;
  }): Promise<any> {
    try {
      const sequence = await Sequence.create(data);
      logger.info('Sequence created', { sequenceId: sequence._id });
      return sequence;
    } catch (error) {
      logger.error('Failed to create sequence', { error });
      throw error;
    }
  }

  /**
   * Enroll influencer in sequence
   */
  async enrollInSequence(
    sequenceId: string,
    influencerId: string,
    campaignId?: string
  ): Promise<IOutreach | null> {
    try {
      const sequence = await Sequence.findById(sequenceId).exec();
      if (!sequence) throw new Error('Sequence not found');

      // Get first step
      const firstStep = sequence.steps.find(s => s.type !== 'delay' && s.type !== 'condition');
      if (!firstStep) throw new Error('No valid step found in sequence');

      // Create first outreach
      const outreach = await Outreach.create({
        influencerId,
        campaignId,
        brandId: sequence.brandId,
        type: 'initial',
        channel: firstStep.type as any,
        subject: firstStep.subject,
        content: firstStep.content,
        sequenceId,
        sequenceStep: firstStep.step,
        status: 'draft',
        scheduledAt: new Date()
      });

      // Update sequence stats
      await Sequence.findByIdAndUpdate(sequenceId, {
        $inc: { totalEnrolled: 1 }
      });

      logger.info('Influencer enrolled in sequence', { sequenceId, influencerId });
      return outreach;
    } catch (error) {
      logger.error('Failed to enroll in sequence', { error });
      throw error;
    }
  }

  /**
   * Get outreach analytics
   */
  async getOutreachAnalytics(brandId?: string): Promise<any> {
    const query = brandId ? { brandId } : {};
    const outreach = await Outreach.find(query).exec();

    const total = outreach.length;
    const sent = outreach.filter(o => ['sent', 'delivered', 'opened', 'replied'].includes(o.status)).length;
    const delivered = outreach.filter(o => ['delivered', 'opened', 'replied'].includes(o.status)).length;
    const opened = outreach.filter(o => ['opened', 'replied'].includes(o.status)).length;
    const replied = outreach.filter(o => o.status === 'replied').length;
    const accepted = outreach.filter(o => o.status === 'accepted').length;
    const rejected = outreach.filter(o => o.status === 'rejected').length;

    const responses = await Response.find(query).exec();
    const interested = responses.filter(r => r.type === 'interested').length;
    const notInterested = responses.filter(r => r.type === 'not_interested').length;

    return {
      totalOutreach: total,
      sent,
      delivered,
      opened,
      replied,
      accepted,
      rejected,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      replyRate: opened > 0 ? (replied / opened) * 100 : 0,
      acceptanceRate: replied > 0 ? (accepted / replied) * 100 : 0,
      totalResponses: responses.length,
      interested,
      notInterested,
      responseRate: responses.length > 0 ? (interested / responses.length) * 100 : 0,
      byChannel: this.groupByChannel(outreach),
      byType: this.groupByType(outreach)
    };
  }

  /**
   * Update outreach status
   */
  async updateOutreachStatus(
    id: string,
    status: string,
    additionalData?: any
  ): Promise<IOutreach | null> {
    const updateData: any = { status };

    if (status === 'delivered') updateData.deliveredAt = new Date();
    if (status === 'opened') updateData.openedAt = new Date();
    if (status === 'replied') updateData.repliedAt = new Date();

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    return Outreach.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  /**
   * Schedule outreach
   */
  async scheduleOutreach(
    id: string,
    scheduledAt: Date
  ): Promise<IOutreach | null> {
    return Outreach.findByIdAndUpdate(
      id,
      {
        status: 'scheduled',
        scheduledAt
      },
      { new: true }
    ).exec();
  }

  /**
   * Delete outreach
   */
  async deleteOutreach(id: string): Promise<boolean> {
    const result = await Outreach.findByIdAndDelete(id).exec();
    if (result) {
      await Promise.all([
        Email.deleteMany({ outreachId: id }).exec(),
        Response.deleteMany({ outreachId: id }).exec()
      ]);
    }
    return !!result;
  }

  // Helper methods
  private groupByChannel(outreach: any[]): any {
    const groups: any = {};
    outreach.forEach(o => {
      if (!groups[o.channel]) {
        groups[o.channel] = { total: 0, sent: 0, replied: 0 };
      }
      groups[o.channel].total++;
      if (['sent', 'delivered', 'opened', 'replied'].includes(o.status)) {
        groups[o.channel].sent++;
      }
      if (o.status === 'replied') {
        groups[o.channel].replied++;
      }
    });
    return groups;
  }

  private groupByType(outreach: any[]): any {
    const groups: any = {};
    outreach.forEach(o => {
      if (!groups[o.type]) {
        groups[o.type] = { total: 0, sent: 0, replied: 0 };
      }
      groups[o.type].total++;
      if (['sent', 'delivered', 'opened', 'replied'].includes(o.status)) {
        groups[o.type].sent++;
      }
      if (o.status === 'replied') {
        groups[o.type].replied++;
      }
    });
    return groups;
  }
}

export const outreachService = new OutreachService();