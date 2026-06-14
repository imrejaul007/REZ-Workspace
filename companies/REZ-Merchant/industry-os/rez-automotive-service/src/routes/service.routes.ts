import { Router, Request, Response } from 'express';
import { ServiceModel } from '../models/Service';
import { CreateServiceSchema } from '../types';
import { ZodError } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const isPackage = req.query.isPackage as string;

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (isPackage !== undefined) query.isPackage = isPackage === 'true';

    const skip = (page - 1) * limit;
    const [services, total] = await Promise.all([
      ServiceModel.find(query).sort({ price: 1 }).skip(skip).limit(limit),
      ServiceModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: services,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const services = await ServiceModel.findByCategory(req.params.category);
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/packages', async (_req: Request, res: Response) => {
  try {
    const services = await ServiceModel.findPackages();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await ServiceModel.findById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await CreateServiceSchema.parseAsync(req.body);
    const service = new ServiceModel(data);
    await service.save();
    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const service = await ServiceModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data: service, message: 'Service updated' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const service = await ServiceModel.findByIdAndDelete(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
