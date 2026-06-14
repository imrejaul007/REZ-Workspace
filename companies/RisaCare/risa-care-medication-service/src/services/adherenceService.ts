import { v4 as uuidv4 } from 'uuid';
import { DoseRecord, IDoseRecord } from '../models/DoseRecord';
import { Medication } from '../models/Medication';
import logger from '../utils/logger';

export interface RecordDoseDto {
  medicationId: string;
  profileId: string;
  scheduledTime: Date;
  status: 'taken' | 'missed' | 'skipped' | 'delayed';
  takenTime?: Date;
  quantity?: number;
  method?: 'manual' | 'auto' | 'partial';
  notes?: string;
  sideEffects?: string;
  skipReason?: string;
  delayMinutes?: number;
}

export interface AdherenceReport {
  profileId: string;
  medicationId?: string;
  period: {
    start: Date;
    end: Date;
  };
  overall: {
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    skippedDoses: number;
    adherenceRate: number;
  };
  byMedication: Array<{
    medicationId: string;
    medicationName: string;
    totalDoses: number;
    takenDoses: number;
    missedDoses: number;
    adherenceRate: number;
  }>;
  dailyAdherence: Array<{
    date: string;
    rate: number;
    taken: number;
    total: number;
  }>;
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    weeklyChange: number;
  };
}

export interface AdherenceStats {
  medicationId: string;
  medicationName: string;
  currentStreak: number;
  longestStreak: number;
  lastTaken: Date | null;
  adherenceRate: number;
  weeklyRate: number;
  monthlyRate: number;
  onTimeRate: number;
  averageDelayMinutes: number;
}

export class AdherenceService {
  /**
   * Record a dose
   */
  async recordDose(dto: RecordDoseDto): Promise<IDoseRecord> {
    try {
      logger.info('Recording dose', {
        medicationId: dto.medicationId,
        profileId: dto.profileId,
        status: dto.status
      });

      // Find existing dose record
      let doseRecord = await DoseRecord.findOne({
        medicationId: dto.medicationId,
        scheduledTime: dto.scheduledTime
      });

      if (doseRecord) {
        // Update existing record
        doseRecord.status = dto.status;
        doseRecord.takenTime = dto.takenTime;
        doseRecord.quantity = dto.quantity ?? doseRecord.quantity;
        doseRecord.method = dto.method ?? 'manual';
        doseRecord.notes = dto.notes;
        doseRecord.sideEffects = dto.sideEffects;
        doseRecord.skipReason = dto.skipReason;
        doseRecord.delayMinutes = dto.delayMinutes;

        if (dto.status === 'delayed' && dto.takenTime) {
          const delayMs = dto.takenTime.getTime() - dto.scheduledTime.getTime();
          doseRecord.delayMinutes = Math.floor(delayMs / 60000);
        }

        await doseRecord.save();
      } else {
        // Create new record
        doseRecord = new DoseRecord({
          id: uuidv4(),
          medicationId: dto.medicationId,
          profileId: dto.profileId,
          scheduledTime: dto.scheduledTime,
          scheduledTimeString: this.getTimeString(dto.scheduledTime),
          status: dto.status,
          takenTime: dto.takenTime,
          quantity: dto.quantity ?? 1,
          method: dto.method ?? 'manual',
          notes: dto.notes,
          sideEffects: dto.sideEffects,
          skipReason: dto.skipReason,
          delayMinutes: dto.delayMinutes
        });

        await doseRecord.save();
      }

      logger.info('Dose recorded', { doseId: doseRecord.id, status: dto.status });

      return doseRecord.toJSON() as IDoseRecord;
    } catch (error) {
      logger.error('Failed to record dose', { error, dto });
      throw error;
    }
  }

