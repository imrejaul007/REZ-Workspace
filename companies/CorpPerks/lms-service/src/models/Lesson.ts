import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ILesson {
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'document';
  content: string;
  duration: number;
  order: number;
  videoUrl?: string;
  quizQuestions?: IQuizQuestion[];
}

export interface ILessonDocument extends Omit<ILesson, '_id'>, Document {}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true, validate: [arrayMinLength(2), 'At least 2 options required'] },
    correctAnswer: { type: Number, required: true, min: 0 },
    explanation: { type: String },
  },
  { _id: false }
);

function arrayMinLength(min: number) {
  return (val: string[]) => val && val.length >= min;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['video', 'text', 'quiz', 'assignment', 'document'],
      required: true,
    },
    content: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    order: { type: Number, required: true, default: 0 },
    videoUrl: { type: String },
    quizQuestions: { type: [quizQuestionSchema], default: undefined },
  },
  { _id: false }
);

export const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema);
