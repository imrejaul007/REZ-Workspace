import mongoose, { Document, Schema } from 'mongoose';

export interface IStore {
  name: string;
  retailerId: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  shelves: mongoose.Types.ObjectId[];
  status: 'active' | 'inactive' | 'pending';
  category: string[];
  size: 'small' | 'medium' | 'large';
  zone: string;
  tier: 'premium' | 'standard' | 'economy';
  impressionsPerDay: number;
  avgFootfall: number;
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  };
  contact: {
    email: string;
    phone: string;
    manager?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreDocument extends IStore, Document {
  _id: mongoose.Types.ObjectId;
}

const StoreSchema = new Schema<IStoreDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    retailerId: {
      type: String,
      required: true,
      index: true
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    shelves: [{
      type: Schema.Types.ObjectId,
      ref: 'Shelf'
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
      index: true
    },
    category: [{
      type: String,
      index: true
    }],
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    zone: {
      type: String,
      required: true,
      index: true
    },
    tier: {
      type: String,
      enum: ['premium', 'standard', 'economy'],
      default: 'standard',
      index: true
    },
    impressionsPerDay: {
      type: Number,
      default: 0
    },
    avgFootfall: {
      type: Number,
      default: 0
    },
    operatingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '21:00' },
      days: [{ type: String, default: 'Mon-Sun' }]
    },
    contact: {
      email: { type: String },
      phone: { type: String },
      manager: { type: String }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
StoreSchema.index({ 'location.coordinates': '2dsphere' });
StoreSchema.index({ name: 'text', 'location.city': 'text' });

// Virtual for total shelf capacity
StoreSchema.virtual('totalShelfCapacity').get(function() {
  return this.shelves?.length || 0;
});

export const Store = mongoose.model<IStoreDocument>('Store', StoreSchema);
export default Store;