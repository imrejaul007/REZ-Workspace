import { publicClient } from './client';

export interface TimeSlot {
  time: string;
  available: boolean;
  spotsLeft?: number;
}

export interface ReservationConfirmation {
  reservationCode: string;
  date: string;
  timeSlot: string;
  confirmationMessage: string;
}

export async function getAvailability(storeSlug: string, date: string): Promise<TimeSlot[]> {
  const { data } = await publicClient.get(
    `/api/web-ordering/store/${storeSlug}/availability`,
    { params: { date } },
  );
  if (!data.success) throw new Error(data.message || 'Failed to fetch availability');
  return (data.data?.slots ?? []) as TimeSlot[];
}

export async function createReservation(
  storeSlug: string,
  payload: {
    customerName: string;
    customerPhone: string;
    partySize: number;
    date: string;
    timeSlot: string;
    notes?: string;
  },
): Promise<ReservationConfirmation> {
  const { data } = await publicClient.post(
    `/api/web-ordering/store/${storeSlug}/reserve`,
    payload,
    { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
  );
  if (!data.success) throw new Error(data.message || 'Failed to create reservation');
  return data.data as ReservationConfirmation;
}
