import { Router } from 'express';
import { z } from 'zod';
import { inventoryService } from '../services/inventoryService.js';
import { InventoryItemSchema, StockAdjustmentSchema, WarehouseSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/items', (req, res) => {
  try {
    const item = InventoryItemSchema.parse(req.body);
    const created = inventoryService.createItem(item);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else {
      logger.error('Failed to create item', { error });
      res.status(500).json({ success: false, error: 'Failed to create item' });
    }
  }
});

router.get('/items', (req, res) => {
  const { status, lowStock } = req.query;
  if (lowStock === 'true') {
    const items = inventoryService.getLowStockItems();
    return res.json({ success: true, data: items });
  }
  const items = Array.from((inventoryService as any).inventory?.values?.() || []);
  res.json({ success: true, data: items });
});

router.get('/items/:id', (req, res) => {
  const item = inventoryService.getItem(req.params.id);
  item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Item not found' });
});

router.get('/products/:productId/inventory', (req, res) => {
  const item = inventoryService.getItem(req.params.productId, true);
  item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Inventory not found' });
});

router.patch('/items/:id', (req, res) => {
  const item = inventoryService.updateItem(req.params.id, req.body);
  item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Item not found' });
});

router.post('/items/:id/adjust', (req, res) => {
  try {
    const adjustment = StockAdjustmentSchema.omit({ id: true, inventoryItemId: true, previousQuantity: true, newQuantity: true, createdAt: true }).parse(req.body);
    const result = inventoryService.adjustStock(req.params.id, adjustment);
    result ? res.json({ success: true, data: result }) : res.status(404).json({ success: false, error: 'Item not found' });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to adjust stock' });
  }
});

router.post('/items/:id/reserve', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid quantity' });
  }
  const success = inventoryService.reserveStock(req.params.id, quantity);
  res.json({ success });
});

router.post('/items/:id/release', (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid quantity' });
  }
  const success = inventoryService.releaseReservation(req.params.id, quantity);
  res.json({ success });
});

router.post('/transfer', (req, res) => {
  const { fromId, toId, quantity, warehouseId } = req.body;
  if (!fromId || !toId || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  const success = inventoryService.transferStock(fromId, toId, quantity, warehouseId);
  res.json({ success });
});

router.get('/items/:id/adjustments', (req, res) => {
  const adjustments = inventoryService.getAdjustments(req.params.id);
  res.json({ success: true, data: adjustments });
});

router.post('/warehouses', (req, res) => {
  try {
    const warehouse = WarehouseSchema.parse(req.body);
    const created = inventoryService.createWarehouse(warehouse);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) res.status(400).json({ success: false, errors: error.errors });
    else res.status(500).json({ success: false, error: 'Failed to create warehouse' });
  }
});

router.get('/warehouses', (req, res) => {
  const warehouses = inventoryService.getAllWarehouses();
  res.json({ success: true, data: warehouses });
});

router.get('/warehouses/:id', (req, res) => {
  const warehouse = inventoryService.getWarehouse(req.params.id);
  warehouse ? res.json({ success: true, data: warehouse }) : res.status(404).json({ success: false, error: 'Warehouse not found' });
});

router.get('/alerts', (req, res) => {
  const { acknowledged } = req.query;
  const alerts = inventoryService.getAlerts(acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined);
  res.json({ success: true, data: alerts });
});

router.post('/alerts/:id/acknowledge', (req, res) => {
  const success = inventoryService.acknowledgeAlert(req.params.id);
  res.json({ success });
});

router.get('/report', (req, res) => {
  const report = inventoryService.getReport();
  res.json({ success: true, data: report });
});

router.post('/bulk/update', (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Updates must be an array' });
  }
  inventoryService.bulkUpdateQuantities(updates);
  res.json({ success: true });
});

export default router;
