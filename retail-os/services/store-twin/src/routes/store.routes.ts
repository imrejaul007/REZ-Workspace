import { Router, Request, Response } from 'express';
import { StoreService } from '../services/store.service';
import { validateCreateStore, validateUpdateStore } from '../schemas/store.schema';

const router = Router();
const storeService = new StoreService();

export function getStoreRouter(): Router {
  return router;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateStore(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateCreateStore.errors });
    }

    const store = await storeService.createStore(req.body);
    return res.status(201).json(store);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: { type?: string; status?: string; city?: string } = {};
    if (req.query.type) filter.type = req.query.type as string;
    if (req.query.status) filter.status = req.query.status as string;
    if (req.query.city) filter.city = req.query.city as string;

    const stores = await storeService.listStores(filter);
    return res.json({ stores, count: stores.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.latitude as string);
    const lon = parseFloat(req.query.longitude as string);
    const radius = parseFloat(req.query.radius as string) || 10;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const stores = await storeService.getNearbyStores(lat, lon, radius);
    return res.json({ stores, count: stores.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const store = await storeService.getStore(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/code/:code', async (req: Request, res: Response) => {
  try {
    const store = await storeService.getStoreByCode(req.params.code);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const valid = validateUpdateStore(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateUpdateStore.errors });
    }

    const store = await storeService.updateStore(req.params.id, req.body);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await storeService.deleteStore(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/departments', async (req: Request, res: Response) => {
  try {
    const store = await storeService.addDepartment(req.params.id, req.body);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.status(201).json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/metrics/department', async (req: Request, res: Response) => {
  try {
    const { departmentId, salesDelta } = req.body;
    const store = await storeService.updateDepartmentMetrics(req.params.id, departmentId, salesDelta);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/customers', async (req: Request, res: Response) => {
  try {
    const { count } = req.body;
    const store = await storeService.updateCustomerCount(req.params.id, count);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json({ currentCustomers: store.capacity.currentCustomers });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/checkouts', async (req: Request, res: Response) => {
  try {
    const { count } = req.body;
    const store = await storeService.updateActiveCheckouts(req.params.id, count);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json({ activeCheckouts: store.capacity.activeCheckouts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/staff', async (req: Request, res: Response) => {
  try {
    const { role, count } = req.body;
    const store = await storeService.updateStaff(req.params.id, role, count);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store.staff);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const temporary = req.body.temporary !== false;
    const store = await storeService.closeStore(req.params.id, temporary);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reopen', async (req: Request, res: Response) => {
  try {
    const store = await storeService.reopenStore(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(store);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await storeService.getStoreMetrics(req.params.id);
    if (!metrics) {
      return res.status(404).json({ error: 'Store not found' });
    }
    return res.json(metrics);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { storeService };
