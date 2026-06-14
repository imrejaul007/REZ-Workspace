import { publicClient } from './client';

export interface DeliveryCheck {
  deliverable: boolean;
  fee: number;
  distanceKm: number;
  message?: string;
}

export interface DeliveryAddress {
  line1: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export async function checkDelivery(
  storeSlug: string,
  latitude: number,
  longitude: number,
): Promise<DeliveryCheck> {
  const { data } = await publicClient.post(
    `/api/web-ordering/store/${storeSlug}/check-delivery`,
    { latitude, longitude },
    { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
  );
  if (!data.success) throw new Error(data.message || 'Delivery check failed');
  return data.data as DeliveryCheck;
}
