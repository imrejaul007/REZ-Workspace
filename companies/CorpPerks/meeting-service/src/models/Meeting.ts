import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  IMeeting,
  MeetingType,
  MeetingStatus,
  IAgendaItem,
  IMeetingNote,
  IActionItem,
  IFeedback,
} from '../types';

export interface MeetingDocument extends Omit<IMeeting, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const AgendaItemSubSchema = new Schema(
  {
    agendaItemId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    topicType: {
      type: String,
      enum: ['discussion', 'update', 'decision', 'feedback', 'goal', 'blocker', 'other'],
    },
    proposedById: { type: String, required: true },
    proposedByName: { type: String, required: true },
    duration: { type: Number },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    notes: { type: String },
  },
  { _id: false }
);

const MeetingNoteSubSchema = new Schema(
  {
    noteId: { type: String, required: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    discussionSummary: { type: String },
    decisions: { type: [String], default: [] },
    keyTakeaways: { type: [String], default: [] },
    actionItems: { type: [String], default: [] },
    attachments: {
      type: [
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          type: { type: String, required: true },
          size: { type: Number, required: true },
        },
      ],
      default: [],
    },
    isPrivate: { type: Boolean, default: false },
    sharedWith: { type: [String], default: [] },
  },
  { _id: false }
);

const ActionItemSubSchema = new Schema(
  {
    itemId: { type: String, required: true },
    task: { type: String, required: true },
    description: { type: String },
    assigneeId: { type: String, required: true },
    assigneeName: { type: String, required: true },
    createdById: { type: String, required: true },
    createdByName: { type: String, required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    completedAt: { type: Date },
    completedNote: { type: String },
  },
  { _id: false }
);

const FeedbackSubSchema = new Schema(
  {
    feedbackId: { type: String, required: true },
    reviewerId: { type: String, required: true },
    reviewerName: { type: String, required: true },
    revieweeId: { type: String, required: true },
    revieweeName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedbackType: {
      type: String,
      enum: ['meeting_prep', 'engagement', 'action_items', 'communication', 'overall'],
    },
    comment: { type: String },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RecurrenceSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      required: true,
    },
    nextOccurrence: { type: Date },
    lastOccurrence: { type: Date },
    endDate: { type: Date },
  },
  { _id: false }
);

const MeetingSchema = new Schema<MeetingDocument>(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['1on1', 'skip_level', 'team_meeting'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    scheduledStart: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    actualStart: {
      type: Date,
    },
    actualEnd: {
      type: Date,
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 480,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
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
    attendeeId: {
      type: String,
      required: true,
      index: true,
    },
    attendeeName: {
      type: String,
      required: true,
    },
    attendeeAvatar: {
      type: String,
    },
    participantIds: {
      type: [String],
      default: [],
      index: true,
    },
    location: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    cancellationReason: {
      type: String,
    },
    agenda: {
      type: [AgendaItemSubSchema],
      default: [],
    },
    agendaSent: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: [MeetingNoteSubSchema],
      default: [],
    },
    aiSummary: {
      type: String,
    },
    actionItems: {
      type: [ActionItemSubSchema],
      default: [],
    },
    feedback: {
      type: [FeedbackSubSchema],
      default: [],
    },
    recurrence: {
      type: RecurrenceSchema,
    },
    calendarEventId: {
      type: String,
    },
    outlookEventId: {
      type: String,
    },
    googleEventId: {
      type: String,
    },
    meetingType: {
      type: String,
      enum: ['video', 'audio', 'in_person', 'phone'],
      default: 'video',
    },
    createdById: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'meetings',
  }
);

// Compound indexes for common queries
MeetingSchema.index({ hostId: 1, status: 1 });
MeetingSchema.index({ attendeeId: 1, status: 1 });
MeetingSchema.index({ hostId: 1, attendeeId: 1, status: 1 });
MeetingSchema.index({ scheduledStart: 1, status: 1 });
MeetingSchema.index({ companyId: 1, scheduledStart: 1 });

