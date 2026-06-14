import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Lab Order Test - Individual test in an order
 */
export interface ILabOrderTest {
  code: string;
  name: string;
  price: number;
}

/**
 * Lab Order Result - Individual test result
 */
export interface ILabOrderResult {
  testCode: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low';
}

/**
 * Lab Order Status enum
 */
export type LabOrderStatus = 'ordered' | 'sample_collected' | 'processing' | 'ready' | 'delivered';

/**
 * Lab Order interface
 */
export interface ILabOrder extends Document {
  patientId: Types.ObjectId;
  storeId: Types.ObjectId;
  merchantId: Types.ObjectId;
  doctorId: Types.ObjectId;
  tests: ILabOrderTest[];
  labPartner?: string;
  status: LabOrderStatus;
  results?: ILabOrderResult[];
  reportUrl?: string;
  orderedAt: Date;
  reportAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lab Order Schema
 */
const LabOrderSchema = new Schema<ILabOrder>(
  {
    patientId: { type: Schema.Types.ObjectId, required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, required: true, index: true },
    tests: [
      {
        code: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    labPartner: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['ordered', 'sample_collected', 'processing', 'ready', 'delivered'],
      default: 'ordered',
      index: true,
    },
    results: [
      {
        testCode: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        unit: { type: String, required: true, trim: true },
        referenceRange: { type: String, required: true, trim: true },
        status: {
          type: String,
          required: true,
          enum: ['normal', 'high', 'low'],
        },
      },
    ],
    reportUrl: { type: String, trim: true },
    orderedAt: { type: Date, required: true, default: Date.now },
    reportAt: { type: Date },
  },
  { timestamps: true, strict: true, strictQuery: true }
);

// Indexes for efficient queries
LabOrderSchema.index({ patientId: 1, orderedAt: -1 });
LabOrderSchema.index({ merchantId: 1, status: 1 });
LabOrderSchema.index({ storeId: 1, status: 1 });
LabOrderSchema.index({ doctorId: 1, orderedAt: -1 });

// Validate status transitions
LabOrderSchema.pre('save', function (this: ILabOrder, next) {
  const validTransitions: Record<LabOrderStatus, LabOrderStatus[]> = {
    ordered: ['sample_collected'],
    sample_collected: ['processing'],
    processing: ['ready'],
    ready: ['delivered'],
    delivered: [],
  };

  if (this.isModified('status') && !this.isNew) {
    const currentStatus = this.status as LabOrderStatus;
    // Get the previous status from the document before update
    const prevStatus = (this as unknown)._previousStatus as LabOrderStatus;
    if (prevStatus && !validTransitions[prevStatus]?.includes(currentStatus)) {
      next(new Error(`Invalid status transition from ${prevStatus} to ${currentStatus}`));
      return;
    }
  }
  next();
});

export const LabOrder =
  mongoose.models.LabOrder || mongoose.model<ILabOrder>('LabOrder', LabOrderSchema);
