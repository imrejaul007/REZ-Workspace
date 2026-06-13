import mongoose, { Schema, Document } from 'mongoose';
import { RoomTwin } from '../types/twin.types';

export interface IRoomTwin extends Omit<RoomTwin, 'created_at' | 'updated_at'>, Document {
  created_at: Date;
  updated_at: Date;
}

const RoomTwinSchema = new Schema<IRoomTwin>(
  {
    room_id: { type: String, required: true, unique: true, index: true },
    property_id: { type: String, required: true, index: true },
    room_number: { type: String, required: true },
    room_type: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'],
      required: true,
    },
    floor: { type: Number, required: true },
    view: {
      type: String,
      enum: ['city', 'pool', 'garden', 'ocean', 'mountain'],
      default: 'city',
    },
    capacity: {
      max_adults: { type: Number, default: 2 },
      max_children: { type: Number, default: 1 },
      max_occupancy: { type: Number, default: 3 },
    },
    bed_configuration: {
      bed_count: { type: Number, default: 1 },
      bed_type: { type: String, enum: ['king', 'queen', 'twin', 'bunk'], default: 'king' },
      rollaway_available: { type: Boolean, default: false },
    },
    amenities: {
      smart_tv: { type: Boolean, default: false },
      smart_speaker: { type: Boolean, default: false },
      minibar: { type: Boolean, default: true },
      coffee_machine: { type: Boolean, default: false },
      safe: { type: Boolean, default: true },
      balcony: { type: Boolean, default: false },
      jacuzzi: { type: Boolean, default: false },
    },
    status: {
      current: {
        type: String,
        enum: ['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected'],
        default: 'available',
      },
      next_available: { type: String },
      maintenance_alerts: [{ type: String }],
    },
    iot_state: {
      thermostat: {
        current: { type: Number, default: 22 },
        target: { type: Number, default: 22 },
        mode: { type: String, default: 'auto' },
      },
      lighting: {
        scene: { type: String, default: 'relax' },
        brightness: { type: Number, default: 70 },
      },
      blinds: { type: String, enum: ['open', 'closed', 'partial'], default: 'closed' },
      door_lock: { type: String, enum: ['locked', 'unlocked'], default: 'locked' },
      minibar_door: { type: String, enum: ['closed', 'open'], default: 'closed' },
      occupancy_sensor: { type: Boolean, default: false },
    },
    revenue: {
      base_rate: { type: Number, required: true },
      rack_rate: { type: Number, required: true },
      minibar_balance: { type: Number, default: 0 },
      last_rate_update: { type: String },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient queries
RoomTwinSchema.index({ room_type: 1, 'status.current': 1 });
RoomTwinSchema.index({ property_id: 1, floor: 1 });
RoomTwinSchema.index({ 'revenue.base_rate': 1 });
RoomTwinSchema.index({ 'revenue.rack_rate': 1 });

// Virtual for upgrade path
RoomTwinSchema.virtual('upgrade_path').get(function (this: IRoomTwin) {
  const upgradeMap: Record<string, string> = {
    standard: 'deluxe',
    deluxe: 'suite',
    suite: 'penthouse',
    penthouse: 'penthouse',
    accessible: 'standard',
  };
  return upgradeMap[this.room_type] || this.room_type;
});

export const RoomTwinModel = mongoose.model<IRoomTwin>('RoomTwin', RoomTwinSchema);