import { Router, Request, Response } from 'express';
import { contractEngine } from '../services/contractEngine';
import { ContractCreationRequest, ContractFilter, ContractStatus } from '../types';

const router = Router();

// GET /health - Health check
router.get('/health', (_req: Request, res: Response) => {
  const health = contractEngine.getHealth();
  res.json({
    service: 'sutar-contract-os',
    port: 4190,
    ...health,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/contracts - Create a new contract
router.post('/api/contracts', async (req: Request, res: Response) => {
  try {
    const request = req.body as ContractCreationRequest;
    const contract = await contractEngine.createContract(request);
    res.status(201).json({ contract });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create contract',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/contracts - List contracts with filters
router.get('/api/contracts', async (req: Request, res: Response) => {
  try {
    const filter: ContractFilter = {
      status: req.query.status
        ? (req.query.status as string).split(',') as ContractStatus[]
        : undefined,
      contractType: req.query.type
        ? (req.query.type as string).split(',') as ContractFilter['contractType']
        : undefined,
      partyId: req.query.partyId as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const contracts = await contractEngine.filterContracts(filter);
    res.json({ contracts, count: contracts.length });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list contracts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/contracts/:contractId - Get contract details
router.get('/api/contracts/:contractId', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const contract = await contractEngine.getContract(contractId);

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found',
        contractId,
      });
    }

    res.json({ contract });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get contract',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PATCH /api/contracts/:contractId/status - Update contract status
router.patch('/api/contracts/:contractId/status', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const contract = await contractEngine.updateContractStatus(contractId, status);

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found',
        contractId,
      });
    }

    res.json({ contract });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update contract status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/contracts/:contractId/sign - Sign contract
router.post('/api/contracts/:contractId/sign', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const { partyId } = req.body;

    if (!partyId) {
      return res.status(400).json({ error: 'Party ID is required' });
    }

    const contract = await contractEngine.signContract(contractId, partyId);

    if (!contract) {
      return res.status(404).json({
        error: 'Contract or party not found',
        contractId,
        partyId,
      });
    }

    res.json({ contract });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to sign contract',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PATCH /api/contracts/:contractId/obligations/:index - Update obligation
router.patch('/api/contracts/:contractId/obligations/:index', async (req: Request, res: Response) => {
  try {
    const { contractId, index } = req.params;
    const update = req.body;

    const contract = await contractEngine.updateObligation(
      contractId,
      parseInt(index),
      update
    );

    if (!contract) {
      return res.status(404).json({
        error: 'Contract not found',
        contractId,
      });
    }

    res.json({ contract });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update obligation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/contracts/templates - List contract templates
router.get('/api/contracts/templates', (_req: Request, res: Response) => {
  try {
    const templates = contractEngine.getAllTemplates();
    res.json({ templates });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get templates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/contracts/templates/:templateId - Get template
router.get('/api/contracts/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = await contractEngine.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        templateId,
      });
    }

    res.json({ template });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get template',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/analytics - Get contract analytics
router.get('/api/analytics', async (_req: Request, res: Response) => {
  try {
    const analytics = await contractEngine.getContractAnalytics();
    res.json({ analytics });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
