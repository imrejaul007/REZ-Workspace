/**
 * Service Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Service } from '../models/Service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get services by salon
router.get('/salon/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { category } = req.query;

    const query: unknown = { salonId, isActive: true };
    if (category) query.category = category;

    const services = await Service.find(query);

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get services' });
  }
});

// Create service
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const serviceSchema = z.object({
      salonId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      category: z.string(),
      duration: z.number(),
      price: z.number(),
    });

    const data = serviceSchema.parse(req.body);
    const serviceId = `SVC${Date.now()}`;

    const service = new Service({
      serviceId,
      ...data,
    });

    await service.save();

    res.status(201).json({
      success: true,
      data: service,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

export { router as serviceRoutes };
