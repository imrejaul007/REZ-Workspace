/**
 * GLAMAI - Appointment Manager Service
 * Salon AI Operating System
 *
 * AI Employee: Handles appointment scheduling, reminders, rescheduling, and cancellations.
 */

import mongoose from 'mongoose';
import { Appointment, Service, Customer, Stylist } from '../models';
import { PREP_INSTRUCTIONS, BUSINESS_HOURS } from '../config';
import { AppointmentResponse, AppointmentStatus } from '../types';
import { logger } from '../middleware/logger';

/**
 * Appointment Manager Service Class
 */
export class AppointmentManagerService {
  /**
   * Schedule a new appointment
   */
  async scheduleAppointment(params: {
    customerId: string;
    serviceId: string;
    stylistId?: string;
    date: string;
    time: string;
    notes?: string;
  }): Promise<{ appointment: any; response: AppointmentResponse }> {
    const { customerId, serviceId, stylistId, date, time, notes } = params;

    logger.info('Appointment Manager: Scheduling appointment', {
      customerId,
      serviceId,
      date,
      time,
    });

    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate stylist if provided
    let stylist = null;
    if (stylistId) {
      stylist = await Stylist.findById(stylistId);
      if (!stylist) {
        throw new Error('Stylist not found');
      }
    }

    // Check for conflicting appointments
    const dateTime = new Date(`${date}T${time}:00`);
    const conflicting = await Appointment.findOne({
      stylistId: stylistId || null,
      date: {
        $gte: new Date(dateTime.getTime() - service.duration * 60000),
        $lte: new Date(dateTime.getTime() + service.duration * 60000),
      },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    if (conflicting) {
      throw new Error('Time slot already booked');
    }

    // Create appointment
    const appointment = await Appointment.create({
      customerId: new mongoose.Types.ObjectId(customerId),
      serviceId: new mongoose.Types.ObjectId(serviceId),
      stylistId: stylistId ? new mongoose.Types.ObjectId(stylistId) : undefined,
      date: dateTime,
      time,
      status: 'scheduled',
      notes,
    });

    // Update customer stats
    customer.visits += 1;
    customer.lastVisit = new Date();
    await customer.save();

    // Generate response
    const response: AppointmentResponse = {
      appointmentId: appointment._id.toString(),
      serviceName: service.name,
      stylistName: stylist?.name || 'Any Available',
      dateTime: `${date} at ${time}`,
      duration: service.duration,
      price: service.price,
      prepInstructions: PREP_INSTRUCTIONS[service.category] || PREP_INSTRUCTIONS.Other,
      reminderMessage: `Reminder: Your ${service.name} appointment is scheduled for ${new Date(date).toLocaleDateString()} at ${time}.`,
    };

    logger.info('Appointment Manager: Appointment scheduled', {
      appointmentId: appointment._id,
      customerId,
    });

    return { appointment, response };
  }

  /**
   * Reschedule an existing appointment
   */
  async rescheduleAppointment(params: {
    appointmentId: string;
    newDate: string;
    newTime: string;
  }): Promise<any> {
    const { appointmentId, newDate, newTime } = params;

    logger.info('Appointment Manager: Rescheduling appointment', {
      appointmentId,
      newDate,
      newTime,
    });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const service = await Service.findById(appointment.serviceId);
    const dateTime = new Date(`${newDate}T${newTime}:00`);

    // Check for conflicts
    const conflicting = await Appointment.findOne({
      _id: { $ne: appointmentId },
      stylistId: appointment.stylistId,
      date: {
        $gte: new Date(dateTime.getTime() - (service?.duration || 30) * 60000),
        $lte: new Date(dateTime.getTime() + (service?.duration || 30) * 60000),
      },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    if (conflicting) {
      throw new Error('Time slot unavailable');
    }

    appointment.date = dateTime;
    appointment.time = newTime;
    appointment.status = 'scheduled';
    await appointment.save();

    logger.info('Appointment Manager: Appointment rescheduled', {
      appointmentId,
      newDate,
      newTime,
    });

    return {
      appointment,
      newDate,
      newTime,
      service: service?.name,
    };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(params: {
    appointmentId: string;
    reason?: string;
  }): Promise<void> {
    const { appointmentId, reason } = params;

    logger.info('Appointment Manager: Cancelling appointment', {
      appointmentId,
    });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'cancelled';
    if (reason) {
      appointment.notes = `${appointment.notes || ''}\nCancellation: ${reason}`;
    }
    await appointment.save();

    logger.info('Appointment Manager: Appointment cancelled', { appointmentId });
  }

  /**
   * Confirm an appointment
   */
  async confirmAppointment(appointmentId: string): Promise<any> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'confirmed';
    await appointment.save();

    return appointment;
  }

  /**
   * Start an appointment (mark as in-progress)
   */
  async startAppointment(appointmentId: string): Promise<any> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'in-progress';
    await appointment.save();

    return appointment;
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(appointmentId: string): Promise<any> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'completed';
    await appointment.save();

    // Update customer stats and check for loyalty upgrade
    const service = await Service.findById(appointment.serviceId);
    if (service) {
      const customer = await Customer.findById(appointment.customerId);
      if (customer) {
        customer.totalSpent += service.price;

        // Auto-upgrade loyalty tier based on total spent
        if (customer.totalSpent >= 10000 && customer.loyaltyTier === 'gold') {
          customer.loyaltyTier = 'platinum';
        } else if (customer.totalSpent >= 5000 && customer.loyaltyTier === 'silver') {
          customer.loyaltyTier = 'gold';
        } else if (customer.totalSpent >= 2000 && customer.loyaltyTier === 'bronze') {
          customer.loyaltyTier = 'silver';
        }
        await customer.save();
      }
    }

    logger.info('Appointment Manager: Appointment completed', { appointmentId });

    return appointment;
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(appointmentId: string): Promise<any> {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'no-show';
    await appointment.save();

    return appointment;
  }

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(params: {
    date: string;
    serviceId: string;
    stylistId?: string;
  }): Promise<string[]> {
    const { date, serviceId, stylistId } = params;

    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const query: any = {
      date: {
        $gte: new Date(`${date}T00:00:00`),
        $lte: new Date(`${date}T23:59:59`),
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    };

    if (stylistId) {
      query.stylistId = new mongoose.Types.ObjectId(stylistId);
    }

    const existingAppointments = await Appointment.find(query);

    // Generate all possible slots
    const slots: string[] = [];
    const [startHour, startMin] = BUSINESS_HOURS.start.split(':').map(Number);
    const [endHour, endMin] = BUSINESS_HOURS.end.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    const slotDuration = BUSINESS_HOURS.slotInterval;

    while (currentTime + service.duration <= endTime) {
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Check if slot conflicts with existing appointments
      const slotStart = new Date(`${date}T${slotTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + service.duration * 60000);

      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.date);
        const aptEnd = new Date(aptStart.getTime() + (service.duration * 60000));
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (!hasConflict) {
        slots.push(slotTime);
      }

      currentTime += slotDuration;
    }

    return slots;
  }

  /**
   * Get appointments for a date
   */
  async getAppointmentsByDate(date: string): Promise<any[]> {
    return Appointment.find({
      date: {
        $gte: new Date(`${date}T00:00:00`),
        $lte: new Date(`${date}T23:59:59`),
      },
    })
      .populate('customerId', 'name phone email')
      .populate('serviceId', 'name category price duration')
      .populate('stylistId', 'name phone')
      .sort({ date: 1, time: 1 });
  }
}

export default new AppointmentManagerService();