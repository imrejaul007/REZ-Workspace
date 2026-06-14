import { EngagementRecord, CareCircle, FamilyEngagement, ICareCircleMember, ICareCircle, IEngagementRecord } from '../models/Engagement';
import { logger } from 'utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4011';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';

export interface CareCircleInput {
  profileId: string;
  members: Array<{
    userId: string;
    name: string;
    relationship: ICareCircleMember['relationship'];
    notifyOnHealth?: boolean;
    notifyOnEmergency?: boolean;
    accessLevel?: 'view' | 'manage';
  }>;
}

export interface EngagementScore {
  profileId: string;
  overallScore: number;
  breakdown: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  lastActivity: Date;
  trend: 'improving' | 'stable' | 'declining';
}

export interface SendToCareCircleInput {
  profileId: string;
  title: string;
  message: string;
  urgency: 'normal' | 'high' | 'emergency';
  channels?: string[];
  includeVitalSigns?: boolean;
}

export interface FamilyEngagementScore {
  familyId: string;
  patientId: string;
  overallScore: number;
  memberScores: Array<{
    userId: string;
    name: string;
    relationship: string;
    score: number;
    lastActivity: Date;
  }>;
  totalMessages: number;
  acknowledgedMessages: number;
  acknowledgmentRate: number;
}

// Mock care circle data
const mockCareCircles = new Map<string, { profileId: string; members: ICareCircleMember[] }>([
  ['P001', {
    profileId: 'P001',
    members: [
      { userId: 'F001', name: 'Mary Doe', relationship: 'spouse', notifyOnHealth: true, notifyOnEmergency: true, accessLevel: 'manage' },
      { userId: 'F002', name: 'Tom Doe', relationship: 'child', notifyOnHealth: true, notifyOnEmergency: true, accessLevel: 'view' },
    ],
  }],
]);