  /**
   * Get adherence report for a profile
   */
  async getAdherenceReport(
    profileId: string,
    options: { medicationId?: string; startDate?: Date; endDate?: Date } = {}
  ): Promise<AdherenceReport> {
    try {
      const { medicationId, startDate, endDate } = options;
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

      logger.info('Generating adherence report', { profileId, startDate: start, endDate: end });

      const query: Record<string, unknown> = {
        profileId,
        scheduledTime: { $gte: start, $lte: end }
      };

      if (medicationId) {
        query.medicationId = medicationId;
      }

      const records = await DoseRecord.find(query).sort({ scheduledTime: 1 }).lean() as IDoseRecord[];

      // Calculate overall stats
      const totalDoses = records.length;
      const takenDoses = records.filter(r => r.status === 'taken').length;
      const missedDoses = records.filter(r => r.status === 'missed').length;
      const skippedDoses = records.filter(r => r.status === 'skipped').length;
      const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

      // Calculate by medication
      const byMedicationMap = new Map<string, IDoseRecord[]>();
      for (const record of records) {
        const existing = byMedicationMap.get(record.medicationId) || [];
        existing.push(record);
        byMedicationMap.set(record.medicationId, existing);
      }

      const byMedication = await Promise.all(
        Array.from(byMedicationMap.entries()).map(async ([medId, medRecords]) => {
          const medication = await Medication.findOne({ id: medId });
          const medTaken = medRecords.filter(r => r.status === 'taken').length;
          const medTotal = medRecords.length;

          return {
            medicationId: medId,
            medicationName: medication?.name || 'Unknown',
            totalDoses: medTotal,
            takenDoses: medTaken,
            missedDoses: medRecords.filter(r => r.status === 'missed').length,
            adherenceRate: medTotal > 0 ? (medTaken / medTotal) * 100 : 0
          };
        })
      );

      // Calculate daily adherence
      const dailyMap = new Map<string, { taken: number; total: number }>();
      for (const record of records) {
        const dateKey = record.scheduledTime.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { taken: 0, total: 0 };
        existing.total++;
        if (record.status === 'taken') {
          existing.taken++;
        }
        dailyMap.set(dateKey, existing);
      }

      const dailyAdherence = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          rate: data.total > 0 ? (data.taken / data.total) * 100 : 0,
          taken: data.taken,
          total: data.total
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate trends
      const recentRate = this.calculateRecentRate(dailyAdherence, 7);
      const previousRate = this.calculateRecentRate(dailyAdherence, 14, 7);
      const weeklyChange = recentRate - previousRate;

      const trends: AdherenceReport['trends'] = {
        direction: weeklyChange > 5 ? 'improving' : weeklyChange < -5 ? 'declining' : 'stable',
        weeklyChange
      };

      return {
        profileId,
        medicationId,
        period: { start, end },
        overall: {
          totalDoses,
          takenDoses,
          missedDoses,
          skippedDoses,
          adherenceRate
        },
        byMedication,
        dailyAdherence,
        trends
      };
    } catch (error) {
      logger.error('Failed to generate adherence report', { error, profileId });
      throw error;
    }
  }

