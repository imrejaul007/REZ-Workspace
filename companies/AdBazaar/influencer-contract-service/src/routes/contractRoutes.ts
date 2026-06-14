import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { contractService } from '../services/contractService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createContractSchema = z.object({
  campaignId: z.string().optional(),
  influencerId: z.string(),
  brandId: z.string(),
  type: z.enum(['standard', 'nda', 'sponsorship', 'affiliate', 'ambassador']).default('sponsorship'),
  title: z.string(),
  content: z.string(),
  terms: z.object({
    deliverables: z.array(z.object({
      type: z.enum(['post', 'story', 'reel', 'video', 'live', 'blog']),
      description: z.string(),
      quantity: z.number(),
      platform: z.string().optional(),
      dueDate: z.string().datetime().optional()
    })),
    compensation: z.object({
      amount: z.number(),
      currency: z.string().default('INR'),
      paymentTerms: z.string()
    }),
    exclusivity: z.object({
      required: z.boolean().optional(),
      duration: z.number().optional()
    }).optional(),
    usageRights: z.object({
      duration: z.number().optional(),
      platforms: z.array(z.string()).optional(),
      commercialUse: z.boolean().optional()
    }).optional()
  }),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional()
});

const signContractSchema = z.object({
  signerId: z.string(),
  signerName: z.string(),
  signerEmail: z.string().email(),
  signerRole: z.enum(['brand', 'influencer', 'witness']),
  signatureData: z.string().optional(),
  signatureType: z.enum(['typed', 'drawn', 'uploaded', 'digital']).default('typed')
});

// POST /api/contracts - Create contract
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createContractSchema.parse(req.body);
    const contract = await contractService.createContract({
      ...validatedData,
      validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
      validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
      terms: {
        ...validatedData.terms,
        deliverables: validatedData.terms.deliverables.map(d => ({
          ...d,
          dueDate: d.dueDate ? new Date(d.dueDate) : undefined
        }))
      }
    } as any);
    logger.info('Contract created via API', { userId: req.userId, contractId: contract._id });
    res.status(201).json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/contracts - List contracts
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { influencerId, brandId, campaignId, status } = req.query;

    if (influencerId) {
      const contracts = await contractService.getContractsByInfluencer(influencerId as string);
      return res.json(contracts);
    }

    if (brandId) {
      const contracts = await contractService.getContractsByBrand(brandId as string);
      return res.json(contracts);
    }

    if (campaignId) {
      const contracts = await contractService.getContractsByCampaign(campaignId as string);
      return res.json(contracts);
    }

    res.json({ error: 'Please provide influencerId, brandId, or campaignId' });
  } catch (error) {
    next(error);
  }
});

// GET /api/contracts/:id - Get contract by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

// POST /api/contracts/:id/sign - Sign contract
router.post('/:id/sign', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = signContractSchema.parse(req.body);
    const result = await contractService.signContract(req.params.id, {
      ...validatedData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    logger.info('Contract signed via API', { contractId: req.params.id });
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      next(error);
    }
  }
});

// GET /api/contracts/:id/status - Get contract status
router.get('/:id/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await contractService.getContractStatus(req.params.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// PUT /api/contracts/:id - Update contract
router.put('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

// POST /api/contracts/:id/send - Send contract
router.post('/:id/send', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await contractService.sendContract(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

// POST /api/contracts/:id/changes - Request changes
router.post('/:id/changes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { changedBy, changes } = req.body;
    const contract = await contractService.requestChanges(req.params.id, changedBy, changes);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

// POST /api/contracts/:id/terminate - Terminate contract
router.post('/:id/terminate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const contract = await contractService.terminateContract(req.params.id, reason);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    next(error);
  }
});

// GET /api/contracts/:id/documents - Get contract documents
router.get('/:id/documents', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await contractService.getContractDocuments(req.params.id);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contracts/:id - Delete contract
router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await contractService.deleteContract(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as contractRoutes };
