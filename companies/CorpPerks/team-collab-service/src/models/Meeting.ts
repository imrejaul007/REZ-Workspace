import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMeeting, MeetingStatus, ActionItem } from '../types/index.js';

export interface MeetingDocument extends Omit<IMeeting, '_id'>, Document {}

const actionItemSchema = new Schema<ActionItem>(
  {
    id: { type: String, required: true },
    task: { type: String, required: true, maxlength: 500 },
    assigneeId: { type: String, required: true },
    assigneeName: { type: String, required: true },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const meetingSchema = new Schema<MeetingDocument>(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    projectId: {
      type: String,
      index: true,
    },
    channelId: {
      type: String,
      index: true,
    },
    hostId: {
      type: String,
      required: true,
      index: true,
    },
    hostName: {
      type: String,
      required: true,
    },
    hostAvatar: {
      type: String,
    },
    attendees: {
      type: [String],
      default: [],
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] as MeetingStatus[],
      default: 'scheduled',
      index: true,
    },
    meetingLink: {
      type: String,
    },
    notes: {
      type: String,
    },
    actionItems: {
      type: [actionItemSchema],
      default: [],
    },
    recordings: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
    },
    meetingType: {
      type: String,
      enum: ['video', 'audio', 'in_person', 'phone'],
      default: 'video',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
meetingSchema.index({ hostId: 1, startTime: -1 });
meetingSchema.index({ attendees: 1, startTime: -1 });
meetingSchema.index({ projectId: 1, status: 1 });
meetingSchema.index({ channelId: 1, status: 1 });
meetingSchema.index({ status: 1, startTime: 1 });

// Virtual for duration display
meetingSchema.virtual('durationDisplay').get(function (): string {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
});

// Method to check if meeting is upcoming
meetingSchema.methods.isUpcoming = function (): boolean {
  return this.status === 'scheduled' && this.startTime > new Date();
};

// Method to check if meeting is happening now
meetingSchema.methods.isHappeningNow = function (): boolean {
  const now = new Date();
  return this.status === 'in_progress' || (this.startTime <= now && this.endTime >= now && this.status === 'scheduled');
};

// Method to start meeting
meetingSchema.methods.start = function (): void {
  this.status = 'in_progress';
};

// Method to end meeting
meetingSchema.methods.end = function (): void {
  this.status = 'completed';
  this.endTime = new Date();
  // Recalculate actual duration
  const durationMs = this.endTime.getTime() - this.startTime.getTime();
  this.duration = Math.round(durationMs / 60000);
};

// Method to cancel meeting
meetingSchema.methods.cancel = function (): void {
  this.status = 'cancelled';
};

// Method to add action item
meetingSchema.methods.addActionItem = function (item: ActionItem): void {
  this.actionItems.push(item);
};

// Method to update action item
meetingSchema.methods.updateActionItem = function (itemId: string, updates: Partial<ActionItem>): void {
  const item = this.actionItems.find((i: ActionItem) => i.id === itemId);
  if (item) {
    Object.assign(item, updates);
  }
};

// Method to toggle action item completion
meetingSchema.methods.toggleActionItem = function (itemId: string): boolean {
  const item = this.actionItems.find((i: ActionItem) => i.id === itemId);
  if (item) {
    item.completed = !item.completed;
    return item.completed;
  }
  return false;
};

// Static method to get upcoming meetings for user
meetingSchema.statics.findUpcomingForUser = async function (
  userId: string,
  options: { limit?: number; after?: Date } = {}
): Promise<MeetingDocument[]> {
  const { limit = 10, after = new Date() } = options;
  return this.find({
    attendees: userId,
    status: { $in: ['scheduled', 'in_progress'] },
    startTime: { $gte: after },
  })
    .sort({ startTime: 1 })
    .limit(limit);
};

// Static method to get today's meetings for user
meetingSchema.statics.findTodayForUser = async function (userId: string): Promise<MeetingDocument[]> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  return this.find({
    attendees: userId,
    status: { $in: ['scheduled', 'in_progress', 'completed'] },
    startTime: { $gte: startOfDay, $lt: endOfDay },
  }).sort({ startTime: 1 });
};

// Static method to get meetings by date range
meetingSchema.statics.findByDateRange = async function (
  userId: string,
  startDate: Date,
  endDate: Date,
  options: { status?: MeetingStatus[] } = {}
): Promise<MeetingDocument[]> {
  const { status = ['scheduled', 'in_progress', 'completed'] } = options;
  return this.find({
    attendees: userId,
    status: { $in: status },
    startTime: { $gte: startDate, $lt: endDate },
  }).sort({ startTime: 1 });
};

// Static method to get action items assigned to user
meetingSchema.statics.getActionItemsForUser = async function (
  userId: string,
  options: { completed?: boolean; overdue?: boolean; limit?: number } = {}
): Promise<ActionItem[]> {
  const { completed = false, overdue = false, limit = 50 } = options;
  const query: Record<string, unknown> = {
    attendees: userId,
    status: { $in: ['scheduled', 'in_progress', 'completed'] },
    'actionItems.assigneeId': userId,
    'actionItems.completed': completed,
  };

  if (overdue) {
    query['actionItems.dueDate'] = { $lt: new Date() };
  }

  const meetings = await this.find(query)
    .sort({ startTime: -1 })
    .limit(100);

  let actionItems: ActionItem[] = [];
  meetings.forEach((meeting: MeetingDocument) => {
    meeting.actionItems
      .filter((item: ActionItem) => item.assigneeId === userId && item.completed === completed)
      .forEach((item: ActionItem) => {
        actionItems.push({ ...item.toObject(), meetingId: meeting.meetingId, meetingTitle: meeting.title });
      });
  });

  return actionItems.slice(0, limit);
};

// Static method to get meeting stats
meetingSchema.statics.getStats = async function (
  companyId: string,
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
  const match: Record<string, unknown> = {};
  if (startDate || endDate) {
    match.startTime = {};
    if (startDate) match.startTime.$gte = startDate;
    if (endDate) match.startTime.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMeetings: { $sum: 1 },
        upcomingMeetings: {
          $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] },
        },
        completedMeetings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        avgDuration: { $avg: '$duration' },
        totalActionItems: { $sum: { $size: '$actionItems' } },
        completedActionItems: {
          $sum: {
            $size: {
              $filter: {
                input: '$actionItems',
                as: 'item',
                cond: { $eq: ['$$item.completed', true] },
              },
            },
          },
        },
        videoMeetings: { $sum: { $cond: [{ $eq: ['$meetingType', 'video'] }, 1, 0] } },
        audioMeetings: { $sum: { $cond: [{ $eq: ['$meetingType', 'audio'] }, 1, 0] } },
        inPersonMeetings: { $sum: { $cond: [{ $eq: ['$meetingType', 'in_person'] }, 1, 0] } },
        phoneMeetings: { $sum: { $cond: [{ $eq: ['$meetingType', 'phone'] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalMeetings: 0,
      upcomingMeetings: 0,
      completedMeetings: 0,
      avgDuration: 0,
      totalActionItems: 0,
      completedActionItems: 0,
      meetingsByType: { video: 0, audio: 0, in_person: 0, phone: 0 },
    };
  }

  const s = stats[0];
  return {
    totalMeetings: s.totalMeetings,
    upcomingMeetings: s.upcomingMeetings,
    completedMeetings: s.completedMeetings,
    avgDuration: Math.round(s.avgDuration || 0),
    totalActionItems: s.totalActionItems,
    completedActionItems: s.completedActionItems,
    meetingsByType: {
      video: s.videoMeetings,
      audio: s.audioMeetings,
      in_person: s.inPersonMeetings,
      phone: s.phoneMeetings,
    },
  };
};

// Ensure virtuals are included in JSON
meetingSchema.set('toJSON', { virtuals: true });
meetingSchema.set('toObject', { virtuals: true });

export const Meeting: Model<MeetingDocument> = mongoose.model<MeetingDocument>('Meeting', meetingSchema);
