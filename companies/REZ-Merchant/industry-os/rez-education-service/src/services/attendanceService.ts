import { v4 as uuidv4 } from 'uuid';
import { Attendance, AttendanceStatus, Student, Batch, IAttendance, IStudent } from '../models';
import logger from '../utils/logger';

export interface MarkAttendanceInput {
  batchId: string;
  studentId: string;
  merchantId: string;
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  markedBy: string;
  notes?: string;
}

export interface BulkMarkAttendanceInput {
  batchId: string;
  merchantId: string;
  date: Date;
  markedBy: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    checkInTime?: Date;
    checkOutTime?: Date;
    notes?: string;
  }[];
}

export interface AttendanceReport {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
}

export class AttendanceService {
  /**
   * Mark a single attendance record
   */
  async markAttendance(input: MarkAttendanceInput): Promise<IAttendance> {
    const { batchId, studentId, merchantId, date, status, markedBy, notes } = input;

    // Validate batch exists
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    // Validate student exists and is enrolled in this batch
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this student on this date
    const existingRecord = await Attendance.findOne({
      batchId,
      studentId,
      date: {
        $gte: normalizedDate,
        $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingRecord) {
      throw new Error(`Attendance already marked for student ${studentId} on ${normalizedDate.toDateString()}`);
    }

    // Create attendance record
    const attendance = new Attendance({
      attendanceId: `ATT-${uuidv4().substring(0, 8).toUpperCase()}`,
      batchId,
      studentId,
      merchantId,
      date: normalizedDate,
      status,
      checkInTime: input.checkInTime,
      checkOutTime: input.checkOutTime,
      markedBy,
      notes
    });

    await attendance.save();

    // Update student attendance rate
    await this.updateStudentAttendanceRate(studentId);

    logger.info(`Attendance marked for student ${studentId} in batch ${batchId} on ${normalizedDate.toDateString()}`);

    return attendance;
  }

  /**
   * Bulk mark attendance for multiple students
   */
  async bulkMarkAttendance(input: BulkMarkAttendanceInput): Promise<IAttendance[]> {
    const { batchId, merchantId, date, markedBy, records } = input;

    // Validate batch exists
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const results: IAttendance[] = [];

    for (const record of records) {
      try {
        // Check if attendance already marked
        const existingRecord = await Attendance.findOne({
          batchId,
          studentId: record.studentId,
          date: {
            $gte: normalizedDate,
            $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingRecord) {
          // Update existing record
          existingRecord.status = record.status;
          existingRecord.checkInTime = record.checkInTime;
          existingRecord.checkOutTime = record.checkOutTime;
          existingRecord.notes = record.notes;
          await existingRecord.save();
          results.push(existingRecord);
        } else {
          // Create new record
          const attendance = new Attendance({
            attendanceId: `ATT-${uuidv4().substring(0, 8).toUpperCase()}`,
            batchId,
            studentId: record.studentId,
            merchantId,
            date: normalizedDate,
            status: record.status,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            markedBy,
            notes: record.notes
          });

          await attendance.save();
          results.push(attendance);
        }
      } catch (error) {
        logger.error(`Failed to mark attendance for student ${record.studentId}:`, error);
      }
    }

    // Update attendance rates for all affected students
    const studentIds = records.map(r => r.studentId);
    for (const studentId of studentIds) {
      await this.updateStudentAttendanceRate(studentId);
    }

    logger.info(`Bulk attendance marked for ${results.length} students in batch ${batchId}`);

    return results;
  }

  /**
   * Update a student's attendance rate based on their attendance history
   */
  async updateStudentAttendanceRate(studentId: string): Promise<void> {
    // Get all attendance records for this student in the current batch
    const student = await Student.findOne({ studentId });
    if (!student || !student.batchId) {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await Attendance.find({
      studentId,
      batchId: student.batchId,
      date: { $gte: thirtyDaysAgo }
    });

    if (attendanceRecords.length === 0) {
      return;
    }

    const presentDays = attendanceRecords.filter(r =>
      r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE
    ).length;

    const attendanceRate = (presentDays / attendanceRecords.length) * 100;

    await Student.findOneAndUpdate(
      { studentId },
      { $set: { attendanceRate } }
    );

    logger.debug(`Updated attendance rate for student ${studentId}: ${attendanceRate.toFixed(2)}%`);
  }

  /**
   * Get attendance report for a student
   */
  async getStudentAttendanceReport(
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ student: IStudent; report: AttendanceReport }> {
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    const filter: Record<string, unknown> = { studentId };

    if (student.batchId) {
      filter.batchId = student.batchId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        (filter.date as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (filter.date as Record<string, Date>).$lte = endDate;
      }
    }

    const attendanceRecords = await Attendance.find(filter).sort({ date: -1 });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const lateDays = attendanceRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const excusedDays = attendanceRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length;

    return {
      student,
      report: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendanceRate: totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 10000) / 100 : 0
      }
    };
  }

  /**
   * Get daily attendance summary for a batch
   */
  async getDailyBatchAttendance(batchId: string, date: Date): Promise<{
    batch: InstanceType<typeof Batch>;
    date: Date;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
  }> {
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      batchId,
      date: {
        $gte: normalizedDate,
        $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const present = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = attendanceRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = attendanceRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const excused = attendanceRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length;
    const totalRecords = attendanceRecords.length;

    return {
      batch,
      date: normalizedDate,
      totalStudents: batch.enrolledStudents,
      present,
      absent,
      late,
      excused,
      rate: totalRecords > 0 ? Math.round(((present + late) / totalRecords) * 10000) / 100 : 0
    };
  }
}

export const attendanceService = new AttendanceService();