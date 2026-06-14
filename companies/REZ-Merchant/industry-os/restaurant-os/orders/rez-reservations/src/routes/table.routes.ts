/**
 * Table Routes
 */

import { Router, Request, Response } from 'express';
import { Table } from '../models';
import { requireRoles } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Create table
router.post('/', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const tableId = `TBL${Date.now()}${crypto.randomUUID().split('-')[0]}`;
    const table = new Table({ tableId, ...req.body });
    await table.save();
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create table' });
  }
});

// Get all tables
router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, status, location } = req.query;
    const query: unknown = {};

    if (restaurantId) query.restaurantId = restaurantId;
    if (status) query.status = status;
    if (location) query.location = location;

    const tables = await Table.find(query).sort({ name: 1 });
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
});

// Get table by ID
router.get('/:tableId', async (req: Request, res: Response) => {
  try {
    const table = await Table.findOne({ tableId: req.params.tableId });
    if (!table) {
      res.status(404).json({ success: false, error: 'Table not found' });
      return;
    }
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch table' });
  }
});

// Update table
router.put('/:tableId', requireRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const table = await Table.findOneAndUpdate(
      { tableId: req.params.tableId },
      req.body,
      { new: true }
    );
    if (!table) {
      res.status(404).json({ success: false, error: 'Table not found' });
      return;
    }
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update table' });
  }
});

// Update table status
router.post('/:tableId/status', requireRoles('admin', 'manager', 'employee'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const table = await Table.findOneAndUpdate(
      { tableId: req.params.tableId },
      { status },
      { new: true }
    );
    if (!table) {
      res.status(404).json({ success: false, error: 'Table not found' });
      return;
    }
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// Delete table
router.delete('/:tableId', requireRoles('admin'), async (req: Request, res: Response) => {
  try {
    const table = await Table.findOneAndDelete({ tableId: req.params.tableId });
    if (!table) {
      res.status(404).json({ success: false, error: 'Table not found' });
      return;
    }
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete table' });
  }
});

// Get floor layout
router.get('/layout/:restaurantId', async (req: Request, res: Response) => {
  try {
    const tables = await Table.find({ restaurantId: req.params.restaurantId });
    const layout = {
      restaurantId: req.params.restaurantId,
      tables: tables.map(t => ({
        tableId: t.tableId,
        name: t.name,
        position: t.position,
        shape: t.shape,
        status: t.status,
        capacity: t.capacity,
      })),
    };
    res.json({ success: true, data: layout });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get layout' });
  }
});

export { router as tableRoutes };
