import { Router, Request, Response } from 'express';
import manufacturingService from '../services/manufacturing.service';

const router = Router();

// Order routes
router.post('/orders', (req: Request, res: Response) => {
  try {
    const order = manufacturingService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create order', details: (error as Error).message });
  }
});

router.get('/orders', (req: Request, res: Response) => {
  const { status, priority } = req.query;
  const orders = manufacturingService.getAllOrders({
    status: status as string,
    priority: priority as string
  });
  res.json({ orders });
});

router.get('/orders/:id', (req: Request, res: Response) => {
  const order = manufacturingService.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

router.put('/orders/:id', (req: Request, res: Response) => {
  const updated = manufacturingService.updateOrder(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

router.patch('/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = manufacturingService.updateOrderStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

// BOM routes
router.post('/boms', (req: Request, res: Response) => {
  const bom = manufacturingService.createBom(req.body);
  res.status(201).json(bom);
});

router.get('/boms', (req: Request, res: Response) => {
  const { productId } = req.query;
  if (productId) {
    res.json({ boms: manufacturingService.getBomsByProduct(productId as string) });
  } else {
    res.json({ boms: [] });
  }
});

router.get('/boms/:id', (req: Request, res: Response) => {
  const bom = manufacturingService.getBom(req.params.id);
  if (!bom) {
    return res.status(404).json({ error: 'BOM not found' });
  }
  res.json(bom);
});

// Workstation routes
router.post('/workstations', (req: Request, res: Response) => {
  const workstation = manufacturingService.createWorkstation(req.body);
  res.status(201).json(workstation);
});

router.get('/workstations', (req: Request, res: Response) => {
  const { status, type } = req.query;
  const workstations = manufacturingService.getAllWorkstations({
    status: status as string,
    type: type as string
  });
  res.json({ workstations });
});

router.get('/workstations/:id', (req: Request, res: Response) => {
  const workstation = manufacturingService.getWorkstation(req.params.id);
  if (!workstation) {
    return res.status(404).json({ error: 'Workstation not found' });
  }
  res.json(workstation);
});

router.patch('/workstations/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = manufacturingService.updateWorkstationStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Workstation not found' });
  }
  res.json(updated);
});

// Inventory routes
router.post('/inventory', (req: Request, res: Response) => {
  const item = manufacturingService.addInventoryItem(req.body);
  res.status(201).json(item);
});

router.get('/inventory', (req: Request, res: Response) => {
  const items = Array.from(manufacturingService['inventory'].values());
  res.json({ inventory: items });
});

router.patch('/inventory/:id', (req: Request, res: Response) => {
  const { quantity } = req.body;
  const updated = manufacturingService.updateInventoryQuantity(req.params.id, quantity);
  if (!updated) {
    return res.status(404).json({ error: 'Inventory item not found' });
  }
  res.json(updated);
});

router.get('/inventory/low-stock', (req: Request, res: Response) => {
  const items = manufacturingService.getLowStockItems();
  res.json({ items });
});

// Quality check routes
router.post('/quality-checks', (req: Request, res: Response) => {
  const check = manufacturingService.createQualityCheck(req.body);
  res.status(201).json(check);
});

router.get('/orders/:orderId/quality-checks', (req: Request, res: Response) => {
  const checks = manufacturingService.getQualityChecks(req.params.orderId);
  res.json({ checks });
});

// Production report routes
router.post('/production-reports', (req: Request, res: Response) => {
  const report = manufacturingService.createProductionReport(req.body);
  res.status(201).json(report);
});

router.get('/production-reports', (req: Request, res: Response) => {
  const { date, workstation } = req.query;
  const reports = manufacturingService.getProductionReports({
    date: date as string,
    workstation: workstation as string
  });
  res.json({ reports });
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  res.json(manufacturingService.getStats());
});

export default router;
