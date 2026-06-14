import { AppointmentModel } from '../models/Appointment';
import { Appointment, CreateBookingRequest, BookingStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class BookingService {
  async createBooking(data: CreateBookingRequest): Promise<Appointment> {
    const appointmentDate = new Date(data.date);
    const booking = new AppointmentModel({
      bookingId: `BK-${uuidv4().substring(0, 8).toUpperCase()}`,
      customerId: data.customerId,
      serviceId: data.serviceId,
      therapistId: data.therapistId || 'unassigned',
      date: appointmentDate,
      startTime: data.startTime,
      endTime: data.startTime,
      duration: 60,
      status: 'pending',
      notes: data.notes || '',
      specialRequests: data.specialRequests || ''
    });

    await booking.save();
    return booking.toJSON();
  }

  async getBookingById(id: string): Promise<Appointment | null> {
    const booking = await AppointmentModel.findById(id);
    return booking?.toJSON() || null;
  }

  async getBookingByBookingId(bookingId: string): Promise<Appointment | null> {
    const booking = await AppointmentModel.findOne({ bookingId });
    return booking?.toJSON() || null;
  }

  async getBookings(filters: {
    status?: BookingStatus;
    customerId?: string;
    therapistId?: string;
    serviceId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Appointment[]; total: number }> {
    const {
      status,
      customerId,
      therapistId,
      serviceId,
      date,
      page = 1,
      limit = 20
    } = filters;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (therapistId) query.therapistId = therapistId;
    if (serviceId) query.serviceId = serviceId;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const [bookings, total] = await Promise.all([
      AppointmentModel.find(query)
        .sort({ date: -1, startTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AppointmentModel.countDocuments(query)
    ]);

    return {
      bookings: bookings.map(b => b.toJSON()),
      total
    };
  }

  async updateBooking(id: string, data: Partial<Appointment>): Promise<Appointment | null> {
    const updates: Record<string, unknown> = { ...data };
    if (updates.date) {
      updates.date = new Date(updates.date as string);
    }

    const booking = await AppointmentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return booking?.toJSON() || null;
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Appointment | null> {
    const booking = await AppointmentModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    return booking?.toJSON() || null;
  }

  async cancelBooking(id: string): Promise<Appointment | null> {
    return this.updateBookingStatus(id, 'cancelled');
  }

  async getBookingsByDate(date: Date): Promise<Appointment[]> {
    const bookings = await AppointmentModel.findByDate(date);
    return bookings.map(b => b.toJSON());
  }

  async getBookingsByTherapistAndDate(therapistId: string, date: Date): Promise<Appointment[]> {
    const bookings = await AppointmentModel.findByTherapistAndDate(therapistId, date);
    return bookings.map(b => b.toJSON());
  }

  async getBookingsByCustomer(customerId: string, limit = 10): Promise<Appointment[]> {
    const bookings = await AppointmentModel.findByCustomer(customerId, limit);
    return bookings.map(b => b.toJSON());
  }

  async getAvailableSlots(date: string, duration: number, therapistId?: string): Promise<string[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query: Record<string, unknown> = {
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'no_show'] }
    };

    if (therapistId) {
      query.therapistId = therapistId;
    }

    const bookings = await AppointmentModel.find(query).sort({ startTime: 1 });

    const bookedTimes = new Set(bookings.map(b => b.startTime));
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 21;

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      if (!bookedTimes.has(time)) {
        slots.push(time);
      }
    }

    return slots;
  }

  async getBookingStats(date?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byDate: Record<string, number>;
  }> {
    const matchStage: Record<string, unknown> = {};
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const stats = await AppointmentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: { $push: '$status' },
          byDate: { $push: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }
        }
      }
    ]);

    if (stats.length === 0) {
      return { total: 0, byStatus: {}, byDate: {} };
    }

    const result = stats[0];
    const byStatus: Record<string, number> = {};
    const byDate: Record<string, number> = {};

    result.byStatus.forEach((status: string) => {
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    result.byDate.forEach((d: string) => {
      byDate[d] = (byDate[d] || 0) + 1;
    });

    return {
      total: result.total,
      byStatus,
      byDate
    };
  }
}

export const bookingService = new BookingService();
