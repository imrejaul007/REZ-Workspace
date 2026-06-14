import { v4 as uuidv4 } from 'uuid';
import {
  MedicationReminder,
  SetMedicationReminderDTO,
} from '../models/elderlyCare';
import {
  MedicationReminderModel,
  MedicationScheduleModel,
  IMedicationReminder,
  IMedicationSchedule,
} from '../models/mongodb';
import logger from '../utils/logger';

export class MedicationReminderService {
  /**
   * Set medication reminder for a patient
   */
  async setReminder(patientId: string, dto: SetMedicationReminderDTO): Promise<MedicationReminder> {
    logger.info('Setting medication reminder', { patientId, medicationName: dto.medicationName });

    // Create reminder for today
    const reminder = new MedicationReminderModel({
      patientId,
      medicationId: dto.medicationId,
      medicationName: dto.medicationName,
      dosage: dto.dosage,
      scheduledTime: dto.scheduledTime,
      taken: false,
      skipped: false,
      scheduledDate: new Date(),
    });

    await reminder.save();

    // Also add to schedules for recurring use
    await MedicationScheduleModel.findOneAndUpdate(
      { patientId, medicationId: dto.medicationId },
      {
        patientId,
        medicationId: dto.medicationId,
        medicationName: dto.medicationName,
        dosage: dto.dosage,
        frequency: dto.frequency || 'daily',
        scheduledTime: dto.scheduledTime,
        enabled: true,
      },
      { upsert: true, new: true }
    );

    logger.info('Medication reminder set successfully', { patientId, reminderId: reminder._id });

    return reminder.toObject() as unknown as MedicationReminder;
  }

  /**
   * Mark medication as taken
   */
  async markTaken(reminderId: string, patientId: string): Promise<MedicationReminder> {
    logger.info('Marking medication as taken', { patientId, reminderId });

    const reminder = await MedicationReminderModel.findOne({ _id: reminderId, patientId });

    if (!reminder) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    reminder.taken = true;
    reminder.takenAt = new Date();
    reminder.skipped = false;
    reminder.skippedReason = undefined;

    await reminder.save();
    logger.info('Medication marked as taken', { patientId, reminderId });

    return reminder.toObject() as unknown as MedicationReminder;
  }

  /**
   * Mark medication as skipped
   */
  async markSkipped(reminderId: string, patientId: string, reason?: string): Promise<MedicationReminder> {
    logger.info('Marking medication as skipped', { patientId, reminderId, reason });

    const reminder = await MedicationReminderModel.findOne({ _id: reminderId, patientId });

    if (!reminder) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    reminder.skipped = true;
    reminder.skippedReason = reason;
    reminder.taken = false;
    reminder.takenAt = undefined;

    await reminder.save();
    logger.info('Medication marked as skipped', { patientId, reminderId });

    return reminder.toObject() as unknown as MedicationReminder;
  }

