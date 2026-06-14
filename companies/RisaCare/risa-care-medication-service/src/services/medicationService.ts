import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Medication, IMedication } from '../models/Medication';
import { DoseRecord } from '../models/DoseRecord';
import logger from '../utils/logger';

export interface CreateMedicationDto {
  profileId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  ndc?: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'topical' | 'inhaler' | 'patch' | 'drops' | 'other';
  strength: string;
  color?: string;
  shape?: string;
  manufacturer?: string;
  prescribedBy: string;
  visitId?: string;
  startDate: Date;
  endDate?: Date;
  schedule: {
    times: string[];
    frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed' | 'custom';
    withFood: 'before-meal' | 'with-meal' | 'after-meal' | 'empty-stomach' | 'any';
    remindersEnabled?: boolean;
    customDays?: number[];
  };
  dosage: string;
  instructions?: string;
  purpose?: string;
  refillTracking?: {
    currentQuantity: number;
    dosesPerIntake: number;
    totalRefills?: number;
    pharmacy?: {
      name: string;
      phone: string;
      address?: string;
    };
    autoRefillEnabled?: boolean;
  };
  notes?: string;
}

export interface ScheduleRemindersDto {
  medicationId: string;
  reminderTimes: string[];
  caregiverIds?: string[];
  reminderMethods: Array<'push' | 'sms' | 'email'>;
}

export interface RefillDto {
  medicationId: string;
  quantity: number;
  refillDate?: Date;
  pharmacy?: {
    name: string;
    phone: string;
    address?: string;
  };
}

