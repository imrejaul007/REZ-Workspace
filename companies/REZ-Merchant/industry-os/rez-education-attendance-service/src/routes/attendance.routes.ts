import { Router, Request, Response } from 'express';
import { AttendanceModel } from '../models/Attendance';
import { MarkAttendanceSchema, BulkAttendanceSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const studentId = req.query.studentId as string;
    const batchId = req.query.batchId as string;
    const date = req.query.date as string;
    const status = req.query.status as string;

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

    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      AttendanceModel.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      AttendanceModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/student/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const records = await AttendanceModel.findByStudentAndDateRange(studentId, startDate, endDate);
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/batch/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const targetDate = new Date(date);

    const records = await AttendanceModel.findByDate(targetDate).then(results =>
      results.filter(r => r.batchId === batchId)
    );

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/report/:studentId', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const records = await AttendanceModel.findByStudentAndDateRange(studentId, startDate, endDate);

    const summary = {
      totalDays: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length,
      attendancePercentage: records.length > 0
        ? Math.round((records.filter(r => r.status === 'present' || r.status === 'late').length / records.length) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        studentId,
        startDate,
        endDate,
        summary,
        records
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await MarkAttendanceSchema.parseAsync(req.body);

    const existing = await AttendanceModel.findOne({
      studentId: data.studentId,
      date: new Date(data.date)
    });

    if (existing) {
      const updated = await AttendanceModel.findByIdAndUpdate(
        existing._id,
        { $set: { ...data, date: new Date(data.date) } },
        { new: true }
      );
      res.json({
        success: true,
        data: updated,
        message: 'Attendance updated'
      });
      return;
    }

    const attendance = new AttendanceModel({
      ...data,
      date: new Date(data.date),
      markedBy: 'system'
    });

    await attendance.save();
    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const data = await BulkAttendanceSchema.parseAsync(req.body);
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
          return updated;
        }

        const attendance = new AttendanceModel({
          studentId: record.studentId,
          batchId: data.batchId,
          date,
          status: record.status,
          remarks: record.remarks,
          markedBy: 'system'
        });
        return attendance.save();
      })
    );

    res.status(201).json({
      success: true,
      data: results,
      message: 'Bulk attendance marked'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status, remarks } = req.body;
    const attendance = await AttendanceModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status, remarks } },
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
      data: attendance,
      message: 'Attendance updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
