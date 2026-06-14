import mongoose, { Schema, Document } from 'mongoose'

export interface IReconciliationRecord extends Document {
  reconciliationId: string
  merchantId: string
  storeId: string
  aggregatorId: string
  period: {
    start: Date
    end: Date
  }
  localOrders: {
    orderId: string
    orderTotal: number
    commission: number
    status: string
  }[]
  aggregatorOrders: {
    externalOrderId: string
    orderTotal: number
    commission: number
    status: string
    payoutAmount: number
    payoutDate?: Date
  }[]
  discrepancies: {
    type: 'missing_local' | 'missing_aggregator' | 'amount_mismatch' | 'commission_mismatch'
    localOrderId?: string
    aggregatorOrderId?: string
    amount?: number
    description: string
  }[]
  settlement: {
    totalLocalOrders: number
    totalAggregatorOrders: number
    totalLocalRevenue: number
    totalAggregatorRevenue: number
    totalCommission: number
    totalPayout: number
    netDiscrepancy: number
  }
  status: 'pending' | 'verified' | 'disputed' | 'resolved'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ReconciliationOrderSchema = new Schema({
  orderId: String,
  orderTotal: Number,
  commission: Number,
  status: String
}, { _id: false })

const DiscrepancySchema = new Schema({
  type: {
    type: String,
    enum: ['missing_local', 'missing_aggregator', 'amount_mismatch', 'commission_mismatch']
  },
  localOrderId: String,
  aggregatorOrderId: String,
  amount: Number,
  description: String
}, { _id: false })

const ReconciliationSchema = new Schema<IReconciliationRecord>({
  reconciliationId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  aggregatorId: { type: String, required: true },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  localOrders: [ReconciliationOrderSchema],
  aggregatorOrders: [{
    externalOrderId: String,
    orderTotal: Number,
    commission: Number,
    status: String,
    payoutAmount: Number,
    payoutDate: Date
  }],
  discrepancies: [DiscrepancySchema],
  settlement: {
    totalLocalOrders: Number,
    totalAggregatorOrders: Number,
    totalLocalRevenue: Number,
    totalAggregatorRevenue: Number,
    totalCommission: Number,
    totalPayout: Number,
    netDiscrepancy: Number
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'disputed', 'resolved'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
})

export const Reconciliation = mongoose.model<IReconciliationRecord>('Reconciliation', ReconciliationSchema)