export class MedicationService {
  private notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
  }

  /**
   * Create a new medication
   */
  async createMedication(dto: CreateMedicationDto): Promise<IMedication> {
    try {
      logger.info('Creating medication', { profileId: dto.profileId, name: dto.name });

      const medicationId = uuidv4();

      // Calculate refill tracking
      const dosesPerIntake = dto.dosesPerIntake ?? this.parseDosageToDoses(dto.dosage);
      const dailyDoses = dto.schedule.times.length;
      const daysUntilRefill = Math.floor(dto.refillTracking?.currentQuantity ?? 30 / (dailyDoses * dosesPerIntake));

      const medication = new Medication({
        id: medicationId,
        profileId: dto.profileId,
        name: dto.name,
        genericName: dto.genericName,
        brandName: dto.brandName,
        ndc: dto.ndc,
        form: dto.form,
        strength: dto.strength,
        color: dto.color,
        shape: dto.shape,
        manufacturer: dto.manufacturer,
        prescribedBy: dto.prescribedBy,
        visitId: dto.visitId,
        status: 'active',
        startDate: dto.startDate,
        endDate: dto.endDate,
        schedule: {
          times: dto.schedule.times,
          frequency: dto.schedule.frequency,
          withFood: dto.schedule.withFood,
          remindersEnabled: dto.schedule.remindersEnabled ?? true,
          customDays: dto.schedule.customDays
        },
        dosage: dto.dosage,
        instructions: dto.instructions,
        purpose: dto.purpose,
        refillTracking: {
          currentQuantity: dto.refillTracking?.currentQuantity ?? 30,
          dosesPerIntake,
          totalRefills: dto.refillTracking?.totalRefills ?? 0,
          refillsRemaining: dto.refillTracking?.totalRefills ?? 0,
          lastRefillDate: new Date(),
          nextRefillDate: new Date(Date.now() + daysUntilRefill * 24 * 60 * 60 * 1000),
          pharmacy: dto.refillTracking?.pharmacy,
          autoRefillEnabled: dto.refillTracking?.autoRefillEnabled ?? false
        },
        sideEffects: [],
        interactions: []
      });

      await medication.save();

      // Generate initial dose records
      await this.generateDoseRecords(medication);

      // Schedule reminders if enabled
      if (dto.schedule.remindersEnabled !== false) {
        await this.scheduleReminders({
          medicationId,
          reminderTimes: dto.schedule.times,
          reminderMethods: ['push']
        });
      }

      logger.info('Medication created', { medicationId, profileId: dto.profileId });

      return medication.toJSON() as IMedication;
    } catch (error) {
      logger.error('Failed to create medication', { error, dto });
      throw error;
    }
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(medicationId: string): Promise<IMedication | null> {
    try {
      logger.info('Fetching medication', { medicationId });
      const medication = await Medication.findOne({ id: medicationId });
      return medication ? (medication.toJSON() as IMedication) : null;
    } catch (error) {
      logger.error('Failed to fetch medication', { error, medicationId });
      throw error;
    }
  }

  /**
   * Get medications by profile ID
   */
  async getMedicationsByProfile(
    profileId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<{ medications: IMedication[]; total: number }> {
    try {
      const { status, limit = 20, offset = 0 } = options;
      logger.info('Fetching medications for profile', { profileId, status, limit, offset });

      const query: Record<string, unknown> = { profileId };
      if (status) {
        query.status = status;
      }

      const [medications, total] = await Promise.all([
        Medication.find(query)
          .sort({ startDate: -1 })
          .skip(offset)
          .limit(limit)
          .lean(),
        Medication.countDocuments(query)
      ]);

      return {
        medications: medications as IMedication[],
        total
      };
    } catch (error) {
      logger.error('Failed to fetch medications', { error, profileId });
      throw error;
    }
  }

  /**
   * Update medication
   */
  async updateMedication(
    medicationId: string,
    updates: Partial<IMedication>
  ): Promise<IMedication | null> {
    try {
      logger.info('Updating medication', { medicationId });
      const medication = await Medication.findOneAndUpdate(
        { id: medicationId },
        { $set: updates },
        { new: true }
      );
      return medication ? (medication.toJSON() as IMedication) : null;
    } catch (error) {
      logger.error('Failed to update medication', { error, medicationId });
      throw error;
    }
  }

  /**
   * Pause medication
   */
  async pauseMedication(medicationId: string, reason?: string): Promise<IMedication | null> {
    try {
      logger.info('Pausing medication', { medicationId, reason });
      return this.updateMedication(medicationId, { status: 'paused' });
    } catch (error) {
      logger.error('Failed to pause medication', { error, medicationId });
      throw error;
    }
  }

  /**
   * Discontinue medication
   */
  async discontinueMedication(
    medicationId: string,
    reason?: string
  ): Promise<IMedication | null> {
    try {
      logger.info('Discontinuing medication', { medicationId, reason });
      return this.updateMedication(medicationId, {
        status: 'discontinued',
        endDate: new Date()
      });
    } catch (error) {
      logger.error('Failed to discontinue medication', { error, medicationId });
      throw error;
    }
  }

  /**
   * Schedule reminders for medication
   */
  async scheduleReminders(dto: ScheduleRemindersDto): Promise<boolean> {
    try {
      logger.info('Scheduling reminders', { medicationId: dto.medicationId });

      const medication = await Medication.findOne({ id: dto.medicationId });
      if (!medication) {
        throw new Error('Medication not found');
      }

      // Call notification service to schedule reminders
      try {
        await axios.post(`${this.notificationServiceUrl}/api/notifications/schedule`, {
          type: 'medication-reminder',
          profileId: medication.profileId,
          medicationId: dto.medicationId,
          medicationName: medication.name,
          dosage: medication.dosage,
          times: dto.reminderTimes,
          methods: dto.reminderMethods,
          caregiverIds: dto.caregiverIds,
          recurring: true,
          recurrencePattern: {
            frequency: medication.schedule.frequency,
            interval: 1
          }
        }, {
          timeout: 5000
        });

        // Update medication to mark reminders as scheduled
        await Medication.findOneAndUpdate(
          { id: dto.medicationId },
          { 'schedule.remindersEnabled': true }
        );

        logger.info('Reminders scheduled', { medicationId: dto.medicationId });
        return true;
      } catch (apiError) {
        // Notification service unavailable, log and continue
        logger.warn('Notification service unavailable, reminders not scheduled', {
          error: apiError,
          medicationId: dto.medicationId
        });
        return false;
      }
    } catch (error) {
      logger.error('Failed to schedule reminders', { error, dto });
      throw error;
    }
  }

  /**
   * Record a refill
   */
  async recordRefill(dto: RefillDto): Promise<IMedication | null> {
    try {
      logger.info('Recording refill', { medicationId: dto.medicationId });

      const medication = await Medication.findOne({ id: dto.medicationId });
      if (!medication) {
        throw new Error('Medication not found');
      }

      if (medication.refillTracking.refillsRemaining <= 0) {
        throw new Error('No refills remaining');
      }

      const now = new Date();
      const daysUntilRefill = Math.floor(
        dto.quantity / (medication.schedule.times.length * medication.refillTracking.dosesPerIntake)
      );

      const updates = {
        'refillTracking.currentQuantity': dto.quantity,
        'refillTracking.lastRefillDate': dto.refillDate || now,
        'refillTracking.nextRefillDate': new Date(now.getTime() + daysUntilRefill * 24 * 60 * 60 * 1000),
        'refillTracking.refillsRemaining': Math.max(0, medication.refillTracking.refillsRemaining - 1)
      };

      if (dto.pharmacy) {
        Object.assign(updates, {
          'refillTracking.pharmacy': dto.pharmacy
        });
      }

      const updated = await Medication.findOneAndUpdate(
        { id: dto.medicationId },
        { $set: updates },
        { new: true }
      );

      // Regenerate dose records
      if (updated) {
        await this.generateDoseRecords(updated);
      }

      logger.info('Refill recorded', { medicationId: dto.medicationId, quantity: dto.quantity });

      return updated ? (updated.toJSON() as IMedication) : null;
    } catch (error) {
      logger.error('Failed to record refill', { error, dto });
      throw error;
    }
  }

  /**
   * Track refill status
   */
  async getRefillStatus(medicationId: string): Promise<{
    medicationId: string;
    currentQuantity: number;
    dosesRemaining: number;
    daysRemaining: number;
    nextRefillDate: Date | null;
    refillsRemaining: number;
    lowSupplyAlert: boolean;
  } | null> {
    try {
      const medication = await Medication.findOne({ id: medicationId });
      if (!medication) return null;

      const { currentQuantity, dosesPerIntake, refillsRemaining, nextRefillDate } = medication.refillTracking;
      const dailyDoses = medication.schedule.times.length;
      const dosesRemaining = currentQuantity / dosesPerIntake;
      const daysRemaining = Math.floor(dosesRemaining / dailyDoses);

      return {
        medicationId,
        currentQuantity,
        dosesRemaining,
        daysRemaining,
        nextRefillDate: nextRefillDate || null,
        refillsRemaining,
        lowSupplyAlert: daysRemaining <= 7 // Alert when less than 7 days supply
      };
    } catch (error) {
      logger.error('Failed to get refill status', { error, medicationId });
      throw error;
    }
  }

  /**
   * Generate dose records for upcoming period
   */
  private async generateDoseRecords(medication: IMedication): Promise<void> {
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

      // Check existing records
      const existingCount = await DoseRecord.countDocuments({
        medicationId: medication.id,
        scheduledTime: { $gte: now, $lte: endDate }
      });

      if (existingCount > 0) {
        logger.info('Dose records already exist for this period', {
          medicationId: medication.id,
          count: existingCount
        });
        return;
      }

      const records: Partial<IDoseRecord>[] = [];

      for (const time of medication.schedule.times) {
        // Generate records for each day
        let currentDate = new Date(now);

        while (currentDate <= endDate) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // Only create future records
          if (scheduledTime > now) {
            records.push({
              id: uuidv4(),
              medicationId: medication.id,
              profileId: medication.profileId,
              scheduledTime,
              scheduledTimeString: time,
              status: 'pending',
              quantity: medication.refillTracking.dosesPerIntake,
              method: 'manual',
              adherenceWindow: {
                early: 30,
                late: 120
              }
            });
          }

          // Move to next day
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }

      if (records.length > 0) {
        await DoseRecord.insertMany(records);
        logger.info('Dose records generated', {
          medicationId: medication.id,
          count: records.length
        });
      }
    } catch (error) {
      logger.error('Failed to generate dose records', { error, medicationId: medication.id });
    }
  }

  private parseDosageToDoses(dosage: string): number {
    // Parse dosage string like "2 tablets", "1 capsule", "5ml"
    const match = dosage.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
}

export interface IDoseRecord {
  id: string;
  medicationId: string;
  profileId: string;
  scheduledTime: Date;
  scheduledTimeString: string;
  takenTime?: Date;
  status: 'taken' | 'missed' | 'skipped' | 'delayed' | 'pending';
  quantity: number;
  method: 'manual' | 'auto' | 'partial';
  notes?: string;
  sideEffects?: string;
  skipReason?: string;
  delayMinutes?: number;
}

export const medicationService = new MedicationService();
