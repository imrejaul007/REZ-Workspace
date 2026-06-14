import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  _id: mongoose.Types.ObjectId;
  retailerId: mongoose.Types.ObjectId;
  storeCode: string;
  name: string;
  storeType: 'supermarket' | 'hypermarket' | 'convenience' | 'department' | 'specialty';
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    shelfUnits: number;
    endCaps: number;
    checkouts: number;
    entranceDisplays: number;
    freezerDoors: number;
  };
  inventory: {
    totalUnits: number;
    activeMediaUnits: number;
    availableUnits: number;
    reservedUnits: number;
  };
  operatingHours: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  status: 'active' | 'inactive' | 'maintenance';
  attributes: {
    hasSelfCheckout: boolean;
    hasDeli: boolean;
    hasBakery: boolean;
    hasPharmacy: boolean;
    trafficScore: number;
    avgDailyVisitors: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    retailerId: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true, index: true },
    storeCode: { type: String, required: true },
    name: { type: String, required: true },
    storeType: {
      type: String,
      enum: ['supermarket', 'hypermarket', 'convenience', 'department', 'specialty'],
      required: true
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    capacity: {
      shelfUnits: { type: Number, default: 50 },
      endCaps: { type: Number, default: 10 },
      checkouts: { type: Number, default: 8 },
      entranceDisplays: { type: Number, default: 4 },
      freezerDoors: { type: Number, default: 20 }
    },
    inventory: {
      totalUnits: { type: Number, default: 0 },
      activeMediaUnits: { type: Number, default: 0 },
      availableUnits: { type: Number, default: 0 },
      reservedUnits: { type: Number, default: 0 }
    },
    operatingHours: {
      type: Map,
      of: {
        open: String,
        close: String,
        closed: Boolean
      }
    },
    status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
    attributes: {
      hasSelfCheckout: { type: Boolean, default: false },
      hasDeli: { type: Boolean, default: false },
      hasBakery: { type: Boolean, default: false },
      hasPharmacy: { type: Boolean, default: false },
      trafficScore: { type: Number, default: 5 },
      avgDailyVisitors: { type: Number, default: 1000 }
    }
  },
  { timestamps: true }
);

// Indexes
StoreSchema.index({ retailerId: 1, storeCode: 1 }, { unique: true });
StoreSchema.index({ 'address.city': 1, 'address.state': 1 });
StoreSchema.index({ status: 1 });

export const Store = mongoose.model<IStore>('Store', StoreSchema);
export default Store;