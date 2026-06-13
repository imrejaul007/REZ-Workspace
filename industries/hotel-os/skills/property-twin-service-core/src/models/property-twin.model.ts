import mongoose, { Schema, Document } from 'mongoose';
import {
  PropertyTwinDocument,
  VenueType
} from '../schemas/property-twin.schema';

export interface IPropertyTwinModel extends Omit<PropertyTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Sub-schemas
const CoordinatesSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const LocationSchema = new Schema({
  address: { type: String },
  city: { type: String, required: true },
  country: { type: String, required: true },
  coordinates: { type: CoordinatesSchema },
  timezone: { type: String }
}, { _id: false });

const InventorySchema = new Schema({
  totalRooms: { type: Number, required: true, min: 0 },
  byType: { type: Schema.Types.Mixed, default: {} },
  availableToday: { type: Number, default: 0 },
  availableTomorrow: { type: Number, default: 0 }
}, { _id: false });

const VenueHoursSchema = new Schema({
  monday: { open: { type: String }, close: { type: String } },
  tuesday: { open: { type: String }, close: { type: String } },
  wednesday: { open: { type: String }, close: { type: String } },
  thursday: { open: { type: String }, close: { type: String } },
  friday: { open: { type: String }, close: { type: String } },
  saturday: { open: { type: String }, close: { type: String } },
  sunday: { open: { type: String }, close: { type: String } }
}, { _id: false });

const VenueSchema = new Schema({
  venueId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: Object.values(VenueType), required: true },
  capacity: { type: Number, default: 0 },
  hours: { type: VenueHoursSchema },
  posRevenueCenterId: { type: String },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const StaffSchema = new Schema({
  totalCount: { type: Number, default: 0 },
  byDepartment: { type: Schema.Types.Mixed, default: {} },
  onDutyNow: { type: Number, default: 0 }
}, { _id: false });

const ServicesSchema = new Schema({
  checkIn24h: { type: Boolean, default: true },
  conciergeAvailable: { type: Boolean, default: true },
  roomServiceHours: { type: Schema.Types.Mixed, default: {} },
  housekeepingSchedule: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const RevenueSchema = new Schema({
  todayRevenue: { type: Number, default: 0 },
  mtdRevenue: { type: Number, default: 0 },
  ytdRevenue: { type: Number, default: 0 },
  revpar: { type: Number, default: 0 },
  adr: { type: Number, default: 0 },
  occupancyRate: { type: Number, default: 0, min: 0, max: 100 }
}, { _id: false });

const UpsellConfigSchema = new Schema({
  enabledUpgradeTypes: [{ type: String }],
  maxUpgradeDiscount: { type: Number, default: 30 },
  upgradeProbabilityThreshold: { type: Number, default: 0.5 }
}, { _id: false });

const PricingRulesSchema = new Schema({
  seasonalPricing: { type: Boolean, default: true },
  weekendPricing: { type: Boolean, default: true },
  lastMinuteDiscount: { type: Number, default: 10 },
  earlyBirdDiscount: { type: Number, default: 15 }
}, { _id: false });

const SettingsSchema = new Schema({
  brandStandardsVersion: { type: String, default: '1.0.0' },
  upsellConfig: { type: UpsellConfigSchema },
  pricingRules: { type: PricingRulesSchema }
}, { _id: false });

// Main Property Twin Schema
const PropertyTwinSchema = new Schema<IPropertyTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    propertyId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    brand: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    location: {
      type: LocationSchema,
      required: true
    },
    inventory: {
      type: InventorySchema,
      required: true
    },
    venues: [{
      type: VenueSchema
    }],
    staff: {
      type: StaffSchema,
      required: true,
      default: () => ({})
    },
    services: {
      type: ServicesSchema,
      required: true,
      default: () => ({})
    },
    revenue: {
      type: RevenueSchema,
      required: true,
      default: () => ({})
    },
    settings: {
      type: SettingsSchema,
      required: true,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
PropertyTwinSchema.index({ 'location.city': 1 });
PropertyTwinSchema.index({ 'location.country': 1 });
PropertyTwinSchema.index({ 'revenue.occupancyRate': 1 });
PropertyTwinSchema.index({ 'revenue.todayRevenue': 1 });

// Instance methods
PropertyTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.hotel.property.${this.propertyId}`;
};

PropertyTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    propertyId: obj.propertyId,
    brand: obj.brand,
    name: obj.name,
    location: obj.location,
    inventory: obj.inventory,
    venues: obj.venues,
    staff: obj.staff,
    services: obj.services,
    revenue: obj.revenue,
    settings: obj.settings,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// Static methods
PropertyTwinSchema.statics.findByPropertyId = function(propertyId: string) {
  return this.findOne({ propertyId });
};

PropertyTwinSchema.statics.findByBrand = function(brand: string) {
  return this.find({ brand });
};

PropertyTwinSchema.statics.findByCity = function(city: string) {
  return this.find({ 'location.city': city });
};

PropertyTwinSchema.statics.findByCountry = function(country: string) {
  return this.find({ 'location.country': country });
};

PropertyTwinSchema.statics.findHighOccupancy = function(threshold: number = 80) {
  return this.find({
    'revenue.occupancyRate': { $gte: threshold }
  });
};

// Export model
export const PropertyTwin = mongoose.model<IPropertyTwinModel>('PropertyTwin', PropertyTwinSchema);
