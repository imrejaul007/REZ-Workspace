import mongoose, { Document, Schema } from 'mongoose';

// Venue definition
export interface IVenue {
  venueId: string;
  name: string;
  type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'meeting_room' | 'ballroom' | 'lounge' | 'cafe';
  capacity: number;
  operatingHours: {
    dayOfWeek: number; // 0-6, Sunday = 0
    openTime: string; // HH:mm format
    closeTime: string;
    isClosed: boolean;
  }[];
  amenities: string[];
  contact?: {
    phone?: string;
    email?: string;
    reservationUrl?: string;
  };
  images?: string[];
  status: 'open' | 'closed' | 'seasonal' | 'renovation';
}

// Amenity definition
export interface IAmenity {
  amenityId: string;
  name: string;
  category: 'pool' | 'spa' | 'fitness' | 'dining' | 'business' | 'transportation' | 'entertainment' | 'family' | 'accessibility';
  description: string;
  available: boolean;
  location?: string;
  operatingHours?: string;
  additionalCost?: number;
  bookingRequired?: boolean;
}

// Policy definition
export interface IPolicy {
  policyId: string;
  name: string;
  category: 'checkin' | 'checkout' | 'cancellation' | 'pet' | 'smoking' | 'parking' | 'payment' | 'general';
  description: string;
  rules: string[];
  exceptions?: string[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

// Revenue center definition
export interface IRevenueCenter {
  centerId: string;
  name: string;
  type: 'rooms' | 'fnb' | 'spa' | 'parking' | 'laundry' | 'business_center' | 'gift_shop' | 'other';
  revenueCode: string;
  targetRevenue?: number;
  actualRevenue?: number;
  budgetedRevenue?: number;
  lastUpdated: Date;
}

// Property Twin document interface
export interface IPropertyTwin extends Document {
  propertyId: string;
  propertyName: string;
  brand: string;
  chainCode?: string;
  location: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    timezone: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    emergencyContact?: string;
  };
  venues: IVenue[];
  amenities: IAmenity[];
  policies: IPolicy[];
  revenueCenters: IRevenueCenter[];
  configuration: {
    totalRooms: number;
    totalFloors: number;
    roomTypes: {
      type: string;
      count: number;
      baseRate: number;
    }[];
    starRating: number;
    yearBuilt?: number;
    lastRenovation?: Date;
  };
  metrics: {
    occupancyRate: number;
    averageDailyRate: number;
    revenuePerAvailableRoom: number;
    guestSatisfactionScore: number;
    lastUpdated: Date;
  };
  integrations: {
    serviceName: string;
    endpoint: string;
    status: 'connected' | 'disconnected' | 'error';
    lastSync?: Date;
  }[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
    twinVersion: string;
  };
  status: 'active' | 'inactive' | 'coming-soon';
  tags: string[];
}

// Mongoose schema for Venue
const VenueSchema = new Schema<IVenue>(
  {
    venueId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room', 'ballroom', 'lounge', 'cafe'],
      required: true,
    },
    capacity: { type: Number, default: 0 },
    operatingHours: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        openTime: { type: String },
        closeTime: { type: String },
        isClosed: { type: Boolean, default: false },
      },
    ],
    amenities: [{ type: String }],
    contact: {
      phone: { type: String },
      email: { type: String },
      reservationUrl: { type: String },
    },
    images: [{ type: String }],
    status: { type: String, enum: ['open', 'closed', 'seasonal', 'renovation'], default: 'open' },
  },
  { _id: false }
);

// Mongoose schema for Amenity
const AmenitySchema = new Schema<IAmenity>(
  {
    amenityId: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['pool', 'spa', 'fitness', 'dining', 'business', 'transportation', 'entertainment', 'family', 'accessibility'],
      required: true,
    },
    description: { type: String, required: true },
    available: { type: Boolean, default: true },
    location: { type: String },
    operatingHours: { type: String },
    additionalCost: { type: Number },
    bookingRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

// Mongoose schema for Policy
const PolicySchema = new Schema<IPolicy>(
  {
    policyId: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['checkin', 'checkout', 'cancellation', 'pet', 'smoking', 'parking', 'payment', 'general'],
      required: true,
    },
    description: { type: String, required: true },
    rules: [{ type: String }],
    exceptions: [{ type: String }],
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
  },
  { _id: false }
);

