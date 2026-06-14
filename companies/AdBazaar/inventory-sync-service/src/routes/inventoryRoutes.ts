import { Router, Response } from 'express';
import { InventorySyncService, inventorySyncService } from '../services';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createServiceLogger } from 'utils/logger.js';

const router = Router();
const logger = createServiceLogger('InventoryRoutes');
router.use(authMiddleware);
const service: InventorySyncService = inventorySyncService;

// POST /api/inventory - Create inventory
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const inventory = await service.createInventory({ ...req.body, companyId: req.companyId || 'adb_company_001' });
    res.status(201).json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Failed to create inventory', { error });
    res.status(500).json({ success: false, error: 'Failed to create inventory' });
  }
});

// GET /api/inventory/:id - Get inventory by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const inventory = await service.getInventoryById(req.params.id);
    if (!inventory) return res.status(404).json({ success: false, error: 'Inventory not found' });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get inventory' });
  }
});

// PUT /api/inventory/:id - Update inventory
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const inventory = await service.updateInventory(req.params.id, req.body);
    if (!inventory) return res.status(404).json({ success: false, error: 'Inventory not found' });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update inventory' });
  }
});

// GET /api/inventory/sync - Get sync status
router.get('/sync/status', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const status = await service.getSyncStatus(companyId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get sync status' });
  }
});

// POST /api/inventory/sync - Initiate sync
router.post('/sync', async (req: AuthRequest, res: Response) => {
  try {
    const sync = await service.initiateSync({ ...req.body, companyId: req.companyId || 'adb_company_001' });
    res.json({ success: true, data: sync });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to initiate sync' });
  }
});

// GET /api/inventory/sync/history - Get sync history
router.get('/sync/history', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const history = await service.getSyncHistory(companyId);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get sync history' });
  }
});

// POST /api/inventory/:id/reserve - Reserve stock
router.post('/:id/reserve', async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    const inventory = await service.reserveStock(req.params.id, quantity);
    if (!inventory) return res.status(404).json({ success: false, error: 'Inventory not found' });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/inventory/:id/release - Release stock
router.post('/:id/release', async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    const inventory = await service.releaseStock(req.params.id, quantity);
    if (!inventory) return res.status(404).json({ success: false, error: 'Inventory not found' });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to release stock' });
  }
});

// GET /api/inventory/low-stock - Get low stock items
router.get('/low-stock/all', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.query.companyId as string || 'adb_company_001';
    const items = await service.getLowStockItems(companyId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get low stock items' });
  }
});

// POST /api/inventory/:id/webhook - Trigger webhook
router.post('/:id/webhook', async (req: AuthRequest, res: Response) => {
  try {
    const { type, payload } = req.body;
    const webhook = await service.triggerWebhook(req.params.id, type, payload);
    res.json({ success: true, data: webhook });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to trigger webhook' });
  }
});

export default router;