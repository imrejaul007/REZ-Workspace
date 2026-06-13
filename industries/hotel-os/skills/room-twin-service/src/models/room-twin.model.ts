import mongoose, { Schema, Document } from 'mongoose';
import {
  RoomTwinDocument,
  RoomType,
  RoomView,
  RoomStatus,
  BedType,
  ThermostatMode,
  BlindState,
  DoorLockState,
  MinibarDoorState,
  HousekeepingFrequency,
  SupplyStatus
} from '../schemas/room-twin.schema';

export interface IRoomTwinModel extends Omit<RoomTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Sub-schemas
const RoomCapacitySchema = new Schema({
  maxAdults: { type: Number, required: true, min: 1 },
  maxChildren: { type: Number, default: 0 },
  maxOccupancy: { type: Number, required: true, min: 1 }
}, { _id: false });

const BedConfigurationSchema = new Schema({
  bedCount: { type: Number, required: true, min: 1 },
  bedType: { type: String, enum: Object.values(BedType), required: true },
  rollawayAvailable: { type: Boolean, default: false }
}, { _id: false });

const RoomAmenitiesSchema = new Schema({
  smartTv: { type: Boolean, default: false },
  smartSpeaker: { type: Boolean, default: false },
  minibar: { type: Boolean, default: false },
  coffeeMachine: { type: Boolean, default: false },
  safe: { type: Boolean, default: false },
  balcony: { type: Boolean, default: false },
  jacuzzi: { type: Boolean, default: false }
}, { _id: false });

const ThermostatStateSchema = new Schema({
  current: { type: Number, default: 72 },
  target: { type: Number, default: 72 },
  mode: { type: String, enum: Object.values(ThermostatMode), default: ThermostatMode.AUTO }
}, { _id: false });

const LightingStateSchema = new Schema({
  scene: { type: String, default: 'default' },
  brightness: { type: Number, min: 0, max: 100, default: 80 }
}, { _id: false });

const IoTStateSchema = new Schema({
  thermostat: { type: ThermostatStateSchema },
  lighting: { type: LightingStateSchema },
  blinds: { type: String, enum: Object.values(BlindState), default: BlindState.CLOSED },
  doorLock: { type: String, enum: Object.values(DoorLockState), default: DoorLockState.LOCKED },
  minibarDoor: { type: String, enum: Object.values(MinibarDoorState), default: MinibarDoorState.CLOSED },
  occupancySensor: { type: Boolean, default: false }
}, { _id: false });

const HousekeepingInfoSchema = new Schema({
  lastCleaned: { type: String },
  nextScheduled: { type: String },
  frequency: {
    type: String,
    enum: Object.values(HousekeepingFrequency),
    default: HousekeepingFrequency.DAILY
  },
  supplyStatus: {
    type: String,
    enum: Object.values(SupplyStatus),
    default: SupplyStatus.ADEQUATE
  }
}, { _id: false });

const RoomRevenueSchema = new Schema({
  baseRate: { type: Number, default: 0 },
  rackRate: { type: Number, default: 0 },
  minibarBalance: { type: Number, default: 0 },
  lastRateUpdate: { type: String }
}, { _id: false });

const RoomStatusInfoSchema = new Schema({
  current: {
    type: String,
    enum: Object.values(RoomStatus),
    default: RoomStatus.AVAILABLE
  },
  nextAvailable: { type: String },
  maintenanceAlerts: [{ type: String }]
}, { _id: false });

// Main Room Twin Schema
const RoomTwinSchema = new Schema<IRoomTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    propertyId: {
      type: String,
      required: true,
      index: true
    },
    roomNumber: {
      type: String,
      required: true,
      index: true
    },
    roomType: {
      type: String,
      enum: Object.values(RoomType),
      required: true
    },
    floor: {
      type: Number,
      required: true,
      min: 0
    },
    view: {
      type: String,
      enum: Object.values(RoomView),
      required: true
    },
    capacity: {
      type: RoomCapacitySchema,
      required: true
    },
    bedConfiguration: {
      type: BedConfigurationSchema,
      required: true
    },
    amenities: {
      type: RoomAmenitiesSchema,
      required: true,
      default: () => ({})
    },
    status: {
      type: RoomStatusInfoSchema,
      required: true,
      default: () => ({})
    },
    iotState: {
      type: IoTStateSchema,
      required: true,
      default: () => ({})
    },
    housekeeping: {
      type: HousekeepingInfoSchema,
      required: true,
      default: () => ({})
    },
    revenue: {
      type: RoomRevenueSchema,
      required: true,
      default: () => ({})
    },
    currentGuestId: {
      type: String,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
RoomTwinSchema.index({ 'status.current': 1 });
RoomTwinSchema.index({ roomType: 1 });
RoomTwinSchema.index({ floor: 1 });
RoomTwinSchema.index({ 'revenue.baseRate': 1 });
RoomTwinSchema.index({ currentGuestId: 1 });

// Instance methods
RoomTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.hotel.room.${this.roomId}`;
};

RoomTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    roomId: obj.roomId,
    propertyId: obj.propertyId,
    roomNumber: obj.roomNumber,
    roomType: obj.roomType,
    floor: obj.floor,
    view: obj.view,
    capacity: obj.capacity,
    bedConfiguration: obj.bedConfiguration,
    amenities: obj.amenities,
    status: obj.status,
    iotState: obj.iotState,
    housekeeping: obj.housekeeping,
    revenue: obj.revenue,
    currentGuestId: obj.currentGuestId,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// Static methods
RoomTwinSchema.statics.findByRoomId = function(roomId: string) {
  return this.findOne({ roomId });
};

RoomTwinSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId });
};

RoomTwinSchema.statics.findByStatus = function(status: RoomStatus) {
  return this.find({ 'status.current': status });
};

RoomTwinSchema.statics.findAvailableRooms = function(propertyId: string) {
  return this.find({
    propertyId,
    'status.current': RoomStatus.AVAILABLE
  });
};

RoomTwinSchema.statics.findOccupiedRooms = function(propertyId: string) {
  return this.find({
    propertyId,
    'status.current': RoomStatus.OCCUPIED
  });
};

RoomTwinSchema.statics.findByFloor = function(propertyId: string, floor: number) {
  return this.find({ propertyId, floor });
};

// Export model
export const RoomTwin = mongoose.model<IRoomTwinModel>('RoomTwin', RoomTwinSchema);
