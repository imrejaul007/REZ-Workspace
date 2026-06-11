/**
 * EDULEARN MODELS
 * MongoDB Schemas for Education Platform
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IStudent extends Document {
  studentId: string;
  name: string;
  email: string;
  grade?: string;
  status: 'active' | 'inactive' | 'graduated';
  enrolledCourses: string[];
  progress: Map<string, number>;
  strengths: string[];
  areasForImprovement: string[];
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  preferredStudyTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse extends Document {
  courseId: string;
  name: string;
  description?: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  modules: number;
  isActive: boolean;
  prerequisites: string[];
  tags: string[];
  createdAt: Date;
}

export interface IAssessment extends Document {
  assessmentId: string;
  title: string;
  courseId: string;
  questions: IQuestion[];
  type: 'quiz' | 'exam' | 'assignment' | 'test';
  difficulty: 'easy' | 'medium' | 'hard';
  totalMarks: number;
  timeLimit?: number;
  results: Map<string, {
    score: number;
    feedback: string;
    timeSpent: number;
    completedAt: Date;
  }>;
  createdAt: Date;
}

export interface IQuestion {
  question: string;
  type: 'mcq' | 'short' | 'long' | 'truefalse';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: string;
  topic: string;
  bloomsLevel: string;
  marks: number;
}

export interface ILearningPath extends Document {
  pathId: string;
  studentId: string;
  recommendedCourses: string[];
  dailyStudyTime: number;
  weeklyGoals: {
    course: string;
    target: string;
    completed: boolean;
  }[];
  focusAreas: string[];
  adaptiveRecommendations: {
    type: string;
    subject: string;
    interval: string;
    completed: boolean;
  }[];
  status: 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface IContent extends Document {
  contentId: string;
  type: 'lesson' | 'worksheet' | 'quiz' | 'notes' | 'video' | 'activity';
  topic: string;
  subject: string;
  gradeLevel: string;
  title: string;
  content: string;
  learningObjectives: string[];
  keyConcepts: string[];
  activities: string[];
  resources: { title: string; url: string }[];
  metadata: {
    generatedAt: Date;
    generatedBy: 'ai' | 'teacher' | 'system';
    format: string;
    estimatedMinutes: number;
  };
  createdAt: Date;
}

export interface IEnrollment extends Document {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped';
  progress: number;
  currentModule: number;
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
}

export interface IAttendance extends Document {
  attendanceId: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy?: string;
  createdAt: Date;
}

export interface IGrade extends Document {
  gradeId: string;
  studentId: string;
  courseId: string;
  assessmentId?: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  feedback?: string;
  gradedBy: 'teacher' | 'ai';
  gradedAt: Date;
  createdAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const studentSchema = new Schema<IStudent>({
  studentId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  grade: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  enrolledCourses: [{ type: String }],
  progress: { type: Map, of: Number, default: {} },
  strengths: [{ type: String }],
  areasForImprovement: [{ type: String }],
  learningStyle: { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading'] },
  preferredStudyTime: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const courseSchema = new Schema<ICourse>({
  courseId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  duration: { type: Number, default: 30 },
  modules: { type: Number, default: 8 },
  isActive: { type: Boolean, default: true },
  prerequisites: [{ type: String }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const questionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short', 'long', 'truefalse'], required: true },
  options: [{ type: String }],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String },
  difficulty: { type: String },
  topic: { type: String },
  bloomsLevel: { type: String },
  marks: { type: Number, default: 1 }
}, { _id: false });

const assessmentSchema = new Schema<IAssessment>({
  assessmentId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  courseId: { type: String, required: true, index: true },
  questions: [questionSchema],
  type: { type: String, enum: ['quiz', 'exam', 'assignment', 'test'], default: 'quiz' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  totalMarks: { type: Number, default: 0 },
  timeLimit: { type: Number },
  results: {
    type: Map,
    of: {
      score: Number,
      feedback: String,
      timeSpent: Number,
      completedAt: Date
    },
    default: {}
  },
  createdAt: { type: Date, default: Date.now }
});

const learningPathSchema = new Schema<ILearningPath>({
  pathId: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  recommendedCourses: [{ type: String }],
  dailyStudyTime: { type: Number, default: 60 },
  weeklyGoals: [{
    course: String,
    target: String,
    completed: { type: Boolean, default: false }
  }],
  focusAreas: [{ type: String }],
  adaptiveRecommendations: [{
    type: String,
    subject: String,
    interval: String,
    completed: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const contentSchema = new Schema<IContent>({
  contentId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['lesson', 'worksheet', 'quiz', 'notes', 'video', 'activity'], required: true },
  topic: { type: String, required: true, index: true },
  subject: { type: String, required: true, index: true },
  gradeLevel: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  learningObjectives: [{ type: String }],
  keyConcepts: [{ type: String }],
  activities: [{ type: String }],
  resources: [{
    title: String,
    url: String
  }],
  metadata: {
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: String, enum: ['ai', 'teacher', 'system'], default: 'ai' },
    format: String,
    estimatedMinutes: Number
  },
  createdAt: { type: Date, default: Date.now }
});

const enrollmentSchema = new Schema<IEnrollment>({
  enrollmentId: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true },
  status: { type: String, enum: ['enrolled', 'in-progress', 'completed', 'dropped'], default: 'enrolled' },
  progress: { type: Number, default: 0 },
  currentModule: { type: Number, default: 1 },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  lastAccessedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const attendanceSchema = new Schema<IAttendance>({
  attendanceId: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
  markedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const gradeSchema = new Schema<IGrade>({
  gradeId: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true },
  assessmentId: { type: String, index: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  grade: { type: String, required: true },
  feedback: { type: String },
  gradedBy: { type: String, enum: ['teacher', 'ai'], default: 'teacher' },
  gradedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// ============================================
// MODELS
// ============================================

export const Student: Model<IStudent> = mongoose.model<IStudent>('Student', studentSchema);
export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
export const Assessment: Model<IAssessment> = mongoose.model<IAssessment>('Assessment', assessmentSchema);
export const LearningPath: Model<ILearningPath> = mongoose.model<ILearningPath>('LearningPath', learningPathSchema);
export const Content: Model<IContent> = mongoose.model<IContent>('Content', contentSchema);
export const Enrollment: Model<IEnrollment> = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const Grade: Model<IGrade> = mongoose.model<IGrade>('Grade', gradeSchema);

export default {
  Student,
  Course,
  Assessment,
  LearningPath,
  Content,
  Enrollment,
  Attendance,
  Grade
};
