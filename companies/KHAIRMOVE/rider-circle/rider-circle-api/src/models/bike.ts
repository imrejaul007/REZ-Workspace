/**
 * Bike Digital Twin Model
 * MongoDB schema for motorcycle digital twins with health tracking, maintenance, and document management
 * @module models/bike
 * @author RiderCircle Team
 * @version 1.0.0
 */

import mongoose, { Document, Schema } from 'mongoose';

/**
 * Service record for bike maintenance history
 * @interface IServiceRecord
 */
export interface IServiceRecord {
  /** Date of service */
  date: Date;
  /** Type of service performed */
  type: 'regular' | 'repair' | 'upgrade' | 'accident';
  /** Description of the service */
  description: string;
  /** Odometer reading at service */
  odometer: number;
  /** Cost of service in INR */
  cost?: number;
  /** Name of service center */
  serviceCenter?: string;
  /** Additional notes */
  notes?: string;
  /** URLs to receipts/invoices */
  documents?: string[];
}

/**
 * Document metadata for RC, insurance, PUC
 * @interface IDocumentMeta
 */
export interface IDocumentMeta {
  /** Document number (e.g., registration number) */
  number: string;
  /** Issue date */
  issueDate?: Date;
  /** Expiry date */
  expiryDate?: Date;
  /** URL to document scan */
  url?: string;
  /** Whether document is verified */
  verified: boolean;
  /** Verification timestamp */
  verifiedAt?: Date;
}

/**
 * AI-predicted dates for maintenance items
 * @interface IBikePredictions
 */
export interface IBikePredictions {
  /** Predicted tire replacement date */
  tireReplacementDue?: Date;
  /** Next recommended service date */
  nextServiceDate?: Date;
  /** Insurance renewal date */
  insuranceRenewal?: Date;
  /** PUC expiry date */
  pucExpiry?: Date;
  /** Predicted battery health decline date */
  batteryHealthDecline?: Date;
}

/**
 * Bike Digital Twin - Complete motorcycle profile with health tracking
 * @interface IBikeDigitalTwin
 * @extends Document
 */
export interface IBikeDigitalTwin extends Document {
  // Ownership
  /** Owner rider's ObjectId */
  riderId: mongoose.Types.ObjectId;
  /** Whether this is the primary bike */
  isPrimary: boolean;

  // Identity
  /** User-defined nickname for the bike */
  nickname: string;
  /** Manufacturer name (Royal Enfield, Yamaha, KTM, Honda, etc.) */
  make: string;
  /** Model name (Himalayan 450, MT-15, Duke 390, etc.) */
  modelName: string;
  /** Manufacturing year */
  year: number;
  /** Vehicle Identification Number */
  vin: string;
  /** License plate number */
  registrationNumber: string;
  /** Bike color */
  color: string;

  // Specs
  /** Engine displacement in CC */
  engineCC: number;
  /** Horsepower rating */
  horsepower?: number;
  /** Torque rating */
  torque?: number;
  /** Fuel tank capacity in liters */
  fuelCapacity: number;
  /** Dry weight in kg */
  weight?: number;

  // Digital Profile
  /** Current odometer reading */
  odometer: number;
  /** Fuel type */
  fuelType: 'petrol' | 'electric' | 'hybrid';
  /** Avatar image URL */
  avatar?: string;
  /** Cover image URL */
  coverImage?: string;

  // Maintenance
  /** Service history records */
  serviceHistory: IServiceRecord[];
  /** Next service details */
  nextServiceDue: {
    /** Service type */
    type: string;
    /** Km remaining until service */
    dueAt: number;
    /** Due date */
    dueDate?: Date;
  };
  /** Tire health percentages */
  tireHealth: {
    /** Front tire health (0-100) */
    front: number;
    /** Rear tire health (0-100) */
    rear: number;
    /** Last replacement date */
    lastReplaced?: Date;
  };
  /** Chain condition (0-100) */
  chainCondition: number;
  /** Brake health percentages */
  brakeHealth: {
    /** Front brake health (0-100) */
    front: number;
    /** Rear brake health (0-100) */
    rear: number;
  };
  /** Engine oil condition (0-100) */
  oilCondition: number;
  /** Battery health (0-100) */
  batteryHealth: number;

