import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStore extends Document {
  name: string;
  code: string;
  type: 'retail' | 'warehouse' | 'popup';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone: string;
  email: string;
  managerId: Types.ObjectId;
  operatingHours: {
    [day: string]: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['retail', 'warehouse', 'popup'],
      default: 'retail',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    operatingHours: {
      type: Map,
      of: {
        open: String,
        close: String,
        isClosed: Boolean,
      },
      default: {
        monday: { open: '09:00', close: '21:00', isClosed: false },
        tuesday: { open: '09:00', close: '21:00', isClosed: false },
        wednesday: { open: '09:00', close: '21:00', isClosed: false },
        thursday: { open: '09:00', close: '21:00', isClosed: false },
        friday: { open: '09:00', close: '21:00', isClosed: false },
        saturday: { open: '10:00', close: '22:00', isClosed: false },
        sunday: { open: '10:00', close: '20:00', isClosed: false },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StoreSchema.index({ code: 1 }, { unique: true });
StoreSchema.index({ 'address.city': 1 });
StoreSchema.index({ location: '2dsphere' });
StoreSchema.index({ isActive: 1, type: 1 });

export const Store = mongoose.model<IStore>('Store', StoreSchema);
export default Store;
