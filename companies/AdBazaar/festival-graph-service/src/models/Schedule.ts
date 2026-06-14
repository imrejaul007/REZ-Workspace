import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleEvent {
  id: string;
  name: string;
  description?: string;
  artistId?: mongoose.Types.ObjectId;
  artistName?: string;
  stage: string;
  startTime: Date;
  endTime?: Date;
  type: 'performance' | 'workshop' | 'panel' | 'competition' | 'meet_greet' | 'other';
  featured: boolean;
}

export interface ISchedule extends Document {
  _id: mongoose.Types.ObjectId;
  festivalId: mongoose.Types.ObjectId;
  day: number; // Day number (1, 2, 3, etc.)
  date: Date;
  events: IScheduleEvent[];
  totalEvents: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleEventSchema = new Schema<IScheduleEvent>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
    },
    artistName: {
      type: String,
      maxlength: 255,
    },
    stage: {
      type: String,
      required: true,
      maxlength: 100,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    type: {
      type: String,
      enum: ['performance', 'workshop', 'panel', 'competition', 'meet_greet', 'other'],
      default: 'performance',
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ScheduleSchema = new Schema<ISchedule>(
  {
    festivalId: {
      type: Schema.Types.ObjectId,
      ref: 'Festival',
      required: true,
      index: true,
    },
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    events: {
      type: [ScheduleEventSchema],
      default: [],
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for festival + day
ScheduleSchema.index({ festivalId: 1, day: 1 }, { unique: true });
ScheduleSchema.index({ festivalId: 1, date: 1 });

// Pre-save hook to calculate totalEvents
ScheduleSchema.pre('save', function (next) {
  this.totalEvents = this.events.length;
  next();
});

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);