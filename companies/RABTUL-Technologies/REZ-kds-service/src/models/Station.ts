import mongoose, { Schema, Document } from 'mongoose'

export interface IStation extends Document {
  stationId: string
  name: string
  storeId: string
  merchantId: string
  categories: string[] // food categories this station handles
  color: string
  icon: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const StationSchema = new Schema<IStation>({
  stationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  storeId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  categories: [String],
  color: { type: String, default: '#3B82F6' },
  icon: { type: String, default: '🍳' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
})

export const Station = mongoose.model<IStation>('Station', StationSchema)