  /**
   * Get adherence stats for a specific medication
   */
  async getAdherenceStats(medicationId: string): Promise<AdherenceStats | null> {
    try {
      logger.info('Getting adherence stats', { medicationId });

      const medication = await Medication.findOne({ id: medicationId });
      if (!medication) {
        return null;
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get last 30 days of records
      const records = await DoseRecord.find({
        medicationId,
        scheduledTime: { $gte: thirtyDaysAgo, $lte: now }
      }).sort({ scheduledTime: -1 }).lean() as IDoseRecord[];

      const weeklyRecords = records.filter(r => r.scheduledTime >= sevenDaysAgo);
      const totalDoses = records.length;
      const takenDoses = records.filter(r => r.status === 'taken').length;
      const weeklyTaken = weeklyRecords.filter(r => r.status === 'taken').length;

      // Calculate streaks
      const { currentStreak, longestStreak, lastTaken } = this.calculateStreaks(records);

      // Calculate on-time rate
      const takenRecords = records.filter(r => r.status === 'taken');
      const onTimeCount = takenRecords.filter(r => {
        if (!r.takenTime) return false;
        const delay = (r.takenTime.getTime() - r.scheduledTime.getTime()) / 60000;
        return delay <= r.adherenceWindow?.late;
      }).length;
      const onTimeRate = takenRecords.length > 0 ? (onTimeCount / takenRecords.length) * 100 : 0;

      // Calculate average delay
      const delayedRecords = records.filter(r => r.delayMinutes && r.delayMinutes > 0);
      const averageDelayMinutes = delayedRecords.length > 0
        ? delayedRecords.reduce((sum, r) => sum + (r.delayMinutes || 0), 0) / delayedRecords.length
        : 0;

      return {
        medicationId,
        medicationName: medication.name,
        currentStreak,
        longestStreak,
        lastTaken,
        adherenceRate: totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0,
        weeklyRate: weeklyRecords.length > 0 ? (weeklyTaken / weeklyRecords.length) * 100 : 0,
        monthlyRate: totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0,
        onTimeRate,
        averageDelayMinutes
      };
    } catch (error) {
      logger.error('Failed to get adherence stats', { error, medicationId });
      throw error;
    }
  }

  /**
   * Get upcoming doses for a profile
   */
  async getUpcomingDoses(
    profileId: string,
    options: { hours?: number; limit?: number } = {}
  ): Promise<IDoseRecord[]> {
    try {
      const { hours = 24, limit = 10 } = options;
      const now = new Date();
      const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const records = await DoseRecord.find({
        profileId,
        status: 'pending',
        scheduledTime: { $gte: now, $lte: endTime }
      })
        .sort({ scheduledTime: 1 })
        .limit(limit)
        .lean();

      return records as IDoseRecord[];
    } catch (error) {
      logger.error('Failed to get upcoming doses', { error, profileId });
      return [];
    }
  }

  /**
   * Get missed doses that need attention
   */
  async getMissedDoses(profileId: string): Promise<IDoseRecord[]> {
    try {
      const now = new Date();

      const records = await DoseRecord.find({
        profileId,
        status: 'pending',
        scheduledTime: { $lt: now }
      })
        .sort({ scheduledTime: 1 })
        .limit(10)
        .lean();

      return records as IDoseRecord[];
    } catch (error) {
      logger.error('Failed to get missed doses', { error, profileId });
      return [];
    }
  }

  private calculateStreaks(records: IDoseRecord[]): {
    currentStreak: number;
    longestStreak: number;
    lastTaken: Date | null;
  } {
    const takenRecords = records
      .filter(r => r.status === 'taken')
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());

    if (takenRecords.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastTaken: null };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check if most recent dose was today (for current streak)
    const now = new Date();
    const mostRecent = takenRecords[0];
    const hoursSinceLastDose = (now.getTime() - mostRecent.scheduledTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastDose <= 24) {
      currentStreak = 1;
      tempStreak = 1;
    }

    // Group by date to calculate streaks
    const dateMap = new Map<string, boolean>();
    for (const record of takenRecords) {
      const dateKey = record.scheduledTime.toISOString().split('T')[0];
      dateMap.set(dateKey, true);
    }

    const dates = Array.from(dateMap.keys()).sort().reverse();
    let prevDate: Date | null = null;

    for (const dateStr of dates) {
      const date = new Date(dateStr);

      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const dayDiff = (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff <= 1) {
          tempStreak++;
        } else {
          if (currentStreak === 0 && tempStreak > 0) {
            currentStreak = tempStreak;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      prevDate = date;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
    if (currentStreak === 0) {
      currentStreak = tempStreak;
    }

    return {
      currentStreak,
      longestStreak,
      lastTaken: takenRecords[0]?.takenTime || takenRecords[0]?.scheduledTime || null
    };
  }

  private calculateRecentRate(
    dailyAdherence: Array<{ date: string; rate: number }>,
    days: number,
    offset: number = 0
  ): number {
    const relevantDays = dailyAdherence.slice(offset, offset + days);
    if (relevantDays.length === 0) return 0;

    const totalRate = relevantDays.reduce((sum, d) => sum + d.rate, 0);
    return totalRate / relevantDays.length;
  }

  private getTimeString(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}

export const adherenceService = new AdherenceService();
