import mongoose, { Schema, Document } from 'mongoose';

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
export type DeliveryType = 'instant' | 'scheduled' | 'same_day' | 'next_day';

export interface IDelivery extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  type: DeliveryType;
  status: DeliveryStatus;
  pickup: IAddress;
  drop: IAddress;
  distance: number; // km
  estimatedTime: number; // minutes
  actualTime?: number;
  customerId: string;
  customerPhone: string;
  customerName: string;
  items: IDeliveryItem[];
  specialInstructions?: string;
  isFragile: boolean;
  isPriority: boolean;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehicleType: 'bike' | 'auto' | 'mini_truck';
  deliveryFee: number;
  platformFee: number;
  driverEarning: number;
  cashCollected?: number;
  otp?: string;
  trackingUrl?: string;
  route?: IRoute;
  timeline: IDeliveryEvent[];
  rating?: number;
  ratingComment?: string;
  attemptCount: number;
  failedReason?: string;
  storeId: string;
  storeName: string;
  scheduledAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  lat: number;
  lng: number;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IDeliveryItem {
  name: string;
  quantity: number;
  price: number;
  weight?: number;
}

export interface IRoute {
  polyline: string;
  waypoints: IAddress[];
  distance: number;
  duration: number;
}

export interface IDeliveryEvent {
  status: DeliveryStatus;
  timestamp: Date;
  location?: IAddress;
  comment?: string;
}

const AddressSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true },
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true }
}, { _id: false });

const DeliveryItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  weight: Number
}, { _id: false });

const RouteSchema = new Schema({
  polyline: String,
  waypoints: [AddressSchema],
  distance: Number,
  duration: Number
}, { _id: false });

const DeliveryEventSchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: AddressSchema,
  comment: String
}, { _id: false });

const DeliverySchema = new Schema({
  orderId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['instant', 'scheduled', 'same_day', 'next_day'],
    default: 'instant'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  pickup: { type: AddressSchema, required: true },
  drop: { type: AddressSchema, required: true },
  distance: { type: Number, required: true },
  estimatedTime: { type: Number, required: true },
  actualTime: Number,
  customerId: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [DeliveryItemSchema],
  specialInstructions: String,
  isFragile: { type: Boolean, default: false },
  isPriority: { type: Boolean, default: false },
  driverId: String,
  driverName: String,
  driverPhone: String,
  driverRating: Number,
  vehicleType: { type: String, enum: ['bike', 'auto', 'mini_truck'], default: 'bike' },
  deliveryFee: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  driverEarning: { type: Number, required: true },
  cashCollected: Number,
  otp: String,
  trackingUrl: String,
  route: RouteSchema,
  timeline: [DeliveryEventSchema],
  rating: Number,
  ratingComment: String,
  attemptCount: { type: Number, default: 0 },
  failedReason: String,
  storeId: { type: String, required: true },
  storeName: { type: String, required: true },
  scheduledAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date
}, { timestamps: true });

DeliverySchema.index({ status: 1, createdAt: -1 });
DeliverySchema.index({ driverId: 1, status: 1 });
DeliverySchema.index({ storeId: 1, status: 1 });

export const Delivery = mongoose.models.Delivery ||
  mongoose.model<IDelivery>('Delivery', DeliverySchema);
