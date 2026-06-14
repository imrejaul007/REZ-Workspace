import mongoose, { Document, Schema, Model } from 'mongoose';
import { z } from 'zod';

// ============================================
// Zod Validation Schemas
// ============================================

// Location schema
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(1).max(500),
});

// Delivery status enum
export const DeliveryStatusSchema = z.enum([
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
  'failed',
]);

// Create delivery input schema
export const CreateDeliveryInputSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  storeId: z.string().min(1, 'Store ID is required'),
  pickupLocation: LocationSchema,
  deliveryLocation: LocationSchema,
  estimatedTime: z.number().min(1).max(180).optional(),
  distance: z.number().min(0).max(100).optional(),
  fee: z.number().min(0).optional(),
});

// Update delivery input schema
export const UpdateDeliveryInputSchema = z.object({
  driverId: z.string().optional(),
  estimatedTime: z.number().min(1).max(180).optional(),
  status: DeliveryStatusSchema.optional(),
});

// Assign driver input schema
export const AssignDriverInputSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
 estimatedTime: z.number().min(1).max(180).optional(),
});

// Rate delivery input schema
export const RateDeliveryInputSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  feedback: z.string().max(1000).optional(),
});

// Type exports from Zod
export type Location = z.infer<typeof LocationSchema>;
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;
export type CreateDeliveryInput = z.infer<typeof CreateDeliveryInputSchema>;
export type UpdateDeliveryInput = z.infer<typeof UpdateDeliveryInputSchema>;
export type AssignDriverInput = z.infer<typeof AssignDriverInputSchema>;
export type RateDeliveryInput = z.infer<typeof RateDeliveryInputSchema>;

// ============================================
// Mongoose Document Interface
// ============================================

export interface IDelivery extends Document {
  deliveryId: string;
  orderId: string;
  driverId?: string;
  storeId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: DeliveryStatus;
  estimatedTime?: number;
  actualTime?: number;
  distance?: number;
  fee?: number;
  tips: number;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Mongoose Schema
// ============================================

const deliverySchema = new Schema<IDelivery>(
  {
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    driverId: {
      type: String,
      index: true,
    },
    storeId: {
      type: String,
      required: true,
    },
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    deliveryLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    estimatedTime: {
      type: Number,
      min: 1,
      max: 180,
    },
    actualTime: {
      type: Number,
    },
    distance: {
      type: Number,
      min: 0,
      max: 100,
    },
    fee: {
      type: Number,
      min: 0,
    },
    tips: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    collection: 'deliveries',
  }
);

// Indexes for common queries
deliverySchema.index({ createdAt: -1 });
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ driverId: 1, status: 1 });

// Pre-save hook to generate deliveryId
deliverySchema.pre('save', async function (next) {
  if (!this.deliveryId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.deliveryId = `DLV-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Instance method to calculate actual delivery time
deliverySchema.methods.calculateActualTime = function (): number | null {
  if (this.status === 'delivered' && this.createdAt) {
    const deliveredAt = this.updatedAt;
    const createdAt = this.createdAt;
    return Math.round((deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60));
  }
  return null;
};

// Instance method to get total earnings
deliverySchema.methods.getTotalEarnings = function (): number {
  return (this.fee || 0) + this.tips;
};

// Static method to find by order ID
deliverySchema.statics.findByOrderId = function (orderId: string) {
  return this.findOne({ orderId }).sort({ createdAt: -1 });
};

// Static method to find active deliveries for driver
deliverySchema.statics.findActiveForDriver = function (driverId: string) {
  return this.find({
    driverId,
    status: { $in: ['assigned', 'picked_up', 'in_transit'] },
  }).sort({ createdAt: -1 });
};

// Static method to get delivery statistics
deliverySchema.statics.getStats = async function (storeId?: string) {
  const matchStage = storeId ? { storeId } : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDistance: { $avg: '$distance' },
        avgFee: { $avg: '$fee' },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const totalDeliveries = await this.countDocuments(matchStage);
  const completedDeliveries = await this.countDocuments({
    ...matchStage,
    status: 'delivered',
  });

  return {
    byStatus: stats,
    totalDeliveries,
    completedDeliveries,
    completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
  };
};

// ============================================
// Export Model
// ============================================

export const Delivery: Model<IDelivery> = mongoose.model<IDelivery>('Delivery', deliverySchema);

// ============================================
// Helper Functions
// ============================================

// Generate unique delivery ID
export const generateDeliveryId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DLV-${timestamp}-${random}`.toUpperCase();
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Calculate estimated delivery fee based on distance
export const calculateDeliveryFee = (distance: number, baseFee: number = 20): number => {
  if (distance <= 2) return baseFee;
  if (distance <= 5) return baseFee + 10;
  if (distance <= 10) return baseFee + 20;
  return baseFee + 20 + Math.ceil(distance - 10) * 3;
};

// Validate status transition
export const isValidStatusTransition = (
  currentStatus: DeliveryStatus,
  newStatus: DeliveryStatus
): boolean => {
  const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
    pending: ['assigned', 'cancelled'],
    assigned: ['picked_up', 'cancelled', 'failed'],
    picked_up: ['in_transit', 'cancelled', 'failed'],
    in_transit: ['delivered', 'cancelled', 'failed'],
    delivered: [],
    cancelled: [],
    failed: [],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

export default Delivery;