import mongoose, { Document, Schema } from 'mongoose';

export enum CourseCategory {
  LANGUAGE = 'LANGUAGE',
  TECHNOLOGY = 'TECHNOLOGY',
  EXAM_PREP = 'EXAM_PREP',
  SKILLS = 'SKILLS',
  CERTIFICATION = 'CERTIFICATION'
}

export enum CourseStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  INACTIVE = 'INACTIVE'
}

export enum DurationUnit {
  WEEKS = 'WEEKS',
  MONTHS = 'MONTHS'
}

export interface ISchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ISyllabus {
  topic: string;
  description: string;
  order: number;
}

export interface ICourse extends Document {
  courseId: string;
  merchantId: string;
  name: string;
  description: string;
  category: CourseCategory;
  duration: number;
  durationUnit: DurationUnit;
  batchSize: number;
  price: number;
  discountPrice?: number;
  instructorId?: string;
  schedule: ISchedule[];
  syllabus: ISyllabus[];
  maxStudents: number;
  enrollmentCount: number;
  status: CourseStatus;
  startDate?: Date;
  endDate?: Date;
  prerequisites: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>({
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const SyllabusSchema = new Schema<ISyllabus>({
  topic: { type: String, required: true },
  description: { type: String },
  order: { type: Number, required: true }
}, { _id: false });

const CourseSchema = new Schema<ICourse>({
  courseId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: CourseCategory, required: true, index: true },
  duration: { type: Number, required: true },
  durationUnit: { type: String, enum: DurationUnit, default: DurationUnit.MONTHS },
  batchSize: { type: Number, default: 20 },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  instructorId: { type: String, index: true },
  schedule: [ScheduleSchema],
  syllabus: [SyllabusSchema],
  maxStudents: { type: Number, default: 30 },
  enrollmentCount: { type: Number, default: 0 },
  status: { type: String, enum: CourseStatus, default: CourseStatus.DRAFT, index: true },
  startDate: { type: Date },
  endDate: { type: Date },
  prerequisites: [{ type: String }],
  tags: [{ type: String }]
}, {
  timestamps: true,
  collection: 'courses'
});

// Compound indexes for common queries
CourseSchema.index({ merchantId: 1, status: 1 });
CourseSchema.index({ category: 1, status: 1 });
CourseSchema.index({ merchantId: 1, category: 1 });
CourseSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for available seats
CourseSchema.virtual('availableSeats').get(function() {
  return this.maxStudents - this.enrollmentCount;
});

// Virtual for is full
CourseSchema.virtual('isFull').get(function() {
  return this.enrollmentCount >= this.maxStudents;
});

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
