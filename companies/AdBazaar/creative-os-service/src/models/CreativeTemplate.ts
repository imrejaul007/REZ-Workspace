import mongoose, { Document, Schema } from 'mongoose';

export interface ICreativeTemplate extends Document {
  name: string;
  description?: string;
  type: 'banner' | 'video' | 'native' | 'text' | 'carousel' | 'interactive';
  category: string;
  elements: {
    headline?: {
      maxLength: number;
      placeholder?: string;
      required: boolean;
      aiSuggestions?: boolean;
    };
    body?: {
      maxLength: number;
      placeholder?: string;
      required: boolean;
      aiSuggestions?: boolean;
    };
    cta?: {
      maxLength: number;
      placeholder?: string;
      required: boolean;
      options?: string[];
    };
    image?: {
      aspectRatio: string;
      minSize?: { width: number; height: number };
      maxSize?: { width: number; height: number };
      required: boolean;
      formats?: string[];
    };
    video?: {
      aspectRatio: string;
      maxDuration?: number;
      required: boolean;
      formats?: string[];
    };
    logo?: {
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      size: { width: number; height: number };
      required: boolean;
    };
    background?: {
      type: 'color' | 'gradient' | 'image';
      defaultColor?: string;
    };
  };
  settings: {
    dimensions?: {
      width: number;
      height: number;
    };
    fileSize?: {
      maxKB: number;
    };
    duration?: {
      minSeconds: number;
      maxSeconds: number;
    };
    adFormats?: string[];
    industry?: string[];
  };
  preview?: {
    thumbnailUrl?: string;
    livePreviewUrl?: string;
  };
  isPublic: boolean;
  isActive: boolean;
  usageCount: number;
  successRate?: number;
  tags?: string[];
  createdBy: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreativeTemplateSchema = new Schema<ICreativeTemplate>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    type: {
      type: String,
      required: true,
      enum: ['banner', 'video', 'native', 'text', 'carousel', 'interactive'],
      index: true
    },
    category: { type: String, required: true, index: true },
    elements: {
      headline: {
        maxLength: { type: Number, default: 100 },
        placeholder: { type: String },
        required: { type: Boolean, default: false },
        aiSuggestions: { type: Boolean, default: true }
      },
      body: {
        maxLength: { type: Number, default: 500 },
        placeholder: { type: String },
        required: { type: Boolean, default: false },
        aiSuggestions: { type: Boolean, default: true }
      },
      cta: {
        maxLength: { type: Number, default: 30 },
        placeholder: { type: String },
        required: { type: Boolean, default: true },
        options: [{ type: String }]
      },
      image: {
        aspectRatio: { type: String, required: true },
        minSize: {
          width: { type: Number },
          height: { type: Number }
        },
        maxSize: {
          width: { type: Number },
          height: { type: Number }
        },
        required: { type: Boolean, default: false },
        formats: [{ type: String }]
      },
      video: {
        aspectRatio: { type: String },
        maxDuration: { type: Number },
        required: { type: Boolean, default: false },
        formats: [{ type: String }]
      },
      logo: {
        position: {
          type: String,
          enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        },
        size: {
          width: { type: Number },
          height: { type: Number }
        },
        required: { type: Boolean, default: false }
      },
      background: {
        type: {
          type: String,
          enum: ['color', 'gradient', 'image']
        },
        defaultColor: { type: String }
      }
    },
    settings: {
      dimensions: {
        width: { type: Number },
        height: { type: Number }
      },
      fileSize: {
        maxKB: { type: Number }
      },
      duration: {
        minSeconds: { type: Number },
        maxSeconds: { type: Number }
      },
      adFormats: [{ type: String }],
      industry: [{ type: String }]
    },
    preview: {
      thumbnailUrl: { type: String },
      livePreviewUrl: { type: String }
    },
    isPublic: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    successRate: { type: Number },
    tags: [{ type: String, index: true }],
    createdBy: { type: String, required: true },
    lastUsedAt: { type: Date }
  },
  {
    timestamps: true,
    collection: 'creative_templates'
  }
);

// Indexes
CreativeTemplateSchema.index({ type: 1, category: 1, isActive: 1 });
CreativeTemplateSchema.index({ isPublic: 1, isActive: 1 });
CreativeTemplateSchema.index({ tags: 1 });
CreativeTemplateSchema.index({ usageCount: -1 });
CreativeTemplateSchema.index({ createdAt: -1 });

export const CreativeTemplate = mongoose.model<ICreativeTemplate>('CreativeTemplate', CreativeTemplateSchema);