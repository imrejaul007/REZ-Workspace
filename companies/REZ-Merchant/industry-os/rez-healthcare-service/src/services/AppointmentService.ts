import { v4 as uuidv4 } from 'uuid';
import {
  Appointment,
  IAppointment,
  AppointmentStatus,
  AppointmentType,
} from '../models/Appointment';
import { logger } from '../config/logger';
import { IntentGraphClient } from './IntentGraphClient';

export interface CreateAppointmentInput {
  patientId: string;
  providerId: string;
  providerName: string;
  type: AppointmentType;
  scheduledAt: Date;
  duration?: number;
  reason: {
    chiefComplaint: string;
    symptoms?: string[];
    duration?: string;
    severity?: 'mild' | 'moderate' | 'severe';
  };
  priority?: 'routine' | 'urgent' | 'emergency';
}

export interface UpdateAppointmentInput {
  scheduledAt?: Date;
  duration?: number;
  status?: AppointmentStatus;
  diagnosis?: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['confirmed', 'cancelled', 'rescheduled'],
  confirmed: ['in-progress', 'cancelled', 'rescheduled'],
  'in-progress': ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  'no-show': ['scheduled', 'confirmed'],
  rescheduled: ['confirmed', 'cancelled'],
};

export class AppointmentService {
  private intentGraphClient: IntentGraphClient;

  constructor() {
    this.intentGraphClient = new IntentGraphClient();
  }

  private calculateEndTime(startTime: Date, duration: number): Date {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime;
  }

  async createAppointment(input: CreateAppointmentInput): Promise<IAppointment> {
    try {
      const appointmentId = `APT-${uuidv4().substring(0, 8).toUpperCase()}`;
      const duration = input.duration || 30;
      const endTime = this.calculateEndTime(input.scheduledAt, duration);

      const appointment = new Appointment({
        appointmentId,
        patientId: input.patientId,
        providerId: input.providerId,
        providerName: input.providerName,
        type: input.type,
        status: 'scheduled',
        priority: input.priority || 'routine',
        scheduledAt: input.scheduledAt,
        duration,
        endTime,
        reason: input.reason,
        followUpRequired: false,
      });

      await appointment.save();
      logger.info('Appointment created', { appointmentId, patientId: input.patientId });

      // Track intent
      await this.intentGraphClient.trackIntent({
        userId: input.patientId,
        intent: 'appointment_scheduled',
        entities: {
          appointmentId,
          providerId: input.providerId,
          appointmentType: input.type,
          scheduledAt: input.scheduledAt.toISOString(),
        },
        metadata: {
          service: 'rez-healthcare-service',
        },
      });

      return appointment.toObject();
    } catch (error) {
      logger.error('Failed to create appointment', { error, patientId: input.patientId });
      throw error;
    }
  }

  async getAppointmentById(appointmentId: string): Promise<IAppointment | null> {
    try {
      const appointment = await Appointment.findOne({ appointmentId });
      return appointment?.toObject() || null;
    } catch (error) {
      logger.error('Failed to get appointment', { error, appointmentId });
      throw error;
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    additionalData?: {
      cancellationReason?: string;
      cancelledBy?: string;
      diagnosis?: string;
      notes?: string;
    }
  ): Promise<IAppointment | null> {
    try {
      const appointment = await Appointment.findOne({ appointmentId });
      if (!appointment) {
        return null;
      }

      // Validate transition
      const allowedTransitions = VALID_TRANSITIONS[appointment.status];
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${appointment.status} to ${newStatus}`
        );
      }

      const updateData: Record<string, unknown> = { status: newStatus };

      if (newStatus === 'cancelled') {
        updateData.cancellationReason = additionalData?.cancellationReason;
        updateData.cancelledBy = additionalData?.cancelledBy;
        updateData.cancelledAt = new Date();
      }

      if (newStatus === 'completed') {
        updateData.diagnosis = additionalData?.diagnosis;
        updateData.notes = additionalData?.notes;
      }

      const updated = await Appointment.findOneAndUpdate(
        { appointmentId },
        { $set: updateData },
        { new: true }
      );

      if (updated) {
        logger.info('Appointment status updated', { appointmentId, newStatus });
      }

      return updated?.toObject() || null;
    } catch (error) {
      logger.error('Failed to update appointment status', { error, appointmentId });
      throw error;
    }
  }

  async updateAppointment(
    appointmentId: string,
    input: UpdateAppointmentInput
  ): Promise<IAppointment | null> {
    try {
      const updateData: Record<string, unknown> = { ...input };

      if (input.scheduledAt || input.duration) {
        const appointment = await Appointment.findOne({ appointmentId });
        if (!appointment) {
          return null;
        }

        const duration = input.duration || appointment.duration;
        const scheduledAt = input.scheduledAt || appointment.scheduledAt;
        updateData.endTime = this.calculateEndTime(scheduledAt, duration);
      }

      const updated = await Appointment.findOneAndUpdate(
        { appointmentId },
        { $set: updateData },
        { new: true }
      );

      if (updated) {
        logger.info('Appointment updated', { appointmentId });
      }

      return updated?.toObject() || null;
    } catch (error) {
      logger.error('Failed to update appointment', { error, appointmentId });
      throw error;
    }
  }

  async getPatientAppointments(
    patientId: string,
    options?: {
      status?: AppointmentStatus;
      upcoming?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ appointments: IAppointment[]; total: number }> {
    try {
      const { status, upcoming, page = 1, limit = 20 } = options || {};
      const filter: Record<string, unknown> = { patientId };

      if (status) {
        filter.status = status;
      }

      if (upcoming) {
        filter.scheduledAt = { $gte: new Date() };
        filter.status = { $in: ['scheduled', 'confirmed'] };
      }

      const [appointments, total] = await Promise.all([
        Appointment.find(filter)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ scheduledAt: upcoming ? 1 : -1 }),
        Appointment.countDocuments(filter),
      ]);

      return { appointments: appointments.map((a) => a.toObject()), total };
    } catch (error) {
      logger.error('Failed to get patient appointments', { error, patientId });
      throw error;
    }
  }

  async getProviderAppointments(
    providerId: string,
    date: Date
  ): Promise<IAppointment[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        providerId,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      }).sort({ scheduledAt: 1 });

      return appointments.map((a) => a.toObject());
    } catch (error) {
      logger.error('Failed to get provider appointments', { error, providerId, date });
      throw error;
    }
  }

  async cancelAppointment(
    appointmentId: string,
    reason: string,
    cancelledBy: string
  ): Promise<IAppointment | null> {
    return this.updateAppointmentStatus(appointmentId, 'cancelled', {
      cancellationReason: reason,
      cancelledBy,
    });
  }

  async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: Date,
    newDuration?: number
  ): Promise<IAppointment | null> {
    try {
      const updated = await this.updateAppointment(appointmentId, {
        scheduledAt: newScheduledAt,
        duration: newDuration,
        status: 'rescheduled',
      });

      if (updated) {
        await this.updateAppointmentStatus(appointmentId, 'confirmed');
      }

      return updated;
    } catch (error) {
      logger.error('Failed to reschedule appointment', { error, appointmentId });
      throw error;
    }
  }
}
