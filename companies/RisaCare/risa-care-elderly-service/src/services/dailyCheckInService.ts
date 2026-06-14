import { v4 as uuidv4 } from 'uuid';
import {
  DailyCheckIn,
  SubmitCheckInDTO,
} from '../models/elderlyCare';
import {
  DailyCheckInModel,
  CheckInScheduleModel,
  IDailyCheckIn,
  ICheckInSchedule,
} from '../models/mongodb';
import logger from '../utils/logger';

// Default check-in time (24-hour format)
const DEFAULT_CHECK_IN_TIME = '09:00';

export class DailyCheckInService {
  /**
   * Schedule daily check-in for a patient
   */
  async scheduleCheckIn(patientId: string, time?: string): Promise<{ time: string; enabled: boolean }> {
    logger.info('Scheduling daily check-in', { patientId, time });

    const scheduleData = {
      patientId,
      time: time || DEFAULT_CHECK_IN_TIME,
      enabled: true,
    };

    await CheckInScheduleModel.findOneAndUpdate(
      { patientId },
      scheduleData,
      { upsert: true, new: true }
    );

    logger.info('Check-in scheduled successfully', { patientId, schedule: scheduleData });

    return scheduleData;
  }

  /**
   * Get scheduled check-in for a patient
   */
  async getSchedule(patientId: string): Promise<{ time: string; enabled: boolean } | null> {
    const schedule = await CheckInScheduleModel.findOne({ patientId }).lean();
    if (!schedule) return null;
    return { time: schedule.time, enabled: schedule.enabled };
  }

