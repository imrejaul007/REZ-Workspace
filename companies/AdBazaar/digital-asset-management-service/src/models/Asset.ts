import mongoose, { Document, Schema } from 'mongoose';

export interface IAsset extends Document {
  _id: mongoose.Types.ObjectId;
  assetId: string;
  name: string;
  description?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: string;
  tags: string[];
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    colorSpace?: string;
    resolution?: string;
  };
  version: number;
  parentId?: string;
  createdBy: string;
  updatedBy: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  permissions: {
    public: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
  };
  storageInfo: {
    provider: string;
    bucket?: string;
    key?: string;
  };
  analytics: {
    views: number;
    downloads: number;
    shares: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    assetId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      required: true,
      index: true
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    folderId: { type: String, index: true },
    tags: [{ type: String, index: true }],
    metadata: {
      width: Number,
      height: Number,
      duration: Number,
      format: String,
      colorSpace: String,
      resolution: String
    },
    version: { type: Number, default: 1 },
    parentId: { type: String },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived', 'deleted'],
      default: 'draft',
      index: true
    },
    permissions: {
      public: { type: Boolean, default: false },
      allowedUsers: [String],
      allowedRoles: [String]
    },
    storageInfo: {
      provider: { type: String, default: 'local' },
      bucket: String,
      key: String
    },
    analytics: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Indexes
AssetSchema.index({ name: 'text', description: 'text', tags: 'text' });
AssetSchema.index({ createdAt: -1 });
AssetSchema.index({ 'analytics.views': -1 });

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);