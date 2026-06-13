import { Router, Request, Response } from 'express';
import { ShopperService } from '../services/shopper.service';
import { validateCreateShopper, validateUpdateShopper } from '../schemas/shopper.schema';

const router = Router();
const shopperService = new ShopperService();

export function getShopperRouter(): Router {
  return router;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateShopper(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateCreateShopper.errors });
    }

    const profile = await shopperService.createShopper(req.body);
    return res.status(201).json(profile);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: { loyaltyTier?: string; minPoints?: number } = {};
    if (req.query.loyaltyTier) filter.loyaltyTier = req.query.loyaltyTier as string;
    if (req.query.minPoints) filter.minPoints = parseInt(req.query.minPoints as string, 10);

    const shoppers = await shopperService.listShoppers(filter);
    return res.json({ shoppers, count: shoppers.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const profile = await shopperService.getShopper(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const valid = validateUpdateShopper(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateUpdateShopper.errors });
    }

    const profile = await shopperService.updateShopper(req.params.id, req.body);
    if (!profile) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await shopperService.deleteShopper(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/loyalty-points', async (req: Request, res: Response) => {
  try {
    const { points } = req.body;
    if (typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ error: 'Points must be a positive number' });
    }

    const profile = await shopperService.addLoyaltyPoints(req.params.id, points);
    if (!profile) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/purchases', async (req: Request, res: Response) => {
  try {
    const { orderTotal, categories } = req.body;
    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return res.status(400).json({ error: 'Order total must be a non-negative number' });
    }
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories must be an array' });
    }

    const profile = await shopperService.recordPurchase(req.params.id, orderTotal, categories);
    if (!profile) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/sessions', async (req: Request, res: Response) => {
  try {
    const { durationMinutes } = req.body;
    if (typeof durationMinutes !== 'number' || durationMinutes < 0) {
      return res.status(400).json({ error: 'Duration must be a non-negative number' });
    }

    const profile = await shopperService.recordSession(req.params.id, durationMinutes);
    if (!profile) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/basket-abandonment', async (req: Request, res: Response) => {
  try {
    const profile = await shopperService.recordBasketAbandonment(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id/insights', async (req: Request, res: Response) => {
  try {
    const insights = await shopperService.getShopperInsights(req.params.id);
    if (!insights) {
      return res.status(404).json({ error: 'Shopper not found' });
    }
    return res.json(insights);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { shopperService };