  /**
   * Submit daily check-in
   */
  async submitCheckIn(dto: SubmitCheckInDTO): Promise<DailyCheckIn> {
    logger.info('Submitting daily check-in', { patientId: dto.patientId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if check-in already exists for today
    const existingToday = await DailyCheckInModel.findOne({
      patientId: dto.patientId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (existingToday) {
      // Update existing check-in
      Object.assign(existingToday, {
        completed: true,
        completedAt: new Date(),
        vitals: dto.vitals,
        mood: dto.mood,
        painLevel: dto.painLevel,
        notes: dto.notes,
        symptoms: dto.symptoms || [],
      });
      await existingToday.save();
      logger.info('Today\'s check-in updated', { patientId: dto.patientId });
      return existingToday.toObject() as unknown as DailyCheckIn;
    }

    // Create new check-in
    const checkIn = new DailyCheckInModel({
      patientId: dto.patientId,
      date: dto.date || new Date(),
      completed: true,
      completedAt: new Date(),
      vitals: dto.vitals,
      mood: dto.mood,
      painLevel: dto.painLevel,
      notes: dto.notes,
      symptoms: dto.symptoms || [],
    });

    await checkIn.save();
    logger.info('Daily check-in submitted successfully', { patientId: dto.patientId, checkInId: checkIn._id });

    return checkIn.toObject() as unknown as DailyCheckIn;
  }

  /**
   * Get check-in history for a patient
   */
  async getCheckInHistory(
    patientId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<DailyCheckIn[]> {
    logger.info('Fetching check-in history', { patientId, options });

    const query: any = { patientId };

    if (options?.startDate) {
      query.date = { ...query.date, $gte: options.startDate };
    }
    if (options?.endDate) {
      query.date = { ...query.date, $lte: options.endDate };
    }

    let queryBuilder = DailyCheckInModel.find(query).sort({ date: -1 });

    if (options?.limit && options.limit > 0) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    const checkIns = await queryBuilder.lean();
    return checkIns as unknown as DailyCheckIn[];
  }

  /**
   * Get today's check-in for a patient
   */
  async getTodayCheckIn(patientId: string): Promise<DailyCheckIn | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = await DailyCheckInModel.findOne({
      patientId,
      date: { $gte: today, $lt: tomorrow },
    }).lean();

    return checkIn as unknown as DailyCheckIn | null;
  }

  /**
   * Get missed check-ins for a patient
   */
  async getMissedCheckIns(
    patientId: string,
    days: number = 7
  ): Promise<{ date: Date; daysMissed: number }[]> {
    logger.info('Getting missed check-ins', { patientId, days });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    // Get all check-ins in range
    const checkIns = await DailyCheckInModel.find({
      patientId,
      date: { $gte: startDate, $lte: today },
    }).select('date').lean();

    const checkInDates = new Set(
      checkIns.map(c => {
        const d = new Date(c.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    const missed: { date: Date; daysMissed: number }[] = [];

    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      if (!checkInDates.has(date.getTime())) {
        missed.push({
          date,
          daysMissed: i,
        });
      }
    }

    return missed;
  }

  /**
   * Get check-in compliance rate
   */
  async getComplianceRate(patientId: string, days: number = 30): Promise<{
    total: number;
    completed: number;
    rate: number;
  }> {
    logger.info('Calculating compliance rate', { patientId, days });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    const completed = await DailyCheckInModel.countDocuments({
      patientId,
      date: { $gte: startDate, $lte: today },
      completed: true,
    });

    return {
      total: days,
      completed,
      rate: Math.round((completed / days) * 100),
    };
  }

  /**
   * Get health trends over time
   */
  async getHealthTrends(
    patientId: string,
    days: number = 30
  ): Promise<{
    mood: { average: number; trend: 'up' | 'down' | 'stable' };
    pain: { average: number; max: number; trend: 'up' | 'down' | 'stable' };
    vitals: {
      bp: { readings: string[] };
      hr: { average: number; min: number; max: number };
      spo2: { average: number; min: number };
    };
  }> {
    logger.info('Calculating health trends', { patientId, days });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checkIns = await DailyCheckInModel.find({
      patientId,
      date: { $gte: startDate },
      completed: true,
    }).sort({ date: 1 }).lean();

    // Mood trend (great=5, good=4, okay=3, fair=2, poor=1)
    const moodValues: Record<string, number> = { great: 5, good: 4, okay: 3, fair: 2, poor: 1 };
    const moodReadings = checkIns
      .filter(c => c.mood)
      .map(c => moodValues[c.mood!]);

    // Pain trend
    const painReadings = checkIns
      .filter(c => c.painLevel !== undefined)
      .map(c => c.painLevel!);

    // Vitals
    const hrReadings = checkIns
      .filter(c => c.vitals?.hr !== undefined)
      .map(c => c.vitals!.hr!);

    const spo2Readings = checkIns
      .filter(c => c.vitals?.spo2 !== undefined)
      .map(c => c.vitals!.spo2!);

    const bpReadings = checkIns
      .filter(c => c.vitals?.bp !== undefined)
      .map(c => c.vitals!.bp!);

    // Calculate averages
    const moodAverage = moodReadings.length > 0
      ? moodReadings.reduce((a, b) => a + b, 0) / moodReadings.length
      : 0;

    const painAverage = painReadings.length > 0
      ? painReadings.reduce((a, b) => a + b, 0) / painReadings.length
      : 0;

    const painMax = painReadings.length > 0 ? Math.max(...painReadings) : 0;

    const hrAverage = hrReadings.length > 0
      ? hrReadings.reduce((a, b) => a + b, 0) / hrReadings.length
      : 0;
    const hrMin = hrReadings.length > 0 ? Math.min(...hrReadings) : 0;
    const hrMax = hrReadings.length > 0 ? Math.max(...hrReadings) : 0;

    const spo2Average = spo2Readings.length > 0
      ? spo2Readings.reduce((a, b) => a + b, 0) / spo2Readings.length
      : 0;
    const spo2Min = spo2Readings.length > 0 ? Math.min(...spo2Readings) : 0;

    // Calculate trends
    const calculateTrend = (readings: number[]): 'up' | 'down' | 'stable' => {
      if (readings.length < 4) return 'stable';
      const half = Math.floor(readings.length / 2);
      const firstHalf = readings.slice(0, half);
      const secondHalf = readings.slice(half);
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;
      if (diff > 0.2) return 'up';
      if (diff < -0.2) return 'down';
      return 'stable';
    };

    return {
      mood: {
        average: Math.round(moodAverage * 10) / 10,
        trend: calculateTrend(moodReadings),
      },
      pain: {
        average: Math.round(painAverage * 10) / 10,
        max: painMax,
        trend: calculateTrend(painReadings),
      },
      vitals: {
        bp: { readings: bpReadings },
        hr: {
          average: Math.round(hrAverage),
          min: hrMin,
          max: hrMax,
        },
        spo2: {
          average: Math.round(spo2Average),
          min: spo2Min,
        },
      },
    };
  }

  /**
   * Get all patients with missed check-ins today
   */
  async getPatientsMissingToday(): Promise<string[]> {
    logger.info('Finding patients missing check-ins today');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all patients with scheduled check-ins
    const schedules = await CheckInScheduleModel.find({ enabled: true }).lean();
    const scheduledPatientIds = schedules.map(s => s.patientId);

    // Get patients who checked in today
    const checkedIn = await DailyCheckInModel.distinct('patientId', {
      date: { $gte: today, $lt: tomorrow },
    });

    const checkedInSet = new Set(checkedIn);

    return scheduledPatientIds.filter(id => !checkedInSet.has(id));
  }

  /**
   * Cancel scheduled check-in
   */
  async cancelSchedule(patientId: string): Promise<boolean> {
    const result = await CheckInScheduleModel.findOneAndUpdate(
      { patientId },
      { enabled: false },
      { new: true }
    );

    if (!result) return false;

    logger.info('Check-in schedule cancelled', { patientId });
    return true;
  }
}

export const dailyCheckInService = new DailyCheckInService();
export default dailyCheckInService;