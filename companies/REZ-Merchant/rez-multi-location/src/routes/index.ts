import { Router, Request, Response } from 'express';
import { Location, LocationTransfer } from '../models/Location';
import { logger } from '../config/logger';

const router = Router();

// Locations
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const { merchantId, type, status, city } = req.query;
    const query: Record<string, any> = {};
    if (merchantId) query.merchantId = merchantId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (city) query['address.city'] = city;

    const locations = await Location.find(query).populate('managerId', 'name email').sort({ isPrimary: -1, name: 1 });
    res.json({ success: true, data: locations, count: locations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch locations' } });
  }
});

router.get('/locations/:id', async (req: Request, res: Response) => {
  try {
    const location = await Location.findById(req.params.id).populate('managerId', 'name email');
    if (!location) return res.status(404).json({ success: false, error: { message: 'Location not found' } });
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch location' } });
  }
});

router.post('/locations', async (req: Request, res: Response) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.put('/locations/:id', async (req: Request, res: Response) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ success: false, error: { message: 'Location not found' } });
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.patch('/locations/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const location = await Location.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!location) return res.status(404).json({ success: false, error: { message: 'Location not found' } });
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Inventory at location
router.get('/locations/:id/inventory', async (req: Request, res: Response) => {
  try {
    const location = await Location.findById(req.params.id).populate('inventory.productId');
    if (!location) return res.status(404).json({ success: false, error: { message: 'Location not found' } });
    res.json({ success: true, data: location.inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch inventory' } });
  }
});

router.post('/locations/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, minStock } = req.body;
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, error: { message: 'Location not found' } });

    const existingIndex = location.inventory.findIndex(i => i.productId.toString() === productId);
    if (existingIndex >= 0) {
      location.inventory[existingIndex].quantity = quantity;
      location.inventory[existingIndex].minStock = minStock;
    } else {
      location.inventory.push({ productId, quantity, minStock: minStock || 0 });
    }
    await location.save();

    res.json({ success: true, data: location.inventory });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Transfers
router.get('/transfers', async (req: Request, res: Response) => {
  try {
    const { fromLocation, toLocation, status } = req.query;
    const query: Record<string, any> = {};
    if (fromLocation) query.fromLocationId = fromLocation;
    if (toLocation) query.toLocationId = toLocation;
    if (status) query.status = status;

    const transfers = await LocationTransfer.find(query)
      .populate('fromLocationId', 'name code')
      .populate('toLocationId', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: transfers, count: transfers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch transfers' } });
  }
});

router.post('/transfers', async (req: Request, res: Response) => {
  try {
    const { fromLocationId, toLocationId, productId, quantity, initiatedBy, notes } = req.body;

    const transfer = await LocationTransfer.create({
      fromLocationId, toLocationId, productId, quantity, initiatedBy, notes,
    });

    await Location.updateOne({ _id: fromLocationId }, { $pull: { inventory: { productId } } });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

router.patch('/transfers/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updateData: Record<string, any> = { status };
    if (status === 'completed') updateData.completedAt = new Date();

    const transfer = await LocationTransfer.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!transfer) return res.status(404).json({ success: false, error: { message: 'Transfer not found' } });

    if (status === 'completed') {
      await Location.updateOne(
        { _id: transfer.toLocationId },
        { $push: { inventory: { productId: transfer.productId, quantity: transfer.quantity, minStock: 0 } } }
      );
    }

    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: (error as Error).message } });
  }
});

// Stats
router.get('/locations/:id/stats', async (req: Request, res: Response) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ success: false, error: { message: 'Location not found' } });

    const lowStock = location.inventory.filter(i => i.quantity <= i.minStock).length;
    res.json({
      success: true,
      data: {
        dailyRevenue: location.dailyRevenue,
        monthlyRevenue: location.monthlyRevenue,
        totalOrders: location.totalOrders,
        rating: location.rating,
        inventoryCount: location.inventory.length,
        lowStockItems: lowStock,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stats' } });
  }
});

export default router;
