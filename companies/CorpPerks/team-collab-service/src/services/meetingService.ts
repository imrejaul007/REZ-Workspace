import { Meeting, MeetingDocument } from '../models/Meeting.js';
import { MeetingNote, MeetingNoteDocument } from '../models/MeetingNote.js';
import {
  generateMeetingId,
  CreateMeetingDTO,
  UpdateMeetingDTO,
  CreateActionItemDTO,
  ActionItem,
} from '../types/index.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export class MeetingService {
  /**
   * Create a new meeting
   */
  async createMeeting(data: CreateMeetingDTO): Promise<MeetingDocument> {
    const meetingId = generateMeetingId();

    // Calculate duration in minutes
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    const duration = Math.round(durationMs / 60000);

    if (duration <= 0) {
      throw new ForbiddenError('End time must be after start time');
    }

    const meeting = new Meeting({
      meetingId,
      title: data.title,
      description: data.description || '',
      projectId: data.projectId,
      channelId: data.channelId,
      hostId: data.hostId,
      hostName: data.hostName,
      hostAvatar: data.hostAvatar,
      attendees: data.attendees,
      startTime,
      endTime,
      duration,
      status: 'scheduled',
      meetingLink: data.meetingLink,
      notes: undefined,
      actionItems: [],
      recordings: [],
      location: data.location,
      meetingType: data.meetingType || 'video',
    });

    await meeting.save();
    return meeting;
  }

  /**
   * Get meeting by ID
   */
  async getMeeting(meetingId: string): Promise<MeetingDocument> {
    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      throw new NotFoundError('Meeting', meetingId);
    }

    return meeting;
  }

  /**
   * Get meeting by MongoDB _id
   */
  async getMeetingById(id: string): Promise<MeetingDocument> {
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      throw new NotFoundError('Meeting', id);
    }

    return meeting;
  }

  /**
   * List meetings for a user
   */
  async listMeetings(
    userId: string,
    options: {
      status?: Array<'scheduled' | 'in_progress' | 'completed' | 'cancelled'>;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<{ meetings: MeetingDocument[]; total: number }> {
    const { status, startDate, endDate, limit = 50 } = options;

    const query: Record<string, unknown> = {
      attendees: userId,
    };

    if (status && status.length > 0) {
      query.status = { $in: status };
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = startDate;
      if (endDate) query.startTime.$lte = endDate;
    }

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .sort({ startTime: 1 })
        .limit(limit),
      Meeting.countDocuments(query),
    ]);

    return { meetings, total };
  }

  /**
   * Get upcoming meetings for a user
   */
  async getUpcomingMeetings(
    userId: string,
    options: { limit?: number } = {}
  ): Promise<MeetingDocument[]> {
    return Meeting.findUpcomingForUser(userId, options);
  }

  /**
   * Get today's meetings for a user
   */
  async getTodayMeetings(userId: string): Promise<MeetingDocument[]> {
    return Meeting.findTodayForUser(userId);
  }

  /**
   * Get meetings by date range
   */
  async getMeetingsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options?: { status?: Array<'scheduled' | 'in_progress' | 'completed' | 'cancelled'> }
  ): Promise<MeetingDocument[]> {
    return Meeting.findByDateRange(userId, startDate, endDate, options);
  }

  /**
   * Update a meeting
   */
  async updateMeeting(
    meetingId: string,
    userId: string,
    data: UpdateMeetingDTO
  ): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    // Only host can update
    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can update this meeting');
    }

    if (data.title !== undefined) {
      meeting.title = data.title;
    }
    if (data.description !== undefined) {
      meeting.description = data.description;
    }
    if (data.attendees !== undefined) {
      meeting.attendees = data.attendees;
    }
    if (data.startTime !== undefined) {
      meeting.startTime = new Date(data.startTime);
      // Recalculate duration
      const endTime = data.endTime ? new Date(data.endTime) : meeting.endTime;
      meeting.duration = Math.round((endTime.getTime() - meeting.startTime.getTime()) / 60000);
    }
    if (data.endTime !== undefined) {
      meeting.endTime = new Date(data.endTime);
      meeting.duration = Math.round((meeting.endTime.getTime() - meeting.startTime.getTime()) / 60000);
    }
    if (data.meetingLink !== undefined) {
      meeting.meetingLink = data.meetingLink;
    }
    if (data.location !== undefined) {
      meeting.location = data.location;
    }
    if (data.status !== undefined) {
      meeting.status = data.status;
    }

    await meeting.save();
    return meeting;
  }

  /**
   * Start a meeting
   */
  async startMeeting(meetingId: string, userId: string): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can start the meeting');
    }

    if (meeting.status !== 'scheduled') {
      throw new ForbiddenError('Meeting cannot be started - invalid status');
    }

    meeting.start();
    await meeting.save();

    return meeting;
  }

  /**
   * End a meeting
   */
  async endMeeting(meetingId: string, userId: string): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can end the meeting');
    }

    if (meeting.status !== 'scheduled' && meeting.status !== 'in_progress') {
      throw new ForbiddenError('Meeting cannot be ended - invalid status');
    }

    meeting.end();
    await meeting.save();

    return meeting;
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(meetingId: string, userId: string): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can cancel the meeting');
    }

    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      throw new ForbiddenError('Meeting cannot be cancelled - already completed or cancelled');
    }

    meeting.cancel();
    await meeting.save();

    return meeting;
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.getMeeting(meetingId);

    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can delete the meeting');
    }

    await Meeting.deleteOne({ meetingId });
  }

  /**
   * Add action item to a meeting
   */
  async addActionItem(
    meetingId: string,
    userId: string,
    data: CreateActionItemDTO
  ): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    // Only host or attendee can add action items
    if (meeting.hostId !== userId && !meeting.attendees.includes(userId)) {
      throw new ForbiddenError('Only meeting participants can add action items');
    }

    const actionItem: ActionItem = {
      id: uuidv4(),
      task: data.task,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      dueDate: data.dueDate,
      completed: false,
      createdAt: new Date(),
    };

    meeting.addActionItem(actionItem);
    await meeting.save();

    return meeting;
  }

  /**
   * Update action item
   */
  async updateActionItem(
    meetingId: string,
    userId: string,
    itemId: string,
    updates: Partial<ActionItem>
  ): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    const item = meeting.actionItems.find((i: ActionItem) => i.id === itemId);
    if (!item) {
      throw new NotFoundError('Action item', itemId);
    }

    // Only assignee or host can update
    if (item.assigneeId !== userId && meeting.hostId !== userId) {
      throw new ForbiddenError('Only the assignee or host can update action items');
    }

    meeting.updateActionItem(itemId, updates);
    await meeting.save();

    return meeting;
  }

  /**
   * Toggle action item completion
   */
  async toggleActionItem(
    meetingId: string,
    userId: string,
    itemId: string
  ): Promise<{ completed: boolean; meeting: MeetingDocument }> {
    const meeting = await this.getMeeting(meetingId);

    const item = meeting.actionItems.find((i: ActionItem) => i.id === itemId);
    if (!item) {
      throw new NotFoundError('Action item', itemId);
    }

    // Only assignee or host can toggle
    if (item.assigneeId !== userId && meeting.hostId !== userId) {
      throw new ForbiddenError('Only the assignee or host can toggle action items');
    }

    const completed = meeting.toggleActionItem(itemId);
    await meeting.save();

    return { completed, meeting };
  }

  /**
   * Get action items for a meeting
   */
  async getActionItems(meetingId: string): Promise<ActionItem[]> {
    const meeting = await this.getMeeting(meetingId);
    return meeting.actionItems;
  }

  /**
   * Get action items assigned to a user
   */
  async getActionItemsForUser(
    userId: string,
    options: { completed?: boolean; overdue?: boolean; limit?: number } = {}
  ): Promise<ActionItem[]> {
    return Meeting.getActionItemsForUser(userId, options);
  }

  /**
   * Add notes to a meeting
   */
  async addNotes(meetingId: string, userId: string, notes: string): Promise<MeetingDocument> {
    const meeting = await this.getMeeting(meetingId);

    // Only host can add notes
    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can add notes');
    }

    meeting.notes = notes;
    await meeting.save();

    return meeting;
  }

  /**
   * Save AI-generated meeting notes
   */
  async saveNotes(
    meetingId: string,
    userId: string,
    notes: {
      content: string;
      summary: string;
      decisions: string[];
      actionItems: CreateActionItemDTO[];
    }
  ): Promise<MeetingNoteDocument> {
    const meeting = await this.getMeeting(meetingId);

    // Only host can save notes
    if (meeting.hostId !== userId) {
      throw new ForbiddenError('Only the host can save meeting notes');
    }

    // Create or update meeting note
    let meetingNote = await MeetingNote.findOne({ meetingId });

    const actionItems: ActionItem[] = notes.actionItems.map((item) => ({
      id: uuidv4(),
      task: item.task,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      completed: false,
      createdAt: new Date(),
    }));

    if (meetingNote) {
      meetingNote.content = notes.content;
      meetingNote.summary = notes.summary;
      meetingNote.decisions = notes.decisions;
      meetingNote.actionItems = actionItems;
      meetingNote.generatedAt = new Date();
    } else {
      meetingNote = new MeetingNote({
        noteId: `NOTE-${uuidv4().substring(0, 8).toUpperCase()}`,
        meetingId,
        content: notes.content,
        summary: notes.summary,
        decisions: notes.decisions,
        actionItems,
        generatedBy: 'ai',
        generatedAt: new Date(),
      });
    }

    await meetingNote.save();

    // Update meeting with notes and action items
    meeting.notes = notes.summary;
    meeting.actionItems = actionItems;
    await meeting.save();

    return meetingNote;
  }

  /**
   * Get meeting notes
   */
  async getNotes(meetingId: string): Promise<MeetingNoteDocument | null> {
    return MeetingNote.findByMeeting(meetingId);
  }

  /**
   * Get meeting statistics
   */
  async getStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalMeetings: number;
    upcomingMeetings: number;
    completedMeetings: number;
    avgDuration: number;
    totalActionItems: number;
    completedActionItems: number;
    meetingsByType: Record<string, number>;
  }> {
    return Meeting.getStats(userId || '', startDate, endDate);
  }
}

export const meetingService = new MeetingService();
