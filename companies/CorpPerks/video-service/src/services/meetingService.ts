import { v4 as uuidv4 } from 'uuid';
import { Meeting } from '../models';
import {
  CreateMeetingInput,
  UpdateMeetingInput,
  JoinMeetingInput,
  MeetingQueryInput,
} from '../validators';
import {
  parseDate,
  calculateEndTime,
  generateRoomName,
  generateMeetingLink,
  calculateDuration,
} from '../utils';
import {
  PaginatedResponse,
  Meeting as MeetingType,
  Participant,
  ParticipantStatus,
  MeetingStatus,
} from '../types';

export class MeetingService {
  /**
   * Create a new meeting
   */
  async create(
    input: CreateMeetingInput,
    userId: string,
    userName: string,
    companyId: string
  ): Promise<MeetingType> {
    const meetingId = `mtg_${uuidv4()}`;
    const startTime = parseDate(input.startTime);
    const duration = input.duration || 60;
    const endTime = calculateEndTime(startTime, duration);

    // Generate meeting room
    const roomName = generateRoomName();
    const link = generateMeetingLink(roomName);

    // Build participants list
    const participants: Participant[] = [
      {
        participantId: `p_${uuidv4()}`,
        userId: input.hostId,
        name: input.hostName,
        email: input.hostEmail || '',
        role: 'host',
        status: ParticipantStatus.INVITED,
      },
    ];

    // Add additional participants
    if (input.participants && input.participants.length > 0) {
      input.participants.forEach((p) => {
        participants.push({
          participantId: `p_${uuidv4()}`,
          userId: p.userId,
          name: p.name,
          email: p.email,
          role: p.role || 'attendee',
          status: ParticipantStatus.INVITED,
        });
      });
    }

    const meeting = new Meeting({
      meetingId,
      companyId,
      title: input.title,
      description: input.description,
      hostId: input.hostId,
      hostName: input.hostName,
      hostEmail: input.hostEmail,
      startTime,
      endTime,
      duration,
      timezone: input.timezone || 'Asia/Kolkata',
      link,
      externalMeetingId: roomName,
      videoProvider: 'daily',
      maxParticipants: input.maxParticipants || 100,
      isRecurring: input.isRecurring || false,
      recurringPattern: input.recurringPattern
        ? {
            ...input.recurringPattern,
            frequency: input.recurringPattern.frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
          }
        : undefined,
      status: MeetingStatus.SCHEDULED,
      agenda: input.agenda,
      recordingEnabled: input.recordingEnabled || false,
      waitingRoomEnabled: input.waitingRoomEnabled || false,
      participants,
      createdById: userId,
      createdByName: userName,
    });

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * Update a meeting
   */
  async update(
    meetingId: string,
    input: UpdateMeetingInput,
    userId: string
  ): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId, status: MeetingStatus.SCHEDULED });
    if (!meeting) return null;

    // Check authorization
    if (meeting.hostId !== userId) {
      throw new Error('Only the host can update the meeting');
    }

    // Apply updates
    if (input.title !== undefined) meeting.title = input.title;
    if (input.description !== undefined) meeting.description = input.description;
    if (input.duration !== undefined) meeting.duration = input.duration;
    if (input.maxParticipants !== undefined) meeting.maxParticipants = input.maxParticipants;
    if (input.agenda !== undefined) meeting.agenda = input.agenda;
    if (input.recordingEnabled !== undefined) meeting.recordingEnabled = input.recordingEnabled;
    if (input.waitingRoomEnabled !== undefined) meeting.waitingRoomEnabled = input.waitingRoomEnabled;

    if (input.startTime !== undefined) {
      meeting.startTime = parseDate(input.startTime);
      meeting.endTime = calculateEndTime(meeting.startTime, meeting.duration);
    }

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * Get meeting by ID
   */
  async getById(meetingId: string): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId });
    return meeting?.toObject() as unknown as MeetingType || null;
  }

  /**
   * List meetings with filters
   */
  async list(query: MeetingQueryInput): Promise<PaginatedResponse<MeetingType>> {
    const filter: Record<string, unknown> = {};

    if (query.companyId) filter.companyId = query.companyId;
    if (query.hostId) filter.hostId = query.hostId;
    if (query.status) filter.status = query.status;

    if (query.fromDate || query.toDate) {
      filter.startTime = {};
      if (query.fromDate) (filter.startTime as Record<string, Date>).$gte = new Date(query.fromDate);
      if (query.toDate) (filter.startTime as Record<string, Date>).$lte = new Date(query.toDate);
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'startTime';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Meeting.countDocuments(filter),
    ]);

    return {
      data: meetings.map((m) => m.toObject() as unknown as MeetingType),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + meetings.length < total,
      },
    };
  }

  /**
   * Get upcoming meetings for user
   */
  async getUpcoming(userId: string, limit = 10): Promise<MeetingType[]> {
    const meetings = await Meeting.findUpcomingForUser(userId, { limit });
    return meetings.map((m) => m.toObject() as unknown as MeetingType);
  }

  /**
   * Get today's meetings for user
   */
  async getToday(userId: string): Promise<MeetingType[]> {
    const meetings = await Meeting.findTodayForUser(userId);
    return meetings.map((m) => m.toObject() as unknown as MeetingType);
  }

  /**
   * Get meetings in date range
   */
  async getInRange(userId: string, fromDate: string, toDate: string): Promise<MeetingType[]> {
    const meetings = await Meeting.findInRange(userId, new Date(fromDate), new Date(toDate));
    return meetings.map((m) => m.toObject() as unknown as MeetingType);
  }

  /**
   * Join a meeting
   */
  async join(
    meetingId: string,
    input: JoinMeetingInput
  ): Promise<{ meeting: MeetingType; participant: Participant }> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Check if meeting has ended
    if (meeting.status === MeetingStatus.COMPLETED || meeting.status === MeetingStatus.CANCELLED) {
      throw new Error('Meeting has ended');
    }

    // Check max participants
    const activeParticipants = meeting.participants.filter(
      (p) => p.status === ParticipantStatus.JOINED
    ).length;
    if (activeParticipants >= meeting.maxParticipants) {
      throw new Error('Meeting is full');
    }

    // Find or create participant
    let participant = meeting.participants.find((p) => p.userId === input.userId);

    if (!participant) {
      participant = {
        participantId: `p_${uuidv4()}`,
        userId: input.userId,
        name: input.name,
        email: input.email,
        role: input.role || 'attendee',
        status: ParticipantStatus.JOINED,
        joinedAt: new Date(),
        deviceInfo: input.deviceInfo,
      };
      meeting.participants.push(participant);
    } else {
      participant.status = ParticipantStatus.JOINED;
      participant.joinedAt = new Date();
      participant.name = input.name;
      participant.email = input.email;
      if (input.deviceInfo) {
        participant.deviceInfo = input.deviceInfo;
      }
    }

    // Update meeting status if first join
    if (meeting.status === MeetingStatus.SCHEDULED) {
      meeting.status = MeetingStatus.IN_PROGRESS;
    }

    await meeting.save();
    return {
      meeting: meeting.toObject() as unknown as MeetingType,
      participant,
    };
  }

  /**
   * Leave a meeting
   */
  async leave(meetingId: string, participantId: string): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    const participant = meeting.participants.find((p) => p.participantId === participantId);
    if (!participant) return null;

    participant.status = ParticipantStatus.LEFT;
    participant.leftAt = new Date();
    if (participant.joinedAt) {
      participant.duration = calculateDuration(participant.joinedAt, participant.leftAt);
    }

    // Check if all participants have left
    const activeParticipants = meeting.participants.filter(
      (p) => p.status === ParticipantStatus.JOINED && p.role !== 'host'
    );
    if (activeParticipants.length === 0) {
      meeting.status = MeetingStatus.COMPLETED;
      meeting.endTime = new Date();
    }

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * End a meeting (host only)
   */
  async end(meetingId: string, userId: string): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    // Check authorization
    if (meeting.hostId !== userId) {
      throw new Error('Only the host can end the meeting');
    }

    meeting.status = MeetingStatus.COMPLETED;
    meeting.endTime = new Date();

    // Update all active participants
    meeting.participants.forEach((p) => {
      if (p.status === ParticipantStatus.JOINED) {
        p.status = ParticipantStatus.LEFT;
        p.leftAt = new Date();
        if (p.joinedAt) {
          p.duration = calculateDuration(p.joinedAt, p.leftAt);
        }
      }
    });

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * Cancel a meeting
   */
  async cancel(
    meetingId: string,
    userId: string,
    reason?: string
  ): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId, status: MeetingStatus.SCHEDULED });
    if (!meeting) return null;

    // Check authorization
    if (meeting.hostId !== userId) {
      throw new Error('Only the host can cancel the meeting');
    }

    meeting.status = MeetingStatus.CANCELLED;
    if (reason) {
      meeting.cancellationReason = reason;
    }

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * Get meeting statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    totalDuration: number;
  }> {
    return Meeting.getMeetingStats(userId);
  }

  /**
   * Add participant to meeting
   */
  async addParticipant(
    meetingId: string,
    userId: string,
    name: string,
    email: string,
    role: 'co_host' | 'presenter' | 'attendee' = 'attendee'
  ): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId, status: MeetingStatus.SCHEDULED });
    if (!meeting) return null;

    // Check if already a participant
    const existing = meeting.participants.find((p) => p.userId === userId);
    if (existing) {
      throw new Error('User is already a participant');
    }

    meeting.participants.push({
      participantId: `p_${uuidv4()}`,
      userId,
      name,
      email,
      role,
      status: ParticipantStatus.INVITED,
    });

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * Remove participant from meeting
   */
  async removeParticipant(
    meetingId: string,
    participantId: string,
    userId: string
  ): Promise<MeetingType | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    // Check authorization (host or self-removal)
    if (meeting.hostId !== userId) {
      const participant = meeting.participants.find((p) => p.participantId === participantId);
      if (!participant || participant.userId !== userId) {
        throw new Error('Not authorized to remove this participant');
      }
    }

    meeting.participants = meeting.participants.filter(
      (p) => p.participantId !== participantId
    );

    await meeting.save();
    return meeting.toObject() as unknown as MeetingType;
  }

  /**
   * Delete meeting
   */
  async delete(meetingId: string): Promise<boolean> {
    const result = await Meeting.deleteOne({ meetingId });
    return result.deletedCount > 0;
  }
}

export const meetingService = new MeetingService();
