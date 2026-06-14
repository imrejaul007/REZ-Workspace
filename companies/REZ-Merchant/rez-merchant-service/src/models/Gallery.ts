import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * GalleryItem - Media items for store portfolio/gallery.
 * Supports images and videos.
 */
export interface IGalleryItem extends Document {
  storeId: Types.ObjectId;
  type: 'image' | 'video';
  url: string;
  caption?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // for videos
    thumbnail?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GalleryItemSchema = new Schema<IGalleryItem>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
    category: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    metadata: {
      width: Number,
      height: Number,
      duration: Number,
      thumbnail: String,
    },
  },
  { timestamps: true },
);

GalleryItemSchema.index({ storeId: 1, isActive: 1 });
GalleryItemSchema.index({ storeId: 1, category: 1 });
GalleryItemSchema.index({ storeId: 1, sortOrder: 1 });
GalleryItemSchema.index({ storeId: 1, type: 1 });

export const GalleryItem = mongoose.models.GalleryItem || mongoose.model<IGalleryItem>('GalleryItem', GalleryItemSchema);
