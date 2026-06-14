import mongoose, { Schema, Document } from 'mongoose'

export interface IKDSOrder extends Document {
  orderId: string
  orderNumber: string
  merchantId: string
  storeId: string
  items: Array<{
    id: string
    name: string
    quantity: number
    station: string
    status: 'pending' | 'preparing' | 'ready'
    modifiers?: string[]
    notes?: string
    createdAt: Date
    updatedAt: Date
  }>
  status: 'new' | 'in_progress' | 'ready' | 'completed' | 'cancelled'
  priority: 'normal' | 'rush'
  tableNumber?: string
  customerName?: string
  orderType: 'dine_in' | 'takeaway' | 'delivery'
  estimatedTime?: number // minutes
  completedAt?: Date
  bumpedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const KDSOrderItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  station: { type: String, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready'], default: 'pending' },
  modifiers: [String],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false })

const KDSOrderSchema = new Schema<IKDSOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  orderNumber: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  items: [KDSOrderItemSchema],
  status: {
    type: String,
    enum: ['new', 'in_progress', 'ready', 'completed', 'cancelled'],
    default: 'new',
    index: true
  },
  priority: { type: String, enum: ['normal', 'rush'], default: 'normal' },
  tableNumber: String,
  customerName: String,
  orderType: {
    type: String,
    enum: ['dine_in', 'takeaway', 'delivery'],
    default: 'dine_in'
  },
  estimatedTime: Number,
  completedAt: Date,
  bumpedAt: Date
}, {
  timestamps: true
})

// Compound indexes for common queries
KDSOrderSchema.index({ storeId: 1, status: 1, createdAt: -1 })
KDSOrderSchema.index({ storeId: 1, 'items.station': 1, status: 1 })
KDSOrderSchema.index({ merchantId: 1, createdAt: -1 })

export const KDSOrder = mongoose.model<IKDSOrder>('KDSOrder', KDSOrderSchema)
