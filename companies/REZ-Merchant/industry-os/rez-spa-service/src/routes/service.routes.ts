import { Router, Request, Response, NextFunction } from 'express';
import { SpaServiceModel } from '../models/SpaService';
import { CreateServiceSchema, UpdateServiceSchema, PaginationQuery } from '../types';
import { ZodError } from 'zod';

const router = Router();

// Validation error handler
const validateRequest = (schema: typeof CreateServiceSchema | typeof UpdateServiceSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await schema.parseAsync(req.body);
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
};

// Get all services
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const category = req.query.category as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: Record<string, unknown> = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const [services, total] = await Promise.all([
      SpaServiceModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('therapists', 'name avatar'),
      SpaServiceModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: services,
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

// Get popular services
router.get('/popular', async (_req: Request, res: Response) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 10;
    const services = await SpaServiceModel.findPopular(limit);
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get featured services
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 10;
    const services = await SpaServiceModel.findFeatured(limit);
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get services by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const services = await SpaServiceModel.findByCategory(category as any);
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get service by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await SpaServiceModel.findById(req.params.id)
      .populate('therapists', 'name avatar rating')
      .populate('products', 'name brand');

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Create service
router.post('/', validateRequest(CreateServiceSchema), async (req: Request, res: Response) => {
  try {
    const service = new SpaServiceModel(req.body);
    await service.save();
    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update service
router.put('/:id', validateRequest(UpdateServiceSchema), async (req: Request, res: Response) => {
  try {
    const service = await SpaServiceModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Delete service
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const service = await SpaServiceModel.findByIdAndDelete(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add therapist to service
router.post('/:id/therapists', async (req: Request, res: Response) => {
  try {
    const { therapistId } = req.body;
    const service = await SpaServiceModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { therapists: therapistId } },
      { new: true }
    );

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      data: service,
      message: 'Therapist added to service'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get service statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const service = await SpaServiceModel.findById(req.params.id);

    if (!service) {
      res.status(404).json({
        success: false,
        error: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: service._id,
        name: service.name,
        totalBookings: 0, // Would come from booking service
        totalRevenue: 0, // Would come from booking service
        averageRating: service.rating || 0,
        therapistCount: service.therapists.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
