import mongoose, { Document, Schema, Types } from 'mongoose';

// Geo location interface
export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  updatedAt: Date;
}

// Rider document interface
export interface IRider extends Document {
  name: string;
  phone: string;
  email?: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: GeoLocation;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  vehicleType: 'bike' | 'scooter' | 'cycle';
  vehicleNumber?: string;
  zones: string[];
  shift: {
    start: string; // HH:mm format
    end: string;
  };
  documents: {
    license?: string;
    insurance?: string;
    aadhar?: string;
    verified: boolean;
  };
  metrics: {
    averageDeliveryTime: number; // in minutes
    onTimeRate: number; // percentage
    customerRating: number;
  };
  earnings: {
    today: number;
    week: number;
    month: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Geo location schema
const GeoLocationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: { type: [Number], required: true }, // [lng, lat]
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Shift schema
const ShiftSchema = new Schema({
  start: { type: String, required: true }, // HH:mm
  end: { type: String, required: true }
}, { _id: false });

// Documents schema
const DocumentsSchema = new Schema({
  license: { type: String },
  insurance: { type: String },
  aadhar: { type: String },
  verified: { type: Boolean, default: false }
}, { _id: false });

// Metrics schema
const MetricsSchema = new Schema({
  averageDeliveryTime: { type: Number, default: 0 },
  onTimeRate: { type: Number, default: 100 },
  customerRating: { type: Number, default: 5 }
}, { _id: false });

// Earnings schema
const EarningsSchema = new Schema({
  today: { type: Number, default: 0 },
  week: { type: Number, default: 0 },
  month: { type: Number, default: 0 }
}, { _id: false });

// Main rider schema
const RiderSchema = new Schema<IRider>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline',
    index: true
  },
  currentLocation: {
    type: GeoLocationSchema,
    index: '2dsphere'
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  totalDeliveries: {
    type: Number,
    default: 0
  },
  completedDeliveries: {
    type: Number,
    default: 0
  },
  cancelledDeliveries: {
    type: Number,
    default: 0
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'cycle'],
    required: true
  },
  vehicleNumber: {
    type: String,
    uppercase: true
  },
  zones: [{
    type: String
  }],
  shift: {
    type: ShiftSchema,
    required: true
  },
  documents: {
    type: DocumentsSchema,
    default: () => ({ verified: false })
  },
  metrics: {
    type: MetricsSchema,
    default: () => ({})
  },
  earnings: {
    type: EarningsSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  collection: 'riders'
});

// Compound indexes
RiderSchema.index({ status: 1, 'currentLocation': '2dsphere' });
RiderSchema.index({ zones: 1, status: 1 });
RiderSchema.index({ rating: -1 });

// Instance method to update location
RiderSchema.methods.updateLocation = function(lat: number, lng: number) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [lng, lat],
    updatedAt: new Date()
  };
  return this.save();
};

// Instance method to set status
RiderSchema.methods.setStatus = function(status: 'available' | 'busy' | 'offline') {
  this.status = status;
  return this.save();
};

// Instance method to mark delivery complete
RiderSchema.methods.completeDelivery = function(deliveryTimeMinutes: number, wasOnTime: boolean) {
  this.totalDeliveries += 1;
  this.completedDeliveries += 1;

  // Update metrics
  const currentAvg = this.metrics.averageDeliveryTime;
  const totalDeliveries = this.totalDeliveries;
  this.metrics.averageDeliveryTime =
    Math.round((currentAvg * (totalDeliveries - 1) + deliveryTimeMinutes) / totalDeliveries);

  if (wasOnTime) {
    const onTimeDeliveries = Math.round(this.metrics.onTimeRate * (this.totalDeliveries - 1) / 100) + 1;
    this.metrics.onTimeRate = Math.round(onTimeDeliveries / this.totalDeliveries * 100);
  }

  return this.save();
};

// Instance method to cancel delivery
RiderSchema.methods.cancelDelivery = function() {
  this.cancelledDeliveries += 1;
  return this.save();
};

// Static method to find available riders near a location
RiderSchema.statics.findNearby = function(lng: number, lat: number, maxDistanceKm: number = 5) {
  return this.find({
    status: 'available',
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistanceKm * 1000 // convert to meters
      }
    }
  });
};

// Static method to get all available riders
RiderSchema.statics.getAvailable = function() {
  return this.find({ status: 'available' });
};

// Static method to find riders in a zone
RiderSchema.statics.findByZone = function(zone: string) {
  return this.find({
    zones: zone,
    status: { $ne: 'offline' }
  });
};

// Static method to get rider leaderboard
RiderSchema.statics.getLeaderboard = function(limit: number = 10) {
  return this.find()
    .sort({ totalDeliveries: -1, rating: -1 })
    .limit(limit)
    .select('name rating totalDeliveries completedDeliveries vehicleType');
};

export const Rider = mongoose.model<IRider>('Rider', RiderSchema);
export default Rider;
