/**
 * REZ Inbox - Threads Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

export const threadsRouter = Router();

threadsRouter.get('/', asyncHandler(async (req, res) => {
  // List all threads
  res.json({
    success: true,
    data: [],
  });
}));

threadsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {},
  });
}));