  // Documents
  /** Vehicle documents */
  documents: {
    /** Registration certificate */
    registration: IDocumentMeta;
    /** Insurance policy */
    insurance: IDocumentMeta;
    /** Pollution certificate (PUC) */
    pollution: IDocumentMeta;
  };

  /** AI-computed overall health score (0-100) */
  overallHealth: number;

  /** AI-predicted maintenance dates */
  predictions: IBikePredictions;

  // Usage Stats
  /** Total rides completed */
  totalRides: number;
  /** Total distance traveled in km */
  totalDistance: number;
  /** Average fuel efficiency in km/l */
  fuelEfficiency: number;

  // Preferences
  /** Preferred route ObjectIds */
  preferredRoutes: mongoose.Types.ObjectId[];
  /** Favorite stop names */
  favoriteStops: string[];

  // Status
  /** Whether bike is active */
  isActive: boolean;
  /** Whether bike is reported stolen */
  isStolen: boolean;

  /** Document creation timestamp */
  createdAt: Date;
  /** Document update timestamp */
  updatedAt: Date;
}

/**
 * Schema for service records
 * @private
 */
const ServiceRecordSchema = new Schema<IServiceRecord>({
  date: { type: Date, required: true },
  type: { type: String, enum: ['regular', 'repair', 'upgrade', 'accident'], required: true },
  description: { type: String, required: true },
  odometer: { type: Number, required: true },
  cost: { type: Number },
  serviceCenter: { type: String },
  notes: { type: String },
  documents: [{ type: String }],
}, { _id: false });

/**
 * Schema for document metadata
 * @private
 */
const DocumentMetaSchema = new Schema<IDocumentMeta>({
  number: { type: String, required: true },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  url: { type: String },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
}, { _id: false });

/**
 * Main bike digital twin schema
 * @private
 */
const BikeDigitalTwinSchema = new Schema<IBikeDigitalTwin>({
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'RiderProfile',
    required: true,
    index: true,
  },
  isPrimary: { type: Boolean, default: false },

  // Identity
  nickname: { type: String, required: true, trim: true, maxlength: 30 },
  make: { type: String, required: true, trim: true },
  modelName: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  vin: { type: String, trim: true, uppercase: true },
  registrationNumber: { type: String, required: true, trim: true, uppercase: true },
  color: { type: String, trim: true },

  // Specs
  engineCC: { type: Number, required: true },
  horsepower: { type: Number },
  torque: { type: Number },
  fuelCapacity: { type: Number, required: true },
  weight: { type: Number },

  // Digital Profile
  odometer: { type: Number, default: 0 },
  fuelType: { type: String, enum: ['petrol', 'electric', 'hybrid'], default: 'petrol' },
  avatar: { type: String },
  coverImage: { type: String },

  // Maintenance
  serviceHistory: [ServiceRecordSchema],
  nextServiceDue: {
    type: { type: String },
    dueAt: { type: Number },
    dueDate: { type: Date },
  },
  tireHealth: {
    front: { type: Number, default: 100, min: 0, max: 100 },
    rear: { type: Number, default: 100, min: 0, max: 100 },
    lastReplaced: { type: Date },
  },
  chainCondition: { type: Number, default: 100, min: 0, max: 100 },
  brakeHealth: {
    front: { type: Number, default: 100, min: 0, max: 100 },
    rear: { type: Number, default: 100, min: 0, max: 100 },
  },
  oilCondition: { type: Number, default: 100, min: 0, max: 100 },
  batteryHealth: { type: Number, default: 100, min: 0, max: 100 },

  // Documents
  documents: {
    registration: { type: DocumentMetaSchema, required: true },
    insurance: { type: DocumentMetaSchema, required: true },
    pollution: { type: DocumentMetaSchema },
  },

  // Health Score
  overallHealth: { type: Number, default: 100, min: 0, max: 100 },

  // Predictions
  predictions: {
    tireReplacementDue: { type: Date },
    nextServiceDate: { type: Date },
    insuranceRenewal: { type: Date },
    pucExpiry: { type: Date },
    batteryHealthDecline: { type: Date },
  },

  // Usage Stats
  totalRides: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 },
  fuelEfficiency: { type: Number, default: 0 },

  // Preferences
  preferredRoutes: [{ type: Schema.Types.ObjectId, ref: 'Route' }],
  favoriteStops: [{ type: String }],

  // Status
  isActive: { type: Boolean, default: true },
  isStolen: { type: Boolean, default: false },

}, {
  timestamps: true,
});

