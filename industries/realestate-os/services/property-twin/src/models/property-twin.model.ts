import mongoose, { Document, Schema } from 'mongoose';

// Location sub-schema
export interface IAddress {
  street: string;
  unit?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface ILocation {
  address: IAddress;
  coordinates: ICoordinates;
  areaId?: string;
  neighborhood?: string;
  submarket?: string;
}

// Listing sub-schema
export interface IPriceHistory {
  price: number;
  date: Date;
  event: 'price_change' | 'relisted';
}

export interface IListing {
  listingId?: string;
  status: 'active' | 'pending' | 'under_contract' | 'sold' | 'off_market';
  listingDate?: Date;
  listingPrice: number;
  askingPrice?: number;
  priceHistory: IPriceHistory[];
  daysOnMarket?: number;
}

// Physical property sub-schema
export interface IPhysical {
  propertyType: 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial';
  yearBuilt?: number;
  lotSizeSqft?: number;
  interiorSqft?: number;
  bedrooms: number;
  bathrooms: number;
  garage?: number;
  stories?: number;
  parkingSpaces?: number;
  hoaFee?: number | null;
  lotAcreage?: number | null;
}

// Features sub-schema
export interface IFeatures {
  interior: string[];
  exterior: string[];
  energy: string[];
  smartHome: string[];
  accessibility: string[];
}

// Condition sub-schema
export interface ICondition {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  roofAge?: number;
  hvacAge?: number;
  plumbingAge?: number;
  electricalAge?: number;
  lastInspection?: Date | null;
}

// Financial sub-schema
export interface IFinancial {
  currentValue?: number;
  propflowEstimate?: number;
  rentZestimate?: number | null;
  propertyTax?: number;
  insuranceEstimate?: number;
  hoaFee?: number | null;
  mortgageBalance?: number | null;
}

// Market sub-schema
export interface IMarket {
  compPricePerSqft?: number;
  avgDaysOnMarket?: number;
  priceTrend: 'increasing' | 'stable' | 'decreasing';
  marketTemperature: 'hot' | 'warm' | 'cool' | 'cold';
  competitionIndex?: number;
}

// Media sub-schema
export interface IMedia {
  photos: string[];
  videos: string[];
  threeDTourUrl?: string | null;
  floorPlanUrl?: string | null;
  documents: string[];
}

// Ownership sub-schema
export interface IOwnership {
  ownerType: 'individual' | 'llc' | 'corporation' | 'trust';
  ownerName?: string;
  lastSaleDate?: Date | null;
  lastSalePrice?: number | null;
}

// Agent reference sub-schema
export interface IAgentReference {
  listingAgentId?: string;
  coAgentId?: string | null;
  brokerageId?: string;
}

// Property Twin document interface
export interface IPropertyTwin extends Document {
  twinId: string;
  propertyId: string;

  // Main sections based on INTEGRATION-SPEC.md
  listing: IListing;
  location: ILocation;
  physical: IPhysical;
  features: IFeatures;
  condition: ICondition;
  financial: IFinancial;
  market: IMarket;
  media: IMedia;
  ownership: IOwnership;
  agent: IAgentReference;

  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
    twinVersion: string;
    twinType: 'property';
    source: string;
  };

  // Status
  status: 'active' | 'inactive' | 'archived';
  tags: string[];

  // Computed/derived fields
  pricePerSqft?: number;
  appreciation?: number;

  // Instance methods
  getDaysOnMarket(): number;
  getPricePerSqft(): number;
  isActive(): boolean;
  needsMaintenance(): boolean;
}

// Address Schema
const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    unit: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' },
  },
  { _id: false }
);

// Coordinates Schema
const CoordinatesSchema = new Schema<ICoordinates>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

// Location Schema
const LocationSchema = new Schema<ILocation>(
  {
    address: { type: AddressSchema, required: true },
    coordinates: { type: CoordinatesSchema, required: true },
    areaId: { type: String },
    neighborhood: { type: String },
    submarket: { type: String },
  },
  { _id: false }
);

// Price History Schema
const PriceHistorySchema = new Schema<IPriceHistory>(
  {
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    event: { type: String, enum: ['price_change', 'relisted'], required: true },
  },
  { _id: false }
);

