import { Router, Response } from 'express';
import { Certificate, Enrollment } from '../../models/index.js';
import { authenticate, authorize, asyncHandler, AppError, AuthenticatedRequest } from '../../middleware/index.js';

const router = Router();

// GET /api/certificates - List all certificates (admin)
router.get(
  '/',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { tenantId: req.tenantId };

    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate('courseId', 'title category')
        .populate('enrollmentId', 'employeeId progress')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/certificates/my - Get current user's certificates
router.get(
  '/my',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {
      tenantId: req.tenantId,
      employeeId: req.user?.userId,
    };

    if (req.query.courseId) filter.courseId = req.query.courseId;

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate('courseId', 'title category duration level thumbnail')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/certificates/:id - Get certificate by ID
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    }).populate('courseId');

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    // Check access
    if (
      certificate.employeeId !== req.user?.userId &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'hr_manager'
    ) {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: certificate,
    });
  })
);

// GET /api/certificates/verify/:certificateId - Verify certificate (public)
router.get(
  '/verify/:certificateId',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    }).populate('courseId');

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    res.json({
      success: true,
      data: {
        valid: true,
        certificateId: certificate.certificateId,
        courseTitle: (certificate.courseId as any)?.title,
        employeeName: certificate.metadata?.employeeName,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        status: certificate.expiresAt && new Date() > certificate.expiresAt ? 'expired' : 'valid',
      },
    });
  })
);

// GET /api/certificates/stats - Get certificate statistics
router.get(
  '/stats',
  authenticate,
  authorize('admin', 'hr_manager'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = { tenantId: req.tenantId };

    const [total, thisMonth, thisWeek] = await Promise.all([
      Certificate.countDocuments(filter),
      Certificate.countDocuments({
        ...filter,
        issuedAt: {
          $gte: new Date(new Date().setDate(1)),
        },
      }),
      Certificate.countDocuments({
        ...filter,
        issuedAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        issuedThisMonth: thisMonth,
        issuedThisWeek: thisWeek,
      },
    });
  })
);

export default router;
