/**
 * Tables Routes
 *
 * Endpoints for table management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { tableService } from '../services/TableService';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[tables-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const capacitySchema = z.object({
  min: z.number().int().positive(),
  max: z.number().int().positive(),
});

const createTableSchema = z.object({
  restaurantId: z.string(),
  branchId: z.string(),
  tableNumber: z.string().min(1),
  floor: z.string().optional(),
  capacity: capacitySchema,
  tableType: z.enum(['indoor', 'outdoor', 'private', 'bar', 'vip']),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  amenities: z.array(z.string()).optional(),
});

const updateTableSchema = createTableSchema.partial().omit({ restaurantId: true, branchId: true });

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Get available tables for branch
 * GET /api/tables/branch/:branchId/available
 */
router.get('/branch/:branchId/available', async (req: Request, res: Response) => {
  try {
    const { guestCount } = req.query;

    if (!guestCount) {
      res.status(400).json({ success: false, message: 'guestCount is required' });
      return;
    }

    const tables = await tableService.findAvailableTables(
      req.params.branchId,
      parseInt(guestCount as string, 10)
    );

    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    log('Get available tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tables' });
  }
});

/**
 * Get floor layout
 * GET /api/tables/branch/:branchId/layout
 */
router.get('/branch/:branchId/layout', async (req: Request, res: Response) => {
  try {
    const { floor } = req.query;

    const tables = await tableService.getFloorLayout(
      req.params.branchId,
      floor as string | undefined
    );

    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    log('Get floor layout error:', error);
    res.status(500).json({ success: false, message: 'Failed to get layout' });
  }
});

// ─── Protected Routes ───────────────────────────────────────────────────────────

/**
 * Create table
 * POST /api/tables
 */
router.post('/', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const input = createTableSchema.parse(req.body);

    const table = await tableService.createTable(input);

    res.status(201).json({
      success: true,
      data: table,
      message: 'Table created successfully',
    });
  } catch (error) {
    log('Create table error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create table' });
  }
});

/**
 * Get table by ID
 * GET /api/tables/:tableId
 */
router.get('/:tableId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const table = await tableService.getTable(req.params.tableId);

    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    res.json({ success: true, data: table });
  } catch (error) {
    log('Get table error:', error);
    res.status(500).json({ success: false, message: 'Failed to get table' });
  }
});

/**
 * Update table
 * PUT /api/tables/:tableId
 */
router.put('/:tableId', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const input = updateTableSchema.parse(req.body);

    const table = await tableService.updateTable(req.params.tableId, input);

    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    res.json({
      success: true,
      data: table,
      message: 'Table updated successfully',
    });
  } catch (error) {
    log('Update table error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update table' });
  }
});

/**
 * Delete table
 * DELETE /api/tables/:tableId
 */
router.delete('/:tableId', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const deleted = await tableService.deleteTable(req.params.tableId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    log('Delete table error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete table' });
  }
});

/**
 * Get tables for branch
 * GET /api/tables/branch/:branchId
 */
router.get('/branch/:branchId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, floor, tableType, minCapacity } = req.query;

    const tables = await tableService.getTablesByBranch(req.params.branchId, {
      status: status as unknown,
      floor: floor as string,
      tableType: tableType as string,
      minCapacity: minCapacity ? parseInt(minCapacity as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    log('Get tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tables' });
  }
});

/**
 * Update table status
 * PATCH /api/tables/:tableId/status
 */
router.patch('/:tableId/status', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'status is required' });
      return;
    }

    const table = await tableService.updateStatus(req.params.tableId, status);

    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    res.json({
      success: true,
      data: table,
      message: 'Table status updated',
    });
  } catch (error) {
    log('Update table status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

/**
 * Occupy table
 * POST /api/tables/:tableId/occupy
 */
router.post('/:tableId/occupy', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const table = await tableService.occupyTable(req.params.tableId);

    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    res.json({
      success: true,
      data: table,
      message: 'Table is now occupied',
    });
  } catch (error) {
    log('Occupy table error:', error);
    res.status(500).json({ success: false, message: 'Failed to occupy table' });
  }
});

/**
 * Release table
 * POST /api/tables/:tableId/release
 */
router.post('/:tableId/release', authenticateToken, requireRoles('admin', 'restaurant_owner', 'staff'), async (req: Request, res: Response) => {
  try {
    const table = await tableService.releaseTable(req.params.tableId);

    if (!table) {
      res.status(404).json({ success: false, message: 'Table not found' });
      return;
    }

    res.json({
      success: true,
      data: table,
      message: 'Table is now available',
    });
  } catch (error) {
    log('Release table error:', error);
    res.status(500).json({ success: false, message: 'Failed to release table' });
  }
});

/**
 * Get table statistics
 * GET /api/tables/branch/:branchId/stats
 */
router.get('/branch/:branchId/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await tableService.getTableStats(req.params.branchId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    log('Get table stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

/**
 * Bulk create tables
 * POST /api/tables/bulk
 */
router.post('/bulk', authenticateToken, requireRoles('admin', 'restaurant_owner'), async (req: Request, res: Response) => {
  try {
    const { tables } = req.body;

    if (!Array.isArray(tables)) {
      res.status(400).json({ success: false, message: 'tables must be an array' });
      return;
    }

    const createdTables = await tableService.bulkCreateTables(tables);

    res.status(201).json({
      success: true,
      data: createdTables,
      message: `${createdTables.length} tables created successfully`,
    });
  } catch (error) {
    log('Bulk create tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to create tables' });
  }
});

export default router;
