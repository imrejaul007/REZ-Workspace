/**
 * Booking Service - Business logic for appointments
 */

import { Appointment, IAppointment } from '../models/Appointment';
import { logger } from '../config/logger';

interface CreateBookingData {
  salonId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  stylistId?: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  notes?: string;
  source?: 'app' | 'web' | 'phone' | 'walkin' | 'whatsapp';
}

interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  stylistId?: string;
  stylistName?: string;
}

/**
 * Generate a unique appointment ID
 */
function generateAppointmentId(): string {
  return `APT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
}

/**
 * Calculate end time given start time and duration
 */
function calculateEndTime(startTime: string, duration: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + duration;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
}

/**
 * Convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Check if there's a booking conflict
 */
async function checkConflict(
  salonId: string,
  stylistId: string | undefined,
  date: string,
  startTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const query: Record<string, unknown> = {
    salonId,
    date,
    status: { $nin: ['cancelled', 'no_show'] },
  };

  if (stylistId) {
    query.stylistId = stylistId;
  }

  const existingAppointments = await Appointment.find(query);

  const newStart = timeToMinutes(startTime);
  const newEnd = newStart + 60; // Assuming 60 min default duration

  for (const apt of existingAppointments) {
    if (excludeAppointmentId && apt.appointmentId === excludeAppointmentId) continue;

    if (apt.stylistId !== stylistId) continue;

    const aptStart = timeToMinutes(apt.startTime);
    const aptEnd = timeToMinutes(apt.endTime);

    // Check for overlap
    if (newStart < aptEnd && newEnd > aptStart) {
      return true;
    }
  }

  return false;
}

/**
 * Get available time slots for a date
 */
async function getAvailableSlots(
  salonId: string,
  date: string,
  stylistId?: string,
  serviceIds?: string[]
): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];
  const workStart = 9 * 60; // 9:00 AM
  const workEnd = 21 * 60; // 9:00 PM
  const slotInterval = 30; // 30-minute intervals

  // Get existing bookings
  const query: Record<string, unknown> = {
    salonId,
    date,
    status: { $nin: ['cancelled', 'no_show'] },
  };

  if (stylistId) {
    query.stylistId = stylistId;
  }

  const existingBookings = await Appointment.find(query);

  // Generate slots
  for (let minutes = workStart; minutes < workEnd; minutes += slotInterval) {
    const startTime = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
    const endMinutes = minutes + slotInterval;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Check if slot is booked
    const isBooked = existingBookings.some(booking => {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      return minutes < bookingEnd && endMinutes > bookingStart;
    });

    slots.push({
      start: startTime,
      end: endTime,
      isAvailable: !isBooked,
      stylistId,
    });
  }

  return slots;
}

/**
 * Get stylist availability for a date range
 */
async function getStylistAvailability(
  stylistId: string,
  date?: string,
  startDate?: string,
  endDate?: string
): Promise<Record<string, unknown>> {
  const query: Record<string, unknown> = {
    stylistId,
    status: { $nin: ['cancelled', 'no_show'] },
  };

  if (date) {
    query.date = date;
  } else if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }

  const bookings = await Appointment.find(query).sort({ date: 1, startTime: 1 });

  const availability: Record<string, unknown> = {};

  if (date) {
    // Single day availability
    const workStart = 9 * 60;
    const workEnd = 21 * 60;

    const bookedSlots = bookings.map(b => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

    const freeSlots: Array<{ start: string; end: string }> = [];

    for (let minutes = workStart; minutes < workEnd; minutes += 30) {
      const isBooked = bookedSlots.some(
        slot => minutes >= slot.start && minutes < slot.end
      );

      if (!isBooked) {
        const startTime = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
        const endMinutes = minutes + 30;
        const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
        freeSlots.push({ start: startTime, end: endTime });
      }
    }

    availability[date] = {
      totalSlots: Math.floor((workEnd - workStart) / 30),
      bookedSlots: bookings.length,
      freeSlots: freeSlots.length,
      freeSlotTimes: freeSlots,
      bookings: bookings.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      })),
    };
  } else {
    // Date range - return booking counts per day
    for (const booking of bookings) {
      if (!availability[booking.date]) {
        availability[booking.date] = { booked: 0, bookings: [] };
      }
      (availability[booking.date] as { booked: number }).booked++;
      (availability[booking.date] as { bookings: unknown[] }).bookings.push({
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
    }
  }

  return availability;
}

/**
 * Create a new booking
 */
async function createBooking(data: CreateBookingData): Promise<IAppointment> {
  const appointmentId = generateAppointmentId();
  const duration = 60; // Default duration, should be calculated from services
  const endTime = calculateEndTime(data.startTime, duration);

  const appointment = new Appointment({
    appointmentId,
    salonId: data.salonId,
    customerId: data.customerId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    stylistId: data.stylistId,
    serviceIds: data.serviceIds,
    date: data.date,
    startTime: data.startTime,
    endTime,
    duration,
    status: 'pending',
    type: data.source === 'walkin' ? 'walkin' : 'appointment',
    notes: data.notes,
    source: data.source || 'app',
    depositPaid: false,
    depositAmount: 0,
    reminderSent: false,
  });

  await appointment.save();

  logger.info('Booking created', {
    appointmentId,
    salonId: data.salonId,
    customerId: data.customerId,
    date: data.date,
    startTime: data.startTime,
  });

  return appointment;
}

export const bookingService = {
  checkConflict,
  getAvailableSlots,
  getStylistAvailability,
  createBooking,
  calculateDuration,
};
