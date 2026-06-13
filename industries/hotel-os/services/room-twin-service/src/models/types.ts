import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// Room Twin Types
// ============================================

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'out-of-order' | 'cleaning' | 'do-not-disturb';
export type OccupancyState = 'vacant' | 'occupied' | 'checked-out' | 'reserved';
export type RoomCategory = 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'villa' | 'accessible';

export interface IIoTDevice {
  deviceId: string;
  deviceType: 'thermostat' | 'lighting' | 'locks' | 'tv' | 'minibar' | 'climate' | 'sensors' | 'blinds';
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'error';
  lastHeartbeat: Date;
  metadata?: Record<string, unknown>;
}

export interface IIoTState {
  temperature: number;
  targetTemperature: number;
  humidity: number;
  lighting: {
    main: number;
    ambient: number;
    bathroom: number;
  };
  climate: {
    mode: 'off' | 'heat' | 'cool' | 'auto';
    fanSpeed: 'auto' | 'low' | 'medium' | 'high';
  };
  blinds: {
    level: number;
    mode: 'open' | 'closed' | 'auto';
  };
  doorLock: boolean;
  minibar: {
    doorOpen: boolean;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
  };
  tv: {
    power: boolean;
    channel: number;
    volume: number;
    input: string;
  };
  occupancy: {
    detected: boolean;
    lastMotion: Date;
    guestPresent: boolean;
  };
  energy: {
    consumption: number;
    unit: 'kWh';
  };
  timestamp: Date;
}

export interface IRoomFeatures {
  bedType: string;
  maxOccupancy: number;
  size: number;
  sizeUnit: 'sqft' | 'sqm';
  view: string;
  balcony: boolean;
  floor: number;
  amenities: string[];
  smoking: boolean;
  petFriendly: boolean;
}

export interface IRoomTwin extends Document {
  roomId: string;
  propertyId: string;
  floor: number;
  roomNumber: string;
  category: RoomCategory;
  status: RoomStatus;
  occupancy: OccupancyState;
  currentGuestId?: string;
  currentReservationId?: string;
  iot: {
    devices: IIoTDevice[];
    state: IIoTState;
    lastSync: Date;
  };
  features: IRoomFeatures;
  maintenance: {
    lastService: Date;
    nextService: Date;
    issues: Array<{
      reportedAt: Date;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      resolved: boolean;
      resolvedAt?: Date;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Guest Twin Types
// ============================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface IGuestPreferences {
  room: {
    temperature: number;
    lighting: number;
    pillowType: string;
    bedConfiguration: string;
  };
  amenities: string[];
  dietary: string[];
  accessibility: string[];
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface IStayHistory {
  reservationId: string;
  propertyId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  totalSpend: number;
  feedback?: {
    rating: number;
    comment?: string;
  };
}

export interface IGuestTwin extends Document {
  guestId: string;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality?: string;
    idType?: string;
    idNumber?: string;
    dateOfBirth?: Date;
    profileImage?: string;
  };
  loyalty: {
    tier: LoyaltyTier;
    points: number;
    lifetimePoints: number;
    memberSince: Date;
  };
  preferences: IGuestPreferences;
  stayHistory: IStayHistory[];
  sentiment: {
    overall: number;
    lastUpdated: Date;
    sources: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Property Twin Types
// ============================================

export interface IVenue {
  venueId: string;
  name: string;
  type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'conference' | 'lounge';
  capacity: number;
  operatingHours: {
    open: string;
    close: string;
    days: number[];
  };
  amenities: string[];
}

export interface IRevenueCenter {
  centerId: string;
  name: string;
  type: 'fnb' | 'spa' | 'retail' | 'parking' | 'laundry' | 'business';
  revenue: number;
  target: number;
  currency: string;
}

export interface IPropertyPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  petPolicy: string;
  smokingPolicy: string;
  paymentMethods: string[];
  depositRequired: boolean;
  depositAmount: number;
}

export interface IPropertyTwin extends Document {
  propertyId: string;
  name: string;
  brand: string;
  type: 'hotel' | 'resort' | 'boutique' | 'hostel' | 'aparthotel';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  venues: IVenue[];
  amenities: string[];
  policies: IPropertyPolicies;
  revenueCenters: IRevenueCenter[];
  stats: {
    totalRooms: number;
    availableRooms: number;
    occupancyRate: number;
    avgDailyRate: number;
    revPAR: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Mongoose Schemas
// ============================================

const IoTDeviceSchema = new Schema<IIoTDevice>(
  {
    deviceId: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['thermostat', 'lighting', 'locks', 'tv', 'minibar', 'climate', 'sensors', 'blinds'],
      required: true
    },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    firmwareVersion: { type: String, required: true },
    status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
    lastHeartbeat: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const IoTStateSchema = new Schema<IIoTState>(
  {
    temperature: { type: Number, default: 22 },
    targetTemperature: { type: Number, default: 22 },
    humidity: { type: Number, default: 50 },
    lighting: {
      main: { type: Number, default: 0 },
      ambient: { type: Number, default: 0 },
      bathroom: { type: Number, default: 0 }
    },
    climate: {
      mode: { type: String, enum: ['off', 'heat', 'cool', 'auto'], default: 'auto' },
      fanSpeed: { type: String, enum: ['auto', 'low', 'medium', 'high'], default: 'auto' }
    },
    blinds: {
      level: { type: Number, default: 0 },
      mode: { type: String, enum: ['open', 'closed', 'auto'], default: 'closed' }
    },
    doorLock: { type: Boolean, default: true },
    minibar: {
      doorOpen: { type: Boolean, default: false },
      items: [
        {
          productId: String,
          name: String,
          quantity: Number,
          price: Number
        }
      ]
    },
    tv: {
      power: { type: Boolean, default: false },
      channel: { type: Number, default: 1 },
      volume: { type: Number, default: 10 },
      input: { type: String, default: 'hdmi1' }
    },
    occupancy: {
      detected: { type: Boolean, default: false },
      lastMotion: { type: Date },
      guestPresent: { type: Boolean, default: false }
    },
    energy: {
      consumption: { type: Number, default: 0 },
      unit: { type: String, default: 'kWh' }
    },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const RoomFeaturesSchema = new Schema<IRoomFeatures>(
  {
    bedType: { type: String, required: true },
    maxOccupancy: { type: Number, default: 2 },
    size: { type: Number, required: true },
    sizeUnit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
    view: { type: String, default: 'city' },
    balcony: { type: Boolean, default: false },
    floor: { type: Number, required: true },
    amenities: [{ type: String }],
    smoking: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false }
  },
  { _id: false }
);

const MaintenanceIssueSchema = new Schema(
  {
    reportedAt: { type: Date, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date }
  },
  { _id: false }
);

const MaintenanceSchema = new Schema(
  {
    lastService: { type: Date },
    nextService: { type: Date },
    issues: [MaintenanceIssueSchema]
  },
  { _id: false }
);

export const RoomTwinSchema = new Schema<IRoomTwin>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    floor: { type: Number, required: true },
    roomNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'penthouse', 'villa', 'accessible'],
      default: 'standard'
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'out-of-order', 'cleaning', 'do-not-disturb'],
      default: 'available'
    },
    occupancy: {
      type: String,
      enum: ['vacant', 'occupied', 'checked-out', 'reserved'],
      default: 'vacant'
    },
    currentGuestId: { type: String, index: true },
    currentReservationId: { type: String, index: true },
    iot: {
      devices: [IoTDeviceSchema],
      state: { type: IoTStateSchema, required: true },
      lastSync: { type: Date, default: Date.now }
    },
    features: { type: RoomFeaturesSchema, required: true },
    maintenance: { type: MaintenanceSchema }
  },
  {
    timestamps: true
  }
);

export const GuestTwinSchema = new Schema<IGuestTwin>(
  {
    guestId: { type: String, required: true, unique: true, index: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      nationality: String,
      idType: String,
      idNumber: String,
      dateOfBirth: Date,
      profileImage: String
    },
    loyalty: {
      tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], default: 'bronze' },
      points: { type: Number, default: 0 },
      lifetimePoints: { type: Number, default: 0 },
      memberSince: { type: Date, default: Date.now }
    },
    preferences: {
      room: {
        temperature: { type: Number, default: 22 },
        lighting: { type: Number, default: 50 },
        pillowType: { type: String, default: 'standard' },
        bedConfiguration: { type: String, default: 'queen' }
      },
      amenities: [{ type: String }],
      dietary: [{ type: String }],
      accessibility: [{ type: String }],
      language: { type: String, default: 'en' },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
      }
    },
    stayHistory: [
      {
        reservationId: String,
        propertyId: String,
        roomId: String,
        checkIn: Date,
        checkOut: Date,
        totalSpend: Number,
        feedback: {
          rating: Number,
          comment: String
        }
      }
    ],
    sentiment: {
      overall: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
      sources: [{ type: String }]
    }
  },
  {
    timestamps: true
  }
);

