import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Attendance, AttendanceStatus, Student, Batch } from '../models';
import { attendanceService } from '../services/attendanceService';
import { authenticateToken } from '../middleware/auth';
import { sendAttendanceAlertSMS } from '../integrations/rabtul';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const markAttendanceSchema = z.object({
  batchId: z.string().min(1),
  studentId: z.string().min(1),
  merchantId: z.string().min(1),
  date: z.string().transform(s => new Date(s)),
  status: z.nativeEnum(AttendanceStatus),
  checkInTime: z.string().transform(s => new Date(s)).optional(),
  checkOutTime: z.string().transform(s => new Date(s)).optional(),
  notes: z.string().optional()
});

const bulkMarkAttendanceSchema = z.object({
  batchId: z.string().min(1),
  merchantId: z.string().min(1),
  date: z.string().transform(s => new Date(s)),
  markedBy: z.string().min(1),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.nativeEnum(AttendanceStatus),
    checkInTime: z.string().transform(s => new Date(s)).optional(),
    checkOutTime: z.string().transform(s => new Date(s)).optional(),
    notes: z.string().optional()
  })).min(1)
});

const updateAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus).optional(),
  checkInTime: z.string().transform(s => new Date(s)).optional(),
  checkOutTime: z.string().transform(s => new Date(s)).optional(),
  notes: z.string().optional()
});

const searchQuerySchema = z.object({
  batchId: z.string().optional(),
  studentId: z.string().optional(),
  merchantId: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

/**
 * POST /api/attendance - Mark attendance
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = markAttendanceSchema.parse(req.body);

    const result = await attendanceService.markAttendance({
      ...validatedData,
      markedBy: req.headers['x-user-id'] as string || 'system'
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('already marked')) {
        res.status(409).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/attendance/bulk - Bulk mark attendance
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const validatedData = bulkMarkAttendanceSchema.parse(req.body);

    const results = await attendanceService.bulkMarkAttendance({
      ...validatedData,
      markedBy: validatedData.markedBy
    });

    // Send SMS notifications for absent students via RABTUL SDK
    const absentRecords = results.filter((r: any) => r.status === AttendanceStatus.ABSENT);
    for (const record of absentRecords) {
      try {
        const student = await Student.findOne({ studentId: record.studentId });
        const batch = await Batch.findOne({ batchId: validatedData.batchId });

        if (student && batch) {
          await sendAttendanceAlertSMS({
            parentId: student.studentId,
            parentPhone: student.phone,
            studentName: student.name,
            batchName: batch.name,
            merchantName: batch.merchantId,
            date: new Date(validatedData.date).toLocaleDateString('en-IN'),
            status: 'absent',
            merchantId: batch.merchantId,
          });
          logger.info('Absent student notification sent via RABTUL SDK', {
            studentId: student.studentId,
            batchId: batch.batchId,
          });
        }
      } catch (notifyError) {
        logger.warn('Failed to send absent student notification', { error: notifyError, studentId: record.studentId });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        total: validatedData.records.length,
        processed: results.length,
        failed: validatedData.records.length - results.length,
        notificationsSent: absentRecords.length,
        records: results
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/attendance - List attendance records
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.batchId) {
      filter.batchId = query.batchId;
    }
    if (query.studentId) {
      filter.studentId = query.studentId;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.date) {
      const searchDate = new Date(query.date);
      filter.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    }
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        (filter.date as Record<string, Date>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (filter.date as Record<string, Date>).$lte = new Date(query.endDate);
      }
    }
    if (query.status) {
      filter.status = query.status;
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 50;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        records,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/attendance/batch/:batchId - Get batch attendance
 */
router.get('/batch/:batchId', async (req: Request, res: Response) => {
  try {
    const date = req.query.date
      ? new Date(req.query.date as string)
      : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const attendance = await Attendance.find({
      batchId: req.params.batchId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        batch,
        date: startOfDay,
        attendance,
        summary: {
          total: attendance.length,
          present: attendance.filter(a => a.status === AttendanceStatus.PRESENT).length,
          absent: attendance.filter(a => a.status === AttendanceStatus.ABSENT).length,
          late: attendance.filter(a => a.status === AttendanceStatus.LATE).length,
          excused: attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/attendance/report/:batchId - Get attendance report
 */
router.get('/report/:batchId', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const students = await Student.find({ batchId: req.params.batchId });
    const attendance = await Attendance.find({
      batchId: req.params.batchId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate per-student attendance
    const studentReports = students.map(student => {
      const studentAttendance = attendance.filter(a => a.studentId === student.studentId);
      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter(a =>
        a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
      ).length;

      return {
        student,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 10000) / 100 : 0
      };
    });

    // Overall summary
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absentCount = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const lateCount = attendance.filter(a => a.status === AttendanceStatus.LATE).length;
    const excusedCount = attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;

    res.json({
      success: true,
      data: {
        batch,
        period: { startDate, endDate },
        summary: {
          totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          overallRate: totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 10000) / 100 : 0
        },
        studentReports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/attendance/:id - Update attendance record
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateAttendanceSchema.parse(req.body);

    const attendance = await Attendance.findOneAndUpdate(
      { attendanceId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!attendance) {
      res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
      return;
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

export default router;