import mongoose, { Schema, Document } from 'mongoose';
import { IVideo } from '../types';

export interface IVideoDocument extends Omit<IVideo, '_id'>, Document {}

const VideoSchema = new Schema<IVideoDocument>(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    url: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Video duration is required'],
      min: [0, 'Duration cannot be negative'],
    },
    format: {
      type: String,
      default: 'mp4',
      enum: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    },
    resolution: {
      type: String,
      default: '1080p',
 },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'private',
    },
    category: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    sponsors: {
      type: [String],
      default: [],
      ref: 'Sponsor',
    },
    advertiserId: {
      type: String,
      index: true,
    },
    createdBy: {
      type: String,
      required: [true, 'Creator ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
VideoSchema.index({ title: 'text', description: 'text', tags: 'text' });
VideoSchema.index({ status: 1, createdAt: -1 });
VideoSchema.index({ advertiserId: 1, status: 1 });
VideoSchema.index({ category: 1, status: 1 });

// Virtual for sponsor count
VideoSchema.virtual('sponsorCount').get(function () {
  return this.sponsors?.length || 0;
});

// Pre-save validation
VideoSchema.pre('save', function (next) {
  if (this.status === 'active' && !this.url) {
    next(new Error('Cannot activate video without URL'));
  }
  next();
});

export const Video = mongoose.model<IVideoDocument>('Video', VideoSchema);
export default Video;