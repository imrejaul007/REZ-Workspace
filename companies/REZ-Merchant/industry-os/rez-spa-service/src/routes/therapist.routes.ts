import { Router, Request, Response } from 'express';
import { TherapistModel } from '../models/Therapist';
import { CreateTherapistSchema, UpdateTherapistSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

// Validation error handler
const validateRequest = (schema: typeof CreateTherapistSchema | typeof UpdateTherapistSchema) => {
  return async (req: Request, res: Response, next: Function) => {
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

// Get all therapists
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const specialty = req.query.specialty as string;
    const status = req.query.status as string;

    const query: Record<string, unknown> = {};

    if (specialty) query.specialties = specialty;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [therapists, total] = await Promise.all([
      TherapistModel.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('services', 'name category duration price'),
      TherapistModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: therapists,
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

// Get available therapists
router.get('/available', async (_req: Request, res: Response) => {
  try {
    const therapists = await TherapistModel.findAvailable();
    res.json({
      success: true,
      data: therapists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get therapists by specialty
router.get('/specialty/:specialty', async (req: Request, res: Response) => {
  try {
    const { specialty } = req.params;
    const therapists = await TherapistModel.findBySpecialty(specialty as any);
    res.json({
      success: true,
      data: therapists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get therapist by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const therapist = await TherapistModel.findById(req.params.id)
      .populate('services', 'name category duration price');

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: therapist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get therapist's services
router.get('/:id/services', async (req: Request, res: Response) => {
  try {
    const therapist = await TherapistModel.findById(req.params.id)
      .populate('services');

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: therapist.services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Create therapist
router.post('/', validateRequest(CreateTherapistSchema), async (req: Request, res: Response) => {
  try {
    const therapist = new TherapistModel(req.body);
    await therapist.save();
    res.status(201).json({
      success: true,
      data: therapist,
      message: 'Therapist created successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate')) {
      res.status(409).json({
        success: false,
        error: 'Therapist with this email already exists'
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update therapist
router.put('/:id', validateRequest(UpdateTherapistSchema), async (req: Request, res: Response) => {
  try {
    const therapist = await TherapistModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: therapist,
      message: 'Therapist updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update therapist status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const therapist = await TherapistModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: therapist,
      message: 'Therapist status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Add service to therapist
router.post('/:id/services', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.body;
    const therapist = await TherapistModel.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { services: serviceId } },
      { new: true }
    );

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: therapist,
      message: 'Service added to therapist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Remove service from therapist
router.delete('/:id/services/:serviceId', async (req: Request, res: Response) => {
  try {
    const therapist = await TherapistModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { services: req.params.serviceId } },
      { new: true }
    );

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: therapist,
      message: 'Service removed from therapist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Delete therapist
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const therapist = await TherapistModel.findByIdAndDelete(req.params.id);

    if (!therapist) {
      res.status(404).json({
        success: false,
        error: 'Therapist not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Therapist deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
