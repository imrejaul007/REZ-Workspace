import mongoose, { Schema, Document } from 'mongoose';
import { Enrollment as IEnrollment, EnrollmentStatus } from '../types';

export interface EnrollmentDocument extends Omit<IEnrollment, '_id'>, Document {}

const EnrollmentSchema = new Schema<EnrollmentDocument>(
  {
    studentId: {
      type: String,
      required: true,
      index: true
    },
    courseId: {
      type: String,
      required: true,
      index: true
    },
    batchId: {
      type: String,
      required: true,
      index: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'on_hold'],
      default: 'active',
      index: true
    },
    completedLessons: [{
      type: String
    }],
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, status: 1 });
EnrollmentSchema.index({ courseId: 1, status: 1 });

EnrollmentSchema.statics.findByStudent = function(studentId: string) {
  return this.find({ studentId }).sort({ enrolledAt: -1 });
};

EnrollmentSchema.statics.findByCourse = function(courseId: string) {
  return this.find({ courseId }).sort({ enrolledAt: -1 });
};

EnrollmentSchema.statics.findActive = function(studentId: string) {
  return this.find({ studentId, status: 'active' });
};

EnrollmentSchema.methods.calculateProgress = async function(totalLessons: number): Promise<number> {
  if (totalLessons === 0) return 0;
  return Math.round((this.completedLessons.length / totalLessons) * 100);
};

export const EnrollmentModel = mongoose.model<EnrollmentDocument>('Enrollment', EnrollmentSchema);
