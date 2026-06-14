import { Router, Request, Response } from 'express';
import { z } from 'zod';
import attributionService from '../services/attributionService';
import {
  ConversionType,
  ApiResponse,
  PaginatedResponse,
  Conversion
} from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createConversionSchema = z.object({
  userId: z.string().min(1),
  conversionType: z.nativeEnum(ConversionType),
  value: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  timestamp: z.string().datetime().optional(),
  touchpoints: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional()
});

// Create conversion
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createConversionSchema.parse(req.body);

    const conversion = attributionService.recordConversion({
      ...validatedData,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
      metadata: validatedData.metadata ?? {}
    });

    const response: ApiResponse<Conversion> = {
      success: true,
      data: conversion,
      message: 'Conversion recorded successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error creating conversion:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get conversion
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const conversion = attributionService.getConversion(req.params.id);

    if (!conversion) {
      return res.status(404).json({ success: false, error: 'Conversion not found' });
    }

    const response: ApiResponse<Conversion> = {
      success: true,
      data: conversion
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching conversion:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// List conversions with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string | undefined;
    const conversionType = req.query.conversionType as ConversionType | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const { conversions, total } = attributionService.getConversions({
      userId,
      conversionType,
      startDate,
      endDate,
      page,
      limit
    });

    const response: PaginatedResponse<Conversion> = {
      success: true,
      data: conversions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching conversions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
