import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';

export const complaintsRouter = Router();

// In-memory complaints store (use database in production)
interface Complaint {
  id: string;
  userId: string;
  type: 'booking' | 'payment' | 'service' | 'other';
  status: 'registered' | 'investigating' | 'resolved' | 'escalated' | 'closed';
  description: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

const complaintStore = new Map<string, Complaint>();

const createComplaintSchema = z.object({
  type: z.enum(['booking', 'payment', 'service', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  orderId: z.string().optional(),
});

// GET /do/complaints - Get user's complaints
complaintsRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const complaints = Array.from(complaintStore.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      complaints,
    });
  })
);

// GET /do/complaints/:id - Get complaint details
complaintsRouter.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const complaint = complaintStore.get(id);

    if (!complaint || complaint.userId !== userId) {
      throw new NotFoundError('Complaint not found');
    }

    res.json({
      success: true,
      complaint,
    });
  })
);

// POST /do/complaints - Create a complaint
complaintsRouter.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.id;

    const parsed = createComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { type, description, orderId } = parsed.data;

    const complaint: Complaint = {
      id: `CMP-${uuidv4().slice(0, 8).toUpperCase()}`,
      userId,
      type,
      status: 'registered',
      description,
      orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaintStore.set(complaint.id, complaint);

    logger.info('Complaint created', { complaintId: complaint.id, userId, type });

    res.status(201).json({
      success: true,
      complaint,
      message: 'Complaint registered successfully',
    });
  })
);

// POST /do/complaints/:id/messages - Add message to complaint
complaintsRouter.post(
  '/:id/messages',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { message } = req.body;

    const complaint = complaintStore.get(id);

    if (!complaint || complaint.userId !== userId) {
      throw new NotFoundError('Complaint not found');
    }

    if (!message || typeof message !== 'string' || message.length < 1) {
      throw new ValidationError('Message is required');
    }

    logger.info('Complaint message added', { complaintId: id, userId });

    res.json({
      success: true,
      message: 'Message added successfully',
    });
  })
);

// DELETE /do/complaints/:id - Close complaint (user request)
complaintsRouter.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const complaint = complaintStore.get(id);

    if (!complaint || complaint.userId !== userId) {
      throw new NotFoundError('Complaint not found');
    }

    // Only allow closing if resolved
    if (complaint.status !== 'resolved') {
      throw new ValidationError('Complaint cannot be closed unless resolved');
    }

    complaint.status = 'closed';
    complaint.updatedAt = new Date().toISOString();
    complaintStore.set(id, complaint);

    logger.info('Complaint closed by user', { complaintId: id, userId });

    res.json({
      success: true,
      message: 'Complaint closed successfully',
    });
  })
);
