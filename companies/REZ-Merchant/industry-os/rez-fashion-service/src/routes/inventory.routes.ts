import { Router, Request, Response } from 'express';
import { Product, InventoryAlert } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  if (!merchantId) return res.status(400).json({ success: false, error: 'Merchant ID required' });

  const overview = {
    totalProducts: await Product.countDocuments({ merchantId }),
    activeProducts: await Product.countDocuments({ merchantId, status: 'active' }),
    outOfStock: await Product.countDocuments({ merchantId, stock: 0 }),
    lowStock: await Product.countDocuments({ merchantId, $expr: { $lte: ['$stock', '$reorderLevel'] } }),
    totalStock: await Product.aggregate([{ $match: { merchantId } }, { $group: { _id: null, total: { $sum: '$stock' } } }]),
    inventoryValue: await Product.aggregate([{ $match: { merchantId } }, { $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$costPrice'] } } } }]),
  };

  res.json({ success: true, data: overview });
}));

router.get('/low-stock', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  const alerts = await InventoryAlert.getUnresolved(merchantId);
  res.json({ success: true, data: alerts, count: alerts.length });
}));

router.get('/size-alerts', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  const alerts = await InventoryAlert.find({ merchantId, alertType: 'size_alert', resolved: false });
  res.json({ success: true, data: alerts, count: alerts.length });
}));

router.get('/category-breakdown', asyncHandler(async (req: Request, res: Response) => {
  const { merchantId } = req.query as any;
  if (!merchantId) return res.status(400).json({ success: false, error: 'Merchant ID required' });

  const breakdown = await Product.aggregate([
    { $match: { merchantId } },
    { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' }, value: { $sum: { $multiply: ['$stock', '$costPrice'] } } } },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: breakdown });
}));

router.patch('/:productId/stock', asyncHandler(async (req: Request, res: Response) => {
  const { adjustment, operation } = req.body;
  const product = await Product.findOne({ productId: req.params.productId });
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

  if (operation === 'set') {
    product.stock = adjustment;
  } else if (operation === 'add') {
    product.stock += adjustment;
  } else if (operation === 'subtract') {
    product.stock = Math.max(0, product.stock - adjustment);
  }

  if (product.stock === 0) product.status = 'out_of_stock';
  else if (product.status === 'out_of_stock') product.status = 'active';

  await product.save();

  // Create alert if low stock
  if (product.stock <= product.reorderLevel && product.stock > 0) {
    await InventoryAlert.createAlert(
      product.productId, product.merchantId, product.name,
      'low_stock', product.stock, product.reorderLevel
    );
  } else if (product.stock === 0) {
    await InventoryAlert.createAlert(
      product.productId, product.merchantId, product.name,
      'out_of_stock', 0, product.minStock
    );
  }

  res.json({ success: true, data: product, message: 'Stock updated successfully' });
}));

router.post('/alerts/:alertId/resolve', asyncHandler(async (req: Request, res: Response) => {
  const alert = await InventoryAlert.findOne({ alertId: req.params.alertId });
  if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
  await alert.resolve();
  res.json({ success: true, message: 'Alert resolved' });
}));

export default router;