import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  _id: mongoose.Types.ObjectId;
  folderId: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  depth: number;
  createdBy: string;
  assetCount: number;
  subfolderCount: number;
  permissions: {
    public: boolean;
    allowedUsers?: string[];
    allowedRoles?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    folderId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    parentId: { type: String, index: true },
    path: { type: String, required: true },
    depth: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    assetCount: { type: Number, default: 0 },
    subfolderCount: { type: Number, default: 0 },
    permissions: {
      public: { type: Boolean, default: false },
      allowedUsers: [String],
      allowedRoles: [String]
    }
  },
  { timestamps: true }
);

FolderSchema.index({ parentId: 1 });
FolderSchema.index({ path: 1 });
FolderSchema.index({ name: 'text' });

export const Folder = mongoose.model<IFolder>('Folder', FolderSchema);