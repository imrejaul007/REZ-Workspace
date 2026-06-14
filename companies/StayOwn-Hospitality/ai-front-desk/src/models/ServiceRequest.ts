/**
 * Service Request Model for AI Front Desk Service
 */

import mongoose, { Document, Schema } from 'mongoose';

export type ServiceRequestTypeEnum = 'room_service' | 'housekeeping' | 'concierge' | 'maintenance' | 'taxi';
export type ServiceRequestStatusEnum = 'pending' | 'in_progress' | 'completed';
export type ServiceRequestPriorityEnum = 'low' | 'medium' | 'high';

export interface IServiceRequest extends Document {
  guestId?: string;
  roomNumber: string;
  type: ServiceRequestTypeEnum;
  description: string;
  status: ServiceRequestStatusEnum;
  priority: ServiceRequestPriorityEnum;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    guestId: { type: String, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['room_service', 'housekeeping', 'concierge', 'maintenance', 'taxi'],
    },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceRequestSchema.index({ status: 1, priority: 1 });
ServiceRequestSchema.index({ roomNumber: 1 });
ServiceRequestSchema.index({ type: 1 });
ServiceRequestSchema.index({ createdAt: -1 });
ServiceRequestSchema.index({ guestId: 1 });

export const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);

export default ServiceRequest;