// Listing Schema
const ListingSchema = new Schema<IListing>(
  {
    listingId: { type: String },
    status: {
      type: String,
      enum: ['active', 'pending', 'under_contract', 'sold', 'off_market'],
      required: true,
      default: 'active',
    },
    listingDate: { type: Date },
    listingPrice: { type: Number, required: true },
    askingPrice: { type: Number },
    priceHistory: [PriceHistorySchema],
    daysOnMarket: { type: Number, default: 0 },
  },
  { _id: false }
);

// Physical Schema
const PhysicalSchema = new Schema<IPhysical>(
  {
    propertyType: {
      type: String,
      enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial'],
      required: true,
    },
    yearBuilt: { type: Number },
    lotSizeSqft: { type: Number },
    interiorSqft: { type: Number },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    garage: { type: Number, default: 0 },
    stories: { type: Number },
    parkingSpaces: { type: Number },
    hoaFee: { type: Number, default: null },
    lotAcreage: { type: Number },
  },
  { _id: false }
);

// Features Schema
const FeaturesSchema = new Schema<IFeatures>(
  {
    interior: [{ type: String }],
    exterior: [{ type: String }],
    energy: [{ type: String }],
    smartHome: [{ type: String }],
    accessibility: [{ type: String }],
  },
  { _id: false }
);

// Condition Schema
const ConditionSchema = new Schema<ICondition>(
  {
    overall: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      required: true,
      default: 'good',
    },
    roofAge: { type: Number },
    hvacAge: { type: Number },
    plumbingAge: { type: Number },
    electricalAge: { type: Number },
    lastInspection: { type: Date },
  },
  { _id: false }
);

// Financial Schema
const FinancialSchema = new Schema<IFinancial>(
  {
    currentValue: { type: Number },
    propflowEstimate: { type: Number },
    rentZestimate: { type: Number, default: null },
    propertyTax: { type: Number },
    insuranceEstimate: { type: Number },
    hoaFee: { type: Number, default: null },
    mortgageBalance: { type: Number, default: null },
  },
  { _id: false }
);

// Market Schema
const MarketSchema = new Schema<IMarket>(
  {
    compPricePerSqft: { type: Number },
    avgDaysOnMarket: { type: Number },
    priceTrend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing'],
      required: true,
      default: 'stable',
    },
    marketTemperature: {
      type: String,
      enum: ['hot', 'warm', 'cool', 'cold'],
      required: true,
      default: 'warm',
    },
    competitionIndex: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

// Media Schema
const MediaSchema = new Schema<IMedia>(
  {
    photos: [{ type: String }],
    videos: [{ type: String }],
    threeDTourUrl: { type: String, default: null },
    floorPlanUrl: { type: String, default: null },
    documents: [{ type: String }],
  },
  { _id: false }
);

// Ownership Schema
const OwnershipSchema = new Schema<IOwnership>(
  {
    ownerType: {
      type: String,
      enum: ['individual', 'llc', 'corporation', 'trust'],
      required: true,
      default: 'individual',
    },
    ownerName: { type: String },
    lastSaleDate: { type: Date },
    lastSalePrice: { type: Number },
  },
  { _id: false }
);

// Agent Reference Schema
const AgentReferenceSchema = new Schema<IAgentReference>(
  {
    listingAgentId: { type: String },
    coAgentId: { type: String, default: null },
    brokerageId: { type: String },
  },
  { _id: false }
);

// Metadata Schema
const MetadataSchema = new Schema(
  {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    twinVersion: { type: String, default: '1.0.0' },
    twinType: { type: String, default: 'property' },
    source: { type: String, default: 'manual' },
  },
  { _id: false }
);

// Main Property Twin Schema
const PropertyTwinSchema = new Schema<IPropertyTwin>(
  {
    twinId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },

    listing: { type: ListingSchema, required: true },
    location: { type: LocationSchema, required: true },
    physical: { type: PhysicalSchema, required: true },
    features: { type: FeaturesSchema, default: () => ({}) },
    condition: { type: ConditionSchema, default: () => ({}) },
    financial: { type: FinancialSchema, default: () => ({}) },
    market: { type: MarketSchema, default: () => ({}) },
    media: { type: MediaSchema, default: () => ({}) },
    ownership: { type: OwnershipSchema, default: () => ({}) },
    agent: { type: AgentReferenceSchema, default: () => ({}) },

    metadata: { type: MetadataSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    tags: [{ type: String }],

    pricePerSqft: { type: Number },
    appreciation: { type: Number },
  },
  {
    timestamps: { createdAt: 'metadata.createdAt', updatedAt: 'metadata.updatedAt' },
  }
);

// Indexes for efficient querying
PropertyTwinSchema.index({ twinId: 1 });
PropertyTwinSchema.index({ propertyId: 1 });
PropertyTwinSchema.index({ 'location.address.city': 1 });
PropertyTwinSchema.index({ 'location.address.state': 1 });
PropertyTwinSchema.index({ 'location.address.postalCode': 1 });
PropertyTwinSchema.index({ 'listing.status': 1 });
PropertyTwinSchema.index({ 'physical.propertyType': 1 });
PropertyTwinSchema.index({ 'listing.listingPrice': 1 });
PropertyTwinSchema.index({ 'physical.bedrooms': 1 });
PropertyTwinSchema.index({ 'physical.bathrooms': 1 });
PropertyTwinSchema.index({ 'physical.interiorSqft': 1 });
PropertyTwinSchema.index({ tags: 1 });
PropertyTwinSchema.index({ status: 1 });
PropertyTwinSchema.index({ 'metadata.lastActivity': -1 });
PropertyTwinSchema.index({ 'location.areaId': 1 });

// Compound indexes
PropertyTwinSchema.index({ 'listing.status': 1, 'listing.listingPrice': 1 });
PropertyTwinSchema.index({ 'location.address.city': 1, 'listing.status': 1 });
PropertyTwinSchema.index({ 'location.address.state': 1, 'physical.propertyType': 1 });

// Text index for search
PropertyTwinSchema.index(
  { 'location.address.street': 'text', 'location.neighborhood': 'text' },
  { weights: { 'location.address.street': 10, 'location.neighborhood': 5 } }
);

// Pre-save middleware
PropertyTwinSchema.pre('save', function (next) {
  this.metadata.lastActivity = new Date();

  // Calculate price per sqft if interior sqft is available
  if (this.physical.interiorSqft && this.physical.interiorSqft > 0) {
    this.pricePerSqft = Math.round((this.listing.askingPrice || this.listing.listingPrice) / this.physical.interiorSqft * 100) / 100;
  }

  // Calculate appreciation if both values available
  if (this.financial.currentValue && this.ownership.lastSalePrice) {
    this.appreciation = Math.round(((this.financial.currentValue - this.ownership.lastSalePrice) / this.ownership.lastSalePrice) * 10000) / 100;
  }

  next();
});

// Instance method: Get days on market
PropertyTwinSchema.methods.getDaysOnMarket = function (): number {
  if (!this.listing.listingDate) return 0;
  const now = new Date();
  const listingDate = new Date(this.listing.listingDate);
  return Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60 * 24));
};

