import mongoose, { Schema, Document } from 'mongoose';
import {
  TableTwinDocument,
  TableStatus,
  TableZone,
  defaultTurnTimes,
  defaultTodayMetrics
} from '../schemas/table-twin.schema';

export interface ITableTwinModel extends Omit<TableTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

// Turn Times Schema
const TurnTimesSchema = new Schema({
  seatedAt: { type: String },
  orderPlacedAt: { type: String },
  billRequestedAt: { type: String },
  clearedAt: { type: String }
}, { _id: false });

// Today Metrics Schema
const TodayMetricsSchema = new Schema({
  covers: { type: Number, default: 0 },
  avgTurnTime: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 }
}, { _id: false });

// Main Table Twin Schema
const TableTwinSchema = new Schema<ITableTwinModel>(
  {
    twinId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tableId: {
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
    tableNumber: {
      type: Number,
      required: true
    },
    seats: {
      type: Number,
      required: true,
      min: 1
    },
    zone: {
      type: String,
      enum: Object.values(TableZone),
      default: TableZone.INDOOR
    },
    status: {
      type: String,
      enum: Object.values(TableStatus),
      default: TableStatus.AVAILABLE
    },
    currentSessionId: { type: String },
    currentOrderId: { type: String },
    currentCustomerCount: { type: Number },
    turnTimes: {
      type: TurnTimesSchema,
      default: () => ({})
    },
    todayMetrics: {
      type: TodayMetricsSchema,
      default: () => ({})
    },
    reservationId: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for common queries
TableTwinSchema.index({ restaurantId: 1, status: 1 });
TableTwinSchema.index({ restaurantId: 1, zone: 1 });
TableTwinSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
TableTwinSchema.index({ currentSessionId: 1 });
TableTwinSchema.index({ currentOrderId: 1 });

// Instance methods
TableTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.table.${this.tableId}`;
};

TableTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    tableId: obj.tableId,
    restaurantId: obj.restaurantId,
    tableNumber: obj.tableNumber,
    seats: obj.seats,
    zone: obj.zone,
    status: obj.status,
    currentSessionId: obj.currentSessionId,
    currentOrderId: obj.currentOrderId,
    currentCustomerCount: obj.currentCustomerCount,
    turnTimes: obj.turnTimes,
    todayMetrics: obj.todayMetrics,
    reservationId: obj.reservationId,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// Static methods
TableTwinSchema.statics.findByTableId = function(tableId: string) {
  return this.findOne({ tableId });
};

TableTwinSchema.statics.findByRestaurantId = function(restaurantId: string) {
  return this.find({ restaurantId });
};

TableTwinSchema.statics.findByStatus = function(restaurantId: string, status: TableStatus) {
  return this.find({ restaurantId, status });
};

TableTwinSchema.statics.findAvailableTables = function(restaurantId: string, minSeats: number) {
  return this.find({
    restaurantId,
    status: TableStatus.AVAILABLE,
    seats: { $gte: minSeats }
  }).sort({ seats: 1 });
};

TableTwinSchema.statics.getTableStats = async function(restaurantId: string) {
  const [available, occupied, total] = await Promise.all([
    this.countDocuments({ restaurantId, status: TableStatus.AVAILABLE }),
    this.countDocuments({ restaurantId, status: { $in: [TableStatus.SEATED, TableStatus.ORDERING, TableStatus.EATING, TableStatus.BILLING] } }),
    this.countDocuments({ restaurantId })
  ]);
  return { available, occupied, total };
};

// Export model
export const TableTwin = mongoose.model<ITableTwinModel>('TableTwin', TableTwinSchema);
