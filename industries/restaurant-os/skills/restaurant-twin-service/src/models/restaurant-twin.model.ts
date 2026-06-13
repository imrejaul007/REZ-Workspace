import mongoose, { Schema, Document } from 'mongoose';
import {
  RestaurantTwinDocument,
  RestaurantStatus,
  CuisineType,
  defaultFeatures,
  defaultMetrics
} from '../schemas/restaurant-twin.schema';

export interface IRestaurantTwinModel extends Omit<RestaurantTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Location Schema
const LocationSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false });

// Contact Info Schema
const ContactInfoSchema = new Schema({
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String }
  }
}, { _id: false });

// Operating Hours Schema
const OperatingHoursSchema = new Schema({
  day: { type: String, required: true },
  open: { type: String, required: true },
  close: { type: String, required: true },
  isClosed: { type: Boolean, default: false }
}, { _id: false });

// Restaurant Features Schema
const RestaurantFeaturesSchema = new Schema({
  delivery: { type: Boolean, default: false },
  takeaway: { type: Boolean, default: false },
  dineIn: { type: Boolean, default: true },
  driveThru: { type: Boolean, default: false },
  qrOrdering: { type: Boolean, default: false },
  selfKiosk: { type: Boolean, default: false },
  onlineOrdering: { type: Boolean, default: false },
  reservations: { type: Boolean, default: false },
  buffet: { type: Boolean, default: false },
  liveCooking: { type: Boolean, default: false },
  outdoorSeating: { type: Boolean, default: false },
  wifi: { type: Boolean, default: false },
  parking: { type: Boolean, default: false },
  wheelchairAccessible: { type: Boolean, default: false }
}, { _id: false });

// Current Metrics Schema
const CurrentMetricsSchema = new Schema({
  currentCovers: { type: Number, default: 0 },
  pendingOrders: { type: Number, default: 0 },
  avgWaitTime: { type: Number, default: 0 },
  tableTurnover: { type: Number, default: 0 },
  activeStaff: { type: Number, default: 0 },
  kitchenUtilization: { type: Number, default: 0 },
  revenueToday: { type: Number, default: 0 },
  ordersToday: { type: Number, default: 0 }
}, { _id: false });

// Main Restaurant Twin Schema
const RestaurantTwinSchema = new Schema<IRestaurantTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    restaurantId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      index: true
    },
    description: { type: String },
    cuisineType: [{
      type: String,
      enum: Object.values(CuisineType)
    }],
    location: {
      type: LocationSchema,
      required: true
    },
    contact: {
      type: ContactInfoSchema,
      required: true
    },
    totalTables: {
      type: Number,
      required: true,
      min: 0
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 0
    },
    operatingHours: [{
      type: OperatingHoursSchema
    }],
    features: {
      type: RestaurantFeaturesSchema,
      default: () => ({})
    },
    currentMetrics: {
      type: CurrentMetricsSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: Object.values(RestaurantStatus),
      default: RestaurantStatus.CLOSED
    },
    lastUpdated: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
RestaurantTwinSchema.index({ 'location.city': 1 });
RestaurantTwinSchema.index({ 'location.state': 1 });
RestaurantTwinSchema.index({ cuisineType: 1 });
RestaurantTwinSchema.index({ status: 1 });
RestaurantTwinSchema.index({ 'features.qrOrdering': 1 });
RestaurantTwinSchema.index({ 'features.delivery': 1 });
RestaurantTwinSchema.index({ 'features.takeaway': 1 });

// Instance methods
RestaurantTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.${this.restaurantId}`;
};

RestaurantTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    restaurantId: obj.restaurantId,
    merchantId: obj.merchantId,
    name: obj.name,
    description: obj.description,
    cuisineType: obj.cuisineType,
    location: obj.location,
    contact: obj.contact,
    totalTables: obj.totalTables,
    totalSeats: obj.totalSeats,
    operatingHours: obj.operatingHours,
    features: obj.features,
    currentMetrics: obj.currentMetrics,
    status: obj.status,
    lastUpdated: obj.lastUpdated,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// Static methods
RestaurantTwinSchema.statics.findByRestaurantId = function(restaurantId: string) {
  return this.findOne({ restaurantId });
};

RestaurantTwinSchema.statics.findByMerchantId = function(merchantId: string) {
  return this.find({ merchantId });
};

RestaurantTwinSchema.statics.findByStatus = function(status: RestaurantStatus) {
  return this.find({ status });
};

RestaurantTwinSchema.statics.findByCuisine = function(cuisineType: CuisineType) {
  return this.find({ cuisineType });
};

RestaurantTwinSchema.statics.findOpenRestaurants = function() {
  return this.find({ status: { $ne: RestaurantStatus.CLOSED } });
};

// Export model
export const RestaurantTwin = mongoose.model<IRestaurantTwinModel>('RestaurantTwin', RestaurantTwinSchema);
