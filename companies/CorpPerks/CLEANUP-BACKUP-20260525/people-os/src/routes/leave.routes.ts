/**
 * Leave Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as selfService from '../services/selfService';

const router = Router();

const createLeaveSchema = z.object({
  employeeId: z.string().min(1),
  organizationId: z.string().min(1),
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity', 'bereavement']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(1),
  isHalfDay: z.boolean().optional(),
  halfDaySession: z.enum(['morning', 'afternoon']).optional(),
});

const rejectLeaveSchema = z.object({
  rejectedBy: z.string().min(1),
  reason: z.string().min(1),
});

// Create leave request
router.post('/', async (req: Request, res: Response) => {
  try {
    const params = createLeaveSchema.parse(req.body);
    const request = await selfService.createLeaveRequest({
      ...params,
      startDate: new Date(params.startDate),
      endDate: new Date(params.endDate),
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Get leave request
router.get('/:requestId', async (req: Request, res: Response) => {
  const request = await selfService.getLeaveRequest(req.params.requestId);
  if (!request) {
    res.status(404).json({ success: false, error: 'Leave request not found' });
    return;
  }
  res.json({ success: true, data: request });
});

// Submit leave request
router.post('/:requestId/submit', async (req: Request, res: Response) => {
  try {
    const request = await selfService.submitLeaveRequest(req.params.requestId);
    if (!request) {
      res.status(404).json({ success: false, error: 'Leave request not found' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Approve leave request
router.post('/:requestId/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;
    if (!approvedBy) {
      res.status(400).json({ success: false, error: 'approvedBy is required' });
      return;
    }
    const request = await selfService.approveLeaveRequest(req.params.requestId, approvedBy);
    if (!request) {
      res.status(404).json({ success: false, error: 'Leave request not found' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Reject leave request
router.post('/:requestId/reject', async (req: Request, res: Response) => {
  try {
    const params = rejectLeaveSchema.parse(req.body);
    const request = await selfService.rejectLeaveRequest({
      requestId: req.params.requestId,
      ...params,
    });
    if (!request) {
      res.status(404).json({ success: false, error: 'Leave request not found' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    throw error;
  }
});

// Cancel leave request
router.post('/:requestId/cancel', async (req: Request, res: Response) => {
  try {
    const request = await selfService.cancelLeaveRequest(req.params.requestId);
    if (!request) {
      res.status(404).json({ success: false, error: 'Leave request not found' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Get employee leave requests
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  const { status } = req.query;
  const requests = await selfService.getEmployeeLeaveRequests(
    req.params.employeeId,
    status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | undefined
  );
  res.json({ success: true, data: requests });
});

// Get pending approvals for manager
router.get('/pending/:managerId', async (req: Request, res: Response) => {
  const requests = await selfService.getPendingApprovals(req.params.managerId);
  res.json({ success: true, data: requests });
});

export default router;
