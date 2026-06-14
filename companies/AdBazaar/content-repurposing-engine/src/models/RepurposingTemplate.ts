import mongoose, { Document, Schema } from 'mongoose';

// Zod schemas for validation
export const templateRulesSchema = z.object({
  maxLength: z.number().min(1).max(5000),
  includeHashtags: z.boolean(),
  adaptEmoji: z.boolean(),
  addCTA: z.boolean(),
  aspectRatio: z.string(),
});

export const repurposingTemplateStatusSchema = z.enum(['active', 'inactive']);

export interface IRepurposingTemplate {
  id: string;
  name: string;
  sourcePlatform: string;
  targetPlatform: string;
  rules: {
    maxLength: number;
    includeHashtags: boolean;
    adaptEmoji: boolean;
    addCTA: boolean;
    aspectRatio: string;
  };
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRepurposingTemplateDocument extends IRepurposingTemplate, Document {
  _id: mongoose.Types.ObjectId;
}

const RepurposingTemplateSchema = new Schema<IRepurposingTemplateDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    sourcePlatform: { type: String, required: true, index: true },
    targetPlatform: { type: String, required: true, index: true },
    rules: {
      maxLength: { type: Number, required: true, default: 2200 },
      includeHashtags: { type: Boolean, default: true },
      adaptEmoji: { type: Boolean, default: true },
      addCTA: { type: Boolean, default: false },
      aspectRatio: { type: String, default: '16:9' },
    },
    createdBy: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

RepurposingTemplateSchema.index({ sourcePlatform: 1, targetPlatform: 1 });
RepurposingTemplateSchema.index({ createdBy: 1 });

export const RepurposingTemplate = mongoose.model<IRepurposingTemplateDocument>(
  'RepurposingTemplate',
  RepurposingTemplateSchema
);