export const PropertyTwinSchema = new Schema<IPropertyTwin>(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    type: {
      type: String,
      enum: ['hotel', 'resort', 'boutique', 'hostel', 'aparthotel'],
      default: 'hotel'
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: String
    },
    venues: [
      {
        venueId: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'conference', 'lounge'],
          required: true
        },
        capacity: { type: Number, default: 0 },
        operatingHours: {
          open: { type: String },
          close: { type: String },
          days: [{ type: Number }]
        },
        amenities: [{ type: String }]
      }
    ],
    amenities: [{ type: String }],
    policies: {
      checkInTime: { type: String, default: '15:00' },
      checkOutTime: { type: String, default: '11:00' },
      cancellationPolicy: { type: String, default: 'flexible' },
      petPolicy: { type: String, default: 'not-allowed' },
      smokingPolicy: { type: String, default: 'not-allowed' },
      paymentMethods: [{ type: String }],
      depositRequired: { type: Boolean, default: true },
      depositAmount: { type: Number, default: 0 }
    },
    revenueCenters: [
      {
        centerId: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['fnb', 'spa', 'retail', 'parking', 'laundry', 'business'],
          required: true
        },
        revenue: { type: Number, default: 0 },
        target: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' }
      }
    ],
    stats: {
      totalRooms: { type: Number, default: 0 },
      availableRooms: { type: Number, default: 0 },
      occupancyRate: { type: Number, default: 0 },
      avgDailyRate: { type: Number, default: 0 },
      revPAR: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// Models
// ============================================

export const RoomTwin = mongoose.model<IRoomTwin>('RoomTwin', RoomTwinSchema);
export const GuestTwin = mongoose.model<IGuestTwin>('GuestTwin', GuestTwinSchema);
export const PropertyTwin = mongoose.model<IPropertyTwin>('PropertyTwin', PropertyTwinSchema);
