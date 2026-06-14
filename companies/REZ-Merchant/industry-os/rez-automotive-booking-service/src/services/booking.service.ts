import { AppointmentModel } from '../models/Appointment';
import { Appointment, BookingStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class BookingService {
  async createBooking(data: {
    customerId: string;
    vehicleId: string;
    serviceId: string;
    technicianId?: string;
    bayNumber?: string;
    date: string;
    startTime: string;
    notes?: string;
  }): Promise<Appointment> {
    const booking = new AppointmentModel({
      bookingId: `AUTO-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      date: new Date(data.date),
      endTime: data.startTime,
      status: 'scheduled'
    });
    await booking.save();
    return booking.toJSON();
  }

  async getBookingById(id: string): Promise<Appointment | null> {
    const booking = await AppointmentModel.findById(id);
    return booking?.toJSON() || null;
  }

  async getBookings(filters: {
    customerId?: string;
    vehicleId?: string;
    status?: BookingStatus;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Appointment[]; total: number }> {
    const { customerId, vehicleId, status, date, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (customerId) query.customerId = customerId;
    if (vehicleId) query.vehicleId = vehicleId;
    if (status) query.status = status;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const [bookings, total] = await Promise.all([
      AppointmentModel.find(query).sort({ date: -1, startTime: 1 }).skip((page - 1) * limit).limit(limit),
      AppointmentModel.countDocuments(query)
    ]);

    return { bookings: bookings.map(b => b.toJSON()), total };
  }

  async updateBooking(id: string, data: Partial<Appointment>): Promise<Appointment | null> {
    const updates: Record<string, unknown> = { ...data };
    if (updates.date) updates.date = new Date(updates.date as string);
    const booking = await AppointmentModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    return booking?.toJSON() || null;
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Appointment | null> {
    const booking = await AppointmentModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    return booking?.toJSON() || null;
  }

  async cancelBooking(id: string): Promise<Appointment | null> {
    return this.updateBookingStatus(id, 'cancelled');
  }
}

export const bookingService = new BookingService();
