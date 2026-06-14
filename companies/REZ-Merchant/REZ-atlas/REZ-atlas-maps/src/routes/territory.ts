/**
 * Territory Routes - Geographic territory management
 */

import { Router } from 'express';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { Territory } from '../models/Territory.js';
import { MerchantLocation } from '../models/MerchantLocation.js';

const router = Router();

/**
 * GET /api/territory/:territoryId
 * Get territory details with merchant coverage
 */
router.get('/:territoryId', asyncHandler(async (req, res) => {
  const { territoryId } = req.params;

  const territory = await Territory.findById(territoryId);
  if (!territory) {
    throw new NotFoundError('Territory');
  }

  // Get merchants within territory bounds
  const merchants = await MerchantLocation.find({
    location: {
      $geoWithin: {
        $polygon: territory.boundaries.map((b) => [b.lng, b.lat]),
      },
    },
  }).lean();

  // Calculate coverage metrics
  const totalMerchants = merchants.length;
  const merchantsByCategory = merchants.reduce((acc, m) => {
    acc[m.businessType] = (acc[m.businessType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const coverage = calculateCoverage(territory.boundaries, merchants);

  res.json({
    success: true,
    territoryId,
    name: territory.name,
    boundaries: territory.boundaries,
    totalMerchants,
    merchantsByCategory,
    coverage,
    center: territory.center,
  });
}));

/**
 * GET /api/territory
 * List all territories
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query as any;

  const territories = await Territory.find()
    .skip((parseInt(page as string, 10) - 1) * parseInt(limit as string, 10))
    .limit(parseInt(limit as string, 10))
    .lean();

  const total = await Territory.countDocuments();

  res.json({
    success: true,
    data: territories,
    pagination: {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      total,
      pages: Math.ceil(total / parseInt(limit as string, 10)),
    },
  });
}));

/**
 * POST /api/territory
 * Create a new territory
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, boundaries, color, manager } = req.body;

  if (!name || !boundaries || boundaries.length < 3) {
    res.status(400).json({
      success: false,
      error: { message: 'Name and at least 3 boundary points required' },
    });
    return;
  }

  // Calculate center from boundaries
  const center = calculateCenter(boundaries);

  const territory = new Territory({
    name,
    boundaries,
    center,
    color,
    manager,
  });

  await territory.save();

  res.status(201).json({
    success: true,
    data: territory,
  });
}));

/**
 * Calculate coverage percentage
 */
function calculateCoverage(boundaries: any[], merchants: any[]): string {
  // Calculate area of territory
  const area = calculatePolygonArea(boundaries);

  // Calculate merchant density per sq km
  const density = merchants.length / (area || 1);

  // Simple coverage calculation
  if (density > 10) return '95%';
  if (density > 5) return '85%';
  if (density > 2) return '70%';
  if (density > 1) return '50%';
  return '30%';
}

/**
 * Calculate polygon area using shoelace formula
 */
function calculatePolygonArea(points: any[]): number {
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].lng * points[j].lat;
    area -= points[j].lng * points[i].lat;
  }

  return Math.abs(area / 2) * 111.32 * 111.32; // Convert to sq km (approximate)
}

/**
 * Calculate center point of polygon
 */
function calculateCenter(points: any[]): { lat: number; lng: number } {
  let lat = 0;
  let lng = 0;

  for (const p of points) {
    lat += p.lat;
    lng += p.lng;
  }

  return {
    lat: lat / points.length,
    lng: lng / points.length,
  };
}

export { router as territoryRoutes };