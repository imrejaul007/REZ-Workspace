import { Router, Request, Response, NextFunction } from 'express';
import { Warehouse, InventoryItem, StockMovement } from '../models/Inventory';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const router = Router();

// ==================== WAREHOUSES ====================
router.get('/warehouses', async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true });
    res.json({ success: true, data: warehouses });
  } catch (error) { next(error); }
});

router.post('/warehouses', async (req, res, next) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    logger.info('Warehouse created', { id: warehouse._id });
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) { next(error); }
});

// ==================== INVENTORY ====================
router.get('/', async (req, res, next) => {
  try {
    const { warehouseId, storeId } = req.query;
    const query: any = {};
    if (warehouseId) query.warehouseId = warehouseId;
    if (storeId) query.storeId = storeId;

    const items = await InventoryItem.find(query).populate('productId', 'name sku').populate('warehouseId', 'name');
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
});

router.get('/low-stock', async (req, res, next) => {
  try {
    const items = await InventoryItem.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } })
      .populate('productId', 'name sku price')
      .populate('warehouseId', 'name');
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
});

router.patch('/:id/quantity', async (req, res, next) => {
  try {
    const { adjustment, reason } = req.body;
    const item = await InventoryItem.findById(req.params.id);
    if (!item) { res.status(404).json({ success: false, error: 'Item not found' }); return; }

    const movement = new StockMovement({
      type: adjustment > 0 ? 'in' : 'out',
      productId: item.productId,
      toWarehouseId: adjustment > 0 ? item.warehouseId : undefined,
      fromWarehouseId: adjustment < 0 ? item.warehouseId : undefined,
      quantity: Math.abs(adjustment),
      reason: reason || 'Manual adjustment'
    });

    item.quantity += adjustment;
    item.availableQuantity = item.quantity - item.reservedQuantity;
    await Promise.all([item.save(), movement.save()]);

    res.json({ success: true, data: item });
  } catch (error) { next(error); }
});

router.post('/transfer', async (req, res, next) => {
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity } = req.body;

    const [fromItem, toItem] = await Promise.all([
      InventoryItem.findOne({ warehouseId: fromWarehouseId, productId }),
      InventoryItem.findOne({ warehouseId: toWarehouseId, productId })
    ]);

    if (!fromItem || fromItem.quantity < quantity) {
      res.status(400).json({ success: false, error: 'Insufficient stock' }); return;
    }

    const movement = new StockMovement({
      type: 'transfer',
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity
    });

    fromItem.quantity -= quantity;
    fromItem.availableQuantity = fromItem.quantity - fromItem.reservedQuantity;

    if (toItem) {
      toItem.quantity += quantity;
      toItem.availableQuantity = toItem.quantity - toItem.reservedQuantity;
      await Promise.all([fromItem.save(), toItem.save(), movement.save()]);
    } else {
      const newItem = new InventoryItem({
        productId,
        warehouseId: toWarehouseId,
        quantity,
        availableQuantity: quantity
      });
      await Promise.all([fromItem.save(), newItem.save(), movement.save()]);
    }

    logger.info('Transfer completed', { fromWarehouseId, toWarehouseId, productId, quantity });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// ==================== MOVEMENTS ====================
router.get('/movements', async (req, res, next) => {
  try {
    const { productId, type } = req.query;
    const query: any = {};
    if (productId) query.productId = productId;
    if (type) query.type = type;

    const movements = await StockMovement.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: movements });
  } catch (error) { next(error); }
});

export default router;