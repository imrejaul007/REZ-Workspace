import { v4 as uuidv4 } from 'uuid';
import type {
  Appointment,
  AppointmentType,
  AppointmentStatus,
  BookAppointmentInput,
  AvailabilitySlot,
} from '../types/schemas.js';
import {
  getAppointment,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  getAllAppointments,
  createAppointment,
  updateAppointment,
  getDoctor,
  getPatient,
  getDoctorAvailability,
} from '../models/store.js';

export class AppointmentService {
  /**
   * Book a new appointment
   */
  async bookAppointment(input: Omit<BookAppointmentInput, 'appointmentId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const now = new Date().toISOString();
    const appointment: Appointment = {
      appointmentId: uuidv4(),
      patientId: input.patientId,
      doctorId: input.doctorId,
      scheduledAt: input.scheduledAt,
      duration: input.duration || 30,
      type: input.type,
      status: 'scheduled',
      chiefComplaint: input.chiefComplaint,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    return createAppointment(appointment);
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    return getAppointment(appointmentId) || null;
  }

  /**
   * Get all appointments
   */
  async getAllAppointments(): Promise<Appointment[]> {
    return getAllAppointments();
  }

  /**
   * Get appointments for a specific doctor
   */
  async getAppointmentsByDoctorId(doctorId: string): Promise<Appointment[]> {
    return getAppointmentsByDoctor(doctorId);
  }

  /**
   * Get appointments for a specific patient
   */
  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    return getAppointmentsByPatient(patientId);
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment | null> {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return null;

    return updateAppointment(appointmentId, {
      status: 'cancelled',
      notes: appointment.notes
        ? `${appointment.notes}\nCancellation reason: ${reason || 'No reason provided'}`
        : `Cancellation reason: ${reason || 'No reason provided'}`,
    }) || null;
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: string,
    newDuration?: number
  ): Promise<Appointment | null> {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return null;

    const updates: Partial<Appointment> = {
      scheduledAt: newScheduledAt,
    };

    if (newDuration) {
      updates.duration = newDuration;
    }

    return updateAppointment(appointmentId, updates) || null;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<Appointment | null> {
    return updateAppointment(appointmentId, { status }) || null;
  }

  /**
   * Update appointment notes
   */
  async updateAppointmentNotes(appointmentId: string, notes: string): Promise<Appointment | null> {
    return updateAppointment(appointmentId, { notes }) || null;
  }

  /**
   * Get available slots for a doctor on a specific date
   */
  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const doctor = getDoctor(doctorId);
    if (!doctor) return [];

    const availability = getDoctorAvailability(doctorId);
    if (availability.length === 0) {
      // Use default availability from doctor record
      return this.getDefaultSlots(doctor.availability, date);
    }

    // Get existing appointments for the doctor on this date
    const appointments = getAppointmentsByDoctor(doctorId);
    const dateStr = date.split('T')[0];
    const bookedSlots = appointments
      .filter(a => {
        const appointmentDate = new Date(a.scheduledAt).toISOString().split('T')[0];
        return appointmentDate === dateStr && a.status !== 'cancelled';
      })
      .map(a => {
        const time = new Date(a.scheduledAt);
        return time.toTimeString().slice(0, 5); // HH:MM format
      });

    // Generate available slots
    const availableSlots: string[] = [];
    const dayOfWeek = new Date(date).getDay();

    const daySlots = availability.filter(s => s.dayOfWeek === dayOfWeek);
    if (daySlots.length === 0) return [];

    for (const slot of daySlots) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const slotDuration = slot.slotDuration || 30;

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;

        // Check if slot is not booked
        const isBooked = bookedSlots.some(booked => {
          const [bookedH, bookedM] = booked.split(':').map(Number);
          const bookedMinutes = bookedH * 60 + bookedM;
          return Math.abs(bookedMinutes - currentMinutes) < slotDuration;
        });

        if (!isBooked) {
          availableSlots.push(slotTime);
        }

        currentMinutes += slotDuration;
      }
    }

    return availableSlots;
  }

  /**
   * Get default slots from doctor's availability config
   */
  private getDefaultSlots(availability: AvailabilitySlot[], date: string): string[] {
    const slots: string[] = [];
    const dayOfWeek = new Date(date).getDay();

    const daySlots = availability.filter(s => s.dayOfWeek === dayOfWeek);

    for (const slot of daySlots) {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const slotDuration = slot.slotDuration || 30;

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotTime = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
        slots.push(slotTime);
        currentMinutes += slotDuration;
      }
    }

    return slots;
  }

  /**
   * Get upcoming appointments for a patient
   */
  async getUpcomingAppointments(patientId: string): Promise<Appointment[]> {
    const now = new Date();
    const appointments = getAppointmentsByPatient(patientId);

    return appointments
      .filter(a => {
        const appointmentDate = new Date(a.scheduledAt);
        return appointmentDate > now && a.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  /**
   * Get today's appointments for a doctor
   */
  async getTodayAppointments(doctorId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const appointments = getAppointmentsByDoctor(doctorId);

    return appointments
      .filter(a => {
        const appointmentDate = new Date(a.scheduledAt).toISOString().split('T')[0];
        return appointmentDate === today && a.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(appointmentId: string): Promise<Appointment | null> {
    return updateAppointment(appointmentId, { status: 'no_show' }) || null;
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(appointmentId: string, notes?: string): Promise<Appointment | null> {
    const appointment = getAppointment(appointmentId);
    if (!appointment) return null;

    return updateAppointment(appointmentId, {
      status: 'completed',
      notes: notes ? `${appointment.notes || ''}\n${notes}`.trim() : appointment.notes,
    }) || null;
  }

  /**
   * Start an appointment (patient arrived)
   */
  async startAppointment(appointmentId: string): Promise<Appointment | null> {
    return updateAppointment(appointmentId, { status: 'in_progress' }) || null;
  }

  /**
   * Get appointments by date range
   */
  async getAppointmentsByDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const appointments = getAppointmentsByDoctor(doctorId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return appointments
      .filter(a => {
        const appointmentDate = new Date(a.scheduledAt);
        return appointmentDate >= start && appointmentDate <= end;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
