import { authClient, publicClient } from './client';
import { CatalogItem, AppointmentSlot } from '@/lib/types';

export async function getCatalog(storeSlug: string): Promise<CatalogItem[]> {
  const { data } = await publicClient.get(`/api/catalog/${storeSlug}`);
  if (!data.success) throw new Error(data.message || 'Failed to load catalog');
  return data.data.items as CatalogItem[];
}

export async function getAppointmentSlots(
  storeSlug: string,
  date: string,
  serviceId: string,
): Promise<AppointmentSlot> {
  const { data } = await publicClient.get(`/api/appointments/${storeSlug}/slots`, {
    params: { date, serviceId },
  });
  if (!data.success) throw new Error(data.message || 'Failed to load slots');
  return data.data as AppointmentSlot;
}

// NW-MED-048: Use authClient — backend must verify the authenticated user owns this
// booking. publicClient allowed unauthenticated attackers to flood any store's calendar.
export async function bookAppointment(
  storeSlug: string,
  payload: {
    serviceId: string;
    date: string;
    startTime: string;
    staffId?: string;
    customerPhone: string;
    customerName: string;
    notes?: string;
  },
) {
  const { data } = await authClient.post(`/api/appointments/${storeSlug}/book`, payload);
  if (!data.success) throw new Error(data.message || 'Failed to book appointment');
  return data.data;
}
