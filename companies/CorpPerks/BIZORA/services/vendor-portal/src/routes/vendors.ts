import { Router, Request, Response, NextFunction } from 'express';
import { vendorService } from '../services/vendorService.js';
import { logger } from '../config/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and DOC files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Error handler for multer
const handleMulterError = (err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// GET /api/vendors - List all vendors
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const filters = {
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined
    };

    const result = await vendorService.getVendors(filters, {
      page,
      limit,
      sortBy,
      sortOrder
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/vendors/stats - Get vendor statistics
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await vendorService.getVendorStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// POST /api/vendors - Register new vendor
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.createVendor(req.body);

    logger.info('New vendor registered', {
      vendorId: vendor._id,
      email: vendor.email,
      category: vendor.category
    });

    res.status(201).json({
      message: 'Vendor registered successfully',
      data: vendor
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes('Validation error')) {
      return res.status(400).json({ error: 'Invalid vendor data', details: error.message });
    }
    next(error);
  }
});

// GET /api/vendors/:id - Get vendor by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
});

// PUT /api/vendors/:id - Update vendor
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    logger.info('Vendor updated', { vendorId: req.params.id });

    res.json({
      message: 'Vendor updated successfully',
      data: vendor
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation error')) {
      return res.status(400).json({ error: 'Invalid update data', details: error.message });
    }
    next(error);
  }
});

// PATCH /api/vendors/:id/status - Update vendor status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;

    if (!['pending', 'active', 'suspended', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: pending, active, suspended, rejected'
      });
    }

    const vendor = await vendorService.updateVendorStatus(req.params.id, status);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    logger.info('Vendor status updated', { vendorId: req.params.id, status });

    res.json({
      message: 'Vendor status updated successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vendors/:id - Delete vendor (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await vendorService.deleteVendor(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    logger.info('Vendor deleted', { vendorId: req.params.id });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/vendors/:id/orders - Get vendor orders
router.get('/:id/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await vendorService.getVendorOrders(req.params.id, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Vendor not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// GET /api/vendors/:id/payments - Get vendor payment history
router.get('/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await vendorService.getVendorPayments(req.params.id, {
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Vendor not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// POST /api/vendors/:id/documents - Upload vendor documents
router.post(
  '/:id/documents',
  upload.single('file'),
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const vendor = await vendorService.getVendorById(req.params.id);

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // In production, you would update the vendor's documents field
      logger.info('Document uploaded', {
        vendorId: req.params.id,
        filename: req.file.filename,
        originalName: req.file.originalname
      });

      res.json({
        message: 'Document uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
