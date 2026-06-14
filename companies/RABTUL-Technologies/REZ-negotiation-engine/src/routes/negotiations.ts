import { Router, Request, Response } from 'express';
import { negotiationService, CreateNegotiationDto } from '../services/negotiationService.js';

const router = Router();

/**
 * Create a new negotiation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const dto: CreateNegotiationDto = {
      ...req.body,
      tenantId,
      createdBy: req.headers['x-user-id'] as string || 'system'
    };

    const negotiation = await negotiationService.create(dto);

    res.status(201).json({
      success: true,
      data: negotiation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get all negotiations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const { status, type, buyerId, sellerId, search, page, limit } = req.query;

    const result = await negotiationService.findAll({
      tenantId,
      status: status as string,
      type: type as string,
      buyerId: buyerId as string,
      sellerId: sellerId as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.negotiations,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get negotiation by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const negotiation = await negotiationService.findById(req.params.id, tenantId);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Send RFQ
 */
router.post('/:id/rfq', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const { seller } = req.body;
    if (!seller) {
      return res.status(400).json({ success: false, error: 'Seller information required' });
    }

    const negotiation = await negotiationService.sendRFQ(req.params.id, tenantId, seller);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Submit quote
 */
router.post('/:id/quote', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const userId = req.headers['x-user-id'] as string || 'system';
    const { offer } = req.body;

    if (!offer) {
      return res.status(400).json({ success: false, error: 'Offer details required' });
    }

    const negotiation = await negotiationService.submitQuote(req.params.id, tenantId, userId, offer);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Submit counter offer
 */
router.post('/:id/counter', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const userId = req.headers['x-user-id'] as string || 'system';
    const counterOffer = req.body;

    if (!counterOffer) {
      return res.status(400).json({ success: false, error: 'Counter offer details required' });
    }

    const negotiation = await negotiationService.submitCounterOffer(
      req.params.id,
      tenantId,
      userId,
      counterOffer
    );

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Accept negotiation (make deal)
 */
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const userId = req.headers['x-user-id'] as string || 'system';
    const negotiation = await negotiationService.accept(req.params.id, tenantId, userId);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Reject negotiation
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const userId = req.headers['x-user-id'] as string || 'system';
    const { reason } = req.body;

    const negotiation = await negotiationService.reject(req.params.id, tenantId, userId, reason);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Cancel negotiation
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const userId = req.headers['x-user-id'] as string || 'system';
    const negotiation = await negotiationService.cancel(req.params.id, tenantId, userId);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({ success: true, data: negotiation });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get negotiation history
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const negotiation = await negotiationService.getHistory(req.params.id, tenantId);

    if (!negotiation) {
      return res.status(404).json({ success: false, error: 'Negotiation not found' });
    }

    res.json({
      success: true,
      data: {
        auditTrail: negotiation.auditTrail,
        offerHistory: negotiation.offerHistory,
        counterOffers: negotiation.counterOffers
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
