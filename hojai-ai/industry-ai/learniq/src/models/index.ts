/**
 * LEARNIQ - Education AI Operating System
 * Production-Ready MongoDB Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// STUDENT MODEL
// ============================================

export interface IStudent extends Document {
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  class: string;
  section: string;
  admissionDate: Date;
  attendance: Record<string, 'present' | 'absent' | 'leave'>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  admissionDate: { type: Date, default: Date.now },
  attendance: { type: Map, of: String, default: {} }
}, { timestamps: true });

StudentSchema.index({ rollNumber: 1 });
StudentSchema.index({ class: 1 });

// ============================================
// COURSE MODEL
// ============================================

export interface ICourseSchedule {
  day: string;
  time: string;
  room: string;
}

export interface ICourse extends Document {
  name: string;
  code: string;
  credits: number;
  instructor: string;
  schedule: ICourseSchedule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  credits: { type: Number, required: true },
  instructor: { type: String, required: true },
  schedule: [{ day: String, time: String, room: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CourseSchema.index({ code: 1 });
CourseSchema.index({ instructor: 1 });

// ============================================
// ATTENDANCE MODEL
// ============================================

export interface IAttendance extends Document {
  courseId: mongoose.Types.ObjectId;
  date: Date;
  present: string[];
  absent: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  present: [String],
  absent: [String]
}, { timestamps: true });

AttendanceSchema.index({ courseId: 1 });
AttendanceSchema.index({ date: 1 });

// ============================================
// GRADE MODEL
// ============================================

export interface IGrade extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  marks: number;
  maxMarks: number;
  grade?: string;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema = new Schema<IGrade>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  assignmentId: { type: Schema.Types.ObjectId },
  marks: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  grade: String,
  feedback: String
}, { timestamps: true });

GradeSchema.index({ studentId: 1 });
GradeSchema.index({ courseId: 1 });

// ============================================
// ASSIGNMENT MODEL
// ============================================

export interface IAssignment extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  maxMarks: number;
  submissions: Array<{ studentId: string; marks?: number; submittedAt?: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  submissions: [{ studentId: String, marks: Number, submittedAt: Date }]
}, { timestamps: true });

AssignmentSchema.index({ courseId: 1 });
AssignmentSchema.index({ dueDate: 1 });

// ============================================
// EXPORT MODELS
// ============================================

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
export const Course = mongoose.model<ICourse>('Course', CourseSchema);
export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export const Grade = mongoose.model<IGrade>('Grade', GradeSchema);
export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export const Models = { Student, Course, Attendance, Grade, Assignment };
export default Models;