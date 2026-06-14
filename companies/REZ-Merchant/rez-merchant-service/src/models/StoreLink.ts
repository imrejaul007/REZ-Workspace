import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * StoreLink - Manages configurable links for REZ Now store pages.
 * Examples: website, menu, reservation, order, contact, social links.
 */
export interface IStoreLink extends Document {
  storeId: Types.ObjectId;
  links: IStoreLinkItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreLinkItem {
  id: string;
  type: 'website' | 'menu' | 'reservation' | 'order' | 'contact' | 'social';
  title: string;
  url: string;
  icon?: string;
  order: number;
  clickCount: number;
}

const StoreLinkItemSchema = new Schema<IStoreLinkItem>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['website', 'menu', 'reservation', 'order', 'contact', 'social'],
    },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    icon: { type: String },
    order: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const StoreLinkSchema = new Schema<IStoreLink>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
    links: { type: [StoreLinkItemSchema], default: [] },
  },
  { timestamps: true },
);

StoreLinkSchema.index({ storeId: 1 });

export const StoreLink = mongoose.models.StoreLink || mongoose.model<IStoreLink>('StoreLink', StoreLinkSchema);
