import { Router, Response } from 'express';
import { TenantRequest, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/index.js';
import { clientService } from '../services/index.js';

const router = Router();

// All routes require tenant context
router.use(requireTenant);

// Create a new client
router.post(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const client = await clientService.create(req.body, req.tenantId!);
    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  })
);

// Get all clients
router.get(
  '/',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const { clients, total, page, limit } = await clientService.findAll(req.tenantId!, req.query);
    res.json({
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Get a single client by ID
router.get(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const client = await clientService.findById(req.tenantId!, req.params.id);
    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }
    res.json({
      success: true,
      data: client,
    });
  })
);

// Update a client
router.patch(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const client = await clientService.update(req.tenantId!, req.params.id, req.body);
    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }
    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  })
);

// Archive (soft delete) a client
router.delete(
  '/:id',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const success = await clientService.archive(req.tenantId!, req.params.id);
    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }
    res.json({
      success: true,
      message: 'Client archived successfully',
    });
  })
);

// Get client contacts
router.get(
  '/:id/contacts',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const contacts = await clientService.getContacts(req.tenantId!, req.params.id);
    res.json({
      success: true,
      data: contacts,
    });
  })
);

// Add a contact to client
router.post(
  '/:id/contacts',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const client = await clientService.addContact(req.tenantId!, req.params.id, req.body);
    if (!client) {
      res.status(404).json({
        success: false,
        error: 'Client not found',
      });
      return;
    }
    res.status(201).json({
      success: true,
      data: client,
      message: 'Contact added successfully',
    });
  })
);

// Get client statistics
router.get(
  '/:id/stats',
  asyncHandler(async (req: TenantRequest, res: Response) => {
    const stats = await clientService.getStats(req.tenantId!, req.params.id);
    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;
