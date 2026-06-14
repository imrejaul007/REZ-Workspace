import { Meeting, MeetingDocument } from '../models/Meeting';
import { OneOnOne, OneOnOneDocument } from '../models/OneOnOne';
import { CalendarSlot, WorkingHours, CalendarConflict } from '../types';

// Define lean document type for queries
interface LeanMeetingDoc {
  meetingId: string;
  title: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}

export class CalendarService {
  // ==================== CONFLICT DETECTION ====================

  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: string
  ): Promise<CalendarConflict[]> {
    const query: Record<string, unknown> = {
      $or: [
        { hostId: userId },
        { attendeeId: userId },
        { participantIds: userId },
      ],
      status: { $in: ['scheduled', 'in_progress'] },
      $and: [
        { scheduledStart: { $lt: endTime } },
        { scheduledEnd: { $gt: startTime } },
      ],
    };

    if (excludeMeetingId) {
      (query.$and as Array<Record<string, unknown>>).push(
        { meetingId: { $ne: excludeMeetingId } }
      );
    }

    const conflicts = await Meeting.find(query)
      .select('meetingId title scheduledStart scheduledEnd')
      .lean<LeanMeetingDoc[]>();

    return conflicts.map((m: LeanMeetingDoc) => ({
      existingMeetingId: m.meetingId,
      existingMeetingTitle: m.title,
      start: m.scheduledStart,
      end: m.scheduledEnd,
    }));
  }

  async findAvailableSlots(
    userId: string,
    startDate: Date,
    endDate: Date,
    duration: number,
    workingHours?: WorkingHours[]
  ): Promise<CalendarSlot[]> {
    const slots: CalendarSlot[] = [];
    const defaultWorkingHours: WorkingHours[] = [
      { day: 1, start: '09:00', end: '18:00' }, // Monday
      { day: 2, start: '09:00', end: '18:00' }, // Tuesday
      { day: 3, start: '09:00', end: '18:00' }, // Wednesday
      { day: 4, start: '09:00', end: '18:00' }, // Thursday
      { day: 5, start: '09:00', end: '18:00' }, // Friday
    ];

    const hours = workingHours || defaultWorkingHours;

    // Get all meetings in the date range
    const meetings = await Meeting.find({
      $or: [
        { hostId: userId },
        { attendeeId: userId },
        { participantIds: userId },
      ],
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledStart: { $gte: startDate, $lt: endDate },
    })
      .select('scheduledStart scheduledEnd')
      .lean();

    // Iterate through each day
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayHours = hours.find((h) => h.day === dayOfWeek);

      if (dayHours) {
        const [startHour, startMinute] = dayHours.start.split(':').map(Number);
        const [endHour, endMinute] = dayHours.end.split(':').map(Number);

        const dayStart = new Date(currentDate);
        dayStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Find available slots within working hours
        let slotStart = new Date(dayStart);

        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

          if (slotEnd <= dayEnd) {
            // Check if this slot conflicts with any meeting
            const hasConflict = meetings.some((meeting) => {
              const meetingStart = new Date(meeting.scheduledStart);
              const meetingEnd = new Date(meeting.scheduledEnd);
              return slotStart < meetingEnd && slotEnd > meetingStart;
            });

            slots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              available: !hasConflict,
              busy: hasConflict,
            });
          }

          // Move to next 30-minute slot
          slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  // ==================== CALENDAR VIEW ====================

  async getCalendarView(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    meetings: MeetingDocument[];
    oneOnOnes: OneOnOneDocument[];
    availableSlots: CalendarSlot[];
  }> {
    const [meetings, oneOnOnes, availableSlots] = await Promise.all([
      Meeting.findInRange(userId, startDate, endDate),
      OneOnOne.findUpcoming(userId, { daysAhead: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) }),
      this.findAvailableSlots(userId, startDate, endDate, 30),
    ]);

    return {
      meetings,
      oneOnOnes,
      availableSlots: availableSlots.filter((s: CalendarSlot) => s.available),
    };
  }

  // ==================== SCHEDULE OPTIMIZATION ====================

  async suggestOptimalTimes(
    userId: string,
    duration: number,
    daysAhead: number = 7
  ): Promise<CalendarSlot[]> {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);

    const slots = await this.findAvailableSlots(userId, startDate, endDate, duration);

    // Filter to only available slots
    return slots.filter((slot) => slot.available);
  }

  // ==================== RECURRING MEETING CHECKS ====================

  async checkRecurringConflict(
    userId: string,
    dayOfWeek: number,
    time: string,
    duration: number,
    endDate: Date
  ): Promise<Array<{ date: Date; conflicts: CalendarConflict[] }>> {
    const conflicts: Array<{ date: Date; conflicts: CalendarConflict[] }> = [];
    const startDate = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    // Check next 12 occurrences
    for (let i = 0; i < 12; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(checkDate.getDate() + ((dayOfWeek - startDate.getDay() + 7) % 7) + i * 7);
      checkDate.setHours(hours, minutes, 0, 0);

      const checkEnd = new Date(checkDate.getTime() + duration * 60 * 1000);

      if (checkDate > endDate) break;

      const dayConflicts = await this.checkConflicts(userId, checkDate, checkEnd);

      if (dayConflicts.length > 0) {
        conflicts.push({
          date: checkDate,
          conflicts: dayConflicts,
        });
      }
    }

    return conflicts;
  }

  // ==================== BUSY TIMES ====================

  async getBusyTimes(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ start: Date; end: Date; busy: boolean }>> {
    const meetings = await Meeting.find({
      $or: [
        { hostId: userId },
        { attendeeId: userId },
        { participantIds: userId },
      ],
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledStart: { $gte: startDate, $lt: endDate },
    })
      .select('scheduledStart scheduledEnd')
      .sort({ scheduledStart: 1 })
      .lean<LeanMeetingDoc[]>();

    return meetings.map((m: LeanMeetingDoc) => ({
      start: m.scheduledStart,
      end: m.scheduledEnd,
      busy: true,
    }));
  }

  // ==================== FREE/BUSY FOR MULTIPLE USERS ====================

  async getFreeBusyForUsers(
    userIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, Array<{ start: Date; end: Date; busy: boolean }>>> {
    const result: Record<string, Array<{ start: Date; end: Date; busy: boolean }>> = {};

    await Promise.all(
      userIds.map(async (userId) => {
        result[userId] = await this.getBusyTimes(userId, startDate, endDate);
      })
    );

    return result;
  }

  // ==================== FIND COMMON SLOTS ====================

  async findCommonSlots(
    userIds: string[],
    duration: number,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarSlot[]> {
    // Get all busy times for all users
    const allBusyTimes = await this.getFreeBusyForUsers(userIds, startDate, endDate);

    // Get all possible slots
    const allSlots = await this.findAvailableSlots(userIds[0], startDate, endDate, duration);

    // Filter slots that are available for ALL users
    return allSlots.filter((slot: CalendarSlot) => {
      return userIds.every((userId: string) => {
        const userBusy = allBusyTimes[userId] || [];
        return !userBusy.some(
          (busy: { start: Date; end: Date; busy: boolean }) => slot.start < busy.end && slot.end > busy.start
        );
      });
    });
  }

  // ==================== DAILY SUMMARY ====================

  async getDailySummary(
    userId: string,
    date: Date
  ): Promise<{
    date: Date;
    totalMeetings: number;
    totalDuration: number;
    meetingIds: string[];
    hasConflicts: boolean;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const meetings = await Meeting.findInRange(userId, startOfDay, endOfDay);

    // Check for conflicts (overlapping meetings)
    const hasConflicts = this.hasOverlappingMeetings(meetings);

    return {
      date,
      totalMeetings: meetings.length,
      totalDuration: meetings.reduce((sum: number, m: MeetingDocument) => sum + m.duration, 0),
      meetingIds: meetings.map((m: MeetingDocument) => m.meetingId),
      hasConflicts,
    };
  }

  private hasOverlappingMeetings(meetings: MeetingDocument[]): boolean {
    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        if (
          meetings[i].scheduledStart < meetings[j].scheduledEnd &&
          meetings[i].scheduledEnd > meetings[j].scheduledStart
        ) {
          return true;
        }
      }
    }
    return false;
  }
}

export const calendarService = new CalendarService();
