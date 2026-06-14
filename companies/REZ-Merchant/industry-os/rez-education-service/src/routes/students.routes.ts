import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Student, StudentStatus, PaymentStatus, Attendance } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createStudentSchema = z.object({
  merchantId: z.string().min(1),
  batchId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(1),
  age: z.number().int().positive().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  photoUrl: z.string().url().optional(),
  enrollmentDate: z.string().transform(s => new Date(s)).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional()
});

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  age: z.number().int().positive().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  photoUrl: z.string().url().optional(),
  batchId: z.string().optional(),
  status: z.nativeEnum(StudentStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional()
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  merchantId: z.string().optional(),
  batchId: z.string().optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(StudentStatus)
});

/**
 * POST /api/students - Create a new student
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createStudentSchema.parse(req.body);

    const student = new Student({
      ...validatedData,
      studentId: `STD-${uuidv4().substring(0, 8).toUpperCase()}`,
      enrollmentDate: validatedData.enrollmentDate || new Date(),
      attendanceRate: 0,
      status: validatedData.status || StudentStatus.ACTIVE,
      paymentStatus: validatedData.paymentStatus || PaymentStatus.PENDING
    });

    await student.save();

    res.status(201).json({
      success: true,
      data: student
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
 * GET /api/students - List/search students
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { phone: { $regex: query.q, $options: 'i' } },
        { email: { $regex: query.q, $options: 'i' } }
      ];
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.batchId) {
      filter.batchId = query.batchId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ enrollmentDate: -1 })
        .skip(skip)
        .limit(limit),
      Student.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        students,
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
 * GET /api/students/:id - Get student by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/students/:id - Update student
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStudentSchema.parse(req.body);

    const student = await Student.findOneAndUpdate(
      { studentId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    res.json({
      success: true,
      data: student
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
 * DELETE /api/students/:id - Delete student
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOneAndDelete({ studentId: req.params.id });

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/students/:id/attendance - Get student attendance history
 */
router.get('/:id/attendance', async (req: Request, res: Response) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: last 90 days
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const attendance = await Attendance.find({
      studentId: student.studentId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    // Calculate attendance rate
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a =>
      a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    res.json({
      success: true,
      data: {
        student,
        attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          attendanceRate: Math.round(attendanceRate * 100) / 100
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
 * PATCH /api/students/:id/status - Update student status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);

    const student = await Student.findOneAndUpdate(
      { studentId: req.params.id },
      { $set: { status: validatedData.status } },
      { new: true }
    );

    if (!student) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    res.json({
      success: true,
      data: student
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