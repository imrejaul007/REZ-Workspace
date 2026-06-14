import axios from 'axios';
import { FollowUp, IFollowUp, SiteVisit, ISiteVisit, FollowUpStatus, SiteVisitStatus } from '../models/CRM';
import { logger } from '../config/logger';

export interface CreateFollowUpInput {
  leadId: string;
  brokerId: string;
  agentId?: string;
  type: string;
  priority?: string;
  scheduledAt: string | Date;
  duration?: number;
  timezone?: string;
  notes?: string;
}

export interface CreateSiteVisitInput {
  leadId: string;
  brokerId: string;
  propertyId: string;
  scheduledAt: string | Date;
  estimatedDuration?: number;
  timezone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  landmark?: string;
  attendees?: Array<{ name?: string; phone?: string; role?: string }>;
}

export class CRMService {
  private whatsappUrl = process.env.REZ_WHATSAPP_URL || 'http://localhost:4202';
  private notificationsUrl = process.env.REZ_NOTIFICATIONS_URL || 'http://localhost:4011';

  // Follow-ups

  async createFollowUp(input: CreateFollowUpInput): Promise<IFollowUp> {
    const followUp = new FollowUp({
      leadId: input.leadId,
      brokerId: input.brokerId,
      agentId: input.agentId,
      type: input.type,
      priority: input.priority || 'medium',
      scheduledAt: new Date(input.scheduledAt),
      duration: input.duration,
      timezone: input.timezone,
      notes: input.notes,
      status: FollowUpStatus.PENDING
    });
    await followUp.save();
    logger.info('Follow-up created', { followUpId: followUp._id, leadId: input.leadId });

    // Schedule reminder notification
    await this.scheduleReminder(followUp);

    return followUp;
  }

  async getFollowUp(id: string): Promise<IFollowUp | null> {
    return FollowUp.findOne({ _id: id, deletedAt: null });
  }