// Instance method: Get price per sqft
PropertyTwinSchema.methods.getPricePerSqft = function (): number {
  if (!this.physical.interiorSqft || this.physical.interiorSqft === 0) return 0;
  return Math.round((this.listing.askingPrice || this.listing.listingPrice) / this.physical.interiorSqft * 100) / 100;
};

// Instance method: Check if property is active
PropertyTwinSchema.methods.isActive = function (): boolean {
  return this.status === 'active' && this.listing.status === 'active';
};

// Instance method: Check if property needs maintenance
PropertyTwinSchema.methods.needsMaintenance = function (): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Check if roof is older than 20 years
  if (this.condition.roofAge && (currentYear - this.physical.yearBuilt! - this.condition.roofAge) > 20) {
    return true;
  }

  // Check if HVAC is older than 15 years
  if (this.condition.hvacAge && (currentYear - this.physical.yearBuilt! - this.condition.hvacAge) > 15) {
    return true;
  }

  return this.condition.overall === 'poor' || this.condition.overall === 'fair';
};

// Static method: Find active listings
PropertyTwinSchema.statics.findActive = function () {
  return this.find({ 'listing.status': 'active', status: 'active' });
};

// Static method: Find by city
PropertyTwinSchema.statics.findByCity = function (city: string) {
  return this.find({ 'location.address.city': city });
};

// Static method: Find by price range
PropertyTwinSchema.statics.findByPriceRange = function (minPrice: number, maxPrice: number) {
  return this.find({
    'listing.listingPrice': { $gte: minPrice, $lte: maxPrice },
    'listing.status': 'active',
  });
};

// Static method: Find by property type
PropertyTwinSchema.statics.findByPropertyType = function (type: IPhysical['propertyType']) {
  return this.find({ 'physical.propertyType': type, 'listing.status': 'active' });
};

// Export model
export const PropertyTwin = mongoose.model<IPropertyTwin>('PropertyTwin', PropertyTwinSchema);
