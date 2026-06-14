import { randomBytes } from 'crypto';
import { OneOnOne, OneOnOneDocument } from '../models/OneOnOne';
import { Meeting, MeetingDocument } from '../models/Meeting';
import { meetingService } from './meetingService';
import {
  IOneOnOne,
  ScheduleOneOnOneRequest,
  OneOnOneStats,
  MeetingType,
  MeetingFrequency,
  OneOnOneStatus,
} from '../types';

export class OneOnOneService {
  // ==================== ID GENERATION ====================

  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // ==================== 1:1 CRUD ====================

  async scheduleOneOnOne(
    data: ScheduleOneOnOneRequest & { companyId: string; createdById: string }
  ): Promise<{ oneOnOne: OneOnOneDocument; meeting: MeetingDocument }> {
    // Check if there's already an active 1:1 relationship
    const existing = await OneOnOne.findActivePair(data.managerId, data.employeeId);
    if (existing) {
      throw new Error('A 1:1 relationship already exists between these users');
    }

    // Create the 1:1 relationship
    const oneOnOneId = this.generateId('O2O');
    const scheduledStart = new Date(data.nextScheduled);
    const duration = data.duration || 30;
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60 * 1000);

    // Determine title based on type
    let title = `${data.managerName} & ${data.employeeName}`;
    if (data.type === '1on1') {
      title = `1:1 Meeting - ${data.managerName} & ${data.employeeName}`;
    } else if (data.type === 'skip_level') {
      title = `Skip Level - ${data.managerName} & ${data.employeeName}`;
    } else {
      title = `Team Meeting - ${data.managerName} & ${data.employeeName}`;
    }

    // Create the meeting
    const meeting = await meetingService.createMeeting({
      companyId: data.companyId,
      type: data.type,
      title,
      scheduledStart,
      scheduledEnd,
      hostId: data.managerId,
      hostName: data.managerName,
      hostAvatar: data.managerAvatar,
      attendeeId: data.employeeId,
      attendeeName: data.employeeName,
      attendeeAvatar: data.employeeAvatar,
      meetingLink: data.meetingLink,
      meetingType: 'video',
      duration,
      timezone: data.timezone || 'Asia/Kolkata',
      createdById: data.createdById,
    });

    // Create the 1:1 relationship
    const oneOnOne = new OneOnOne({
      oneOnOneId,
      meetingId: meeting.meetingId,
      companyId: data.companyId,
      managerId: data.managerId,
      managerName: data.managerName,
      managerAvatar: data.managerAvatar,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      employeeAvatar: data.employeeAvatar,
      type: data.type,
      frequency: data.frequency,
      nextScheduled: scheduledStart,
      duration,
      preferredTime: data.preferredTime,
      preferredDays: data.preferredDays,
      status: 'active',
      stats: {
        totalMeetings: 0,
        completedMeetings: 0,
        totalActionItems: 0,
        completedActionItems: 0,
      },
      meetingTemplate: {
        defaultAgenda: [],
        defaultDuration: duration,
        includeLastMeetingReview: true,
      },
    });

