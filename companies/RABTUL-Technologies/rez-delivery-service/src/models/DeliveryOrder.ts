import mongoose, { Document, Schema, Types } from 'mongoose';

// Address interface
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Delivery item interface
export interface DeliveryItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Geo location interface
export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  updatedAt?: Date;
}

// Delivery order document interface
export interface IDeliveryOrder extends Document {
  orderId: string;
  source: 'swiggy' | 'zomato' | 'own' | 'website';
  sourceOrderId?: string;
  merchantId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: Address;
  };
  items: DeliveryItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  riderId?: Types.ObjectId;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  deliveryFee: number;
  platformFee: number;
  discount?: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'online' | 'wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialInstructions?: string;
  tracking?: {
    currentLocation?: GeoLocation;
    lastUpdated?: Date;
    eta?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Status history schema for embedded documents
const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
}, { _id: false });

// Delivery item schema
const DeliveryItemSchema = new Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  notes: { type: String }
}, { _id: false });

// Address schema
const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  }
}, { _id: false });

// Geo location schema for tracking
const GeoLocationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: { type: [Number], required: true }, // [lng, lat]
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Main delivery order schema
const DeliveryOrderSchema = new Schema<IDeliveryOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  source: {
    type: String,
    enum: ['swiggy', 'zomato', 'own', 'website'],
    required: true,
    index: true
  },
  sourceOrderId: {
    type: String,
    sparse: true,
    index: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: AddressSchema, required: true }
  },
  items: {
    type: [DeliveryItemSchema],
    required: true,
    validate: [arr => arr.length > 0, 'Order must have at least one item']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  statusHistory: [StatusHistorySchema],
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'Rider',
    index: true
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  actualDelivery: {
    type: Date
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'wallet'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  tracking: {
    currentLocation: { type: GeoLocationSchema },
    lastUpdated: { type: Date },
    eta: { type: Date }
  }
}, {
  timestamps: true,
  collection: 'delivery_orders'
});

// Indexes for efficient queries
DeliveryOrderSchema.index({ merchantId: 1, status: 1 });
DeliveryOrderSchema.index({ 'customer.phone': 1 });
DeliveryOrderSchema.index({ createdAt: -1 });
DeliveryOrderSchema.index({ 'tracking.currentLocation': '2dsphere' });

// Pre-save hook to add status history
DeliveryOrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Instance method to update tracking
DeliveryOrderSchema.methods.updateTracking = function(location: { lat: number; lng: number }) {
  this.tracking = {
    currentLocation: {
      type: 'Point',
      coordinates: [location.lng, location.lat],
      updatedAt: new Date()
    },
    lastUpdated: new Date()
  };
};

// Static method to find orders by status
DeliveryOrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find orders by source
DeliveryOrderSchema.statics.findBySource = function(source: string) {
  return this.find({ source }).sort({ createdAt: -1 });
};

// Static method to get pending orders for assignment
DeliveryOrderSchema.statics.getPendingForAssignment = function() {
  return this.find({
    status: { $in: ['ready'] },
    riderId: { $exists: false }
  }).sort({ estimatedDelivery: 1 });
};

export const DeliveryOrder = mongoose.model<IDeliveryOrder>('DeliveryOrder', DeliveryOrderSchema);
export default DeliveryOrder;
