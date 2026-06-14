import mongoose, { Schema, Document, Model } from 'mongoose';
import { IOneOnOne, OneOnOneStatus, MeetingFrequency, MeetingType } from '../types';

export interface OneOnOneDocument extends Omit<IOneOnOne, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const StatsSchema = new Schema(
  {
    totalMeetings: { type: Number, default: 0 },
    completedMeetings: { type: Number, default: 0 },
    totalActionItems: { type: Number, default: 0 },
    completedActionItems: { type: Number, default: 0 },
    averageRating: { type: Number },
    lastFeedbackDate: { type: Date },
  },
  { _id: false }
);

const MeetingTemplateSchema = new Schema(
  {
    defaultAgenda: { type: [String], default: [] },
    defaultDuration: { type: Number, default: 30 },
    includeLastMeetingReview: { type: Boolean, default: true },
  },
  { _id: false }
);

const OneOnOneSchema = new Schema<OneOnOneDocument>(
  {
    oneOnOneId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    managerId: {
      type: String,
      required: true,
      index: true,
    },
    managerName: {
      type: String,
      required: true,
    },
    managerAvatar: {
      type: String,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeAvatar: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ['1on1', 'skip_level', 'team_meeting'],
      default: '1on1',
    },
    frequency: {
      type: String,
      required: true,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'weekly',
    },
    nextScheduled: {
      type: Date,
      index: true,
    },
    lastMeeting: {
      type: Date,
    },
    duration: {
      type: Number,
      required: true,
      default: 30,
      min: 15,
      max: 120,
    },
    preferredTime: {
      type: String,
      default: '14:00',
    },
    preferredDays: {
      type: [Number],
      default: [1, 3, 5], // Mon, Wed, Fri
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'ended'],
      default: 'active',
      index: true,
    },
    pausedReason: {
      type: String,
      maxlength: 500,
    },
    meetingTemplate: {
      type: MeetingTemplateSchema,
    },
    stats: {
      type: StatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: 'one_on_ones',
  }
);

// Compound indexes
OneOnOneSchema.index({ managerId: 1, status: 1 });
OneOnOneSchema.index({ employeeId: 1, status: 1 });
OneOnOneSchema.index({ managerId: 1, employeeId: 1 }, { unique: true });
OneOnOneSchema.index({ companyId: 1, status: 1 });
OneOnOneSchema.index({ nextScheduled: 1, status: 1 });

// Virtual for completion rate
OneOnOneSchema.virtual('completionRate').get(function () {
  if (this.stats.totalMeetings === 0) return 0;
  return Math.round(
    (this.stats.completedMeetings / this.stats.totalMeetings) * 100
  );
});

// Virtual for action item completion rate
OneOnOneSchema.virtual('actionItemCompletionRate').get(function () {
  if (this.stats.totalActionItems === 0) return 0;
  return Math.round(
    (this.stats.completedActionItems / this.stats.totalActionItems) * 100
  );
});

// Method to pause
OneOnOneSchema.methods.pause = function (
  this: OneOnOneDocument,
  reason?: string
) {
  this.status = 'paused';
  if (reason) {
    this.pausedReason = reason;
  }
  return this.save();
};

// Method to resume
OneOnOneSchema.methods.resume = function (this: OneOnOneDocument) {
  this.status = 'active';
  this.pausedReason = undefined;
  return this.save();
};

// Method to end
OneOnOneSchema.methods.end = function (this: OneOnOneDocument) {
  this.status = 'ended';
  return this.save();
};

