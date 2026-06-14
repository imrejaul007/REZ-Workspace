import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PurchaseOrderStatus } from '../types';

export interface IPurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IPurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  warehouseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseOrderDocument extends Omit<IPurchaseOrder, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  id: { type: String, default: () => uuidv4() },
  productId: { type: String, required: true },
  sku: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  receivedQuantity: { type: Number, default: 0, min: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
}, { _id: false });

const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  orderNumber: { type: String, required: true, unique: true },
  supplierId: { type: String, required: true, index: true },
  supplierName: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(PurchaseOrderStatus),
    default: PurchaseOrderStatus.DRAFT,
    index: true,
  },
  items: [PurchaseOrderItemSchema],
  totalAmount: { type: Number, required: true, min: 0 },
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  notes: { type: String },
  createdBy: { type: String, required: true },
  approvedBy: { type: String },
  warehouseId: { type: String },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
PurchaseOrderSchema.index({ supplierId: 1, status: 1 });
PurchaseOrderSchema.index({ createdAt: -1 });
PurchaseOrderSchema.index({ expectedDeliveryDate: 1 });

// Pre-save to calculate total
PurchaseOrderSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  next();
});

// Generate order number
PurchaseOrderSchema.statics.generateOrderNumber = function (): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PO-${year}${month}-${random}`;
};

// Get pending orders
PurchaseOrderSchema.statics.getPendingOrders = function () {
  return this.find({
    status: { $in: [PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.ORDERED] },
  }).sort({ expectedDeliveryDate: 1 });
};

export const PurchaseOrder = mongoose.model<IPurchaseOrderDocument>('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;