  async getFollowUps(filters: {
    brokerId?: string;
    leadId?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ followUps: IFollowUp[]; total: number }> {
    const { brokerId, leadId, status, type, page = 1, limit = 20 } = filters;
    const query: Record<string, any> = { deletedAt: null };

    if (brokerId) query.brokerId = brokerId;
    if (leadId) query.leadId = leadId;
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const [followUps, total] = await Promise.all([
      FollowUp.find(query).sort({ scheduledAt: 1 }).skip(skip).limit(limit).lean(),
      FollowUp.countDocuments(query)
    ]);

    return { followUps: followUps as IFollowUp[], total };
  }

  async getDueFollowUps(brokerId: string): Promise<IFollowUp[]> {
    const now = new Date();
    return FollowUp.find({
      brokerId,
      status: FollowUpStatus.PENDING,
      scheduledAt: { $lte: now },
      deletedAt: null
    }).sort({ priority: 1, scheduledAt: 1 }).lean();
  }

  async completeFollowUp(id: string, outcome: string, notes?: string): Promise<IFollowUp | null> {
    const updateData: any = {
      status: FollowUpStatus.COMPLETED,
      outcome,
      completedAt: new Date()
    };
    // Only update notes if provided (don't overwrite with undefined)
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true }
    );
    if (followUp) logger.info('Follow-up completed', { followUpId: id });
    return followUp;
  }

  async rescheduleFollowUp(id: string, newScheduledAt: Date): Promise<IFollowUp | null> {
    // First get the current follow-up to capture old scheduled time
    const existingFollowUp = await FollowUp.findOne({ _id: id, deletedAt: null });
    if (!existingFollowUp) {
      return null;
    }

    const followUp = await FollowUp.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          scheduledAt: newScheduledAt,
          status: FollowUpStatus.PENDING,
          rescheduledFrom: existingFollowUp.scheduledAt
        },
        $inc: { rescheduleCount: 1 }
      },
      { new: true }
    );
    if (followUp) logger.info('Follow-up rescheduled', { followUpId: id, from: existingFollowUp.scheduledAt, to: newScheduledAt });
    return followUp;
  }

  async skipFollowUp(id: string, reason: string): Promise<IFollowUp | null> {
    return FollowUp.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: FollowUpStatus.SKIPPED,
          outcome: reason
        }
      },
      { new: true }
    );
  }

  // Site Visits

  async createSiteVisit(input: CreateSiteVisitInput): Promise<ISiteVisit> {
    const visit = new SiteVisit({
      leadId: input.leadId,
      brokerId: input.brokerId,
      propertyId: input.propertyId,
      scheduledAt: new Date(input.scheduledAt),
      estimatedDuration: input.estimatedDuration,
      timezone: input.timezone,
      address: input.address,
      coordinates: input.coordinates,
      landmark: input.landmark,
      attendees: input.attendees,
      status: SiteVisitStatus.SCHEDULED
    });
    await visit.save();
    logger.info('Site visit created', { visitId: visit._id, leadId: input.leadId });

    // Send WhatsApp reminder
    await this.sendSiteVisitReminder(visit);

    return visit;
  }

  async getSiteVisit(id: string): Promise<ISiteVisit | null> {
    return SiteVisit.findOne({ _id: id, deletedAt: null });
  }

  async getSiteVisits(filters: {
    brokerId?: string;
    leadId?: string;
    propertyId?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ visits: ISiteVisit[]; total: number }> {
    const { brokerId, leadId, propertyId, status, from, to, page = 1, limit = 20 } = filters;
    const query: Record<string, any> = { deletedAt: null };

    if (brokerId) query.brokerId = brokerId;
    if (leadId) query.leadId = leadId;
    if (propertyId) query.propertyId = propertyId;
    if (status) query.status = status;
    if (from || to) {
      query.scheduledAt = {};
      if (from) query.scheduledAt.$gte = from;
      if (to) query.scheduledAt.$lte = to;
    }

    const skip = (page - 1) * limit;
    const [visits, total] = await Promise.all([
      SiteVisit.find(query).sort({ scheduledAt: 1 }).skip(skip).limit(limit).lean(),
      SiteVisit.countDocuments(query)
    ]);

    return { visits: visits as ISiteVisit[], total };
  }

  async confirmSiteVisit(id: string): Promise<ISiteVisit | null> {
    return SiteVisit.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: SiteVisitStatus.CONFIRMED } },
      { new: true }
    );
  }

  async startSiteVisit(id: string): Promise<ISiteVisit | null> {
    return SiteVisit.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: SiteVisitStatus.IN_PROGRESS,
          startedAt: new Date()
        }
      },
      { new: true }
    );
  }

  async completeSiteVisit(id: string, feedback: {
    rating?: number;
    comments?: string;
    interestedProperties?: string[];
    objections?: string[];
    nextSteps?: string;
  }): Promise<ISiteVisit | null> {
    const visit = await SiteVisit.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: SiteVisitStatus.COMPLETED,
          completedAt: new Date(),
          feedback
        }
      },
      { new: true }
    );
    if (visit) logger.info('Site visit completed', { visitId: id });
    return visit;
  }

  async cancelSiteVisit(id: string, reason?: string): Promise<ISiteVisit | null> {
    return SiteVisit.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: SiteVisitStatus.CANCELLED,
          'feedback.nextSteps': reason
        }
      },
      { new: true }
    );
  }

  async markNoShow(id: string): Promise<ISiteVisit | null> {
    return SiteVisit.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: SiteVisitStatus.NO_SHOW } },
      { new: true }
    );
  }

  // Dashboard

  async getDashboard(brokerId: string): Promise<{
    upcomingVisits: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
    completedThisWeek: number;
    totalVisits: number;
  }> {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [upcomingVisits, pendingFollowUps, overdueFollowUps, completedThisWeek, totalVisits] = await Promise.all([
      SiteVisit.countDocuments({
        brokerId,
        status: { $in: [SiteVisitStatus.SCHEDULED, SiteVisitStatus.CONFIRMED] },
        scheduledAt: { $gte: now },
        deletedAt: null
      }),
      FollowUp.countDocuments({
        brokerId,
        status: FollowUpStatus.PENDING,
        scheduledAt: { $gte: now },
        deletedAt: null
      }),
      FollowUp.countDocuments({
        brokerId,
        status: FollowUpStatus.PENDING,
        scheduledAt: { $lt: now },
        deletedAt: null
      }),
      SiteVisit.countDocuments({
        brokerId,
        status: SiteVisitStatus.COMPLETED,
        completedAt: { $gte: weekAgo },
        deletedAt: null
      }),
      SiteVisit.countDocuments({
        brokerId,
        deletedAt: null
      })
    ]);

    return {
      upcomingVisits,
      pendingFollowUps,
      overdueFollowUps,
      completedThisWeek,
      totalVisits
    };
  }

  // Private methods

  private async scheduleReminder(followUp: IFollowUp): Promise<void> {
    try {
      // Send push notification 15 minutes before
      const reminderTime = new Date(followUp.scheduledAt);
      reminderTime.setMinutes(reminderTime.getMinutes() - 15);

      if (reminderTime > new Date()) {
        await axios.post(`${this.notificationsUrl}/api/notifications/schedule`, {
          userId: followUp.brokerId,
          type: 'reminder',
          title: 'Follow-up Reminder',
          message: `You have a ${followUp.type} scheduled in 15 minutes`,
          scheduledAt: reminderTime.toISOString()
        }, {
          headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
        });
      }
    } catch (err) {
      logger.error('Failed to schedule reminder', { followUpId: followUp._id, error: err });
    }
  }

  private async sendSiteVisitReminder(visit: ISiteVisit): Promise<void> {
    try {
      // Send WhatsApp reminder 2 hours before
      const reminderTime = new Date(visit.scheduledAt);
      reminderTime.setHours(reminderTime.getHours() - 2);

      if (reminderTime > new Date()) {
        await axios.post(`${this.whatsappUrl}/api/send`, {
          to: visit.attendees?.[0]?.phone,
          template: 'site_visit_reminder',
          data: {
            scheduledAt: visit.scheduledAt,
            address: visit.address
          }
        }, {
          headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
        });

        await SiteVisit.findByIdAndUpdate(visit._id, {
          reminderSent: true,
          reminderSentAt: new Date()
        });
      }
    } catch (err) {
      logger.error('Failed to send site visit reminder', { visitId: visit._id, error: err });
    }
  }
}

export const crmService = new CRMService();
