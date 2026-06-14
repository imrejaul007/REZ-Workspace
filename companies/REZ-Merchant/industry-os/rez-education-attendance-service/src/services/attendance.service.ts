import { AttendanceModel } from '../models/Attendance';
import { Attendance, AttendanceStatus } from '../types';

export class AttendanceService {
  async markAttendance(data: {
    studentId: string;
    batchId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    checkInTime?: string;
    checkOutTime?: string;
  }): Promise<Attendance> {
    const date = new Date(data.date);

    const existing = await AttendanceModel.findOne({ studentId: data.studentId, date });

    if (existing) {
      const updated = await AttendanceModel.findByIdAndUpdate(
        existing._id,
        { $set: { ...data, date } },
        { new: true }
      );
      return updated!.toJSON();
    }

    const attendance = new AttendanceModel({
      ...data,
      date,
      markedBy: 'system'
    });
    await attendance.save();
    return attendance.toJSON();
  }

  async markBulkAttendance(data: {
    batchId: string;
    date: string;
    records: { studentId: string; status: AttendanceStatus; remarks?: string }[];
  }): Promise<Attendance[]> {
    const date = new Date(data.date);

    const results = await Promise.all(
      data.records.map(async record => {
        const existing = await AttendanceModel.findOne({
          studentId: record.studentId,
          date
        });

        if (existing) {
          const updated = await AttendanceModel.findByIdAndUpdate(
            existing._id,
            { $set: { status: record.status, remarks: record.remarks } },
            { new: true }
          );
          return updated!.toJSON();
        }

        const attendance = new AttendanceModel({
          studentId: record.studentId,
          batchId: data.batchId,
          date,
          status: record.status,
          remarks: record.remarks,
          markedBy: 'system'
        });
        await attendance.save();
        return attendance.toJSON();
      })
    );

    return results;
  }

  async getAttendanceById(id: string): Promise<Attendance | null> {
    const attendance = await AttendanceModel.findById(id);
    return attendance?.toJSON() || null;
  }

  async getAttendance(filters: {
    studentId?: string;
    batchId?: string;
    date?: string;
    status?: AttendanceStatus;
    page?: number;
    limit?: number;
  }): Promise<{ records: Attendance[]; total: number }> {
    const { studentId, batchId, date, status, page = 1, limit = 50 } = filters;

    const query: Record<string, unknown> = {};
    if (studentId) query.studentId = studentId;
    if (batchId) query.batchId = batchId;
    if (status) query.status = status;
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const [records, total] = await Promise.all([
      AttendanceModel.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AttendanceModel.countDocuments(query)
    ]);

    return {
      records: records.map(r => r.toJSON()),
      total
    };
  }

  async getStudentAttendance(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Attendance[]> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const records = await AttendanceModel.findByStudentAndDateRange(studentId, start, end);
    return records.map(r => r.toJSON());
  }

  async getBatchAttendance(batchId: string, date: string): Promise<Attendance[]> {
    const targetDate = new Date(date);
    const records = await AttendanceModel.findByDate(targetDate);
    return records.filter(r => r.batchId === batchId).map(r => r.toJSON());
  }

  async getStudentReport(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    studentId: string;
    startDate: Date;
    endDate: Date;
    summary: {
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendancePercentage: number;
    };
    records: Attendance[];
  }> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const records = await AttendanceModel.findByStudentAndDateRange(studentId, start, end);

    const presentRecords = records.filter(r => r.status === 'present');
    const lateRecords = records.filter(r => r.status === 'late');
    const absentRecords = records.filter(r => r.status === 'absent');
    const excusedRecords = records.filter(r => r.status === 'excused');

    return {
      studentId,
      startDate: start,
      endDate: end,
      summary: {
        totalDays: records.length,
        present: presentRecords.length,
        absent: absentRecords.length,
        late: lateRecords.length,
        excused: excusedRecords.length,
        attendancePercentage: records.length > 0
          ? Math.round(((presentRecords.length + lateRecords.length) / records.length) * 100)
          : 0
      },
      records: records.map(r => r.toJSON())
    };
  }

  async updateAttendance(id: string, data: { status?: AttendanceStatus; remarks?: string }): Promise<Attendance | null> {
    const attendance = await AttendanceModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return attendance?.toJSON() || null;
  }
}

export const attendanceService = new AttendanceService();
