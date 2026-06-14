/**
 * Heat Map Routes - Geospatial heat data based on actual merchant data
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HeatPoint, MerchantLocation } from '../models/MerchantLocation.js';

const router = Router();

/**
 * GET /api/heat
 * Get heat map data for a geographic area
 */
router.get('/', asyncHandler(async (req, res) => {
  const { north, south, east, west, category, metric = 'density', gridSize = 10 } = req.query as any;

  // Parse bounds from query or use default area
  const bounds = {
    north: north || 19.3,
    south: south || 18.9,
    east: east || 73.0,
    west: west || 72.8,
  };

  // Build MongoDB geospatial query
  const query: any = {
    location: {
      $geoWithin: {
        $box: [
          [bounds.west, bounds.south],
          [bounds.east, bounds.north],
        ],
      },
    },
  };

  if (category) {
    query.businessType = category;
  }

  // Get merchants in the area
  const merchants = await MerchantLocation.find(query).lean();

  // Calculate heat points based on metric
  const heatPoints = calculateHeatPoints(merchants, bounds, parseInt(gridSize as string, 10), metric);

  res.json({
    success: true,
    bounds,
    metric,
    gridSize: parseInt(gridSize as string, 10),
    data: heatPoints,
    totalMerchants: merchants.length,
  });
}));

/**
 * Calculate heat points using grid-based aggregation
 */
function calculateHeatPoints(
  merchants: any[],
  bounds: { north: number; south: number; east: number; west: number },
  gridSize: number,
  metric: string
): HeatPoint[] {
  const latStep = (bounds.north - bounds.south) / gridSize;
  const lngStep = (bounds.east - bounds.west) / gridSize;
  const heatPoints: HeatPoint[] = [];

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cellNorth = bounds.south + (i + 1) * latStep;
      const cellSouth = bounds.south + i * latStep;
      const cellWest = bounds.west + j * lngStep;
      const cellEast = bounds.west + (j + 1) * lngStep;

      // Count merchants in this cell
      const merchantsInCell = merchants.filter((m) => {
        const [lng, lat] = m.location.coordinates;
        return lat >= cellSouth && lat < cellNorth && lng >= cellWest && lng < cellEast;
      });

      if (merchantsInCell.length > 0) {
        const centerLat = (cellNorth + cellSouth) / 2;
        const centerLng = (cellEast + cellWest) / 2;

        // Calculate intensity based on metric
        let intensity = merchantsInCell.length / 10; // Default: density
        if (metric === 'revenue') {
          intensity = merchantsInCell.reduce((sum, m) => sum + (m.revenue || 0), 0) / 100000;
        } else if (metric === 'growth') {
          intensity = merchantsInCell.reduce((sum, m) => sum + (m.growthRate || 0), 0) / merchantsInCell.length / 100;
        } else if (metric === 'competition') {
          intensity = Math.min(merchantsInCell.length / 5, 1); // Cap at 1
        }

        heatPoints.push({
          lat: centerLat,
          lng: centerLng,
          intensity: Math.min(intensity, 1), // Normalize to 0-1
          count: merchantsInCell.length,
          category: merchantsInCell[0].businessType,
        });
      }
    }
  }

  return heatPoints;
}

export { router as heatRoutes };