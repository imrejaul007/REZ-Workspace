import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import {
  getProjectsByClientId,
  getInvoicesByClientId,
  getMessagesByClientId,
  getDocumentsByClientId,
  getProfileByClientId,
  getDashboardStatsByClientId,
  mockMessages,
} from '../services/mockData.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/client/profile
 * Get client profile
 */
router.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const profile = getProfileByClientId(clientId);

  if (!profile) {
    res.status(404).json({
      success: false,
      error: 'Profile not found',
    });
    return;
  }

  res.json({
    success: true,
    data: profile,
  });
});

/**
 * GET /api/client/dashboard
 * Get dashboard stats
 */
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const stats = getDashboardStatsByClientId(clientId);

  if (!stats) {
    res.status(404).json({
      success: false,
      error: 'Dashboard not found',
    });
    return;
  }

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/client/projects
 * Get all projects for client
 */
router.get('/projects', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const projects = getProjectsByClientId(clientId);

  res.json({
    success: true,
    data: projects,
  });
});

/**
 * GET /api/client/projects/:id
 * Get specific project
 */
router.get('/projects/:id', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const projects = getProjectsByClientId(clientId);
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    res.status(404).json({
      success: false,
      error: 'Project not found',
    });
    return;
  }

  res.json({
    success: true,
    data: project,
  });
});

/**
 * GET /api/client/invoices
 * Get all invoices for client
 */
router.get('/invoices', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const invoices = getInvoicesByClientId(clientId);

  res.json({
    success: true,
    data: invoices,
  });
});

/**
 * GET /api/client/invoices/:id
 * Get specific invoice
 */
router.get('/invoices/:id', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const invoices = getInvoicesByClientId(clientId);
  const invoice = invoices.find(i => i.id === req.params.id);

  if (!invoice) {
    res.status(404).json({
      success: false,
      error: 'Invoice not found',
    });
    return;
  }

  res.json({
    success: true,
    data: invoice,
  });
});

/**
 * GET /api/client/messages
 * Get all messages for client
 */
router.get('/messages', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const messages = getMessagesByClientId(clientId);

  res.json({
    success: true,
    data: messages,
  });
});

/**
 * POST /api/client/messages
 * Send a message
 */
router.post('/messages', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const { content, attachments } = req.body;

  if (!content || content.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Message content is required',
    });
    return;
  }

  // In production, this would save to database and notify support
  const newMessage = {
    id: `msg-${Date.now()}`,
    messageId: `MSG-${Date.now()}`,
    senderId: req.user!.userId,
    senderName: 'Client', // Would get from profile
    senderType: 'client' as const,
    content,
    attachments: attachments || [],
    isRead: false,
    createdAt: new Date(),
  };

  res.status(201).json({
    success: true,
    data: newMessage,
    message: 'Message sent successfully',
  });
});

/**
 * GET /api/client/messages/:id/read
 * Mark message as read
 */
router.get('/messages/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const messages = getMessagesByClientId(clientId);
  const message = messages.find(m => m.id === req.params.id);

  if (!message) {
    res.status(404).json({
      success: false,
      error: 'Message not found',
    });
    return;
  }

  message.isRead = true;

  res.json({
    success: true,
    data: message,
  });
});

/**
 * GET /api/client/documents
 * Get all documents for client
 */
router.get('/documents', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const documents = getDocumentsByClientId(clientId);

  res.json({
    success: true,
    data: documents,
  });
});

/**
 * GET /api/client/documents/:id
 * Get specific document
 */
router.get('/documents/:id', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const documents = getDocumentsByClientId(clientId);
  const document = documents.find(d => d.id === req.params.id);

  if (!document) {
    res.status(404).json({
      success: false,
      error: 'Document not found',
    });
    return;
  }

  res.json({
    success: true,
    data: document,
  });
});

/**
 * PATCH /api/client/profile
 * Update client profile
 */
router.patch('/profile', (req: AuthenticatedRequest, res: Response) => {
  const clientId = req.user!.clientId;
  const profile = getProfileByClientId(clientId);

  if (!profile) {
    res.status(404).json({
      success: false,
      error: 'Profile not found',
    });
    return;
  }

  // In production, update in database
  const updatedProfile = {
    ...profile,
    ...req.body,
    updatedAt: new Date(),
  };

  res.json({
    success: true,
    data: updatedProfile,
    message: 'Profile updated successfully',
  });
});

export default router;
