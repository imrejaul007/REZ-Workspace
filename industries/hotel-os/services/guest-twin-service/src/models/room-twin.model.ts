import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================================================
// ROOM TWIN DOCUMENT INTERFACE
// ============================================================================

export interface IRoomTwin extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  room_id: string;
  twin_id: string;
  property_id?: string;
  room_number: string;
  room_type: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible';
  floor: number;

  // Room details
  view: 'city' | 'pool' | 'garden' | 'ocean' | 'mountain';
  capacity: {
    max_adults: number;
    max_children: number;
    max_occupancy: number;
  };
  bed_configuration: {
    bed_count: number;
    bed_type: 'king' | 'queen' | 'twin' | 'bunk';
    rollaway_available: boolean;
  };
  amenities: {
    smart_tv: boolean;
    smart_speaker: boolean;
    minibar: boolean;
    coffee_machine: boolean;
    safe: boolean;
    balcony: boolean;
    jacuzzi: boolean;
  };

  // Status
  status: {
    current: 'available' | 'occupied' | 'blocked' | 'out_of_order' | 'cleaning' | 'inspected';
    next_available?: Date;
    maintenance_alerts: string[];
  };

  // IoT state
  iot_state: {
    thermostat?: {
      current: number;
      target: number;
      mode: 'heat' | 'cool' | 'auto' | 'off';
    };
    lighting?: {
      scene: string;
      brightness: number;
    };
    blinds?: 'open' | 'closed' | 'partial';
    door_lock?: 'locked' | 'unlocked';
    minibar_door?: 'closed' | 'open';
    occupancy_sensor?: boolean;
  };

  // Housekeeping
  housekeeping: {
    last_cleaned?: Date;
    next_scheduled?: Date;
    frequency: 'daily' | 'weekly' | 'on_departure';
    supply_status: 'adequate' | 'low' | 'critical';
  };

  // Revenue
  revenue: {
    base_rate: number;
    rack_rate: number;
    minibar_balance: number;
    last_rate_update?: Date;
  };

  // Current guest
  current_guest_id?: string;

  // Metadata
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ROOM TWIN SCHEMA
// ============================================================================

const RoomTwinSchema = new Schema<IRoomTwin>({
  room_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  twin_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  property_id: {
    type: String,
    index: true,
  },
  room_number: {
    type: String,
    required: true,
  },
  room_type: {
    type: String,
    enum: ['standard', 'deluxe', 'suite', 'penthouse', 'accessible'],
    default: 'standard',
  },
  floor: {
    type: Number,
    required: true,
  },
  view: {
    type: String,
    enum: ['city', 'pool', 'garden', 'ocean', 'mountain'],
    default: 'city',
  },

  // Capacity
  capacity: {
    max_adults: { type: Number, default: 2, min: 1 },
    max_children: { type: Number, default: 0, min: 0 },
    max_occupancy: { type: Number, default: 2, min: 1 },
  },

  // Bed configuration
  bed_configuration: {
    bed_count: { type: Number, default: 1, min: 1 },
    bed_type: { type: String, enum: ['king', 'queen', 'twin', 'bunk'], default: 'king' },
    rollaway_available: { type: Boolean, default: false },
  },

  // Amenities
  amenities: {
    smart_tv: { type: Boolean, default: false },
    smart_speaker: { type: Boolean, default: false },
    minibar: { type: Boolean, default: false },
    coffee_machine: { type: Boolean, default: false },
    safe: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    jacuzzi: { type: Boolean, default: false },
  },

  // Status
  status: {
    current: {
      type: String,
      enum: ['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected'],
      default: 'available',
    },
    next_available: Date,
    maintenance_alerts: [{ type: String }],
  },

  // IoT state
  iot_state: {
    thermostat: {
      current: Number,
      target: Number,
      mode: String,
    },
    lighting: {
      scene: String,
      brightness: { type: Number, min: 0, max: 100 },
    },
    blinds: String,
    door_lock: String,
    minibar_door: String,
    occupancy_sensor: Boolean,
  },

  // Housekeeping
  housekeeping: {
    last_cleaned: Date,
    next_scheduled: Date,
    frequency: { type: String, enum: ['daily', 'weekly', 'on_departure'], default: 'daily' },
    supply_status: { type: String, enum: ['adequate', 'low', 'critical'], default: 'adequate' },
  },

  // Revenue
  revenue: {
    base_rate: { type: Number, default: 0, min: 0 },
    rack_rate: { type: Number, default: 0, min: 0 },
    minibar_balance: { type: Number, default: 0, min: 0 },
    last_rate_update: Date,
  },

  // Current guest
  current_guest_id: {
    type: String,
    index: true,
  },

  // Metadata
  version: { type: Number, default: 1 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes
RoomTwinSchema.index({ property_id: 1, room_type: 1 });
RoomTwinSchema.index({ property_id: 1, 'status.current': 1 });
RoomTwinSchema.index({ property_id: 1, floor: 1 });
RoomTwinSchema.index({ current_guest_id: 1 }, { sparse: true });

// Virtual for id
RoomTwinSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

RoomTwinSchema.set('toJSON', { virtuals: true });
RoomTwinSchema.set('toObject', { virtuals: true });

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const RoomTwinModel: Model<IRoomTwin> = mongoose.model<IRoomTwin>('RoomTwin', RoomTwinSchema);