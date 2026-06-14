import mongoose, { Document, Schema } from 'mongoose';

export interface IShelf {
  storeId: mongoose.Types.ObjectId;
  name: string;
  position: {
    aisle: string;
    section: string;
    height: 'eye' | 'reach' | 'floor';
    side: 'left' | 'right' | 'center';
  };
  category: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
  ads: mongoose.Types.ObjectId[];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  visibility: 'high' | 'medium' | 'low';
  pricing: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  impressionsPerHour: number;
  conversionRate: number;
  avgDailyReach: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShelfDocument extends IShelf, Document {
  _id: mongoose.Types.ObjectId;
}

const ShelfSchema = new Schema<IShelfDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      aisle: { type: String, required: true },
      section: { type: String, required: true },
      height: {
        type: String,
        enum: ['eye', 'reach', 'floor'],
        default: 'eye'
      },
      side: {
        type: String,
        enum: ['left', 'right', 'center'],
        default: 'center'
      }
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    capacity: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
      index: true
    },
    ads: [{
      type: Schema.Types.ObjectId,
      ref: 'ShelfAd'
    }],
    dimensions: {
      width: { type: Number, default: 30 },
      height: { type: Number, default: 20 },
      depth: { type: Number, default: 10 }
    },
    visibility: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
      index: true
    },
    pricing: {
      daily: { type: Number, required: true },
      weekly: { type: Number, required: true },
      monthly: { type: Number, required: true }
    },
    impressionsPerHour: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    avgDailyReach: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes
ShelfSchema.index({ storeId: 1, category: 1 });
ShelfSchema.index({ storeId: 1, status: 1 });
ShelfSchema.index({ category: 1, status: 1, visibility: 1 });

// Virtual for occupancy rate
ShelfSchema.virtual('occupancyRate').get(function() {
  if (this.capacity === 0) return 0;
  return (this.ads?.length || 0) / this.capacity;
});

export const Shelf = mongoose.model<IShelfDocument>('Shelf', ShelfSchema);
export default Shelf;