import { z } from 'zod';

export const LessonTypeEnum = z.enum(['video', 'document', 'quiz', 'assignment', 'live']);
export type LessonType = z.infer<typeof LessonTypeEnum>;

export const EnrollmentStatusEnum = z.enum(['active', 'completed', 'dropped', 'on_hold']);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusEnum>;

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  type: LessonType;
  content: {
    url?: string;
    text?: string;
    duration?: number;
    quizQuestions?: QuizQuestion[];
  };
  order: number;
  duration: number;
  isPreview: boolean;
  resources: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface Enrollment {
  _id: string;
  studentId: string;
  courseId: string;
  batchId: string;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number;
  status: EnrollmentStatus;
  completedLessons: string[];
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  type: LessonTypeEnum,
  content: z.object({
    url: z.string().optional(),
    text: z.string().optional(),
    duration: z.number().optional(),
    quizQuestions: z.array(z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      points: z.number().default(1)
    })).optional()
  }),
  order: z.number().min(0),
  duration: z.number().min(1),
  isPreview: z.boolean().default(false),
  resources: z.array(z.string()).optional()
});

export const UpdateLessonSchema = CreateLessonSchema.partial();

export const CreateEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  batchId: z.string().min(1)
});

export const UpdateProgressSchema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
