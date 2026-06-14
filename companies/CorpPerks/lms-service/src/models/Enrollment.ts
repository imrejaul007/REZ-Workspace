import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEnrollment {
  tenantId: string;
  courseId: Types.ObjectId;
  employeeId: string;
  progress: number;
  completedModules: string[];
  completedLessons: string[];
  currentModuleIndex: number;
  currentLessonIndex: number;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  certificateId?: Types.ObjectId;
  score?: number;
}

export interface IEnrollmentDocument extends IEnrollment, Document {
  _id: Types.ObjectId;
}

const enrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    progress: { type: Number, required: true, default: 0, min: 0, max: 100 },
    completedModules: { type: [String], default: [] },
    completedLessons: { type: [String], default: [] },
    currentModuleIndex: { type: Number, default: 0 },
    currentLessonIndex: { type: Number, default: 0 },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, required: true, default: Date.now },
    certificateId: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    score: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate enrollments
enrollmentSchema.index({ tenantId: 1, courseId: 1, employeeId: 1 }, { unique: true });
enrollmentSchema.index({ tenantId: 1, employeeId: 1 });
enrollmentSchema.index({ tenantId: 1, courseId: 1 });

// Pre-save to update lastAccessedAt
enrollmentSchema.pre('save', function (next) {
  this.lastAccessedAt = new Date();
  next();
});

export const Enrollment = mongoose.model<IEnrollmentDocument>('Enrollment', enrollmentSchema);