// Virtual for checking if meeting is upcoming
MeetingSchema.virtual('isUpcoming').get(function () {
  return this.status === 'scheduled' && this.scheduledStart > new Date();
});

// Virtual for checking if meeting is in progress
MeetingSchema.virtual('isInProgress').get(function () {
  return this.status === 'in_progress';
});

// Virtual for checking if meeting is past
MeetingSchema.virtual('isPast').get(function () {
  return this.scheduledEnd < new Date();
});

// Method to start meeting
MeetingSchema.methods.startMeeting = function (this: MeetingDocument) {
  this.status = 'in_progress';
  this.actualStart = new Date();
  return this.save();
};

// Method to end meeting
MeetingSchema.methods.endMeeting = function (
  this: MeetingDocument,
  aiSummary?: string
) {
  this.status = 'completed';
  this.actualEnd = new Date();
  if (aiSummary) {
    this.aiSummary = aiSummary;
  }
  return this.save();
};

// Method to cancel meeting
MeetingSchema.methods.cancel = function (
  this: MeetingDocument,
  reason?: string
) {
  this.status = 'cancelled';
  if (reason) {
    this.cancellationReason = reason;
  }
  return this.save();
};

// Static to find upcoming meetings for user
MeetingSchema.statics.findUpcoming = async function (
  userId: string,
  options?: { limit?: number; skip?: number }
): Promise<MeetingDocument[]> {
  return this.find({
    $or: [
      { hostId: userId },
      { attendeeId: userId },
      { participantIds: userId },
    ],
    status: 'scheduled',
    scheduledStart: { $gt: new Date() },
  })
    .sort({ scheduledStart: 1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 10);
};

// Static to find today's meetings
MeetingSchema.statics.findToday = async function (
  userId: string
): Promise<MeetingDocument[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    $or: [
      { hostId: userId },
      { attendeeId: userId },
      { participantIds: userId },
    ],
    status: { $in: ['scheduled', 'in_progress'] },
    scheduledStart: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ scheduledStart: 1 });
};

// Static to find meetings in date range
MeetingSchema.statics.findInRange = async function (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MeetingDocument[]> {
  return this.find({
    $or: [
      { hostId: userId },
      { attendeeId: userId },
      { participantIds: userId },
    ],
    scheduledStart: { $gte: startDate, $lte: endDate },
  }).sort({ scheduledStart: 1 });
};

// Static to get meeting history
MeetingSchema.statics.getHistory = async function (
  userId: string,
  options?: { limit?: number; skip?: number; status?: MeetingStatus }
): Promise<MeetingDocument[]> {
  const query: Record<string, unknown> = {
    $or: [
      { hostId: userId },
      { attendeeId: userId },
      { participantIds: userId },
    ],
  };

  if (options?.status) {
    query.status = options.status;
  } else {
    query.status = { $in: ['completed', 'cancelled'] };
  }

  return this.find(query)
    .sort({ scheduledStart: -1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 20);
};

// Static to calculate user meeting stats
MeetingSchema.statics.getStats = async function (
  userId: string
): Promise<{
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  totalDuration: number;
  avgDuration: number;
}> {
  const pipeline = [
    {
      $match: {
        $or: [
          { hostId: userId },
          { attendeeId: userId },
          { participantIds: userId },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        upcoming: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'scheduled'] },
                  { $gt: ['$scheduledStart', new Date()] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  if (result.length === 0) {
    return { total: 0, completed: 0, cancelled: 0, upcoming: 0, totalDuration: 0, avgDuration: 0 };
  }

  return {
    total: result[0].total || 0,
    completed: result[0].completed || 0,
    cancelled: result[0].cancelled || 0,
    upcoming: result[0].upcoming || 0,
    totalDuration: result[0].totalDuration || 0,
    avgDuration: Math.round(result[0].avgDuration || 0),
  };
}

export const Meeting: Model<MeetingDocument> = mongoose.model<MeetingDocument>(
  'Meeting',
  MeetingSchema
);
