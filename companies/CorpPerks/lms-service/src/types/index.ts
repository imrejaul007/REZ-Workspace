import { Types } from 'mongoose';

// Lesson Types
export interface ILesson {
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'document';
  content: string;
  duration: number; // in minutes
  order: number;
  videoUrl?: string;
  quizQuestions?: IQuizQuestion[];
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// Module Types
export interface IModule {
  title: string;
  description?: string;
  lessons: ILesson[];
  order: number;
  estimatedDuration: number; // in minutes
}

// Course Types
export interface ICourse {
  tenantId: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  duration: number; // total duration in minutes
  modules: IModule[];
  instructor?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  prerequisites?: string[]; // course IDs
  tags?: string[];
  isPublic: boolean;
  maxParticipants?: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enrollment Types
export interface IEnrollment {
  tenantId: string;
  courseId: Types.ObjectId;
  employeeId: string;
  progress: number; // percentage 0-100
  completedModules: string[]; // module IDs
  completedLessons: string[]; // lesson IDs
  currentModuleIndex: number;
  currentLessonIndex: number;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  certificateId?: Types.ObjectId;
  score?: number; // for courses with final exam
}

// Certificate Types
export interface ICertificate {
  tenantId: string;
  enrollmentId: Types.ObjectId;
  courseId: Types.ObjectId;
  employeeId: string;
  certificateId: string;
  issuedAt: Date;
  expiresAt?: Date;
  certificateUrl?: string;
  metadata?: {
    courseTitle: string;
    employeeName: string;
    completionDate: Date;
    score?: number;
  };
}

// Pagination Types
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response Types
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}

// Filter Types
export interface ICourseFilters {
  category?: string;
  level?: string;
  status?: string;
  isPublic?: boolean;
  search?: string;
}

export interface IEnrollmentFilters {
  courseId?: string;
  employeeId?: string;
  status?: 'in_progress' | 'completed';
}
