import mongoose, { Schema, Document } from 'mongoose';
import {
  InventoryTwinDocument,
  InventoryItem,
  WasteLog,
  ReorderAlert,
  ExpiryAlert
} from '../schemas/inventory-twin.schema';

export interface IInventoryTwinModel extends Omit<InventoryTwinDocument, 'twinId'>, Document {
  _id: mongoose.Types.ObjectId;
}

const SupplierSchema = new Schema({
  supplierId: { type: String, required: true },
  name: { type: String, required: true },
  leadTimeDays: { type: Number, default: 2 },
  costPerUnit: { type: Number, default: 0 },
  minOrderQuantity: { type: Number, default: 1 }
}, { _id: false });

const InventoryItemSchema = new Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  currentStock: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true },
  reorderPoint: { type: Number, default: 10 },
  reorderQuantity: { type: Number, default: 50 },
  costPerUnit: { type: Number, default: 0 },
  expiryDate: { type: String },
  location: { type: String, default: 'main' },
  suppliers: [{ type: SupplierSchema }],
  consumptionRate: { type: Number, default: 0 },
  daysUntilStockout: { type: Number, default: 999 }
}, { _id: false });

const WasteLogSchema = new Schema({
  date: { type: String, required: true },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  estimatedCost: { type: Number, default: 0 }
}, { _id: false });

const ReorderAlertSchema = new Schema({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  currentStock: { type: Number, required: true },
  reorderPoint: { type: Number, required: true },
  urgency: { type: String, required: true },
  suggestedQuantity: { type: Number, required: true },
  estimatedCost: { type: Number, required: true }
}, { _id: false });

const ExpiryAlertSchema = new Schema({
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  expiryDate: { type: String, required: true },
  daysUntilExpiry: { type: Number, required: true },
  currentStock: { type: Number, required: true },
  estimatedValue: { type: Number, required: true }
}, { _id: false });

const InventoryTwinSchema = new Schema<IInventoryTwinModel>(
  {
    twinId: { type: String, required: true, unique: true, index: true },
    inventoryId: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    items: [{ type: InventoryItemSchema }],
    wasteLog: [{ type: WasteLogSchema }],
    totalValue: { type: Number, default: 0 },
    reorderAlerts: [{ type: ReorderAlertSchema }],
    expiringAlerts: [{ type: ExpiryAlertSchema }]
  },
  { timestamps: true, versionKey: false }
);

InventoryTwinSchema.methods.toTwinOsEntityId = function(): string {
  return `twin.restaurant.inventory.${this.inventoryId}`;
};

InventoryTwinSchema.methods.calculateTotalValue = function(): number {
  this.totalValue = this.items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
  return this.totalValue;
};

InventoryTwinSchema.methods.checkReorderPoints = function(): void {
  this.reorderAlerts = this.items
    .filter(item => item.currentStock <= item.reorderPoint)
    .map(item => ({
      itemId: item.itemId,
      itemName: item.name,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
      urgency: item.currentStock <= item.reorderPoint * 0.5 ? 'critical' : item.currentStock <= item.reorderPoint * 0.75 ? 'high' : 'medium',
      suggestedQuantity: item.reorderQuantity,
      estimatedCost: item.reorderQuantity * item.costPerUnit
    }));
};

InventoryTwinSchema.methods.checkExpiryAlerts = function(): void {
  const today = new Date();
  this.expiringAlerts = this.items
    .filter(item => item.expiryDate)
    .map(item => {
      const expiryDate = new Date(item.expiryDate!);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        itemId: item.itemId,
        itemName: item.name,
        expiryDate: item.expiryDate!,
        daysUntilExpiry,
        currentStock: item.currentStock,
        estimatedValue: item.currentStock * item.costPerUnit
      };
    })
    .filter(alert => alert.daysUntilExpiry <= 7)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
};

InventoryTwinSchema.methods.toJSON = function(): object {
  const obj = this.toObject();
  return {
    twinId: obj.twinId,
    inventoryId: obj.inventoryId,
    restaurantId: obj.restaurantId,
    items: obj.items,
    wasteLog: obj.wasteLog,
    totalValue: obj.totalValue,
    reorderAlerts: obj.reorderAlerts,
    expiringAlerts: obj.expiringAlerts,
    twinOsEntityId: this.toTwinOsEntityId(),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

InventoryTwinSchema.statics.findByInventoryId = function(inventoryId: string) {
  return this.findOne({ inventoryId });
};

InventoryTwinSchema.statics.findByRestaurantId = function(restaurantId: string) {
  return this.findOne({ restaurantId });
};

export const InventoryTwin = mongoose.model<IInventoryTwinModel>('InventoryTwin', InventoryTwinSchema);