  /**
   * Get today's medication reminders for a patient
   */
  async getTodayReminders(patientId: string): Promise<MedicationReminder[]> {
    logger.info('Getting today\'s medication reminders', { patientId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reminders = await MedicationReminderModel
      .find({
        patientId,
        scheduledDate: { $gte: today, $lt: tomorrow },
      })
      .sort({ scheduledTime: 1 })
      .lean();

    return reminders as unknown as MedicationReminder[];
  }

  /**
   * Get all medication reminders for a patient
   */
  async getAllReminders(
    patientId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      taken?: boolean;
      skipped?: boolean;
    }
  ): Promise<MedicationReminder[]> {
    logger.info('Fetching medication reminders', { patientId, options });

    const query: any = { patientId };

    if (options?.startDate) {
      query.scheduledDate = { ...query.scheduledDate, $gte: options.startDate };
    }
    if (options?.endDate) {
      query.scheduledDate = { ...query.scheduledDate, $lte: options.endDate };
    }
    if (options?.taken !== undefined) {
      query.taken = options.taken;
    }
    if (options?.skipped !== undefined) {
      query.skipped = options.skipped;
    }

    let queryBuilder = MedicationReminderModel.find(query)
      .sort({ scheduledDate: -1, scheduledTime: 1 });

    if (options?.limit && options.limit > 0) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const reminders = await queryBuilder.lean();
    return reminders as unknown as MedicationReminder[];
  }

  /**
   * Get medication adherence rate
   */
  async getAdherence(patientId: string, days: number = 30): Promise<{
    total: number;
    taken: number;
    skipped: number;
    missed: number;
    adherenceRate: number;
    medicationBreakdown: Record<string, { taken: number; total: number; rate: number }>;
  }> {
    logger.info('Calculating medication adherence', { patientId, days });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    const reminders = await MedicationReminderModel.find({
      patientId,
      scheduledDate: { $gte: startDate, $lte: today },
    }).lean();

    const total = reminders.length;
    const taken = reminders.filter(r => r.taken).length;
    const skipped = reminders.filter(r => r.skipped).length;
    const missed = total - taken - skipped;
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0;

    // Medication breakdown
    const medicationBreakdown: Record<string, { taken: number; total: number; rate: number }> = {};

    for (const reminder of reminders) {
      if (!medicationBreakdown[reminder.medicationName]) {
        medicationBreakdown[reminder.medicationName] = { taken: 0, total: 0, rate: 0 };
      }
      medicationBreakdown[reminder.medicationName].total++;
      if (reminder.taken) {
        medicationBreakdown[reminder.medicationName].taken++;
      }
    }

    // Calculate rates
    for (const med of Object.keys(medicationBreakdown)) {
      const stats = medicationBreakdown[med];
      stats.rate = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0;
    }

    return {
      total,
      taken,
      skipped,
      missed,
      adherenceRate,
      medicationBreakdown,
    };
  }

  /**
   * Get upcoming reminders for today
   */
  async getUpcomingReminders(patientId: string): Promise<MedicationReminder[]> {
    logger.info('Getting upcoming medication reminders', { patientId });

    const todayReminders = await this.getTodayReminders(patientId);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const upcoming = todayReminders.filter(r =>
      !r.taken && !r.skipped && r.scheduledTime > currentTime
    );

    return upcoming;
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders(patientId: string): Promise<MedicationReminder[]> {
    logger.info('Getting overdue medication reminders', { patientId });

    const todayReminders = await this.getTodayReminders(patientId);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const overdue = todayReminders.filter(r =>
      !r.taken && !r.skipped && r.scheduledTime < currentTime
    );

    return overdue;
  }

  /**
   * Delete medication reminder
   */
  async deleteReminder(reminderId: string, patientId: string): Promise<boolean> {
    logger.info('Deleting medication reminder', { patientId, reminderId });

    const result = await MedicationReminderModel.deleteOne({ _id: reminderId, patientId });

    if (result.deletedCount === 0) {
      logger.warn('Reminder not found for deletion', { patientId, reminderId });
      return false;
    }

    logger.info('Reminder deleted successfully', { patientId, reminderId });
    return true;
  }

  /**
   * Delete all schedules for a medication
   */
  async deleteMedicationSchedule(patientId: string, medicationId: string): Promise<boolean> {
    logger.info('Deleting medication schedule', { patientId, medicationId });

    const result = await MedicationScheduleModel.deleteOne({ patientId, medicationId });

    if (result.deletedCount === 0) {
      logger.warn('Schedule not found for deletion', { patientId, medicationId });
      return false;
    }

    logger.info('Medication schedule deleted', { patientId, medicationId });
    return true;
  }

  /**
   * Get medication schedules (for recurring reminders)
   */
  async getMedicationSchedules(patientId: string): Promise<SetMedicationReminderDTO[]> {
    const schedules = await MedicationScheduleModel.find({ patientId, enabled: true }).lean();
    return schedules.map(s => ({
      medicationId: s.medicationId,
      medicationName: s.medicationName,
      dosage: s.dosage,
      scheduledTime: s.scheduledTime,
      scheduledDate: new Date(),
      frequency: s.frequency,
    }));
  }

  /**
   * Create daily reminders from schedules
   */
  async createDailyReminders(patientId: string, date: Date = new Date()): Promise<MedicationReminder[]> {
    logger.info('Creating daily reminders from schedules', { patientId });

    const schedules = await this.getMedicationSchedules(patientId);
    const createdReminders: MedicationReminder[] = [];

    for (const schedule of schedules) {
      const reminder = await this.setReminder(patientId, {
        ...schedule,
        scheduledDate: date,
      });
      createdReminders.push(reminder);
    }

    logger.info('Daily reminders created', { patientId, count: createdReminders.length });
    return createdReminders;
  }
}

export const medicationReminderService = new MedicationReminderService();
export default medicationReminderService;