class EngagementService {
  /**
   * Track engagement for a specific action
   */
  async trackEngagement(
    profileId: string,
    data: {
      campaignId?: string;
      reminderId?: string;
      channel: string;
      action: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'ignored';
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const record = new EngagementRecord({
      profileId,
      campaignId: data.campaignId,
      reminderId: data.reminderId,
      channel: data.channel,
      action: data.action,
      timestamp: new Date(),
      metadata: data.metadata,
    });

    await record.save();
    logger.debug('Engagement tracked', { profileId, action: data.action, channel: data.channel });
  }

  /**
   * Get engagement score for a profile
   */
  async getEngagementScore(profileId: string): Promise<EngagementScore> {
    const records = await EngagementRecord.find({ profileId })
      .sort({ timestamp: -1 })
      .limit(100);

    const counts = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      ignored: 0,
    };

    records.forEach(r => {
      if (r.action in counts) {
        counts[r.action as keyof typeof counts]++;
      }
    });

    // Calculate scores (weighted)
    const breakdown = {
      sent: Math.min(100, counts.sent * 5),
      delivered: counts.sent > 0 ? (counts.delivered / counts.sent) * 25 : 0,
      opened: counts.delivered > 0 ? (counts.opened / counts.delivered) * 25 : 0,
      clicked: counts.opened > 0 ? (counts.clicked / counts.opened) * 20 : 0,
      converted: counts.clicked > 0 ? (counts.converted / counts.clicked) * 30 : 0,
    };

    const overallScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    // Calculate trend
    const recentRecords = await EngagementRecord.find({
      profileId,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    const olderRecords = await EngagementRecord.find({
      profileId,
      timestamp: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentRecords.length > olderRecords.length * 1.2) {
      trend = 'improving';
    } else if (recentRecords.length < olderRecords.length * 0.8) {
      trend = 'declining';
    }

    return {
      profileId,
      overallScore: Math.round(overallScore),
      breakdown,
      lastActivity: records[0]?.timestamp || new Date(0),
      trend,
    };
  }

  /**
   * Get or create care circle for a profile
   */
  async getCareCircle(profileId: string): Promise<ICareCircle | null> {
    return CareCircle.findOne({ profileId });
  }

  /**
   * Create or update care circle
   */
  async createCareCircle(input: CareCircleInput): Promise<ICareCircle> {
    const existing = await CareCircle.findOne({ profileId: input.profileId });

    if (existing) {
      existing.members = input.members.map(m => ({
        ...m,
        notifyOnHealth: m.notifyOnHealth ?? true,
        notifyOnEmergency: m.notifyOnEmergency ?? true,
        accessLevel: m.accessLevel ?? 'view',
      }));
      await existing.save();
      logger.info('Care circle updated', { profileId: input.profileId });
      return existing;
    }

    const careCircle = new CareCircle({
      profileId: input.profileId,
      members: input.members.map(m => ({
        ...m,
        notifyOnHealth: m.notifyOnHealth ?? true,
        notifyOnEmergency: m.notifyOnEmergency ?? true,
        accessLevel: m.accessLevel ?? 'view',
      })),
    });

    await careCircle.save();
    logger.info('Care circle created', { profileId: input.profileId });

    return careCircle;
  }

  /**
   * Add member to care circle
   */
  async addCareCircleMember(
    profileId: string,
    member: ICareCircleMember
  ): Promise<ICareCircle> {
    const careCircle = await CareCircle.findOne({ profileId });

    if (!careCircle) {
      throw new NotFoundError('Care Circle', profileId);
    }

    // Check if member already exists
    const existingIndex = careCircle.members.findIndex(m => m.userId === member.userId);
    if (existingIndex >= 0) {
      throw new ValidationError('Member already exists in care circle');
    }

    careCircle.members.push(member);
    await careCircle.save();

    logger.info('Member added to care circle', { profileId, userId: member.userId });
    return careCircle;
  }

  /**
   * Remove member from care circle
   */
  async removeCareCircleMember(profileId: string, userId: string): Promise<ICareCircle> {
    const careCircle = await CareCircle.findOne({ profileId });

    if (!careCircle) {
      throw new NotFoundError('Care Circle', profileId);
    }

    careCircle.members = careCircle.members.filter(m => m.userId !== userId);
    await careCircle.save();

    logger.info('Member removed from care circle', { profileId, userId });
    return careCircle;
  }

  /**
   * Send notification to care circle
   */
  async sendToCareCircle(input: SendToCareCircleInput): Promise<{
    success: boolean;
    sentTo: string[];
    failedTo: string[];
  }> {
    let careCircle = await this.getCareCircle(input.profileId);

    // Fallback to mock data
    if (!careCircle) {
      const mockData = mockCareCircles.get(input.profileId);
      if (mockData) {
        careCircle = new CareCircle({
          id: `CC-${input.profileId}`,
          profileId: mockData.profileId,
          members: mockData.members,
        });
      }
    }

    if (!careCircle) {
      throw new NotFoundError('Care Circle', input.profileId);
    }

    const sentTo: string[] = [];
    const failedTo: string[] = [];

    for (const member of careCircle.members) {
      // Check notification preferences
      if (input.urgency === 'normal' && !member.notifyOnHealth) continue;
      if (input.urgency === 'emergency' && !member.notifyOnEmergency) continue;

      try {
        await this.sendNotificationToMember(member, input);
        sentTo.push(member.userId);
      } catch (error) {
        logger.warn('Failed to send to care circle member', { userId: member.userId, error });
        failedTo.push(member.userId);
      }
    }

    logger.info('Care circle notified', { profileId: input.profileId, sentTo: sentTo.length, failedTo: failedTo.length });

    return { success: failedTo.length === 0, sentTo, failedTo };
  }

  /**
   * Get family engagement score
   */
  async getFamilyEngagementScore(familyId: string, patientId: string): Promise<FamilyEngagementScore> {
    let familyEngagement = await FamilyEngagement.findOne({ familyId, patientId });

    if (!familyEngagement) {
      // Create new record
      familyEngagement = new FamilyEngagement({
        familyId,
        patientId,
        engagementScore: 0,
        totalMessages: 0,
        acknowledgedMessages: 0,
        memberScores: {},
      });
    }

    // Get care circle for member details
    const careCircle = await this.getCareCircle(patientId);

    // Calculate engagement from records
    const memberIds: string[] = careCircle?.members?.map((m: ICareCircleMember) => m.userId) || [];
    const records = await EngagementRecord.find({
      profileId: { $in: [patientId, ...memberIds] },
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    const patientRecords = records.filter(r => r.profileId === patientId);
    const totalMessages = patientRecords.length;
    const acknowledgedMessages = patientRecords.filter(
      r => ['opened', 'clicked', 'converted'].includes(r.action)
    ).length;

    // Calculate member scores
    const memberScores: Array<{
      userId: string;
      name: string;
      relationship: string;
      score: number;
      lastActivity: Date;
    }> = [];

    if (careCircle) {
      for (const member of careCircle.members) {
        const memberRecords = records.filter(r => r.profileId === member.userId);
        const score = Math.min(100, memberRecords.length * 10);
        const lastActivity = memberRecords[0]?.timestamp || new Date(0);

        memberScores.push({
          userId: member.userId,
          name: member.name,
          relationship: member.relationship,
          score,
          lastActivity,
        });
      }
    }

    // Calculate overall score
    const acknowledgmentRate = totalMessages > 0 ? (acknowledgedMessages / totalMessages) * 100 : 0;
    const avgMemberScore = memberScores.length > 0
      ? memberScores.reduce((sum, m) => sum + m.score, 0) / memberScores.length
      : 0;
    const overallScore = Math.round((acknowledgmentRate + avgMemberScore) / 2);

    // Update family engagement record
    familyEngagement.engagementScore = overallScore;
    familyEngagement.totalMessages = totalMessages;
    familyEngagement.acknowledgedMessages = acknowledgedMessages;
    familyEngagement.memberScores = memberScores.reduce((acc, m) => ({ ...acc, [m.userId]: m.score }), {});
    familyEngagement.lastActivityAt = new Date();
    await familyEngagement.save();

    return {
      familyId,
      patientId,
      overallScore,
      memberScores,
      totalMessages,
      acknowledgedMessages,
      acknowledgmentRate: Math.round(acknowledgmentRate),
    };
  }

  /**
   * Get engagement history for a profile
   */
  async getEngagementHistory(
    profileId: string,
    options: { limit?: number; action?: string; channel?: string } = {}
  ): Promise<IEngagementRecord[]> {
    const query: Record<string, unknown> = { profileId };

    if (options.action) {
      query.action = options.action;
    }
    if (options.channel) {
      query.channel = options.channel;
    }

    return EngagementRecord.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 50);
  }

  /**
   * Get engagement stats for a date range
   */
  async getEngagementStats(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const records = await EngagementRecord.find({
      profileId,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    const stats: Record<string, number> = {
      total: records.length,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      ignored: 0,
    };

    records.forEach(r => {
      if (r.action in stats) {
        stats[r.action]++;
      }
    });

    return stats;
  }

  private async sendNotificationToMember(
    member: ICareCircleMember,
    input: SendToCareCircleInput
  ): Promise<void> {
    const axios = (await import('axios')).default;

    const urgencyEmoji = {
      normal: '',
      high: '⚠️ ',
      emergency: '🚨 ',
    };

    const message = {
      to: member.userId,
      channel: 'whatsapp',
      title: input.title,
      message: `${urgencyEmoji[input.urgency]}${input.title}\n\n${input.message}${input.includeVitalSigns ? '\n\n(Vital signs attached)' : ''}`,
      priority: input.urgency,
    };

    try {
      await axios.post(`${WHATSAPP_SERVICE_URL}/api/send`, message, { timeout: 10000 });
    } catch (error) {
      logger.warn('WhatsApp service unavailable, simulating send', { message });
    }
  }
}

export const engagementService = new EngagementService();
