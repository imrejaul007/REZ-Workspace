import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Batch, BatchStatus, PaymentPlan, Student } from '../models';
import { enrollmentService } from '../services/enrollmentService';
import { authenticateToken } from '../middleware/auth';
import { sendFeeReminderWhatsApp, trackEnrollmentEvent } from '../integrations/rabtul';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createBatchSchema = z.object({
  courseId: z.string().min(1),
  merchantId: z.string().min(1),
  name: z.string().min(1),
  instructorId: z.string().optional(),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  schedule: z.array(z.object({
    day: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1)
  })).optional(),
  maxStudents: z.number().int().positive().optional(),
  fees: z.number().positive(),
  paymentPlan: z.nativeEnum(PaymentPlan).optional()
});

const updateBatchSchema = z.object({
  name: z.string().min(1).optional(),
  instructorId: z.string().optional(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
  schedule: z.array(z.object({
    day: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1)
  })).optional(),
  maxStudents: z.number().int().positive().optional(),
  fees: z.number().positive().optional(),
  paymentPlan: z.nativeEnum(PaymentPlan).optional(),
  status: z.nativeEnum(BatchStatus).optional()
});

const enrollStudentSchema = z.object({
  studentId: z.string().min(1),
  paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE']).optional()
});

const searchQuerySchema = z.object({
  courseId: z.string().optional(),
  merchantId: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(BatchStatus)
});

/**
 * POST /api/batches - Create a new batch
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createBatchSchema.parse(req.body);

    const batch = new Batch({
      ...validatedData,
      batchId: `BTCH-${uuidv4().substring(0, 8).toUpperCase()}`,
      enrolledStudents: 0,
      status: validatedData.status || BatchStatus.UPCOMING,
      maxStudents: validatedData.maxStudents || 30,
      paymentPlan: validatedData.paymentPlan || PaymentPlan.FULL
    });

    await batch.save();

    res.status(201).json({
      success: true,
      data: batch
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
 * GET /api/batches - List/search batches
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.courseId) {
      filter.courseId = query.courseId;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Batch.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        batches,
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
 * GET /api/batches/:id - Get batch by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/batches/:id - Update batch
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateBatchSchema.parse(req.body);

    const batch = await Batch.findOneAndUpdate(
      { batchId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    res.json({
      success: true,
      data: batch
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
 * DELETE /api/batches/:id - Delete batch
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOneAndDelete({ batchId: req.params.id });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/batches/:id/enroll - Enroll student in batch
 */
router.post('/:id/enroll', async (req: Request, res: Response) => {
  try {
    const validatedData = enrollStudentSchema.parse(req.body);
    const batch = await Batch.findOne({ batchId: req.params.id });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const result = await enrollmentService.enrollStudent({
      batchId: batch.batchId,
      studentId: validatedData.studentId,
      merchantId: batch.merchantId,
      paymentStatus: validatedData.paymentStatus
    });

    // Send fee reminder via WhatsApp if payment is pending via RABTUL SDK
    if (validatedData.paymentStatus === 'PENDING' || validatedData.paymentStatus === 'OVERDUE') {
      try {
        const student = await Student.findOne({ studentId: validatedData.studentId });

        if (student) {
          await sendFeeReminderWhatsApp({
            parentId: student.studentId,
            parentPhone: student.phone,
            parentName: student.parentName || student.name,
            studentName: student.name,
            batchName: batch.name,
            merchantName: batch.merchantId,
            amountDue: batch.fees,
            dueDate: batch.endDate.toLocaleDateString('en-IN'),
            merchantId: batch.merchantId,
          });
          logger.info('Fee reminder sent via RABTUL SDK', {
            studentId: student.studentId,
            batchId: batch.batchId,
          });
        }
      } catch (notifyError) {
        logger.warn('Failed to send fee reminder', { error: notifyError });
      }
    }

    // Track enrollment event via RABTUL SDK
    try {
      const student = await Student.findOne({ studentId: validatedData.studentId });
      if (student) {
        await trackEnrollmentEvent({
          customerId: student.studentId,
          merchantId: batch.merchantId,
          studentId: student.studentId,
          studentName: student.name,
          batchId: batch.batchId,
          batchName: batch.name,
          courseId: batch.courseId,
          courseName: '',
          fees: batch.fees,
          currency: 'INR',
          action: 'enrolled',
        });
      }
    } catch (trackError) {
      logger.warn('Failed to track enrollment event', { error: trackError });
    }

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
      } else if (error.message.includes('Full') || error.message.includes('already enrolled')) {
        res.status(400).json({
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
 * GET /api/batches/:id/students - Get students in batch
 */
router.get('/:id/students', async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    const students = await Student.find({
      batchId: batch.batchId,
      merchantId: batch.merchantId
    }).sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      data: {
        batch,
        students,
        total: students.length
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
 * PATCH /api/batches/:id/status - Update batch status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);

    const batch = await Batch.findOneAndUpdate(
      { batchId: req.params.id },
      { $set: { status: validatedData.status } },
      { new: true }
    );

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
      return;
    }

    res.json({
      success: true,
      data: batch
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