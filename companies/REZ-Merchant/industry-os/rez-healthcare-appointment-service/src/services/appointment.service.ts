import { AppointmentModel } from '../models/Appointment';
import { ScheduleModel } from '../models/Schedule';
import { Appointment, Schedule, AppointmentStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentService {
  async createAppointment(data: { patientId: string; doctorId: string; departmentId: string; date: string; startTime: string; reason: string }): Promise<Appointment> {
    const appointment = new AppointmentModel({
      appointmentId: `APT-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      date: new Date(data.date),
      endTime: data.startTime,
      status: 'scheduled'
    });
    await appointment.save();
    return appointment.toJSON();
  }

  async getAppointments(filters: { doctorId?: string; patientId?: string; date?: string }): Promise<Appointment[]> {
    const query: Record<string, unknown> = {};
    if (filters.doctorId) query.doctorId = filters.doctorId;
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    const appointments = await AppointmentModel.find(query).sort({ date: 1, startTime: 1 });
    return appointments.map(a => a.toJSON());
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
    const appointment = await AppointmentModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    return appointment?.toJSON() || null;
  }

  async getSchedules(doctorId?: string): Promise<Schedule[]> {
    const query: Record<string, unknown> = { isActive: true };
    if (doctorId) query.doctorId = doctorId;
    const schedules = await ScheduleModel.find(query).sort({ dayOfWeek: 1 });
    return schedules.map(s => s.toJSON());
  }
}

export const appointmentService = new AppointmentService();
