import { v4 as uuidv4 } from 'uuid';
import {
  db,
  DoctorAvailability,
  ConsultationMode,
  SetAvailabilityRequest,
  TimeSlot,
} from '../models/teleconsult.js';

export class AvailabilityService {
  /**
   * Set availability slots for a doctor on a specific date
   */
  async setAvailability(request: SetAvailabilityRequest): Promise<DoctorAvailability> {
    const key = `${request.doctorId}:${request.date}`;
    const now = new Date().toISOString();

    // Validate slots don't overlap
    const sortedSlots = [...request.slots].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentEnd = new Date(sortedSlots[i].end).getTime();
      const nextStart = new Date(sortedSlots[i + 1].start).getTime();
      if (currentEnd > nextStart) {
        throw new Error(`Overlapping slots detected: ${sortedSlots[i].end} > ${sortedSlots[i + 1].start}`);
      }
    }

    const slots: TimeSlot[] = sortedSlots.map(slot => ({
      start: slot.start,
      end: slot.end,
      booked: false,
      consultationId: null,
    }));

    const availability: DoctorAvailability = {
      doctorId: request.doctorId,
      date: request.date,
      slots,
      consultationMode: request.consultationMode || ConsultationMode.VIDEO,
      consultationFee: request.consultationFee,
      currency: request.currency || 'INR',
      timezone: 'Asia/Kolkata',
      createdAt: now,
      updatedAt: now,
    };

    db.availability.set(key, availability);

    return availability;
  }

  /**
   * Get availability for a doctor on a specific date
   */
  getAvailability(doctorId: string, date: string): DoctorAvailability | undefined {
    const key = `${doctorId}:${date}`;
    return db.availability.get(key);
  }

  /**
   * Get availability for a doctor across multiple dates
   */
  getAvailabilityRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): DoctorAvailability[] {
    const result: DoctorAvailability[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const availability = this.getAvailability(doctorId, dateStr);
      if (availability) {
        result.push(availability);
      }
    }

    return result;
  }

  /**
   * Book a specific time slot
   */
  async bookSlot(
    doctorId: string,
    date: string,
    slotStart: string,
    slotEnd: string,
    consultationId?: string
  ): Promise<{ success: boolean; slot: TimeSlot }> {
    const key = `${doctorId}:${date}`;
    const availability = db.availability.get(key);

    if (!availability) {
      throw new Error(`No availability found for doctor ${doctorId} on ${date}`);
    }

    const slot = availability.slots.find(
      s => s.start === slotStart && s.end === slotEnd
    );

    if (!slot) {
      throw new Error(`Slot not found: ${slotStart} - ${slotEnd}`);
    }

    if (slot.booked) {
      throw new Error('Slot is already booked');
    }

    slot.booked = true;
    slot.consultationId = consultationId || null;
    availability.updatedAt = new Date().toISOString();

    db.availability.set(key, availability);

    return { success: true, slot };
  }

  /**
   * Cancel a booked slot
   */
  async cancelSlot(
    doctorId: string,
    date: string,
    slotStart: string,
    slotEnd: string
  ): Promise<{ success: boolean; slot: TimeSlot }> {
    const key = `${doctorId}:${date}`;
    const availability = db.availability.get(key);

    if (!availability) {
      throw new Error(`No availability found for doctor ${doctorId} on ${date}`);
    }

    const slot = availability.slots.find(
      s => s.start === slotStart && s.end === slotEnd
    );

    if (!slot) {
      throw new Error(`Slot not found: ${slotStart} - ${slotEnd}`);
    }

    slot.booked = false;
    slot.consultationId = null;
    availability.updatedAt = new Date().toISOString();

    db.availability.set(key, availability);

    return { success: true, slot };
  }

  /**
   * Get available (unbooked) slots for a doctor on a date
   */
  getAvailableSlots(doctorId: string, date: string): TimeSlot[] {
    const availability = this.getAvailability(doctorId, date);
    if (!availability) {
      return [];
    }

    return availability.slots
      .filter(slot => !slot.booked)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  /**
   * Find next available slot for a doctor
   */
  findNextAvailableSlot(
    doctorId: string,
    fromDate: string,
    durationMinutes: number = 30
  ): { date: string; slot: TimeSlot } | null {
    const startDate = new Date(fromDate);
    const maxDaysToSearch = 30;

    for (let i = 0; i < maxDaysToSearch; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const availableSlots = this.getAvailableSlots(doctorId, dateStr);
      const suitableSlot = availableSlots.find(slot => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60);
        return slotDuration >= durationMinutes;
      });

      if (suitableSlot) {
        return { date: dateStr, slot: suitableSlot };
      }
    }

    return null;
  }

  /**
   * Bulk update availability (e.g., weekly template)
   */
  async setBulkAvailability(
    doctorId: string,
    startDate: string,
    endDate: string,
    defaultSlots: Array<{ dayOfWeek: number; start: string; end: string }>,
    consultationMode: ConsultationMode = ConsultationMode.VIDEO,
    consultationFee?: number
  ): Promise<DoctorAvailability[]> {
    const result: DoctorAvailability[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const slotsForDay = defaultSlots.filter(s => s.dayOfWeek === dayOfWeek);

      if (slotsForDay.length > 0) {
        const dateStr = d.toISOString().split('T')[0];
        const slots = slotsForDay.map(s => ({
          start: `${dateStr}T${s.start}`,
          end: `${dateStr}T${s.end}`,
        }));

        const availability = await this.setAvailability({
          doctorId,
          date: dateStr,
          slots,
          consultationMode,
          consultationFee,
        });

        result.push(availability);
      }
    }

    return result;
  }

  /**
   * Delete availability for a specific date
   */
  deleteAvailability(doctorId: string, date: string): boolean {
    const key = `${doctorId}:${date}`;
    return db.availability.delete(key);
  }

  /**
   * Get all booked slots for a doctor on a date (for calendar display)
   */
  getBookedSlots(doctorId: string, date: string): TimeSlot[] {
    const availability = this.getAvailability(doctorId, date);
    if (!availability) {
      return [];
    }

    return availability.slots
      .filter(slot => slot.booked)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  /**
   * Check if a specific slot is available
   */
  isSlotAvailable(doctorId: string, date: string, slotStart: string, slotEnd: string): boolean {
    const availability = this.getAvailability(doctorId, date);
    if (!availability) {
      return false;
    }

    const slot = availability.slots.find(
      s => s.start === slotStart && s.end === slotEnd
    );

    return slot ? !slot.booked : false;
  }

  /**
   * Get doctor's weekly schedule summary
   */
  getWeeklySchedule(doctorId: string, weekStartDate: string): {
    dayOfWeek: number;
    dayName: string;
    slotsCount: number;
    bookedCount: number;
  }[] {
    const start = new Date(weekStartDate);
    const summary: Map<number, { slotsCount: number; bookedCount: number }> = new Map();

    for (let i = 0; i < 7; i++) {
      summary.set(i, { slotsCount: 0, bookedCount: 0 });
    }

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const availability = this.getAvailability(doctorId, dateStr);

      if (availability) {
        const stats = summary.get(i)!;
        stats.slotsCount = availability.slots.length;
        stats.bookedCount = availability.slots.filter(s => s.booked).length;
      }
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return Array.from(summary.entries()).map(([dayOfWeek, stats]) => ({
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      slotsCount: stats.slotsCount,
      bookedCount: stats.bookedCount,
    }));
  }
}

export const availabilityService = new AvailabilityService();