    await oneOnOne.save();
    return { oneOnOne, meeting };
  }

  async getOneOnOne(oneOnOneId: string): Promise<OneOnOneDocument | null> {
    return OneOnOne.findOne({ oneOnOneId });
  }

  async getOneOnOneByMeeting(meetingId: string): Promise<OneOnOneDocument | null> {
    return OneOnOne.findOne({ meetingId });
  }

  async getOneOnOneByPair(
    managerId: string,
    employeeId: string
  ): Promise<OneOnOneDocument | null> {
    return OneOnOne.findActivePair(managerId, employeeId);
  }

  // ==================== 1:1 STATUS MANAGEMENT ====================

  async pauseOneOnOne(
    oneOnOneId: string,
    reason?: string
  ): Promise<OneOnOneDocument | null> {
    const oneOnOne = await OneOnOne.findOne({ oneOnOneId });
    if (!oneOnOne) return null;

    return oneOnOne.pause(reason);
  }

  async resumeOneOnOne(oneOnOneId: string): Promise<OneOnOneDocument | null> {
    const oneOnOne = await OneOnOne.findOne({ oneOnOneId });
    if (!oneOnOne) return null;

    return oneOnOne.resume();
  }

  async endOneOnOne(oneOnOneId: string): Promise<OneOnOneDocument | null> {
    const oneOnOne = await OneOnOne.findOne({ oneOnOneId });
    if (!oneOnOne) return null;

    return oneOnOne.end();
  }

  async updateOneOnOne(
    oneOnOneId: string,
    updates: Partial<{
      frequency: MeetingFrequency;
      duration: number;
      preferredTime: string;
      preferredDays: number[];
      meetingTemplate: {
        defaultAgenda?: string[];
        defaultDuration?: number;
        includeLastMeetingReview?: boolean;
      };
    }>
  ): Promise<OneOnOneDocument | null> {
    return OneOnOne.findOneAndUpdate(
      { oneOnOneId },
      { $set: updates },
      { new: true }
    );
  }

  // ==================== QUERIES ====================

  async getByManager(
    managerId: string,
    options?: { status?: OneOnOneStatus; limit?: number; skip?: number }
  ): Promise<OneOnOneDocument[]> {
    return OneOnOne.findByManager(managerId, options);
  }

  async getByEmployee(
    employeeId: string,
    options?: { status?: OneOnOneStatus }
  ): Promise<OneOnOneDocument[]> {
    return OneOnOne.findByEmployee(employeeId, options);
  }

  async getUpcomingForUser(
    userId: string,
    options?: { limit?: number; daysAhead?: number }
  ): Promise<OneOnOneDocument[]> {
    return OneOnOne.findUpcoming(userId, options);
  }

  async getActiveForUser(userId: string): Promise<OneOnOneDocument[]> {
    return OneOnOne.find({
      $or: [{ managerId: userId }, { employeeId: userId }],
      status: 'active',
    });
  }

  // ==================== MEETING SCHEDULING ====================

  async scheduleNextMeeting(
    oneOnOneId: string,
    meetingData?: {
      scheduledStart: Date;
      duration?: number;
      meetingLink?: string;
      agenda?: Array<{
        title: string;
        description?: string;
        topicType: string;
        duration?: number;
      }>;
    }
  ): Promise<MeetingDocument | null> {
    const oneOnOne = await OneOnOne.findOne({ oneOnOneId });
    if (!oneOnOne || oneOnOne.status !== 'active') {
      return null;
    }

    const scheduledStart = meetingData?.scheduledStart || oneOnOne.nextScheduled;
    if (!scheduledStart) {
      // Calculate next scheduled based on frequency
      const nextDate = this.calculateNextScheduled(
        oneOnOne.frequency,
        oneOnOne.preferredTime,
        oneOnOne.preferredDays
      );
      if (nextDate) {
        oneOnOne.nextScheduled = nextDate;
        await oneOnOne.save();
      }
    }

    const duration = meetingData?.duration || oneOnOne.duration;
    const scheduledEnd = new Date(
      (meetingData?.scheduledStart || oneOnOne.nextScheduled || new Date()).getTime() +
        duration * 60 * 1000
    );

    // Create the meeting
    let title = `${oneOnOne.managerName} & ${oneOnOne.employeeName}`;
    if (oneOnOne.type === '1on1') {
      title = `1:1 Meeting - ${oneOnOne.managerName} & ${oneOnOne.employeeName}`;
    }

    const meeting = await meetingService.createMeeting({
      companyId: oneOnOne.companyId,
      type: oneOnOne.type,
      title,
      scheduledStart: meetingData?.scheduledStart || oneOnOne.nextScheduled || new Date(),
      scheduledEnd,
      hostId: oneOnOne.managerId,
      hostName: oneOnOne.managerName,
      hostAvatar: oneOnOne.managerAvatar,
      attendeeId: oneOnOne.employeeId,
      attendeeName: oneOnOne.employeeName,
      attendeeAvatar: oneOnOne.employeeAvatar,
      meetingLink: meetingData?.meetingLink || oneOnOne.meetingTemplate?.defaultDuration
        ? undefined
        : undefined,
      meetingType: 'video',
      duration,
      timezone: 'Asia/Kolkata',
      createdById: oneOnOne.managerId,
      agenda: meetingData?.agenda?.map(item => ({
        ...item,
        topicType: item.topicType as 'discussion' | 'update' | 'decision' | 'feedback' | 'goal' | 'blocker' | 'other',
      })),
    });

    // Update 1:1 with new meeting ID
    oneOnOne.meetingId = meeting.meetingId;
    await oneOnOne.save();

    return meeting;
  }

  private calculateNextScheduled(
    frequency: MeetingFrequency,
    preferredTime?: string,
    preferredDays?: number[]
  ): Date | null {
    const now = new Date();
    const next = new Date(now);

    // Set preferred time if provided
    if (preferredTime) {
      const [hours, minutes] = preferredTime.split(':').map(Number);
      next.setHours(hours, minutes, 0, 0);
    }

    // Find next preferred day
    if (preferredDays && preferredDays.length > 0) {
      while (!preferredDays.includes(next.getDay())) {
        next.setDate(next.getDate() + 1);
      }
    }

    // Adjust for frequency
    switch (frequency) {
      case 'weekly':
        // Already set to next preferred day, no additional adjustment
        if (next <= now) {
          next.setDate(next.getDate() + 7);
        }
        break;
      case 'biweekly':
        if (next <= now) {
          next.setDate(next.getDate() + 14);
        }
        break;
      case 'monthly':
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
    }

    return next;
  }

  // ==================== STATS ====================

  async getOneOnOneStats(oneOnOneId: string): Promise<{
    oneOnOne: OneOnOneDocument;
    meetingHistory: MeetingDocument[];
    recentFeedback: unknown[];
  } | null> {
    const oneOnOne = await OneOnOne.findOne({ oneOnOneId });
    if (!oneOnOne) return null;

    // Get meeting history
    const meetingHistory = await Meeting.find({
      $or: [
        { hostId: oneOnOne.managerId, attendeeId: oneOnOne.employeeId },
        { hostId: oneOnOne.employeeId, attendeeId: oneOnOne.managerId },
      ],
      status: 'completed',
    })
      .sort({ scheduledStart: -1 })
      .limit(10);

    // Get recent feedback
    const recentFeedback = await meetingService.getUserFeedback(oneOnOne.employeeId, {
      limit: 5,
    });

    return {
      oneOnOne,
      meetingHistory,
      recentFeedback,
    };
  }

  async getCompanyStats(companyId: string): Promise<OneOnOneStats> {
    return OneOnOne.getCompanyStats(companyId);
  }

  // ==================== HR/DIRECT REPORTS ====================

  async getDirectReportsWithOneOnOne(
    managerId: string
  ): Promise<Array<{
    employeeId: string;
    employeeName: string;
    employeeAvatar?: string;
    oneOnOne?: OneOnOneDocument;
    nextMeeting?: Date;
  }>> {
    const oneOnOnes = await OneOnOne.find({
      managerId,
      status: { $in: ['active', 'paused'] },
    });

    return oneOnOnes.map((o2o: OneOnOneDocument) => ({
      employeeId: o2o.employeeId,
      employeeName: o2o.employeeName,
      employeeAvatar: o2o.employeeAvatar,
      oneOnOne: o2o,
      nextMeeting: o2o.nextScheduled,
    }));
  }
}

export const oneOnOneService = new OneOnOneService();
