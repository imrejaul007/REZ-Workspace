import mongoose, { Document, Schema } from 'mongoose';

// Enums for Order Status
export enum SupplierOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// Supplier Order Item Interface
export interface ISupplierOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  receivedQuantity?: number;
}

// Supplier Order Interface
export interface ISupplierOrder extends Document {
  orderId: string;
  merchantId: string;
  supplierId: string;
  supplierName: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  items: ISupplierOrderItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  deliveryDate: Date;
  actualDeliveryDate?: Date;
  status: SupplierOrderStatus;
  notes?: string;
  internalNotes?: string;
  createdBy?: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Order Item Schema
const SupplierOrderItemSchema = new Schema<ISupplierOrderItem>({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  receivedQuantity: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Supplier Order Schema
const SupplierOrderSchema = new Schema<ISupplierOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  supplierId: {
    type: String,
    required: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true,
    index: true
  },
  supplierContact: {
    type: String
  },
  supplierPhone: {
    type: String
  },
  supplierEmail: {
    type: String
  },
  items: {
    type: [SupplierOrderItemSchema],
    required: true,
    validate: {
      validator: function(items: ISupplierOrderItem[]) {
        return items.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: SupplierOrderStatus,
    default: SupplierOrderStatus.PENDING,
    index: true
  },
  notes: {
    type: String
  },
  internalNotes: {
    type: String
  },
  createdBy: {
    type: String
  },
  approvedBy: {
    type: String
  },
  receivedBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'supplier_orders'
});

// Compound Indexes
SupplierOrderSchema.index({ merchantId: 1, status: 1 });
SupplierOrderSchema.index({ merchantId: 1, deliveryDate: 1 });
SupplierOrderSchema.index({ supplierId: 1, status: 1 });
SupplierOrderSchema.index({ status: 1, deliveryDate: 1 });

// Virtual for remaining items count
SupplierOrderSchema.virtual('remainingItems').get(function() {
  return this.items.filter(item =>
    (item.receivedQuantity || 0) < item.quantity
  ).length;
});

// Virtual for completion percentage
SupplierOrderSchema.virtual('completionPercentage').get(function() {
  if (this.items.length === 0) return 0;
  const totalExpected = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = this.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  return totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;
});

// Methods to update status with validation
SupplierOrderSchema.methods.canTransitionTo = function(newStatus: SupplierOrderStatus): boolean {
  const validTransitions: Record<SupplierOrderStatus, SupplierOrderStatus[]> = {
    [SupplierOrderStatus.PENDING]: [SupplierOrderStatus.CONFIRMED, SupplierOrderStatus.CANCELLED],
    [SupplierOrderStatus.CONFIRMED]: [SupplierOrderStatus.SHIPPED, SupplierOrderStatus.CANCELLED],
    [SupplierOrderStatus.SHIPPED]: [SupplierOrderStatus.DELIVERED, SupplierOrderStatus.CANCELLED],
    [SupplierOrderStatus.DELIVERED]: [],
    [SupplierOrderStatus.CANCELLED]: []
  };

  return validTransitions[this.status]?.includes(newStatus) || false;
};

// Static method to get orders by merchant with filters
SupplierOrderSchema.statics.getByMerchant = async function(
  merchantId: string,
  filters: {
    status?: SupplierOrderStatus;
    supplierId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
): Promise<{ orders: ISupplierOrder[]; total: number }> {
  const { status, supplierId, startDate, endDate, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = { merchantId };

  if (status) query.status = status;
  if (supplierId) query.supplierId = supplierId;
  if (startDate || endDate) {
    query.deliveryDate = {};
    if (startDate) (query.deliveryDate as Record<string, Date>).$gte = startDate;
    if (endDate) (query.deliveryDate as Record<string, Date>).$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    this.find(query)
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);

  return { orders, total };
};

// Static method to get pending orders for a supplier
SupplierOrderSchema.statics.getPendingBySupplier = async function(
  supplierId: string
): Promise<ISupplierOrder[]> {
  return this.find({
    supplierId,
    status: { $in: [SupplierOrderStatus.PENDING, SupplierOrderStatus.CONFIRMED, SupplierOrderStatus.SHIPPED] }
  }).sort({ deliveryDate: 1 });
};

// Static method to get orders due for delivery
SupplierOrderSchema.statics.getDueForDelivery = async function(
  merchantId: string,
  daysAhead: number = 3
): Promise<ISupplierOrder[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    merchantId,
    status: { $in: [SupplierOrderStatus.CONFIRMED, SupplierOrderStatus.SHIPPED] },
    deliveryDate: { $lte: futureDate }
  }).sort({ deliveryDate: 1 });
};

export const SupplierOrder = mongoose.model<ISupplierOrder>('SupplierOrder', SupplierOrderSchema);