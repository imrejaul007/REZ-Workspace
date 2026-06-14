import mongoose, { Document, Schema } from 'mongoose';

// Shared item document interface
export interface ISharedItem extends Document {
  id: string;
  circleId: string;
  sharedBy: string;
  sharedWith: string[];
  itemType: 'visit' | 'medication' | 'record' | 'report' | 'vitals';
  itemId: string;
  itemSummary: string;
  sharedAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
    canComment: boolean;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Shared item schema
const SharedItemSchema = new Schema<ISharedItem>(
  {
    id: { type: String, required: true, unique: true, index: true },
    circleId: { type: String, required: true, index: true },
    sharedBy: { type: String, required: true },
    sharedWith: [{ type: String, required: true }],
    itemType: {
      type: String,
      enum: ['visit', 'medication', 'record', 'report', 'vitals'],
      required: true
    },
    itemId: { type: String, required: true },
    itemSummary: { type: String, required: true },
    sharedAt: { type: Date, required: true },
    expiresAt: { type: Date },
    accessCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    permissions: {
      canView: { type: Boolean, default: true },
      canDownload: { type: Boolean, default: false },
      canShare: { type: Boolean, default: false },
      canComment: { type: Boolean, default: false }
    },
    notes: { type: String }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
SharedItemSchema.index({ circleId: 1, sharedAt: -1 });
SharedItemSchema.index({ sharedWith: 1 });
SharedItemSchema.index({ itemType: 1, itemId: 1 });

export const SharedItem = mongoose.model<ISharedItem>('SharedItem', SharedItemSchema);
