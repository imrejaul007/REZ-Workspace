import mongoose, { Schema, Types } from 'mongoose';

export interface ITableSessionItem {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface ITableSession extends Document {
  storeId: Types.ObjectId;
  tableId?: Types.ObjectId;
  merchantId: Types.ObjectId;
  guestCount?: number;
  status: 'open' | 'occupied' | 'reserved' | 'closed' | 'cancelled';
  openedAt: Date;
  closedAt?: Date;
  items: ITableSessionItem[];
  metadata?: Record<string, unknown>;
}

const s = new Schema<ITableSession>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table' },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    guestCount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['open', 'occupied', 'reserved', 'closed', 'cancelled'],
      default: 'open'
    },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    items: [{
      productId: { type: Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 },
      notes: String,
    }],
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, tableId: 1, status: 1 });
// DB-INDEX: Added time query index for session history/analytics by openedAt
s.index({ storeId: 1, openedAt: -1 });
export const TableSession = mongoose.models.TableSession || mongoose.model<ITableSession>('TableSession', s, 'tablesessions');
