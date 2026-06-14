/**
 * REZ Inbox - Import Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

export const importRouter = Router();

importRouter.post('/email', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Connect to email and import
  res.json({
    success: true,
    message: 'Import started',
  });
}));
