/**
 * REZ Atlas Territory - Territory Management Routes
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory store
interface Territory {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  regions?: Array<{
    name: string;
    cities: string[];
  }>;
  stats: {
    merchants: number;
    leads: number;
    revenue: number;
    conversion: number;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface MerchantTerritory {
  merchantId: string;
  territoryId: string;
  assignedAt: string;
  assignedBy: string;
}

const territories: Map<string, Territory> = new Map();
const merchantTerritories: Map<string, MerchantTerritory> = new Map();

// Initialize with sample territories
const sampleTerritories: Territory[] = [
  {
    id: uuidv4(),
    name: 'Mumbai South',
    description: 'South Mumbai area',
    ownerId: 'user-1',
    bounds: { north: 19.0, south: 18.9, east: 72.85, west: 72.8 },
    regions: [{ name: 'South Mumbai', cities: ['Mumbai'] }],
    stats: { merchants: 150, leads: 45, revenue: 2500000, conversion: 15 },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Mumbai North',
    description: 'North Mumbai suburbs',
    ownerId: 'user-2',
    bounds: { north: 19.3, south: 19.0, east: 72.9, west: 72.8 },
    regions: [{ name: 'North Suburbs', cities: ['Andheri', 'Borivali', 'Thane'] }],
    stats: { merchants: 280, leads: 78, revenue: 4200000, conversion: 12 },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Delhi NCR',
    description: 'Delhi and NCR region',
    ownerId: 'user-3',
    bounds: { north: 28.7, south: 28.4, east: 77.4, west: 77.0 },
    regions: [
      { name: 'South Delhi', cities: ['Delhi'] },
      { name: 'Gurugram', cities: ['Gurugram'] },
      { name: 'Noida', cities: ['Noida'] }
    ],
    stats: { merchants: 420, leads: 120, revenue: 6800000, conversion: 18 },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

sampleTerritories.forEach(t => territories.set(t.id, t));

// ============================================================================
// TERRITORIES CRUD
// ============================================================================

/**
 * GET /api/territories
 * List all territories
 */
router.get('/territories', (req: Request, res: Response) => {
  const { ownerId, status } = req.query;

  let filtered = Array.from(territories.values());

  if (ownerId) filtered = filtered.filter(t => t.ownerId === ownerId);
  if (status) filtered = filtered.filter(t => t.status === status);

  res.json({
    territories: filtered,
    count: filtered.length
  });
});

/**
 * GET /api/territories/:id
 * Get territory by ID
 */
router.get('/territories/:id', (req: Request, res: Response) => {
  const territory = territories.get(req.params.id);

  if (!territory) {
    return res.status(404).json({ error: 'Territory not found' });
  }

  res.json({ territory });
});

/**
 * POST /api/territories
 * Create a new territory
 */
