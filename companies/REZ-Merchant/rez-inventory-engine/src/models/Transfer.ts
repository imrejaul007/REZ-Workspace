import mongoose, { Document, Schema, Types } from 'mongoose';

export type TransferStatus = 'pending' | 'approved' | 'dispatched' | 'received' | 'cancelled';

export interface ITransferItem {
  skuId: Types.ObjectId;
  sku: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  dispatchedQuantity?: number;
}

export interface ITransfer extends Document {
  _id: Types.ObjectId;
  transferNumber: string;
  fromStoreId: string;
  toStoreId: string;
  items: ITransferItem[];
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string;
  dispatchedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferItemSchema = new Schema<ITransferItem>(
  {
    skuId: {
      type: Schema.Types.ObjectId,
      ref: 'SKU',
      required: [true, 'SKU ID is required'],
    },
    sku: {
      type: String,
      required: [true, 'SKU code is required'],
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [1, 'Requested quantity must be at least 1'],
    },
    approvedQuantity: {
      type: Number,
      min: [0, 'Approved quantity cannot be negative'],
    },
    dispatchedQuantity: {
      type: Number,
      min: [0, 'Dispatched quantity cannot be negative'],
    },
  },
  { _id: false }
);

const TransferSchema = new Schema<ITransfer>(
  {
    transferNumber: {
      type: String,
      required: [true, 'Transfer number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fromStoreId: {
      type: String,
      required: [true, 'Source store ID is required'],
      index: true,
    },
    toStoreId: {
      type: String,
      required: [true, 'Destination store ID is required'],
      index: true,
    },
    items: {
      type: [TransferItemSchema],
      required: [true, 'Transfer items are required'],
      validate: {
        validator: function (items: ITransferItem[]) {
          return items && items.length > 0;
        },
        message: 'At least one item is required for transfer',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'dispatched', 'received', 'cancelled'],
        message: 'Status must be pending, approved, dispatched, received, or cancelled',
      },
      default: 'pending',
      index: true,
    },
    requestedBy: {
      type: String,
      required: [true, 'Requested by is required'],
    },
    approvedBy: {
      type: String,
    },
    dispatchedAt: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: String,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for common queries
TransferSchema.index({ fromStoreId: 1, status: 1 });
TransferSchema.index({ toStoreId: 1, status: 1 });
TransferSchema.index({ requestedBy: 1, status: 1 });
TransferSchema.index({ createdAt: -1, status: 1 });

// Generate transfer number before saving
TransferSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model<ITransfer>('Transfer').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const seq = (count + 1).toString().padStart(5, '0');
    this.transferNumber = `TRF-${year}${month}${day}-${seq}`;
  }
  next();
});

export const Transfer = mongoose.model<ITransfer>('Transfer', TransferSchema);
