import { randomBytes } from 'crypto';
import { Meeting, MeetingDocument } from '../models/Meeting';
import { OneOnOne, OneOnOneDocument } from '../models/OneOnOne';
import { MeetingNote, MeetingNoteDocument } from '../models/Note';
import { ActionItem, ActionItemDocument } from '../models/ActionItem';
import { Feedback, FeedbackDocument } from '../models/Feedback';
import { AgendaItem, AgendaItemDocument } from '../models/Agenda';
import {
  IMeeting,
  IOneOnOne,
  IMeetingNote,
  IActionItem,
  IFeedback,
  IAgendaItem,
  MeetingStatus,
  MeetingType,
  MeetingFrequency,
  ScheduleOneOnOneRequest,
  AddNoteRequest,
  AddActionItemRequest,
  AddAgendaItemRequest,
  SubmitFeedbackRequest,
  CompleteMeetingRequest,
  UpdateActionItemRequest,
  MeetingStats,
} from '../types';

export class MeetingService {
  // ==================== ID GENERATION ====================

  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private generateMeetingId(): string {
    return this.generateId('MTG');
  }

  private generateOneOnOneId(): string {
    return this.generateId('O2O');
  }

  private generateNoteId(): string {
    return this.generateId('NOTE');
  }

  private generateActionItemId(): string {
    return this.generateId('AI');
  }

  private generateFeedbackId(): string {
    return this.generateId('FB');
  }

  private generateAgendaItemId(): string {
    return this.generateId('AGENDA');
  }

  // ==================== MEETING CRUD ====================

  async createMeeting(data: {
    companyId: string;
    type: MeetingType;
    title: string;
    description?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    hostId: string;
    hostName: string;
    hostAvatar?: string;
    attendeeId: string;
    attendeeName: string;
    attendeeAvatar?: string;
    participantIds?: string[];
    location?: string;
    meetingLink?: string;
    meetingType?: 'video' | 'audio' | 'in_person' | 'phone';
    duration?: number;
    timezone?: string;
    recurrence?: {
      frequency: MeetingFrequency;
      endDate?: Date;
    };
    createdById: string;
    agenda?: AddAgendaItemRequest[];
  }): Promise<MeetingDocument> {
    const duration = data.duration || Math.round(
      (data.scheduledEnd.getTime() - data.scheduledStart.getTime()) / (1000 * 60)
    );

    const meeting = new Meeting({
      meetingId: this.generateMeetingId(),
      companyId: data.companyId,
      type: data.type,
      title: data.title,
      description: data.description,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      duration,
      timezone: data.timezone || 'Asia/Kolkata',
      hostId: data.hostId,
      hostName: data.hostName,
      hostAvatar: data.hostAvatar,
      attendeeId: data.attendeeId,
      attendeeName: data.attendeeName,
      attendeeAvatar: data.attendeeAvatar,
      participantIds: data.participantIds || [],
      location: data.location,
      meetingLink: data.meetingLink,
      meetingType: data.meetingType || 'video',
      status: 'scheduled',
      agenda: (data.agenda || []).map((item, index) => ({
        agendaItemId: this.generateAgendaItemId(),
        meetingId: '', // Will be set after meeting creation
        title: item.title,
        description: item.description,
        topicType: item.topicType,
        proposedById: data.hostId,
        proposedByName: data.hostName,
        duration: item.duration,
        isCompleted: false,
        order: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      agendaSent: false,
      notes: [],
      actionItems: [],
      feedback: [],
      recurrence: data.recurrence ? {
        frequency: data.recurrence.frequency,
        nextOccurrence: data.scheduledStart,
        lastOccurrence: undefined,
        endDate: data.recurrence.endDate,
      } : undefined,
      createdById: data.createdById,
    });

    // Update agenda items with meeting ID
    meeting.agenda = meeting.agenda.map(a => ({ ...a, meetingId: meeting.meetingId }));

    await meeting.save();
    return meeting;
  }

  async getMeeting(meetingId: string): Promise<MeetingDocument | null> {
    return Meeting.findOne({ meetingId });
  }

  async getMeetingById(id: string): Promise<MeetingDocument | null> {
    return Meeting.findById(id);
  }

  async updateMeeting(
    meetingId: string,
    updates: Partial<{
      title: string;
      description: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      duration: number;
      location: string;
      meetingLink: string;
      status: MeetingStatus;
      agendaSent: boolean;
    }>
  ): Promise<MeetingDocument | null> {
    return Meeting.findOneAndUpdate(
      { meetingId },
      { $set: updates },
      { new: true }
    );
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    const result = await Meeting.deleteOne({ meetingId });
    // Also delete related records
    await Promise.all([
      ActionItem.deleteMany({ meetingId }),
      MeetingNote.deleteMany({ meetingId }),
      Feedback.deleteMany({ meetingId }),
      AgendaItem.deleteMany({ meetingId }),
    ]);
    return result.deletedCount > 0;
  }

  // ==================== MEETING ACTIONS ====================

  async startMeeting(meetingId: string): Promise<MeetingDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    meeting.status = 'in_progress';
    meeting.actualStart = new Date();
    await meeting.save();
    return meeting;
  }

  async endMeeting(
    meetingId: string,
    data?: CompleteMeetingRequest
  ): Promise<MeetingDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    meeting.status = 'completed';
    meeting.actualEnd = data?.actualEnd ? new Date(data.actualEnd) : new Date();
    if (data?.aiSummary) {
      meeting.aiSummary = data.aiSummary;
    }
    await meeting.save();

    // Update 1:1 record if exists
    const oneOnOne = await OneOnOne.findOne({ meetingId });
    if (oneOnOne) {
      await oneOnOne.recordMeeting(meeting.actualEnd);
    }

    return meeting;
  }

  async cancelMeeting(
    meetingId: string,
    reason?: string
  ): Promise<MeetingDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    meeting.status = 'cancelled';
    meeting.cancellationReason = reason;
    await meeting.save();
    return meeting;
  }

