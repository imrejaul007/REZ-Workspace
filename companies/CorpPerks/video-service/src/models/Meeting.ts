import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  Meeting as MeetingType,
  MeetingStatus,
  Participant,
  ParticipantStatus,
  RecurringPattern,
} from '../types';

export interface MeetingDocument extends Omit<MeetingType, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

interface IMeetingModel extends Model<MeetingDocument> {
  findUpcomingForUser(
    userId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<MeetingDocument[]>;
  findTodayForUser(userId: string): Promise<MeetingDocument[]>;
  findInRange(userId: string, startDate: Date, endDate: Date): Promise<MeetingDocument[]>;
  findByParticipant(
    userId: string,
    options?: {
      status?: MeetingStatus;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ meetings: MeetingDocument[]; total: number }>;
  getMeetingStats(userId: string): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    totalDuration: number;
  }>;
}

const DeviceInfoSchema = new Schema(
  {
    browser: { type: String },
    os: { type: String },
    device: { type: String },
  },
  { _id: false }
);

const ParticipantSchema = new Schema<Participant>(
  {
    participantId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['host', 'co_host', 'presenter', 'attendee'],
      default: 'attendee',
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ParticipantStatus),
      default: ParticipantStatus.INVITED,
    },
    joinedAt: { type: Date },
    leftAt: { type: Date },
    duration: { type: Number },
    deviceInfo: { type: DeviceInfoSchema },
    connectionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
    },
    ipAddress: { type: String },
  },
  { _id: false }
);

const RecurringPatternSchema = new Schema<RecurringPattern>(
  {
    frequency: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    },
    endDate: { type: Date },
    occurrences: { type: Number, min: 1 },
    parentMeetingId: { type: String },
  },
  { _id: false }
);

const MeetingSchema = new Schema<MeetingDocument, IMeetingModel>(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
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
    hostEmail: {
      type: String,
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
      min: 5,
      max: 480,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    link: {
      type: String,
      required: true,
    },
    externalMeetingId: {
      type: String,
    },
    videoProvider: {
      type: String,
      default: 'daily',
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 2,
      max: 1000,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: RecurringPatternSchema,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(MeetingStatus),
      default: MeetingStatus.SCHEDULED,
      index: true,
    },
    cancellationReason: {
      type: String,
    },
    agenda: {
      type: String,
      maxlength: 5000,
    },
    notes: {
      type: String,
      maxlength: 10000,
    },
    recordingEnabled: {
      type: Boolean,
      default: false,
    },
    recordingUrl: {
      type: String,
    },
    waitingRoomEnabled: {
      type: Boolean,
      default: false,
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    createdById: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'meetings',
  }
);

// Compound indexes
MeetingSchema.index({ companyId: 1, status: 1 });
MeetingSchema.index({ hostId: 1, status: 1 });
MeetingSchema.index({ startTime: 1, status: 1 });
MeetingSchema.index({ companyId: 1, startTime: 1 });
MeetingSchema.index({ 'participants.userId': 1, status: 1 });
MeetingSchema.index({ title: 'text', description: 'text' });

// Method to start meeting
MeetingSchema.methods.startMeeting = function (this: MeetingDocument) {
  this.status = MeetingStatus.IN_PROGRESS;
  return this.save();
};

// Method to end meeting
MeetingSchema.methods.endMeeting = function (this: MeetingDocument) {
  this.status = MeetingStatus.COMPLETED;
  this.endTime = new Date();
  return this.save();
};

// Method to cancel meeting
MeetingSchema.methods.cancel = function (this: MeetingDocument, reason?: string) {
  this.status = MeetingStatus.CANCELLED;
  if (reason) {
    this.cancellationReason = reason;
  }
  return this.save();
};

// Static method to find upcoming meetings for user
MeetingSchema.statics.findUpcomingForUser = async function (
  userId: string,
  options?: { limit?: number; skip?: number }
) {
  return this.find({
    'participants.userId': userId,
    status: MeetingStatus.SCHEDULED,
    startTime: { $gt: new Date() },
  })
    .sort({ startTime: 1 })
    .skip(options?.skip || 0)
    .limit(options?.limit || 20);
};

// Static method to find today's meetings
MeetingSchema.statics.findTodayForUser = async function (userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    'participants.userId': userId,
    status: { $in: [MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS] },
    startTime: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ startTime: 1 });
};

// Static method to find meetings in range
MeetingSchema.statics.findInRange = async function (
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    'participants.userId': userId,
    startTime: { $gte: startDate, $lte: endDate },
  }).sort({ startTime: 1 });
};

// Static method to find by participant
MeetingSchema.statics.findByParticipant = async function (
  userId: string,
  options?: {
    status?: MeetingStatus;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }
) {
  const query: Record<string, unknown> = {
    'participants.userId': userId,
  };

  if (options?.status) {
    query.status = options.status;
  }

  if (options?.fromDate || options?.toDate) {
    query.startTime = {};
    if (options.fromDate) (query.startTime as Record<string, Date>).$gte = options.fromDate;
    if (options.toDate) (query.startTime as Record<string, Date>).$lte = options.toDate;
  }

  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const [meetings, total] = await Promise.all([
    this.find(query).sort({ startTime: -1 }).skip(skip).limit(limit),
    this.countDocuments(query),
  ]);

  return { meetings, total };
};

// Static method to get meeting stats
MeetingSchema.statics.getMeetingStats = async function (userId: string) {
  const pipeline = [
    {
      $match: {
        'participants.userId': userId,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        upcoming: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$status', MeetingStatus.SCHEDULED] },
                  { $gt: ['$startTime', new Date()] },
                ],
              },
              1,
              0,
            ],
          },
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', MeetingStatus.COMPLETED] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', MeetingStatus.CANCELLED] }, 1, 0] },
        },
        totalDuration: { $sum: '$duration' },
      },
    },
  ];

  const result = await this.aggregate(pipeline);

  if (result.length === 0) {
    return { total: 0, upcoming: 0, completed: 0, cancelled: 0, totalDuration: 0 };
  }

  return {
    total: result[0].total || 0,
    upcoming: result[0].upcoming || 0,
    completed: result[0].completed || 0,
    cancelled: result[0].cancelled || 0,
    totalDuration: result[0].totalDuration || 0,
  };
};

export const Meeting = mongoose.model<MeetingDocument, IMeetingModel>(
  'Meeting',
  MeetingSchema
);
