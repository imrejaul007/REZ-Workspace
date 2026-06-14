import mongoose, { Schema, Document, Model } from 'mongoose';
import { z } from 'zod';

// Validation schemas
export const PlatformSchema = z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok']);
export type Platform = z.infer<typeof PlatformSchema>;

export const PrioritySchema = z.enum(['low', 'medium', 'high']);
export type Priority = z.infer<typeof PrioritySchema>;

export interface IPlatformInfo {
  platform: Platform;
  handle: string;
  accountId?: string;
  linked: boolean;
  lastSync?: Date;
}

export interface ICompetitor extends Document {
  name: string;
  industry: string;
  platforms: IPlatformInfo[];
  tags: string[];
  priority: Priority;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const PlatformInfoSchema = new Schema<IPlatformInfo>(
  {
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
    },
    handle: { type: String, required: true },
    accountId: { type: String },
    linked: { type: Boolean, default: false },
    lastSync: { type: Date },
  },
  { _id: false }
);

const CompetitorSchema = new Schema<ICompetitor>(
  {
    name: { type: String, required: true, index: true },
    industry: { type: String, required: true, index: true },
    platforms: { type: [PlatformInfoSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    addedBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
CompetitorSchema.index({ name: 'text', industry: 'text', tags: 'text' });
CompetitorSchema.index({ 'platforms.platform': 1 });

// Instance methods
CompetitorSchema.methods.getPlatforms = function (this: ICompetitor): Platform[] {
  return this.platforms.map((p) => p.platform);
};

CompetitorSchema.methods.hasPlatform = function (this: ICompetitor, platform: Platform): boolean {
  return this.platforms.some((p) => p.platform === platform);
};

// Static methods
CompetitorSchema.statics.findByIndustry = function (industry: string): Promise<ICompetitor[]> {
  return this.find({ industry }).exec();
};

CompetitorSchema.statics.findByPriority = function (priority: Priority): Promise<ICompetitor[]> {
  return this.find({ priority }).exec();
};

CompetitorSchema.statics.findByTag = function (tag: string): Promise<ICompetitor[]> {
  return this.find({ tags: tag }).exec();
};

// Export model
export const Competitor: Model<ICompetitor> = mongoose.model<ICompetitor>('Competitor', CompetitorSchema);

// Validation function
export function validateCompetitorInput(data: unknown) {
  const schema = z.object({
    name: z.string().min(1).max(200),
    industry: z.string().min(1).max(100),
    platforms: z
      .array(
        z.object({
          platform: PlatformSchema,
          handle: z.string().min(1).max(100),
          accountId: z.string().optional(),
        })
      )
      .min(1),
    tags: z.array(z.string()).optional(),
    priority: PrioritySchema.optional(),
    addedBy: z.string().min(1),
  });

  return schema.safeParse(data);
}

export function validateUpdateInput(data: unknown) {
  const schema = z.object({
    name: z.string().min(1).max(200).optional(),
    industry: z.string().min(1).max(100).optional(),
    platforms: z
      .array(
        z.object({
          platform: PlatformSchema,
          handle: z.string().min(1).max(100),
          accountId: z.string().optional(),
        })
      )
      .optional(),
    tags: z.array(z.string()).optional(),
    priority: PrioritySchema.optional(),
  });

  return schema.safeParse(data);
}