// Indexes for efficient querying
BikeDigitalTwinSchema.index({ riderId: 1, isPrimary: -1 });
BikeDigitalTwinSchema.index({ registrationNumber: 1 }, { unique: true });
BikeDigitalTwinSchema.index({ vin: 1 });
BikeDigitalTwinSchema.index({ make: 1, model: 1 });
BikeDigitalTwinSchema.index({ overallHealth: -1 });

/**
 * Pre-save middleware - calculates overall health score
 * Weighted: tires 20%, chain 10%, brakes 15%, oil 10%, battery 10%, documents 35%
 * @private
 */
BikeDigitalTwinSchema.pre('save', function(next) {
  const weights = {
    tire: 0.2,
    chain: 0.1,
    brake: 0.15,
    oil: 0.1,
    battery: 0.1,
    documents: 0.35,
  };

  const tireAvg = (this.tireHealth.front + this.tireHealth.rear) / 2;
  const brakeAvg = (this.brakeHealth.front + this.brakeHealth.rear) / 2;

  // Document expiry penalty
  let documentScore = 100;
  const now = new Date();

  if (this.documents.insurance.expiryDate && this.documents.insurance.expiryDate < now) {
    documentScore -= 30;
  }
  if (this.documents.pollution?.expiryDate && this.documents.pollution.expiryDate < now) {
    documentScore -= 20;
  }

  this.overallHealth = Math.round(
    (tireAvg * weights.tire) +
    (this.chainCondition * weights.chain) +
    (brakeAvg * weights.brake) +
    (this.oilCondition * weights.oil) +
    (this.batteryHealth * weights.battery) +
    (documentScore * weights.documents)
  );

  next();
});

/**
 * Add a service record to the bike
 * @param {IServiceRecord} record - Service record to add
 * @returns {Promise<void>}
 * @example
 * await bike.addServiceRecord({
 *   date: new Date(),
 *   type: 'regular',
 *   description: 'Oil change',
 *   odometer: 15000
 * });
 */
BikeDigitalTwinSchema.methods.addServiceRecord = async function(record: IServiceRecord) {
  this.serviceHistory.push(record);
  this.odometer = Math.max(this.odometer, record.odometer);
  await this.save();
};

/**
 * Update the odometer reading
 * @param {number} km - New odometer reading in km
 * @returns {Promise<void>}
 */
BikeDigitalTwinSchema.methods.updateOdometer = async function(km: number) {
  this.odometer = km;
  await this.save();
};

/**
 * Update a specific health component
 * @param {string} component - Component to update (frontTire, rearTire, chain, frontBrake, rearBrake, oil, battery)
 * @param {number} value - New health value (0-100)
 * @returns {Promise<void>}
 */
BikeDigitalTwinSchema.methods.updateHealth = async function(component: string, value: number) {
  switch (component) {
    case 'frontTire':
      this.tireHealth.front = value;
      break;
    case 'rearTire':
      this.tireHealth.rear = value;
      break;
    case 'chain':
      this.chainCondition = value;
      break;
    case 'frontBrake':
      this.brakeHealth.front = value;
      break;
    case 'rearBrake':
      this.brakeHealth.rear = value;
      break;
    case 'oil':
      this.oilCondition = value;
      break;
    case 'battery':
      this.batteryHealth = value;
      break;
  }
  await this.save();
};

/**
 * Bike Digital Twin model for MongoDB
 * @constant
 * @type {mongoose.Model<IBikeDigitalTwin>}
 */
export const BikeDigitalTwin = mongoose.model<IBikeDigitalTwin>('BikeDigitalTwin', BikeDigitalTwinSchema);
