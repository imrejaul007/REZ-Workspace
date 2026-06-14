import { z } from 'zod';

export const AddressSchema = z.object({
  name: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  country: z.string().default('India')
});
export type Address = z.infer<typeof AddressSchema>;

export const PackageSchema = z.object({
  weight: z.number().min(0.1).max(70),
  length: z.number().min(1).max(120),
  breadth: z.number().min(1).max(120),
  height: z.number().min(1).max(120),
  volumetricWeight: z.number().optional()
});
export type Package = z.infer<typeof PackageSchema>;

export const RateRequestSchema = z.object({
  from: AddressSchema,
  to: AddressSchema,
  package: PackageSchema,
  serviceType: z.enum(['standard', 'express', 'same_day', 'next_day', 'economy']).optional()
});
export type RateRequest = z.infer<typeof RateRequestSchema>;

export const ShipmentSchema = z.object({
  orderId: z.string(),
  trackingId: z.string().optional(),
  carrier: z.string(),
  service: z.string(),
  from: AddressSchema,
  to: AddressSchema,
  package: PackageSchema,
  rate: z.number(),
  status: z.enum(['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled']),
  estimatedDelivery: z.string().optional(),
  actualDelivery: z.string().optional(),
  labelUrl: z.string().optional()
});
export type Shipment = z.infer<typeof ShipmentSchema>;
