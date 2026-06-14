import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { contractService, CreateContractDTO, UpdateContractDTO, ContractFilters } from '../services/contractService.js';
import { pdfGenerator } from '../services/pdfGenerator.js';
import { IContractParty } from '../models/Contract.js';

const router = Router();

// Validation schemas
const createContractSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(['employment', 'nda', 'vendor', 'partnership', 'service', 'lease', 'other']),
  parties: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional()
  })).min(2),
  clauses: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number()
  })).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  terms: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdBy: z.string().min(1)
});

const updateContractSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(['employment', 'nda', 'vendor', 'partnership', 'service', 'lease', 'other']).optional(),
  parties: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
    signedAt: z.string().datetime().optional(),
    signature: z.string().optional()
  })).optional(),
  clauses: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number()
  })).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  terms: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated']).optional(),
  updatedBy: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const signContractSchema = z.object({
  partyEmail: z.string().email(),
  signature: z.string().min(1),
  signedAt: z.string().datetime().optional()
});

const filtersSchema = z.object({
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated']).optional(),
  type: z.enum(['employment', 'nda', 'vendor', 'partnership', 'service', 'lease', 'other']).optional(),
  createdBy: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(20)
});

/**
 * GET /api/contracts
 * List contracts with pagination and filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const validation = filtersSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }

    const { page, limit, ...filters } = validation.data;
    const result = await contractService.listContracts(
      filters as ContractFilters,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    logger.error('Error listing contracts:', error);
    res.status(500).json({ error: 'Failed to list contracts' });
  }
});

/**
 * GET /api/contracts/stats
 * Get contract statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await contractService.getContractStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * GET /api/contracts/expiring
 * Get contracts expiring soon
 */
router.get('/expiring', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const contracts = await contractService.getExpiringContracts(days);
    res.json({ contracts, days });
  } catch (error) {
    logger.error('Error getting expiring contracts:', error);
    res.status(500).json({ error: 'Failed to get expiring contracts' });
  }
});

/**
 * GET /api/contracts/:id
 * Get contract by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await contractService.getContract(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    logger.error('Error getting contract:', error);
    res.status(500).json({ error: 'Failed to get contract' });
  }
});

/**
 * POST /api/contracts
 * Create a new contract
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = createContractSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.errors
      });
    }

    const data: CreateContractDTO = {
      ...validation.data,
      startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
    };

    const contract = await contractService.createContract(data);
    res.status(201).json(contract);
  } catch (error) {
    logger.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

/**
 * PUT /api/contracts/:id
 * Update contract
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validation = updateContractSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.errors
      });
    }

    const data: UpdateContractDTO = {
      ...validation.data,
      startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
      endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
    };

    const contract = await contractService.updateContract(req.params.id, data);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    logger.error('Error updating contract:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

/**
 * DELETE /api/contracts/:id
 * Delete contract (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const contract = await contractService.deleteContract(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ message: 'Contract terminated successfully', contract });
  } catch (error) {
    logger.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

/**
 * POST /api/contracts/:id/sign
 * Sign contract
 */
router.post('/:id/sign', async (req: Request, res: Response) => {
  try {
    const validation = signContractSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validation.error.errors
      });
    }

    const contract = await contractService.signContract(req.params.id, {
      ...validation.data,
      signedAt: validation.data.signedAt ? new Date(validation.data.signedAt) : undefined
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({
      message: 'Contract signed successfully',
      contract,
      allPartiesSigned: contract.parties.every(p => p.signature)
    });
  } catch (error: unknown) {
    logger.error('Error signing contract:', error);
    if (error instanceof Error && error.message === 'Party not found in contract') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to sign contract' });
  }
});

/**
 * GET /api/contracts/:id/pdf
 * Generate and download contract PDF
 */
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const contract = await contractService.getContract(req.params.id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const pdfBuffer = await pdfGenerator.generateContractPDF(contract);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${contract.contractNumber}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (error) {
    logger.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export { router as contractRoutes };
