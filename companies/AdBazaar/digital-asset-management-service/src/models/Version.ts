import mongoose, { Document, Schema } from 'mongoose';

export interface IVersion extends Document {
  _id: mongoose.Types.ObjectId;
  versionId: string;
  assetId: string;
  version: number;
  url: string;
  thumbnailUrl?: string;
  size: number;
  checksum: string;
  changes?: string;
  createdBy: string;
  createdAt: Date;
}

const VersionSchema = new Schema<IVersion>(
  {
    versionId: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    size: { type: Number, required: true },
    checksum: { type: String, required: true },
    changes: { type: String },
    createdBy: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

VersionSchema.index({ assetId: 1, version: -1 });
VersionSchema.index({ assetId: 1, createdAt: -1 });

export const Version = mongoose.model<IVersion>('Version', VersionSchema);