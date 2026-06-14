import { Attendance, IAttendance, AttendanceStatus } from '../models';
import { Types } from 'mongoose';

export interface CheckInDTO {
  staffId: string;
  date?: Date;
}

export interface CheckOutDTO {
  staffId: string;
  date?: Date;
}

export interface AttendanceFilters {
  staffId?: string;
  startDate: Date;
  endDate: Date;
  status?: AttendanceStatus;
}

export class AttendanceService {
  /**
   * Check in a staff member
   */
  async checkIn(data: CheckInDTO): Promise<IAttendance> {
    const attendanceDate = data.date ? new Date(data.date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if already checked in
    const existing = await Attendance.findOne({
      staffId: new Types.ObjectId(data.staffId),
      date: attendanceDate,
    });

    if (existing) {
      if (existing.checkIn) {
        throw new Error('Already checked in for this date');
      }
      existing.checkIn = new Date();
      await existing.save();
      return existing;
    }

    // Determine status based on check-in time
    const now = new Date();
    const status: AttendanceStatus = now.getHours() >= 9 ? 'late' : 'present';

    const attendance = new Attendance({
      staffId: new Types.ObjectId(data.staffId),
      date: attendanceDate,
      checkIn: now,
      status,
      overtimeMinutes: 0,
    });

    await attendance.save();
    return attendance;
  }

  /**
   * Check out a staff member
   */
  async checkOut(data: CheckOutDTO): Promise<IAttendance> {
    const attendanceDate = data.date ? new Date(data.date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      staffId: new Types.ObjectId(data.staffId),
      date: attendanceDate,
    });

    if (!attendance) {
      throw new Error('No attendance record found. Please check in first.');
    }

    if (!attendance.checkIn) {
      throw new Error('Cannot check out without checking in first.');
    }

    if (attendance.checkOut) {
      throw new Error('Already checked out for this date');
    }

    attendance.checkOut = new Date();

    // Calculate and add overtime if applicable
    const workHours = this.calculateWorkHours(attendance.checkIn, attendance.checkOut);
    const standardWorkHours = 8;
    if (workHours > standardWorkHours) {
      attendance.overtimeMinutes = Math.round((workHours - standardWorkHours) * 60);
    }

    await attendance.save();
    return attendance;
  }

  /**
   * Get attendance record
   */
  async getAttendance(
    filters: AttendanceFilters
  ): Promise<{ records: IAttendance[]; total: number }> {
    const query: Record<string, unknown> = {
      date: {
        $gte: new Date(filters.startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(filters.endDate.setHours(23, 59, 59, 999)),
      },
    };

    if (filters.staffId) {
      query.staffId = new Types.ObjectId(filters.staffId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate('staffId', 'name employeeId role')
        .sort({ date: -1 }),
      Attendance.countDocuments(query),
    ]);

    return { records, total };
  }

  /**
   * Get attendance for a specific date
   */
  async getAttendanceForDate(date: Date): Promise<IAttendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate('staffId', 'name employeeId role');
  }

  /**
   * Calculate total overtime for a staff member
   */
  async calculateOvertime(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalOvertimeMinutes: number;
    totalWorkedHours: number;
    averageWorkedHoursPerDay: number;
    daysWorked: number;
  }> {
    const records = await Attendance.find({
      staffId: new Types.ObjectId(staffId),
      date: {
        $gte: new Date(startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(endDate.setHours(23, 59, 59, 999)),
      },
      status: { $ne: 'absent' },
    });

    let totalOvertimeMinutes = 0;
    let totalWorkedHours = 0;
    let daysWorked = 0;

    records.forEach((record) => {
      totalOvertimeMinutes += record.overtimeMinutes || 0;
      totalWorkedHours += record.get('workedHours') as number || 0;
      if (record.checkIn) daysWorked++;
    });

    return {
      totalOvertimeMinutes,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      averageWorkedHoursPerDay: daysWorked > 0
        ? Math.round((totalWorkedHours / daysWorked) * 100) / 100
        : 0,
      daysWorked,
    };
  }

  /**
   * Update attendance status manually
   */
  async updateStatus(
    staffId: string,
    date: Date,
    status: AttendanceStatus
  ): Promise<IAttendance | null> {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    return Attendance.findOneAndUpdate(
      {
        staffId: new Types.ObjectId(staffId),
        date: attendanceDate,
      },
      { $set: { status } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Mark staff as absent
   */
  async markAbsent(staffId: string, date: Date): Promise<IAttendance> {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      staffId: new Types.ObjectId(staffId),
      date: attendanceDate,
    });

    if (existing) {
      existing.status = 'absent';
      await existing.save();
      return existing;
    }

    const attendance = new Attendance({
      staffId: new Types.ObjectId(staffId),
      date: attendanceDate,
      status: 'absent',
      overtimeMinutes: 0,
    });

    await attendance.save();
    return attendance;
  }

  /**
   * Get attendance summary for a date range
   */
  async getAttendanceSummary(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    totalOvertimeMinutes: number;
    averageAttendanceRate: number;
  }> {
    // This would need to be joined with staff data
    // For now, we'll work with attendance records directly
    const records = await Attendance.find({
      date: {
        $gte: new Date(startDate.setHours(0, 0, 0, 0)),
        $lte: new Date(endDate.setHours(23, 59, 59, 999)),
      },
    });

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      totalOvertimeMinutes: 0,
      averageAttendanceRate: 0,
    };

    records.forEach((record) => {
      switch (record.status) {
        case 'present':
          summary.present++;
          break;
        case 'absent':
          summary.absent++;
          break;
        case 'late':
          summary.late++;
          break;
        case 'half_day':
          summary.halfDay++;
          break;
      }
      summary.totalOvertimeMinutes += record.overtimeMinutes || 0;
    });

    const totalRecords = records.length;
    if (totalRecords > 0) {
      summary.averageAttendanceRate = Math.round(
        ((summary.present + summary.late + summary.halfDay) / totalRecords) * 100
      );
    }

    return summary;
  }

  /**
   * Calculate work hours between check-in and check-out
   */
  private calculateWorkHours(checkIn: Date, checkOut: Date): number {
    const diff = checkOut.getTime() - checkIn.getTime();
    return diff / (1000 * 60 * 60);
  }

  /**
   * Bulk mark attendance for multiple staff
   */
  async bulkMarkAttendance(
    staffIds: string[],
    date: Date,
    status: AttendanceStatus
  ): Promise<{ marked: number; failed: string[] }> {
    let marked = 0;
    const failed: string[] = [];

    for (const staffId of staffIds) {
      try {
        await this.updateStatus(staffId, date, status);
        marked++;
      } catch {
        failed.push(staffId);
      }
    }

    return { marked, failed };
  }
}

export const attendanceService = new AttendanceService();