router.post('/territories', (req: Request, res: Response) => {
  const { name, description, ownerId, bounds, regions } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const territory: Territory = {
    id: uuidv4(),
    name,
    description,
    ownerId,
    bounds,
    regions,
    stats: { merchants: 0, leads: 0, revenue: 0, conversion: 0 },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  territories.set(territory.id, territory);

  res.status(201).json({ territory });
});

/**
 * PUT /api/territories/:id
 * Update territory
 */
router.put('/territories/:id', (req: Request, res: Response) => {
  const territory = territories.get(req.params.id);

  if (!territory) {
    return res.status(404).json({ error: 'Territory not found' });
  }

  const { name, description, ownerId, bounds, regions, status } = req.body;

  if (name) territory.name = name;
  if (description !== undefined) territory.description = description;
  if (ownerId !== undefined) territory.ownerId = ownerId;
  if (bounds) territory.bounds = bounds;
  if (regions) territory.regions = regions;
  if (status) territory.status = status;
  territory.updatedAt = new Date().toISOString();

  res.json({ territory });
});

/**
 * DELETE /api/territories/:id
 * Delete territory
 */
router.delete('/territories/:id', (req: Request, res: Response) => {
  const existed = territories.delete(req.params.id);

  if (!existed) {
    return res.status(404).json({ error: 'Territory not found' });
  }

  res.json({ success: true });
});

// ============================================================================
// MERCHANT ASSIGNMENTS
// ============================================================================

/**
 * POST /api/territories/:id/assign
 * Assign merchant to territory
 */
router.post('/territories/:id/assign', (req: Request, res: Response) => {
  const { merchantId, assignedBy } = req.body;

  if (!merchantId) {
    return res.status(400).json({ error: 'merchantId is required' });
  }

  const territory = territories.get(req.params.id);
  if (!territory) {
    return res.status(404).json({ error: 'Territory not found' });
  }

  const assignment: MerchantTerritory = {
    merchantId,
    territoryId: req.params.id,
    assignedAt: new Date().toISOString(),
    assignedBy
  };

  merchantTerritories.set(merchantId, assignment);

  // Update territory stats
  territory.stats.merchants += 1;
  territory.updatedAt = new Date().toISOString();

  res.json({ assignment, territory });
});

/**
 * DELETE /api/territories/:id/merchants/:merchantId
 * Remove merchant from territory
 */
router.delete('/territories/:id/merchants/:merchantId', (req: Request, res: Response) => {
  const territory = territories.get(req.params.id);
  const assignment = merchantTerritories.get(req.params.merchantId);

  if (!territory || !assignment) {
    return res.status(404).json({ error: 'Territory or assignment not found' });
  }

  merchantTerritories.delete(req.params.merchantId);
  territory.stats.merchants = Math.max(0, territory.stats.merchants - 1);

  res.json({ success: true });
});

/**
 * GET /api/territories/:id/merchants
 * Get merchants in territory
 */
router.get('/territories/:id/merchants', (req: Request, res: Response) => {
  const merchants = Array.from(merchantTerritories.values())
    .filter(m => m.territoryId === req.params.id);

  res.json({
    count: merchants.length,
    merchants
  });
});

// ============================================================================
// PERFORMANCE
// ============================================================================

/**
 * GET /api/territories/:id/performance
 * Get territory performance
 */
router.get('/territories/:id/performance', (req: Request, res: Response) => {
  const territory = territories.get(req.params.id);

  if (!territory) {
    return res.status(404).json({ error: 'Territory not found' });
  }

  // Calculate performance metrics
  const performance = {
    territoryId: territory.id,
    territoryName: territory.name,
    ownerId: territory.ownerId,
    stats: territory.stats,
    metrics: {
      revenuePerMerchant: territory.stats.merchants > 0
        ? Math.round(territory.stats.revenue / territory.stats.merchants)
        : 0,
      leadConversionRate: territory.stats.leads > 0
        ? ((territory.stats.merchants / territory.stats.leads) * 100).toFixed(1)
        : '0',
      avgRevenuePerLead: territory.stats.leads > 0
        ? Math.round(territory.stats.revenue / territory.stats.leads)
        : 0
    },
    status: territory.status,
    lastUpdated: territory.updatedAt
  };

  res.json({ performance });
});

// ============================================================================
// BALANCING
// ============================================================================

/**
 * GET /api/territories/balance
 * Get territory balance report
 */
router.get('/territories/balance', (req: Request, res: Response) => {
  const allTerritories = Array.from(territories.values());

  // Calculate balance metrics
  const totalMerchants = allTerritories.reduce((sum, t) => sum + t.stats.merchants, 0);
  const totalLeads = allTerritories.reduce((sum, t) => sum + t.stats.leads, 0);
  const totalRevenue = allTerritories.reduce((sum, t) => sum + t.stats.revenue, 0);

  const avgMerchants = totalMerchants / allTerritories.length;
  const avgLeads = totalLeads / allTerritories.length;
  const avgRevenue = totalRevenue / allTerritories.length;

  const balance = allTerritories.map(t => {
    const merchantDeviation = ((t.stats.merchants - avgMerchants) / avgMerchants * 100).toFixed(1);
    const revenueDeviation = ((t.stats.revenue - avgRevenue) / avgRevenue * 100).toFixed(1);

    return {
      id: t.id,
      name: t.name,
      ownerId: t.ownerId,
      merchants: t.stats.merchants,
      leads: t.stats.leads,
      revenue: t.stats.revenue,
      deviation: {
        merchants: `${merchantDeviation}%`,
        revenue: `${revenueDeviation}%`,
        balanced: Math.abs(Number(merchantDeviation)) < 20 && Math.abs(Number(revenueDeviation)) < 20
      }
    };
  });

  res.json({
    summary: {
      totalTerritories: allTerritories.length,
      totalMerchants,
      totalLeads,
      totalRevenue,
      avgMerchants: Math.round(avgMerchants),
      avgLeads: Math.round(avgLeads),
      avgRevenue: Math.round(avgRevenue)
    },
    territories: balance
  });
});

// ============================================================================
// STATS
// ============================================================================

/**
 * GET /api/territories/stats
 * Get overall territory statistics
 */
router.get('/territories/stats', (req: Request, res: Response) => {
  const allTerritories = Array.from(territories.values());

  const totalMerchants = allTerritories.reduce((sum, t) => sum + t.stats.merchants, 0);
  const totalLeads = allTerritories.reduce((sum, t) => sum + t.stats.leads, 0);
  const totalRevenue = allTerritories.reduce((sum, t) => sum + t.stats.revenue, 0);
  const avgConversion = totalLeads > 0 ? (totalMerchants / totalLeads * 100).toFixed(1) : '0';

  // By owner
  const byOwner: Record<string, { merchants: number; leads: number; revenue: number }> = {};
  allTerritories.forEach(t => {
    if (t.ownerId) {
      if (!byOwner[t.ownerId]) byOwner[t.ownerId] = { merchants: 0, leads: 0, revenue: 0 };
      byOwner[t.ownerId].merchants += t.stats.merchants;
      byOwner[t.ownerId].leads += t.stats.leads;
      byOwner[t.ownerId].revenue += t.stats.revenue;
    }
  });

  // Top territories
  const topByRevenue = [...allTerritories].sort((a, b) => b.stats.revenue - a.stats.revenue).slice(0, 5);
  const topByMerchants = [...allTerritories].sort((a, b) => b.stats.merchants - a.stats.merchants).slice(0, 5);

  res.json({
    total: allTerritories.length,
    totalMerchants,
    totalLeads,
    totalRevenue,
    avgConversion,
    byOwner,
    topByRevenue: topByRevenue.map(t => ({ id: t.id, name: t.name, revenue: t.stats.revenue })),
    topByMerchants: topByMerchants.map(t => ({ id: t.id, name: t.name, merchants: t.stats.merchants }))
  });
});

export { router as territoryRoutes };