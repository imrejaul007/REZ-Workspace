/**
 * REZ Inbox - Messages Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { messagesService } from '../services/messages';

export const messagesRouter = Router();

const listSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  category: z.enum(['travel', 'food', 'invoice', 'subscription', 'banking', 'social', 'promotion', 'other']).optional(),
  status: z.enum(['unread', 'read', 'archived', 'deleted']).optional(),
  starred: z.string().optional(),
});

// List messages
messagesRouter.get('/', asyncHandler(async (req, res) => {
  const params = listSchema.parse(req.query);

  const result = await messagesService.listMessages({
    page: parseInt(params.page, 10),
    limit: parseInt(params.limit, 10),
    category: params.category,
    status: params.status,
    starred: params.starred === 'true',
  });

  res.json({
    success: true,
    data: result,
  });
}));

// Get single message
messagesRouter.get('/:id', asyncHandler(async (req, res) => {
  const message = await messagesService.getMessage(req.params.id);

  if (!message) {
    res.status(404).json({
      success: false,
      error: 'Message not found',
    });
    return;
  }

  res.json({
    success: true,
    data: message,
  });
}));

// Mark as read
messagesRouter.patch('/:id/read', asyncHandler(async (req, res) => {
  await messagesService.markAsRead(req.params.id);

  res.json({
    success: true,
  });
}));

// Mark as unread
messagesRouter.patch('/:id/unread', asyncHandler(async (req, res) => {
  await messagesService.markAsUnread(req.params.id);

  res.json({
    success: true,
  });
}));

// Archive message
messagesRouter.patch('/:id/archive', asyncHandler(async (req, res) => {
  await messagesService.archive(req.params.id);

  res.json({
    success: true,
  });
}));

// Toggle star
messagesRouter.patch('/:id/star', asyncHandler(async (req, res) => {
  const message = await messagesService.toggleStar(req.params.id);

  res.json({
    success: true,
    data: message,
  });
}));

// Delete message
messagesRouter.delete('/:id', asyncHandler(async (req, res) => {
  await messagesService.delete(req.params.id);

  res.json({
    success: true,
  });
}));

// Bulk operations
messagesRouter.post('/bulk', asyncHandler(async (req, res) => {
  const { ids, action } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({
      success: false,
      error: 'ids array is required',
    });
    return;
  }

  await messagesService.bulkAction(ids, action);

  res.json({
    success: true,
  });
}));
