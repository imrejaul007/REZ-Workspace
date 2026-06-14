import type {
  AvailabilitySlot,
  SetAvailabilityInput,
} from '../types/schemas.js';
import {
  getDoctorAvailability,
  setDoctorAvailability,
  getDoctor,
  updateDoctor,
} from '../models/store.js';

export class ScheduleService {
  /**
   * Set doctor availability slots
   */
  async setAvailability(input: SetAvailabilityInput): Promise<AvailabilitySlot[]> {
    const doctor = getDoctor(input.doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Validate slots
    for (const slot of input.slots) {
      if (slot.startTime >= slot.endTime) {
        throw new Error('Start time must be before end time');
      }
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Save to availability store
    setDoctorAvailability(input.doctorId, input.slots);

    // Also update doctor record
    updateDoctor(input.doctorId, { availability: input.slots });

    return input.slots;
  }

  /**
   * Get doctor availability
   */
  async getAvailability(doctorId: string): Promise<AvailabilitySlot[]> {
    const doctor = getDoctor(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Check custom availability first
    const customAvailability = getDoctorAvailability(doctorId);
    if (customAvailability.length > 0) {
      return customAvailability;
    }

    // Fall back to doctor record availability
    return doctor.availability;
  }

  /**
   * Block a specific time slot
   */
  async blockTime(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const doctor = getDoctor(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Store blocked time (implementation would add to a blocked slots collection)
    // For now, just validate the inputs
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    return {
      success: true,
      message: `Time blocked for ${date} from ${startTime} to ${endTime}${reason ? `: ${reason}` : ''}`,
    };
  }

  /**
   * Unblock a previously blocked time slot
   */
  async unblockTime(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<{ success: boolean; message: string }> {
    const doctor = getDoctor(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return {
      success: true,
      message: `Time unblocked for ${date} from ${startTime} to ${endTime}`,
    };
  }

  /**
   * Get weekly schedule for a doctor
   */
  async getWeeklySchedule(doctorId: string): Promise<{
    doctorId: string;
    schedule: {
      [day: number]: AvailabilitySlot[];
    };
  } | null> {
    const doctor = getDoctor(doctorId);
    if (!doctor) {
      return null;
    }

    const availability = await this.getAvailability(doctorId);

    // Group by day of week
    const schedule: { [day: number]: AvailabilitySlot[] } = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = [];
    }

    for (const slot of availability) {
      schedule[slot.dayOfWeek].push(slot);
    }

    return {
      doctorId,
      schedule,
    };
  }

  /**
   * Check if doctor is available at a specific time
   */
  async isAvailable(doctorId: string, date: string, time: string): Promise<boolean> {
    const availability = await this.getAvailability(doctorId);

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    const daySlots = availability.filter(s => s.dayOfWeek === dayOfWeek);

    if (daySlots.length === 0) {
      return false;
    }

    // Check if time falls within any slot
    const [checkHour, checkMin] = time.split(':').map(Number);
    const checkMinutes = checkHour * 60 + checkMin;

    for (const slot of daySlots) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (checkMinutes >= startMinutes && checkMinutes < endMinutes) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get next available slot for a doctor
   */
  async getNextAvailableSlot(
    doctorId: string,
    fromDate?: string
  ): Promise<{ date: string; time: string } | null> {
    const doctor = getDoctor(doctorId);
    if (!doctor) {
      return null;
    }

    const availability = await this.getAvailability(doctorId);
    if (availability.length === 0) {
      return null;
    }

    const startDate = fromDate ? new Date(fromDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Search for next 30 days
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + i);

      const dayOfWeek = checkDate.getDay();
      const daySlots = availability.filter(s => s.dayOfWeek === dayOfWeek);

      if (daySlots.length > 0) {
        // Return first available slot on this day
        const slot = daySlots[0];
        const [hour, min] = slot.startTime.split(':');

        return {
          date: checkDate.toISOString().split('T')[0],
          time: slot.startTime,
        };
      }
    }

    return null;
  }

  /**
   * Set default weekly schedule template
   */
  async setDefaultSchedule(
    doctorId: string,
    weekdaysOnly: boolean = true
  ): Promise<AvailabilitySlot[]> {
    const slots: AvailabilitySlot[] = [];

    if (weekdaysOnly) {
      // Monday to Friday (1-5)
      for (let day = 1; day <= 5; day++) {
        slots.push({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '13:00',
          slotDuration: 30,
        });
        slots.push({
          dayOfWeek: day,
          startTime: '14:00',
          endTime: '18:00',
          slotDuration: 30,
        });
      }
    } else {
      // All days
      for (let day = 0; day <= 6; day++) {
        if (day === 0) {
          // Sunday - limited hours
          slots.push({
            dayOfWeek: day,
            startTime: '10:00',
            endTime: '14:00',
            slotDuration: 30,
          });
        } else {
          slots.push({
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '13:00',
            slotDuration: 30,
          });
          slots.push({
            dayOfWeek: day,
            startTime: '14:00',
            endTime: '18:00',
            slotDuration: 30,
          });
        }
      }
    }

    return this.setAvailability({ doctorId, slots });
  }

  /**
   * Get blocked dates for a doctor
   */
  async getBlockedDates(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<{ date: string; startTime: string; endTime: string; reason?: string }[]> {
    // Implementation would query blocked time slots from database
    // For now, return empty array
    return [];
  }

  /**
   * Get schedule for a specific date range
   */
  async getScheduleForDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    date: string;
    slots: { time: string; available: boolean }[];
  }[]> {
    const availability = await this.getAvailability(doctorId);
    const result: {
      date: string;
      slots: { time: string; available: boolean }[];
    }[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      const daySlots = availability.filter(s => s.dayOfWeek === dayOfWeek);
      const slots: { time: string; available: boolean }[] = [];

      for (const slot of daySlots) {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        const slotDuration = slot.slotDuration || 30;

        let currentMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        while (currentMinutes + slotDuration <= endMinutes) {
          const slotTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
          slots.push({ time: slotTime, available: true });
          currentMinutes += slotDuration;
        }
      }

      result.push({ date: dateStr, slots });
    }

    return result;
  }
}

// Export singleton instance
export const scheduleService = new ScheduleService();
