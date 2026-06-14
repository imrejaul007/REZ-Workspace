import mongoose, { Schema, Document } from 'mongoose';
import {
  IDelivery,
  DeliveryStatus,
  GeoLocation,
  DeliveryEvent,
  DeliveryRoute,
  ETACalculation
} from '../types';

export interface DeliveryDocument extends Omit<IDelivery, '_id'>, Document {}

const GeoLocationSchema = new Schema<GeoLocation>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    timestamp: { type: Date }
  },
  { _id: false }
);

const DeliveryEventSchema = new Schema<DeliveryEvent>(
  {
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    location: { type: GeoLocationSchema },
    notes: { type: String },
    updatedBy: { type: String }
  },
  { _id: false }
);

const DeliveryRouteSchema = new Schema<DeliveryRoute>(
  {
    origin: { type: GeoLocationSchema, required: true },
    destination: { type: GeoLocationSchema, required: true },
    waypoints: [{ type: GeoLocationSchema }],
    distance: { type: Number },
    estimatedDuration: { type: Number }
  },
  { _id: false }
);

const ETACalculationSchema = new Schema<ETACalculation>(
  {
    estimatedArrival: { type: Date, required: true },
    remainingDistance: { type: Number, required: true },
    remainingDuration: { type: Number, required: true },
    trafficCondition: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  { _id: false }
);

const PackageDetailsSchema = new Schema(
  {
    weight: { type: Number },
    dimensions: {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    description: { type: String, required: true },
    specialInstructions: { type: String }
  },
  { _id: false }
);

const PricingSchema = new Schema(
  {
    basePrice: { type: Number, required: true },
    distanceFee: { type: Number, default: 0 },
    surgeFee: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true }
  },
  { _id: false }
);

const ProofOfDeliverySchema = new Schema(
  {
    signature: { type: String },
    photo: { type: String },
    recipientName: { type: String }
  },
  { _id: false }
);

const DeliverySchema = new Schema<DeliveryDocument>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    driverId: {
      type: String,
      index: true,
      sparse: true
    },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
      index: true
    },
    pickup: {
      type: GeoLocationSchema,
      required: true
    },
    dropoff: {
      type: GeoLocationSchema,
      required: true
    },
    route: { type: DeliveryRouteSchema },
    eta: { type: ETACalculationSchema },
    events: [DeliveryEventSchema],
    scheduledPickup: { type: Date },
    scheduledDropoff: { type: Date },
    actualPickup: { type: Date },
    actualDropoff: { type: Date },
    packageDetails: {
      type: PackageDetailsSchema,
      required: true
    },
    pricing: {
      type: PricingSchema,
      required: true
    },
    proofOfDelivery: { type: ProofOfDeliverySchema }
  },
  {
    timestamps: true,
    collection: 'deliveries'
  }
);

DeliverySchema.index({ status: 1, createdAt: -1 });
DeliverySchema.index({ driverId: 1, status: 1 });
DeliverySchema.index({ 'pickup.latitude': 1, 'pickup.longitude': 1 });
DeliverySchema.index({ 'dropoff.latitude': 1, 'dropoff.longitude': 1 });

DeliverySchema.pre('save', function (next) {
  if (this.events.length === 0) {
    this.events.push({
      status: this.status,
      timestamp: new Date(),
      notes: 'Delivery created'
    });
  }
  next();
});

DeliverySchema.methods.addEvent = function (
  status: DeliveryStatus,
  location?: GeoLocation,
  notes?: string,
  updatedBy?: string
): void {
  this.events.push({
    status,
    timestamp: new Date(),
    location,
    notes,
    updatedBy
  });
};

DeliverySchema.methods.getLatestLocation = function (): GeoLocation | null {
  const locationEvents = this.events.filter((e) => e.location);
  if (locationEvents.length === 0) return null;
  return locationEvents[locationEvents.length - 1].location || null;
};

export const Delivery = mongoose.model<DeliveryDocument>('Delivery', DeliverySchema);
export default Delivery;
