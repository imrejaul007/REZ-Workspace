/**
 * Property Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { propertyService } from '../services/property.service';

const router = Router();

// Validation schemas
const CreatePropertySchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  chain: z.string().min(2),
  totalRooms: z.number().min(1),
  starRating: z.number().min(1).max(5),
});

// GET /api/properties - List all properties
router.get('/', async (req: Request, res: Response) => {
  try {
    const { chain } = req.query;
    const properties = await propertyService.getAllProperties(chain as string);

    res.json({
      success: true,
      data: { properties, count: properties.length },
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get properties' },
    });
  }
});

// GET /api/properties/:propertyId - Get property details
router.get('/:propertyId', async (req: Request, res: Response) => {
  try {
    const property = await propertyService.getPropertyById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
    }

    res.json({ success: true, data: { property } });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get property' },
    });
  }
});

// POST /api/properties - Create property
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = CreatePropertySchema.parse(req.body);
    const property = await propertyService.createProperty(validated);

    res.status(201).json({
      success: true,
      data: { property },
      message: 'Property created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create property' },
    });
  }
});

// PUT /api/properties/:propertyId - Update property
router.put('/:propertyId', async (req: Request, res: Response) => {
  try {
    const validated = CreatePropertySchema.partial().parse(req.body);
    const property = await propertyService.updateProperty(req.params.propertyId, validated);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Property not found' },
      });
    }

    res.json({
      success: true,
      data: { property },
      message: 'Property updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: error.errors },
      });
    }
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update property' },
    });
  }
});

// GET /api/properties/:propertyId/metrics - Get property metrics
router.get('/:propertyId/metrics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await propertyService.getPropertyMetrics(
      req.params.propertyId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: { metrics },
    });
  } catch (error) {
    console.error('Get property metrics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get metrics' },
    });
  }
});

export default router;
