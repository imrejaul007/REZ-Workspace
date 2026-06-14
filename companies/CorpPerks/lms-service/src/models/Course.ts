import mongoose, { Schema, Document, Types } from 'mongoose';
import { IModule } from './Module.js';

export interface ICourse {
  tenantId: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  duration: number;
  modules: IModule[];
  instructor?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  prerequisites?: string[];
  tags?: string[];
  isPublic: boolean;
  maxParticipants?: number;
  createdBy: string;
  updatedBy?: string;
}

export interface ICourseDocument extends ICourse, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourseDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    category: { type: String, required: true, index: true },
    thumbnail: { type: String },
    duration: { type: Number, required: true, default: 0 },
    modules: { type: [Schema.Types.Mixed], default: [] },
    instructor: { type: String },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    prerequisites: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    isPublic: { type: Boolean, default: false },
    maxParticipants: { type: Number },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

// Compound indexes
courseSchema.index({ tenantId: 1, category: 1 });
courseSchema.index({ tenantId: 1, status: 1 });
courseSchema.index({ tenantId: 1, tags: 1 });
courseSchema.index({ tenantId: 1, createdBy: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for total modules
courseSchema.virtual('totalModules').get(function () {
  return this.modules?.length || 0;
});

// Virtual for total lessons
courseSchema.virtual('totalLessons').get(function () {
  return this.modules?.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0) || 0;
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

export const Course = mongoose.model<ICourseDocument>('Course', courseSchema);
