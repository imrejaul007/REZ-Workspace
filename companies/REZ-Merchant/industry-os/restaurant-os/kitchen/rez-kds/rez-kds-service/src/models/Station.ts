import mongoose, { Document, Schema } from 'mongoose';
import { StationType } from '../config';

export interface IStationConfig {
  name: string;
  color: string;
  soundEnabled: boolean;
  autoBumpEnabled: boolean;
  averageItemTime: number; // seconds
}

export interface IStation extends Document {
  stationId: string;
  stationType: StationType;
  name: string;
  displayName: string;
  isActive: boolean;
  isOnline: boolean;
  config: IStationConfig;
  currentOrderCount: number;
  avgCompletionTime: number;
  ordersCompletedToday: number;
  averageTicketTime: number; // seconds
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StationConfigSchema = new Schema<IStationConfig>({
  name: { type: String, required: true },
  color: { type: String, default: '#3B82F6' },
  soundEnabled: { type: Boolean, default: true },
  autoBumpEnabled: { type: Boolean, default: false },
  averageItemTime: { type: Number, default: 300 } // 5 minutes default
}, { _id: false });

const StationSchema = new Schema<IStation>({
  stationId: { type: String, required: true, unique: true, index: true },
  stationType: {
    type: String,
    enum: Object.values(StationType),
    required: true,
    index: true
  },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  isActive: { type: Boolean, default: true, index: true },
  isOnline: { type: Boolean, default: true },
  config: { type: StationConfigSchema, default: () => ({}) },
  currentOrderCount: { type: Number, default: 0 },
  avgCompletionTime: { type: Number, default: 0 },
  ordersCompletedToday: { type: Number, default: 0 },
  averageTicketTime: { type: Number, default: 0 },
  lastActivityAt: { type: Date }
}, {
  timestamps: true
});

// Compound indexes
StationSchema.index({ stationType: 1, isActive: 1 });

// Method to update station metrics
StationSchema.methods.recordCompletion = function(completionTimeSeconds: number) {
  this.ordersCompletedToday += 1;
  this.lastActivityAt = new Date();

  // Rolling average calculation
  const totalTime = this.averageTicketTime * (this.ordersCompletedToday - 1);
  this.averageTicketTime = (totalTime + completionTimeSeconds) / this.ordersCompletedToday;
};

// Static to get or create default stations
StationSchema.statics.initializeDefaultStations = async function() {
  const defaultStations: Array<{
    stationId: string;
    stationType: StationType;
    name: string;
    displayName: string;
    config: IStationConfig;
  }> = [
    {
      stationId: 'station-grill-1',
      stationType: StationType.GRILL,
      name: 'grill-1',
      displayName: 'Grill Station 1',
      config: { name: 'Grill', color: '#EF4444', averageItemTime: 420 }
    },
    {
      stationId: 'station-fryer-1',
      stationType: StationType.FRYER,
      name: 'fryer-1',
      displayName: 'Fryer Station 1',
      config: { name: 'Fryer', color: '#F59E0B', averageItemTime: 240 }
    },
    {
      stationId: 'station-salad-1',
      stationType: StationType.SALAD,
      name: 'salad-1',
      displayName: 'Salad Station 1',
      config: { name: 'Salad', color: '#10B981', averageItemTime: 120 }
    },
    {
      stationId: 'station-dessert-1',
      stationType: StationType.DESSERT,
      name: 'dessert-1',
      displayName: 'Dessert Station 1',
      config: { name: 'Dessert', color: '#EC4899', averageItemTime: 180 }
    },
    {
      stationId: 'station-expo-1',
      stationType: StationType.EXPO,
      name: 'expo-1',
      displayName: 'Expo Station 1',
      config: { name: 'Expo', color: '#8B5CF6', averageItemTime: 60 }
    }
  ];

  for (const stationData of defaultStations) {
    await this.findOneAndUpdate(
      { stationId: stationData.stationId },
      stationData,
      { upsert: true, new: true }
    );
  }
};

export const Station = mongoose.model<IStation>('Station', StationSchema);
