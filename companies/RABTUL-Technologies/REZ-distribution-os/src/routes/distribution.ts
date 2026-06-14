import { Router, Request, Response } from 'express';
import distributionService from '../services/distribution.service';

const router = Router();

// Distributor routes
router.post('/distributors', (req: Request, res: Response) => {
  try {
    const distributor = distributionService.createDistributor(req.body);
    res.status(201).json(distributor);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create distributor', details: (error as Error).message });
  }
});

router.get('/distributors', (req: Request, res: Response) => {
  const { status, type } = req.query;
  const distributors = distributionService.getAllDistributors({
    status: status as string,
    type: type as string
  });
  res.json({ distributors });
});

router.get('/distributors/:id', (req: Request, res: Response) => {
  const distributor = distributionService.getDistributor(req.params.id);
  if (!distributor) {
    return res.status(404).json({ error: 'Distributor not found' });
  }
  res.json(distributor);
});

router.put('/distributors/:id', (req: Request, res: Response) => {
  const updated = distributionService.updateDistributor(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Distributor not found' });
  }
  res.json(updated);
});

router.delete('/distributors/:id', (req: Request, res: Response) => {
  const deleted = distributionService.deleteDistributor(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Distributor not found' });
  }
  res.json({ message: 'Distributor deleted' });
});

// Order routes
router.post('/orders', (req: Request, res: Response) => {
  try {
    const order = distributionService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create order', details: (error as Error).message });
  }
});

router.get('/orders', (req: Request, res: Response) => {
  const { distributorId } = req.query;
  if (distributorId) {
    res.json({ orders: distributionService.getOrdersByDistributor(distributorId as string) });
  } else {
    res.json({ orders: Array.from(distributionService['orders'].values()) });
  }
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = distributionService.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

router.patch('/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = distributionService.updateOrderStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

// Inventory routes
router.post('/inventory', (req: Request, res: Response) => {
  const item = distributionService.addInventory(req.body);
  res.status(201).json(item);
});

router.get('/inventory', (req: Request, res: Response) => {
  const { distributorId } = req.query;
  if (distributorId) {
    res.json({ inventory: distributionService.getInventory(distributorId as string) });
  } else {
    res.json({ inventory: Array.from(distributionService['inventory'].values()) });
  }
});

router.patch('/inventory/:id', (req: Request, res: Response) => {
  const { quantity } = req.body;
  const updated = distributionService.updateInventory(req.params.id, quantity);
  if (!updated) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  res.json(updated);
});

router.post('/inventory/:id/reserve', (req: Request, res: Response) => {
  const { amount } = req.body;
  const success = distributionService.reserveInventory(req.params.id, amount);
  if (!success) {
    return res.status(400).json({ error: 'Insufficient inventory' });
  }
  res.json({ message: 'Inventory reserved' });
});

// Retailer routes
router.post('/retailers', (req: Request, res: Response) => {
  const retailer = distributionService.createRetailer(req.body);
  res.status(201).json(retailer);
});

router.get('/retailers', (req: Request, res: Response) => {
  const { distributorId } = req.query;
  if (distributorId) {
    res.json({ retailers: distributionService.getRetailersByDistributor(distributorId as string) });
  } else {
    res.json({ retailers: Array.from(distributionService['retailers'].values()) });
  }
});

router.get('/retailers/:id', (req: Request, res: Response) => {
  const retailer = distributionService.getRetailer(req.params.id);
  if (!retailer) {
    return res.status(404).json({ error: 'Retailer not found' });
  }
  res.json(retailer);
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  res.json(distributionService.getStats());
});

export default router;
