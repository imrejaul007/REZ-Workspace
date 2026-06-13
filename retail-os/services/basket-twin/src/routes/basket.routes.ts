import { Router, Request, Response } from 'express';
import { BasketService } from '../services/basket.service';
import { validateAddItem, validateUpdateItem, validateCreateBasket, validateApplyDiscount } from '../schemas/basket.schema';

const router = Router();
const basketService = new BasketService();

export function getBasketRouter(): Router {
  return router;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateBasket(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateCreateBasket.errors });
    }

    const basket = await basketService.createBasket(req.body);
    return res.status(201).json(basket);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const shopperId = req.query.shopperId as string;
    const status = req.query.status as any;

    if (shopperId) {
      const baskets = await basketService.getShopperBaskets(shopperId, status);
      return res.json({ baskets, count: baskets.length });
    }

    const metrics = await basketService.getMetrics();
    return res.json(metrics);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/active', async (req: Request, res: Response) => {
  try {
    const shopperId = req.query.shopperId as string;
    if (!shopperId) {
      return res.status(400).json({ error: 'shopperId is required' });
    }

    const basket = await basketService.getActiveBasketForShopper(shopperId);
    if (!basket) {
      return res.status(404).json({ error: 'No active basket found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/abandoned', async (req: Request, res: Response) => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    const baskets = await basketService.getAbandonedBaskets(since);
    return res.json({ baskets, count: baskets.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.getBasket(req.params.id);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const valid = validateAddItem(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateAddItem.errors });
    }

    const basket = await basketService.addItem(req.params.id, req.body);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.status(201).json(basket);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/items/:productId', async (req: Request, res: Response) => {
  try {
    const valid = validateUpdateItem(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateUpdateItem.errors });
    }

    const basket = await basketService.updateItemQuantity(req.params.id, req.params.productId, req.body.quantity);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/items/:productId', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.removeItem(req.params.id, req.params.productId);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/discounts', async (req: Request, res: Response) => {
  try {
    const valid = validateApplyDiscount(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateApplyDiscount.errors });
    }

    const basket = await basketService.applyBasketDiscount(req.params.id, req.body);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/discounts/:discountId', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.removeDiscount(req.params.id, req.params.discountId);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/save', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.saveBasket(req.params.id);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.restoreBasket(req.params.id);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/abandon', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.abandonBasket(req.params.id);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const basket = await basketService.convertBasket(req.params.id);
    if (!basket) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.json(basket);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await basketService.deleteBasket(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Basket not found' });
    }
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { basketService };