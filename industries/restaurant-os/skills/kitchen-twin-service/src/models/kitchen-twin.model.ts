import mongoose, { Schema, Document } from 'mongoose';
import {
  KitchenTwinDocument,
  Station,
  KitchenAlert,
  defaultStations
} from '../schemas/kitchen-twin.schema';

export interface IKitchenTwinModel extends Omit<KitchenTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

const StationSchema = new Schema({
  stationId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  assignedItems: [{ type: String }],
  currentOrders: [{ type: String }],
  capacity: { type: Number, default: 5 },
  status: { type: String, default: 'open' },
  avgCookTime: { type: Number, default: 10 },
  currentLoad: { type: Number, default: 0 }
}, { _id: false });

const KitchenAlertSchema = new Schema({
  type: { type: String, required: true },
  message: { type: String, required: true },
  stationId: { type: String },
  timestamp: { type: String, required: true }
}, { _id: false });

const KitchenTwinSchema = new Schema<IKitchenTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    kitchenId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    restaurantId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    stations: [{
      type: StationSchema
    }],
    activeOrders: [{ type: String }],
    pendingOrders: { type: Number, default: 0 },
    avgOrderCompletionTime: { type: Number, default: 0 },
    peakHourThroughput: { type: Number, default: 0 },
    currentUtilization: { type: Number, default: 0 },
    alerts: [{ type: KitchenAlertSchema }]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

KitchenTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.kitchen.${this.kitchenId}`;
};

KitchenTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    kitchenId: obj.kitchenId,
    restaurantId: obj.restaurantId,
    name: obj.name,
    stations: obj.stations,
    activeOrders: obj.activeOrders,
    pendingOrders: obj.pendingOrders,
    avgOrderCompletionTime: obj.avgOrderCompletionTime,
    peakHourThroughput: obj.peakHourThroughput,
    currentUtilization: obj.currentUtilization,
    alerts: obj.alerts,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

KitchenTwinSchema.statics.findByKitchenId = function(kitchenId: string) {
  return this.findOne({ kitchenId });
};

KitchenTwinSchema.statics.findByRestaurantId = function(restaurantId: string) {
  return this.findOne({ restaurantId });
};

export const KitchenTwin = mongoose.model<IKitchenTwinModel>('KitchenTwin', KitchenTwinSchema);