// Method to record meeting completion
OneOnOneSchema.methods.recordMeeting = function (
  this: OneOnOneDocument,
  meetingDate: Date
) {
  this.lastMeeting = meetingDate;
  this.stats.totalMeetings += 1;
  this.stats.completedMeetings += 1;

  // Calculate next scheduled date based on frequency
  const nextDate = new Date(meetingDate);
  switch (this.frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  this.nextScheduled = nextDate;
  return this.save();
};

// Method to record action item
OneOnOneSchema.methods.recordActionItem = function (
  this: OneOnOneDocument,
  completed: boolean = false
) {
  this.stats.totalActionItems += 1;
  if (completed) {
    this.stats.completedActionItems += 1;
  }
  return this.save();
};

// Method to update feedback stats
OneOnOneSchema.methods.recordFeedback = function (
  this: OneOnOneDocument,
  rating: number
) {
  const currentTotal = (this.stats.averageRating || 0) * (this.stats.completedMeetings || 0);
  this.stats.completedMeetings = (this.stats.completedMeetings || 0) + 1;
  this.stats.averageRating = (currentTotal + rating) / this.stats.completedMeetings;
  this.stats.lastFeedbackDate = new Date();
  return this.save();
};

// Static to find active pair
OneOnOneSchema.statics.findActivePair = async function (
  managerId: string,
  employeeId: string
): Promise<OneOnOneDocument | null> {
  return this.findOne({
    managerId,
    employeeId,
    status: 'active',
  });
};

// Static to find manager's direct reports with 1:1s
OneOnOneSchema.statics.findByManager = async function (
  managerId: string,
  options?: { status?: OneOnOneStatus; limit?: number; skip?: number }
): Promise<OneOnOneDocument[]> {
  const query: Record<string, unknown> = { managerId };
  if (options?.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort({ status: 1, nextScheduled: 1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 50);
};

// Static to find employee's 1:1 with manager
OneOnOneSchema.statics.findByEmployee = async function (
  employeeId: string,
  options?: { status?: OneOnOneStatus }
): Promise<OneOnOneDocument[]> {
  const query: Record<string, unknown> = { employeeId };
  if (options?.status) {
    query.status = options.status;
  }

  return this.find(query).sort({ status: 1, nextScheduled: 1 });
};

// Static to find upcoming 1:1s
OneOnOneSchema.statics.findUpcoming = async function (
  userId: string,
  options?: { limit?: number; daysAhead?: number }
): Promise<OneOnOneDocument[]> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (options?.daysAhead || 7));

  return this.find({
    $or: [{ managerId: userId }, { employeeId: userId }],
    status: 'active',
    nextScheduled: { $gte: new Date(), $lte: endDate },
  }).sort({ nextScheduled: 1 }).limit(options?.limit || 10);
};

// Static to get company stats
OneOnOneSchema.statics.getCompanyStats = async function (
  companyId: string
): Promise<{
  totalPairs: number;
  activePairs: number;
  pausedPairs: number;
  endedPairs: number;
  upcomingMeetings: number;
  meetingsThisWeek: number;
  meetingsThisMonth: number;
  averageRating: number;
  totalActionItems: number;
  completedActionItems: number;
}> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const pipeline = [
    { $match: { companyId } },
    {
      $group: {
        _id: null,
        totalPairs: { $sum: 1 },
        activePairs: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        pausedPairs: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
        endedPairs: { $sum: { $cond: [{ $eq: ['$status', 'ended'] }, 1, 0] } },
        upcomingMeetings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gte: ['$nextScheduled', new Date()] },
                ],
              },
              1,
              0,
            ],
          },
        },
        meetingsThisWeek: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gte: ['$nextScheduled', startOfWeek] },
                  { $lt: ['$nextScheduled', endOfWeek] },
                ],
              },
              1,
              0,
            ],
          },
        },
        meetingsThisMonth: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', 'active'] },
                  { $gte: ['$nextScheduled', startOfMonth] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalActionItems: { $sum: '$stats.totalActionItems' },
        completedActionItems: { $sum: '$stats.completedActionItems' },
        avgRating: { $avg: '$stats.averageRating' },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  if (result.length === 0) {
    return {
      totalPairs: 0,
      activePairs: 0,
      pausedPairs: 0,
      endedPairs: 0,
      upcomingMeetings: 0,
      meetingsThisWeek: 0,
      meetingsThisMonth: 0,
      averageRating: 0,
      totalActionItems: 0,
      completedActionItems: 0,
    };
  }

  return {
    totalPairs: result[0].totalPairs || 0,
    activePairs: result[0].activePairs || 0,
    pausedPairs: result[0].pausedPairs || 0,
    endedPairs: result[0].endedPairs || 0,
    upcomingMeetings: result[0].upcomingMeetings || 0,
    meetingsThisWeek: result[0].meetingsThisWeek || 0,
    meetingsThisMonth: result[0].meetingsThisMonth || 0,
    averageRating: Math.round((result[0].avgRating || 0) * 10) / 10,
    totalActionItems: result[0].totalActionItems || 0,
    completedActionItems: result[0].completedActionItems || 0,
  };
}

export const OneOnOne: Model<OneOnOneDocument> = mongoose.model<OneOnOneDocument>(
  'OneOnOne',
  OneOnOneSchema
);
