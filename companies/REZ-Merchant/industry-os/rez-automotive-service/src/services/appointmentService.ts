import { Appointment, AppointmentDocument } from '../models';
import { IAppointment, AppointmentStatus, IPaginatedResult } from '../types';
import { rabtul } from '../integrations/rabtul';
import logger from '../utils/logger';

export interface CreateAppointmentData {
  merchantId: string;
  customerId: string;
  vehicleId: string;
  date: Date;
  time: string;
  serviceType: IAppointment['serviceType'];
  estimatedDuration: number;
  estimatedCost: number;
  notes?: string;
}

export interface UpdateAppointmentData {
  date?: Date;
  time?: string;
  serviceType?: IAppointment['serviceType'];
  status?: AppointmentStatus;
  estimatedDuration?: number;
  estimatedCost?: number;
  notes?: string;
}

export interface AppointmentSearchParams {
  merchantId?: string;
  customerId?: string;
  vehicleId?: string;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CalendarEvent {
  appointmentId: string;
  date: Date;
  time: string;
  endTime: string;
  serviceType: string;
  status: AppointmentStatus;
  estimatedDuration: number;
  vehicleId: string;
  customerId: string;
}

class AppointmentService {
  /**
   * Schedule a new appointment
   */
  async schedule(data: CreateAppointmentData): Promise<AppointmentDocument> {
    // Check slot availability
    const isAvailable = await this.checkSlotAvailability(
      data.merchantId,
      data.date,
      data.time,
      data.estimatedDuration
    );

    if (!isAvailable) {
      throw new Error('Time slot is not available. Please choose another time.');
    }

    const appointment = new Appointment({
      ...data,
      status: 'scheduled',
    });

    await appointment.save();

    logger.info('Appointment scheduled', {
      appointmentId: appointment.appointmentId,
      merchantId: appointment.merchantId,
      date: appointment.date,
      time: appointment.time,
    });

    return appointment;
  }

  /**
   * Get appointment by ID
   */
  async getById(appointmentId: string): Promise<AppointmentDocument | null> {
    return Appointment.findOne({ appointmentId });
  }

  /**
   * Update appointment
   */
  async update(appointmentId: string, data: UpdateAppointmentData): Promise<AppointmentDocument | null> {
    // If changing date/time, verify slot availability
    if (data.date || data.time) {
      const existing = await this.getById(appointmentId);
      if (!existing) return null;

      const newDate = data.date || existing.date;
      const newTime = data.time || existing.time;
      const newDuration = data.estimatedDuration || existing.estimatedDuration;

      const isAvailable = await this.checkSlotAvailability(
        existing.merchantId,
        newDate,
        newTime,
        newDuration,
        appointmentId
      );

      if (!isAvailable) {
        throw new Error('Time slot is not available. Please choose another time.');
      }
    }

    const appointment = await Appointment.findOneAndUpdate(
      { appointmentId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (appointment) {
      logger.info('Appointment updated', {
        appointmentId,
        updates: Object.keys(data),
      });
    }

    return appointment;
  }

  /**
   * Update appointment status
   */
  async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<AppointmentDocument | null> {
    return this.update(appointmentId, { status });
  }

  /**
   * Cancel appointment
   */
  async cancel(appointmentId: string): Promise<AppointmentDocument | null> {
    return this.updateStatus(appointmentId, 'cancelled');
  }

  /**
   * Get appointments by merchant
   */
  async getByMerchant(
    merchantId: string,
    options: AppointmentSearchParams = {}
  ): Promise<IPaginatedResult<AppointmentDocument>> {
    const { page = 1, limit = 20, status } = options;

    const query: Record<string, unknown> = { merchantId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find(query).sort({ date: 1, time: 1 }).skip(skip).limit(limit),
      Appointment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get appointments by customer
   */
  async getByCustomer(customerId: string): Promise<AppointmentDocument[]> {
    return Appointment.find({ customerId })
      .sort({ date: -1, time: -1 });
  }

  /**
   * Get appointments by vehicle
   */
  async getByVehicle(vehicleId: string): Promise<AppointmentDocument[]> {
    return Appointment.find({ vehicleId })
      .sort({ date: -1, time: -1 });
  }

  /**
   * Get calendar events for date range
   */
  async getCalendarEvents(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const appointments = await Appointment.find({
      merchantId,
      date: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] },
    }).sort({ date: 1, time: 1 });

    return appointments.map((apt) => ({
      appointmentId: apt.appointmentId,
      date: apt.date,
      time: apt.time,
      endTime: apt.endTime,
      serviceType: apt.serviceType,
      status: apt.status,
      estimatedDuration: apt.estimatedDuration,
      vehicleId: apt.vehicleId,
      customerId: apt.customerId,
    }));
  }

  /**
   * Check if slot is available
   */
  async checkSlotAvailability(
    merchantId: string,
    date: Date,
    time: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const query: Record<string, unknown> = {
      merchantId,
      date: new Date(date),
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    };

    if (excludeAppointmentId) {
      query.appointmentId = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await Appointment.find(query);

    const newStart = this.timeToMinutes(time);
    const newEnd = newStart + duration;

    for (const apt of existingAppointments) {
      const aptStart = this.timeToMinutes(apt.time);
      const aptEnd = aptStart + apt.estimatedDuration;

      // Check for overlap
      if (!(newEnd <= aptStart || newStart >= aptEnd)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get upcoming appointments (next 24 hours)
   */
  async getUpcomingAppointments(merchantId: string): Promise<AppointmentDocument[]> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Appointment.find({
      merchantId,
      date: { $gte: now, $lte: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] },
    }).sort({ date: 1, time: 1 });
  }

  /**
   * Send appointment reminders
   */
  async sendReminders(): Promise<{ sent: number; failed: number }> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      date: { $gte: tomorrowStart, $lte: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    let sent = 0;
    let failed = 0;

    for (const apt of appointments) {
      const result = await rabtul.sendAppointmentReminder(
        apt.appointmentId,
        apt.customerId,
        apt.customerPhone || '',
        apt.date,
        apt.time,
        apt.serviceType
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    logger.info('Appointment reminders sent', { sent, failed });

    return { sent, failed };
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(merchantId: string): Promise<AppointmentDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Appointment.find({
      merchantId,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled'] },
    }).sort({ time: 1 });
  }

  /**
   * Get appointment statistics
   */
  async getStatistics(merchantId: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    scheduled: number;
    inProgress: number;
    totalRevenue: number;
  }> {
    const query: Record<string, unknown> = { merchantId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const appointments = await Appointment.find(query);

    return {
      total: appointments.length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      scheduled: appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length,
      inProgress: appointments.filter((a) => a.status === 'in-progress').length,
      totalRevenue: appointments
        .filter((a) => a.status === 'completed')
        .reduce((sum, a) => sum + a.estimatedCost, 0),
    };
  }

  /**
   * Helper: Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;