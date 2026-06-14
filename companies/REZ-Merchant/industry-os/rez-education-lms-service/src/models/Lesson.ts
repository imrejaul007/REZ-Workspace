import mongoose, { Schema, Document } from 'mongoose';
import { Lesson as ILesson, LessonType } from '../types';

export interface LessonDocument extends Omit<ILesson, '_id'>, Document {}

const QuizQuestionSchema = new Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: Number, required: true },
  points: { type: Number, default: 1 }
}, { _id: false });

const ContentSchema = new Schema({
  url: { type: String },
  text: { type: String },
  duration: { type: Number },
  quizQuestions: [QuizQuestionSchema]
}, { _id: false });

const LessonSchema = new Schema<LessonDocument>(
  {
    courseId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    type: {
      type: String,
      required: true,
      enum: ['video', 'document', 'quiz', 'assignment', 'live'],
      index: true
    },
    content: {
      type: ContentSchema,
      default: {}
    },
    order: {
      type: Number,
      required: true,
      min: 0
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    resources: [{
      type: String
    }]
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

LessonSchema.index({ courseId: 1, order: 1 });
LessonSchema.index({ type: 1 });

LessonSchema.statics.findByCourse = function(courseId: string) {
  return this.find({ courseId }).sort({ order: 1 });
};

LessonSchema.statics.findByType = function(courseId: string, type: LessonType) {
  return this.find({ courseId, type }).sort({ order: 1 });
};

export const LessonModel = mongoose.model<LessonDocument>('Lesson', LessonSchema);
