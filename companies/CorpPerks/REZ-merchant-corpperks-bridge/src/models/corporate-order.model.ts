import mongoose, { Document, Schema } from 'mongoose';
import { CorporateOrder } from '../types';

export interface ICorporateOrder extends Omit<CorporateOrder, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const orderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    benefitApplied: { type: String },
    benefitDeduction: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    instructions: { type: String },
  },
  { _id: false }
);

const corporateOrderSchema = new Schema<ICorporateOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    merchantOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v: unknown[]) => v && v.length > 0,
        message: 'Order must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    benefitDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['allowance', 'card', 'upi', 'wallet', 'corporate_billing'],
      required: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'GSTInvoice',
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
    },
    scheduledFor: {
      type: Date,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Generate order number
corporateOrderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `CP-ORD-${year}${month}${day}-`;

  const lastOrder = await this.findOne({
    orderNumber: { $regex: `^${prefix}` },
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber');

  if (!lastOrder) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
  const newNumber = lastNumber + 1;
  return `${prefix}${String(newNumber).padStart(4, '0')}`;
};

// Calculate order totals
corporateOrderSchema.methods.calculateTotals = function (): void {
  let subtotal = 0;
  let benefitDeduction = 0;

  for (const item of this.items) {
    const itemSubtotal = item.quantity * item.unitPrice - item.discount;
    subtotal += itemSubtotal;
    benefitDeduction += item.benefitDeduction;
  }

  this.subtotal = subtotal;
  this.benefitDeduction = benefitDeduction;
  this.grandTotal = subtotal - benefitDeduction + this.taxAmount + this.deliveryFee;
};

// Valid state transitions
const validTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

corporateOrderSchema.methods.canTransitionTo = function (newStatus: string): boolean {
  return validTransitions[this.status]?.includes(newStatus) ?? false;
};

corporateOrderSchema.methods.transitionTo = function (newStatus: string): void {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(
      `Cannot transition from ${this.status} to ${newStatus}`
    );
  }
  this.status = newStatus;
};

// Compound indexes
corporateOrderSchema.index({ employeeId: 1, status: 1 });
corporateOrderSchema.index({ companyId: 1, status: 1 });
corporateOrderSchema.index({ merchantOrderId: 1 });
corporateOrderSchema.index({ createdAt: -1, status: 1 });
corporateOrderSchema.index({ scheduledFor: 1, status: 1 });

export const CorporateOrderModel = mongoose.model<ICorporateOrder>(
  'CorporateOrder',
  corporateOrderSchema
);
export default CorporateOrderModel;
