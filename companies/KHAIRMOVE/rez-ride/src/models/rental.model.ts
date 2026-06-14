import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RentalBookingDocument = RentalBookingModel & Document;

export enum RentalStatus {
  BOOKED = 'booked',
  DRIVER_DISPATCHED = 'driver_dispatched',
  PICKUP_IN_PROGRESS = 'pickup_in_progress',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type VehicleType = 'auto' | 'sedan' | 'suv';

@Schema({ _id: false })
export class RentalLocation {
  @Prop({ required: true }) lat: number;
  @Prop({ required: true }) lng: number;
  @Prop({ required: true }) address: string;
  @Prop({ type: Date, required: true }) time: Date;
}

@Schema({ timestamps: true, collection: 'rental_bookings' })
export class RentalBookingModel {
  @Prop({ required: true, index: true }) bookingId: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Driver', index: true }) driverId?: Types.ObjectId;
  @Prop({ required: true, enum: ['auto', 'sedan', 'suv'] }) vehicleType: VehicleType;
  @Prop({ required: true }) packageId: string;
  @Prop({ type: RentalLocation, required: true }) pickup: RentalLocation;
  @Prop({ type: RentalLocation }) drop?: RentalLocation;
  @Prop({ required: true, enum: RentalStatus, default: RentalStatus.BOOKED, index: true }) status: RentalStatus;
  @Prop({ required: true }) includedKm: number;
  @Prop({ default: 0 }) usedKm: number;
  @Prop({ default: 0 }) excessKm: number;
  @Prop({ default: 0 }) excessKmCharge: number;
  @Prop({ required: true }) basePrice: number;
  @Prop({ default: 0 }) totalPrice: number;
  @Prop({ default: 0 }) actualDuration: number;
  @Prop({ default: 0 }) waitingTime: number;
  @Prop({ default: 0 }) waitingCharge: number;
  @Prop({ type: Date }) startedAt?: Date;
  @Prop({ type: Date }) completedAt?: Date;
  @Prop() cancellationReason?: string;
  @Prop({ default: 0 }) cancellationFee: number;
  // Timestamp fields added automatically by Mongoose due to timestamps: true
  createdAt?: Date;
  updatedAt?: Date;
}

export const RentalBookingSchema = SchemaFactory.createForClass(RentalBookingModel);

// Indexes for performance
RentalBookingSchema.index({ userId: 1, status: 1 });
RentalBookingSchema.index({ driverId: 1, status: 1 });
RentalBookingSchema.index({ createdAt: -1 });
RentalBookingSchema.index({ 'pickup.time': 1 });

