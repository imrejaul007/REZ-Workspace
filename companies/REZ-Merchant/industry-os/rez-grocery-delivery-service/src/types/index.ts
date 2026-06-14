import { z } from 'zod';

export const DeliveryStatusEnum = z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled']);
export type DeliveryStatus = z.infer<typeof DeliveryStatusEnum>;

export interface Delivery {
  _id: string;
  deliveryId: string;
  orderId: string;
  customerId: string;
  driverId?: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: { productId: string; name: string; quantity: number }[];
  status: DeliveryStatus;
  scheduledTime: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: { lat: number; lng: number };
  rating: number;
  createdAt: Date;
}

export const CreateDeliverySchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  items: z.array(z.object({ productId: z.string(), name: z.string(), quantity: z.number() })),
  scheduledTime: z.string()
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
