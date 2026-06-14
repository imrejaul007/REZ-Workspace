import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { inventoryCore } from '../services/inventoryCore.js';
import { WarehouseSchema, ProductStockSchema, StockMovementSchema, StockTransferSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/warehouses', (req, res) => {
  try {
    const warehouse = WarehouseSchema.parse(req.body);
    res.json({ success: true, data: inventoryCore.createWarehouse(warehouse) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create warehouse' });
    }
  }
});

router.get('/warehouses', (req, res) => {
  res.json({ success: true, data: inventoryCore.getAllWarehouses() });
});

router.get('/warehouses/:id', (req, res) => {
  const warehouse = inventoryCore.getWarehouse(req.params.id);
  if (!warehouse) {
    return res.status(404).json({ success: false, error: 'Warehouse not found' });
  }
  res.json({ success: true, data: warehouse });
});

router.post('/stock', (req, res) => {
  try {
    const stock = ProductStockSchema.parse(req.body);
    res.json({ success: true, data: inventoryCore.addStock(stock) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to add stock' });
    }
  }
});

router.get('/stock/:productId', (req, res) => {
  const { warehouseId } = req.query;
  const stock = inventoryCore.getStock(req.params.productId, warehouseId as string);
  if (!stock) {
    return res.status(404).json({ success: false, error: 'Stock not found' });
  }
  res.json({ success: true, data: stock });
});

router.get('/stock/:productId/total', (req, res) => {
  const total = inventoryCore.getTotalStock(req.params.productId);
  res.json({ success: true, data: { productId: req.params.productId, totalStock: total } });
});

router.post('/stock/:productId/reserve', async (req, res) => {
  const { warehouseId, quantity } = req.body;
  const success = await inventoryCore.reserveStock(req.params.productId, warehouseId, quantity);
  res.json({ success, message: success ? 'Reserved' : 'Insufficient stock' });
});

router.post('/stock/:productId/consume', async (req, res) => {
  const { warehouseId, quantity } = req.body;
  const success = await inventoryCore.consumeStock(req.params.productId, warehouseId, quantity);
  res.json({ success, message: success ? 'Consumed' : 'Failed' });
});

router.post('/stock/:productId/receive', async (req, res) => {
  const { warehouseId, quantity } = req.body;
  await inventoryCore.receiveStock(req.params.productId, warehouseId, quantity);
  res.json({ success: true, message: 'Stock received' });
});

router.post('/transfers', (req, res) => {
  try {
    const transfer = StockTransferSchema.parse(req.body);
    const result = inventoryCore.transferStock(transfer);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Transfer failed' });
    }
  }
});

router.get('/movements', (req, res) => {
  const { productId, warehouseId } = req.query;
  const movements = inventoryCore.getMovements(productId as string, warehouseId as string);
  res.json({ success: true, data: movements });
});

router.get('/low-stock', (req, res) => {
  res.json({ success: true, data: inventoryCore.getLowStockItems() });
});

router.get('/value', (req, res) => {
  res.json({ success: true, data: inventoryCore.getInventoryValue() });
});

export default router;