  // ==================== NOTES ====================

  async addNote(
    meetingId: string,
    authorId: string,
    authorName: string,
    data: AddNoteRequest
  ): Promise<MeetingNoteDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    const note = new MeetingNote({
      noteId: this.generateNoteId(),
      meetingId,
      authorId,
      authorName,
      content: data.content,
      sentiment: data.sentiment,
      discussionSummary: data.discussionSummary,
      decisions: data.decisions || [],
      keyTakeaways: data.keyTakeaways || [],
      actionItems: [],
      isPrivate: data.isPrivate || false,
      sharedWith: data.sharedWith || [],
    });

    await note.save();

    // Update meeting's notes array
    meeting.notes.push({
      noteId: note.noteId,
      authorId: note.authorId,
      authorName: note.authorName,
      content: note.content,
      sentiment: note.sentiment,
      discussionSummary: note.discussionSummary,
      decisions: note.decisions,
      keyTakeaways: note.keyTakeaways,
      actionItems: note.actionItems,
      attachments: [],
      isPrivate: note.isPrivate,
      sharedWith: note.sharedWith,
    });
    await meeting.save();

    return note;
  }

  async getNotes(meetingId: string, userId?: string): Promise<MeetingNoteDocument[]> {
    return MeetingNote.findByMeeting(meetingId, userId);
  }

  async updateNote(
    noteId: string,
    updates: Partial<{
      content: string;
      discussionSummary: string;
      decisions: string[];
      keyTakeaways: string[];
      isPrivate: boolean;
      sharedWith: string[];
    }>
  ): Promise<MeetingNoteDocument | null> {
    return MeetingNote.findOneAndUpdate(
      { noteId },
      { $set: updates },
      { new: true }
    );
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const result = await MeetingNote.deleteOne({ noteId });
    return result.deletedCount > 0;
  }

  // ==================== ACTION ITEMS ====================

  async addActionItem(
    meetingId: string,
    createdById: string,
    createdByName: string,
    data: AddActionItemRequest
  ): Promise<ActionItemDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    const actionItem = new ActionItem({
      itemId: this.generateActionItemId(),
      meetingId,
      task: data.task,
      description: data.description,
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      createdById,
      createdByName,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: 'pending',
      priority: data.priority || 'medium',
    });

    await actionItem.save();

    // Update meeting's action items
    meeting.actionItems.push({
      itemId: actionItem.itemId,
      task: actionItem.task,
      description: actionItem.description,
      assigneeId: actionItem.assigneeId,
      assigneeName: actionItem.assigneeName,
      createdById: actionItem.createdById,
      createdByName: actionItem.createdByName,
      dueDate: actionItem.dueDate,
      status: 'pending',
      priority: actionItem.priority || 'medium',
    });
    await meeting.save();

    // Update 1:1 stats if exists
    const oneOnOne = await OneOnOne.findOne({ meetingId });
    if (oneOnOne) {
      await oneOnOne.recordActionItem(false);
    }

    return actionItem;
  }

  async getActionItems(meetingId: string): Promise<ActionItemDocument[]> {
    return ActionItem.find({ meetingId }).sort({ priority: -1, dueDate: 1 });
  }

  async updateActionItem(
    itemId: string,
    updates: UpdateActionItemRequest
  ): Promise<ActionItemDocument | null> {
    const updateData: Record<string, unknown> = {};

    if (updates.status) {
      updateData.status = updates.status;
      if (updates.status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (updates.dueDate) {
      updateData.dueDate = new Date(updates.dueDate);
    }
    if (updates.completedNote) {
      updateData.completedNote = updates.completedNote;
    }

    return ActionItem.findOneAndUpdate(
      { itemId },
      { $set: updateData },
      { new: true }
    );
  }

  async deleteActionItem(itemId: string): Promise<boolean> {
    const result = await ActionItem.deleteOne({ itemId });
    return result.deletedCount > 0;
  }

  async getUserActionItems(
    userId: string,
    options?: { status?: string; overdue?: boolean; limit?: number }
  ): Promise<ActionItemDocument[]> {
    const query: Record<string, unknown> = { assigneeId: userId };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.overdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'completed' };
    }

    return ActionItem.find(query)
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .limit(options?.limit || 50);
  }

  // ==================== FEEDBACK ====================

  async submitFeedback(
    meetingId: string,
    reviewerId: string,
    reviewerName: string,
    revieweeId: string,
    revieweeName: string,
    data: SubmitFeedbackRequest
  ): Promise<FeedbackDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    const feedback = new Feedback({
      feedbackId: this.generateFeedbackId(),
      meetingId,
      reviewerId,
      reviewerName,
      revieweeId,
      revieweeName,
      rating: data.rating,
      feedbackType: data.feedbackType,
      comment: data.comment,
      submittedAt: new Date(),
    });

    await feedback.save();

    // Update meeting's feedback array
    meeting.feedback.push({
      feedbackId: feedback.feedbackId,
      reviewerId: feedback.reviewerId,
      reviewerName: feedback.reviewerName,
      revieweeId: feedback.revieweeId,
      revieweeName: feedback.revieweeName,
      rating: feedback.rating,
      feedbackType: feedback.feedbackType,
      comment: feedback.comment,
      sentiment: feedback.sentiment,
      submittedAt: feedback.submittedAt,
    });
    await meeting.save();

    // Update 1:1 stats if exists
    const oneOnOne = await OneOnOne.findOne({ meetingId });
    if (oneOnOne) {
      await oneOnOne.recordFeedback(data.rating);
    }

    return feedback;
  }

  async getFeedback(meetingId: string): Promise<FeedbackDocument[]> {
    return Feedback.findByMeeting(meetingId);
  }

  async getUserFeedback(
    userId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<FeedbackDocument[]> {
    return Feedback.getFeedbackHistory(userId, options);
  }

  // ==================== AGENDA ====================

  async addAgendaItem(
    meetingId: string,
    proposedById: string,
    proposedByName: string,
    data: AddAgendaItemRequest
  ): Promise<AgendaItemDocument | null> {
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return null;

    const agendaItem = new AgendaItem({
      agendaItemId: this.generateAgendaItemId(),
      meetingId,
      title: data.title,
      description: data.description,
      topicType: data.topicType,
      proposedById,
      proposedByName,
      duration: data.duration,
      isCompleted: false,
      order: meeting.agenda.length,
    });

    await agendaItem.save();

    meeting.agenda.push({
      agendaItemId: agendaItem.agendaItemId,
      title: agendaItem.title,
      description: agendaItem.description,
      topicType: agendaItem.topicType,
      proposedById: agendaItem.proposedById,
      proposedByName: agendaItem.proposedByName,
      duration: agendaItem.duration,
      isCompleted: agendaItem.isCompleted,
      order: agendaItem.order,
      notes: undefined,
    });
    await meeting.save();

    return agendaItem;
  }

  async getAgenda(meetingId: string): Promise<AgendaItemDocument[]> {
    return AgendaItem.findByMeeting(meetingId);
  }

  async updateAgendaItem(
    agendaItemId: string,
    updates: Partial<{
      title: string;
      description: string;
      duration: number;
      isCompleted: boolean;
      order: number;
      notes: string;
    }>
  ): Promise<AgendaItemDocument | null> {
    return AgendaItem.findOneAndUpdate(
      { agendaItemId },
      { $set: updates },
      { new: true }
    );
  }

  async deleteAgendaItem(agendaItemId: string): Promise<boolean> {
    const result = await AgendaItem.deleteOne({ agendaItemId });
    return result.deletedCount > 0;
  }

  async reorderAgenda(meetingId: string, orderedIds: string[]): Promise<boolean> {
    const updates = orderedIds.map((id, index) =>
      AgendaItem.findOneAndUpdate(
        { agendaItemId: id, meetingId },
        { $set: { order: index } },
        { new: true }
      )
    );
    await Promise.all(updates);
    return true;
  }

  // ==================== QUERIES ====================

  async getUpcomingMeetings(
    userId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<MeetingDocument[]> {
    return Meeting.findUpcoming(userId, options);
  }

  async getTodayMeetings(userId: string): Promise<MeetingDocument[]> {
    return Meeting.findToday(userId);
  }

  async getMeetingsInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MeetingDocument[]> {
    return Meeting.findInRange(userId, startDate, endDate);
  }

  async getMeetingHistory(
    userId: string,
    options?: { limit?: number; skip?: number; status?: MeetingStatus }
  ): Promise<MeetingDocument[]> {
    return Meeting.getHistory(userId, options);
  }

  async getMeetingStats(userId: string): Promise<MeetingStats> {
    const stats = await Meeting.getStats(userId);
    const actionItems = await ActionItem.find({ assigneeId: userId });

    const pendingActionItems = actionItems.filter(
      (a: ActionItemDocument) => a.status !== 'completed'
    ).length;
    const overdueActionItems = actionItems.filter(
      (a: ActionItemDocument) => a.status !== 'completed' && a.dueDate && a.dueDate < new Date()
    ).length;

    const feedbacks = await Feedback.find({
      $or: [{ reviewerId: userId }, { revieweeId: userId }],
    });

    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum: number, f: FeedbackDocument) => sum + f.rating, 0) / feedbacks.length
      : undefined;

    return {
      ...stats,
      totalActionItems: actionItems.length,
      completedActionItems: actionItems.filter((a: ActionItemDocument) => a.status === 'completed').length,
      pendingActionItems,
      overdueActionItems,
      averageRating: avgRating,
    };
  }
}

export const meetingService = new MeetingService();
