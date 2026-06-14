import mongoose, { Document, Schema } from 'mongoose';

export interface IMetadata extends Document {
  _id: mongoose.Types.ObjectId;
  metadataId: string;
  contentId: string;
  contentType: string;
  tags: string[];
  categories: string[];
  attributes: Record<string, any>;
  language?: string;
  region?: string;
  audience?: string[];
  customFields: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  visibility: 'public' | 'private' | 'restricted';
  createdBy: string;
  updatedBy: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const MetadataSchema = new Schema<IMetadata>(
  {
    metadataId: { type: String, required: true, unique: true, index: true },
    contentId: { type: String, required: true, index: true },
    contentType: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    categories: [{ type: String, index: true }],
    attributes: { type: Schema.Types.Mixed, default: {} },
    language: { type: String, default: 'en' },
    region: { type: String },
    audience: [String],
    customFields: { type: Schema.Types.Mixed, default: {} },
    seo: {
      title: String,
      description: String,
      keywords: [String]
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'restricted'],
      default: 'public'
    },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

MetadataSchema.index({ contentId: 1, contentType: 1 });
MetadataSchema.index({ tags: 1 });
MetadataSchema.index({ categories: 1 });
MetadataSchema.index({ language: 1, region: 1 });
MetadataSchema.index({ createdAt: -1 });

export const Metadata = mongoose.model<IMetadata>('Metadata', MetadataSchema);