// Mongoose schema for Revenue Center
const RevenueCenterSchema = new Schema<IRevenueCenter>(
  {
    centerId: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['rooms', 'fnb', 'spa', 'parking', 'laundry', 'business_center', 'gift_shop', 'other'],
      required: true,
    },
    revenueCode: { type: String, required: true },
    targetRevenue: { type: Number },
    actualRevenue: { type: Number },
    budgetedRevenue: { type: Number },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Mongoose schema for Location
const LocationSchema = new Schema(
  {
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    timezone: { type: String, required: true },
  },
  { _id: false }
);

// Mongoose schema for Contact
const ContactSchema = new Schema(
  {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },
    emergencyContact: { type: String },
  },
  { _id: false }
);

// Mongoose schema for Configuration
const ConfigurationSchema = new Schema(
  {
    totalRooms: { type: Number, required: true, min: 0 },
    totalFloors: { type: Number, required: true, min: 0 },
    roomTypes: [
      {
        type: { type: String, required: true },
        count: { type: Number, required: true },
        baseRate: { type: Number, required: true },
      },
    ],
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    yearBuilt: { type: Number },
    lastRenovation: { type: Date },
  },
  { _id: false }
);

// Mongoose schema for Metrics
const MetricsSchema = new Schema(
  {
    occupancyRate: { type: Number, min: 0, max: 100, default: 0 },
    averageDailyRate: { type: Number, min: 0, default: 0 },
    revenuePerAvailableRoom: { type: Number, min: 0, default: 0 },
    guestSatisfactionScore: { type: Number, min: 0, max: 100, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Mongoose schema for Integration
const IntegrationSchema = new Schema(
  {
    serviceName: { type: String, required: true },
    endpoint: { type: String, required: true },
    status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
    lastSync: { type: Date },
  },
  { _id: false }
);

// Mongoose schema for Property Twin
const PropertyTwinSchema = new Schema<IPropertyTwin>(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    propertyName: { type: String, required: true },
    brand: { type: String, required: true },
    chainCode: { type: String },
    location: { type: LocationSchema, required: true },
    contact: { type: ContactSchema, required: true },
    venues: [VenueSchema],
    amenities: [AmenitySchema],
    policies: [PolicySchema],
    revenueCenters: [RevenueCenterSchema],
    configuration: { type: ConfigurationSchema, required: true },
    metrics: { type: MetricsSchema, default: () => ({}) },
    integrations: [IntegrationSchema],
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      twinVersion: { type: String, default: '1.0.0' },
    },
    status: { type: String, enum: ['active', 'inactive', 'coming-soon'], default: 'active' },
    tags: [{ type: String }],
  },
  {
    timestamps: { createdAt: 'metadata.createdAt', updatedAt: 'metadata.updatedAt' },
  }
);

// Indexes
PropertyTwinSchema.index({ propertyName: 'text', brand: 'text' });
PropertyTwinSchema.index({ 'location.address.city': 1 });
PropertyTwinSchema.index({ 'location.address.country': 1 });
PropertyTwinSchema.index({ 'configuration.starRating': 1 });
PropertyTwinSchema.index({ status: 1 });
PropertyTwinSchema.index({ tags: 1 });
PropertyTwinSchema.index({ 'metadata.lastActivity': -1 });

// Compound indexes
PropertyTwinSchema.index({ status: 1, 'location.address.country': 1 });

// Pre-save middleware
PropertyTwinSchema.pre('save', function (next) {
  this.metadata.lastActivity = new Date();
  next();
});

// Instance method to get total venue capacity
PropertyTwinSchema.methods.getTotalVenueCapacity = function (): number {
  return this.venues.reduce((total, venue) => total + venue.capacity, 0);
};

// Instance method to get available amenities
PropertyTwinSchema.methods.getAvailableAmenities = function (): IAmenity[] {
  return this.amenities.filter((amenity) => amenity.available);
};

// Instance method to get active venues
PropertyTwinSchema.methods.getActiveVenues = function (): IVenue[] {
  return this.venues.filter((venue) => venue.status === 'open');
};

// Instance method to get policies by category
PropertyTwinSchema.methods.getPoliciesByCategory = function (
  category: IPolicy['category']
): IPolicy[] {
  return this.policies.filter((policy) => policy.category === category);
};

// Instance method to calculate RevPAR
PropertyTwinSchema.methods.calculateRevPAR = function (): number {
  const { occupancyRate, averageDailyRate } = this.metrics;
  return (occupancyRate / 100) * averageDailyRate;
};

// Static method to find properties by country
PropertyTwinSchema.statics.findByCountry = function (country: string) {
  return this.find({ 'location.address.country': country });
};

// Static method to find properties by city
PropertyTwinSchema.statics.findByCity = function (city: string) {
  return this.find({ 'location.address.city': city });
};

export const PropertyTwin = mongoose.model<IPropertyTwin>('PropertyTwin', PropertyTwinSchema);
