/**
 * Cluster Routes - Aggregate merchants into geographic clusters
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MerchantLocation } from '../models/MerchantLocation.js';

const router = Router();

/**
 * GET /api/clusters
 * Get merchant clusters for a geographic area
 */
router.get('/', asyncHandler(async (req, res) => {
  const { north, south, east, west, zoom = 10, category, minCount = 1 } = req.query as any;

  // Parse bounds
  const bounds = {
    north: north || 19.3,
    south: south || 18.9,
    east: east || 73.0,
    west: west || 72.8,
  };

  // Calculate cluster radius based on zoom level
  const clusterRadius = calculateClusterRadius(parseInt(zoom as string, 10));

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

  // Cluster merchants using grid-based clustering
  const clusters = clusterMerchants(merchants, clusterRadius, parseInt(minCount as string, 10));

  res.json({
    success: true,
    bounds,
    zoom: parseInt(zoom as string, 10),
    clusters,
    totalMerchants: merchants.length,
    clusterCount: clusters.length,
  });
}));

/**
 * Calculate cluster radius based on zoom level
 */
function calculateClusterRadius(zoom: number): number {
  // Base radius in degrees, adjusted by zoom
  const baseRadius = 0.1; // ~11km at equator
  return baseRadius / Math.pow(2, zoom - 10);
}

/**
 * Cluster merchants using grid-based clustering
 */
function clusterMerchants(merchants: any[], radius: number, minCount: number): any[] {
  const clusters: Map<string, any> = new Map();
  const processed = new Set<string>();

  for (const merchant of merchants) {
    if (processed.has(merchant._id.toString())) continue;

    const [lng, lat] = merchant.location.coordinates;
    const clusterKey = `${Math.floor(lat / radius)}_${Math.floor(lng / radius)}`;

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, {
        lat,
        lng,
        count: 0,
        merchants: [],
        categories: new Set(),
        totalRevenue: 0,
      });
    }

    const cluster = clusters.get(clusterKey)!;
    cluster.count++;
    cluster.merchants.push(merchant._id);
    cluster.categories.add(merchant.businessType);
    cluster.totalRevenue += merchant.revenue || 0;

    // Update center to average
    cluster.lat = (cluster.lat * (cluster.count - 1) + lat) / cluster.count;
    cluster.lng = (cluster.lng * (cluster.count - 1) + lng) / cluster.count;

    processed.add(merchant._id.toString());
  }

  // Convert to array and filter by minCount
  return Array.from(clusters.values())
    .filter((c) => c.count >= minCount)
    .map((c) => ({
      lat: c.lat,
      lng: c.lng,
      count: c.count,
      category: Array.from(c.categories)[0] || 'mixed',
      categories: Array.from(c.categories),
      totalRevenue: c.totalRevenue,
    }));
}

export { router as clusterRoutes };