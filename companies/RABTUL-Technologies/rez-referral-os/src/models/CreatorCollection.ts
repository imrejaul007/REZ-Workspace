import mongoose, { Schema, Types } from 'mongoose';
import { ICreatorCollection, ICollectionItem } from '../types/referral';

export interface CreatorCollectionDocument extends Omit<ICreatorCollection, '_id'>, mongoose.Document {
  addItem(item: ICollectionItem): Promise<void>;
  trackScan(): Promise<void>;
  trackConversion(): Promise<void>;
}

interface CreatorCollectionModel extends mongoose.Model<CreatorCollectionDocument> {
  generateSlug(creatorId: Types.ObjectId, name: string): Promise<string>;
}

const collectionItemSchema = new Schema<ICollectionItem>(
  {
    type: {
      type: String,
      required: true,
      enum: ['product', 'merchant', 'service', 'event', 'guide'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
    },
    url: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: true }
);

const creatorCollectionSchema = new Schema<CreatorCollectionDocument>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    items: [collectionItemSchema],
    referralCodeId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    totalScans: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalConversions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index
creatorCollectionSchema.index({ creatorId: 1, slug: 1 }, { unique: true });
creatorCollectionSchema.index({ slug: 1 }, { unique: true });

// Static method to generate unique slug
creatorCollectionSchema.statics.generateSlug = async function (
  creatorId: Types.ObjectId,
  name: string
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  let slug = baseSlug;
  let suffix = 0;

  while (await this.findOne({ creatorId, slug })) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
    if (suffix > 100) {
      throw new Error('Failed to generate unique collection slug');
    }
  }

  return slug;
};

// Method to add item
creatorCollectionSchema.methods.addItem = async function (item: ICollectionItem): Promise<void> {
  this.items.push(item as Types.DocumentArray<ICollectionItem>[0]);
  await this.save();
};

// Method to track scan
creatorCollectionSchema.methods.trackScan = async function (): Promise<void> {
  this.totalScans += 1;
  await this.save();
};

// Method to track conversion
creatorCollectionSchema.methods.trackConversion = async function (): Promise<void> {
  this.totalConversions += 1;
  await this.save();
};

export const CreatorCollection = mongoose.model<CreatorCollectionDocument, CreatorCollectionModel>(
  'CreatorCollection',
  creatorCollectionSchema
);
