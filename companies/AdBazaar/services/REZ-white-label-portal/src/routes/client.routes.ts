import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { clientService } from '../services/client.service';
import { CreateClientSchema } from '../types';
import logger from '../utils/logger';

const clientLogger = logger.child({ component: 'ClientRoutes' });
const router = Router();

// Validation middleware
const validate = (schema: z.ZodSchema) => async (
  req: Request,
  res: Response,
  next: Function
) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors,
        },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    next(error);
  }
};

// ============== Client Routes ==============

// Create client
router.post('/', validate(CreateClientSchema), async (req: Request, res: Response) => {
  try {
    const client = await clientService.createClient(req.body);
    
    clientLogger.info('Client created', { clientId: client.id, tenantId: client.tenantId });
    
    res.status(201).json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to create client', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get client by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const client = await clientService.getClient(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to get client', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get client by email
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const client = await clientService.getClientByEmail(req.params.email);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to get client by email', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update client
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const client = await clientService.updateClient(req.params.id, req.body);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to update client', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Delete client
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await clientService.deleteClient(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to delete client', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// List clients for tenant
router.get('/tenant/:tenantId', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    
    const filters = {
      status: req.query.status as any,
      search: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      industry: req.query.industry as string,
    };
    
    const result = await clientService.listClients(req.params.tenantId, { page, limit, sortBy, sortOrder }, filters);
    
    res.json({
      success: true,
      data: result.data,
      meta: { 
        requestId: req.headers['x-request-id'] as string || uuidv4(), 
        timestamp: new Date(),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    clientLogger.error('Failed to list clients', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list clients' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get all clients for tenant
router.get('/tenant/:tenantId/all', async (req: Request, res: Response) => {
  try {
    const clients = await clientService.getClientsByTenant(req.params.tenantId);
    
    res.json({
      success: true,
      data: clients,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to get all clients', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get clients' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get client statistics
router.get('/tenant/:tenantId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await clientService.getClientStats(req.params.tenantId);
    
    res.json({
      success: true,
      data: stats,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to get client stats', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get stats' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Search clients
router.get('/tenant/:tenantId/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query is required' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    const clients = await clientService.searchClients(req.params.tenantId, query, limit);
    
    res.json({
      success: true,
      data: clients,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to search clients', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to search clients' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Client Status Routes ==============

// Activate client
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const client = await clientService.activateClient(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to activate client', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to activate client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Deactivate client
router.post('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const client = await clientService.deactivateClient(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to deactivate client', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate client' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Client Contact Routes ==============

// Add contact
router.post('/:id/contacts', async (req: Request, res: Response) => {
  try {
    const client = await clientService.addContact(req.params.id, req.body);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.status(201).json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to add contact', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add contact' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update contact
router.patch('/:id/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const client = await clientService.updateContact(req.params.id, req.params.contactId, req.body);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client or contact not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to update contact', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update contact' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Remove contact
router.delete('/:id/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const client = await clientService.removeContact(req.params.id, req.params.contactId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client or contact not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to remove contact', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove contact' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get primary contact
router.get('/:id/primary-contact', async (req: Request, res: Response) => {
  try {
    const contact = await clientService.getPrimaryContact(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client or contact not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: contact,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to get primary contact', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get primary contact' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Client Tags Routes ==============

// Add tags
router.post('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;
    const client = await clientService.addTags(req.params.id, tags);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to add tags', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add tags' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Remove tags
router.delete('/:id/tags', async (req: Request, res: Response) => {
  try {
    const { tags } = req.body;
    const client = await clientService.removeTags(req.params.id, tags);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to remove tags', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove tags' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Client Settings Routes ==============

// Update settings
router.patch('/:id/settings', async (req: Request, res: Response) => {
  try {
    const client = await clientService.updateSettings(req.params.id, req.body);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: client,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    clientLogger.error('Failed to update settings', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

export default router;
