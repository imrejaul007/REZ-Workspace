/**
 * Expense Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as selfService from '../services/selfService';

const router = Router();

const createExpenseSchema = z.object({
  employeeId: z.string().min(1),
  organizationId: z.string().min(1),
  claimType: z.enum(['travel', 'meals', 'accommodation', 'communication', 'equipment', 'training', 'other']),
  amount: z.number().positive(),
  expenseDate: z.string().datetime(),
  description: z.string().min(1),
  projectCode: z.string().optional(),
});

const rejectExpenseSchema = z.object({
  rejectedBy: z.string().min(1),
  reason: z.string().min(1),
});

const reimburseSchema = z.object({
  paymentReference: z.string().min(1),
});

// Create expense claim
router.post('/', async (req: Request, res: Response) => {
  try {
    const params = createExpenseSchema.parse(req.body);
    const claim = await selfService.createExpenseClaim({
      ...params,
      expenseDate: new Date(params.expenseDate),
    });
    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    throw error;
  }
});

// Get expense claim
router.get('/:claimId', async (req: Request, res: Response) => {
  const claim = await selfService.getExpenseClaim(req.params.claimId);
  if (!claim) {
    res.status(404).json({ success: false, error: 'Expense claim not found' });
    return;
  }
  res.json({ success: true, data: claim });
});

// Submit expense claim
router.post('/:claimId/submit', async (req: Request, res: Response) => {
  try {
    const claim = await selfService.submitExpenseClaim(req.params.claimId);
    if (!claim) {
      res.status(404).json({ success: false, error: 'Expense claim not found' });
      return;
    }
    res.json({ success: true, data: claim });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Approve expense claim
router.post('/:claimId/approve', async (req: Request, res: Response) => {
  try {
    const { approvedBy } = req.body;
    if (!approvedBy) {
      res.status(400).json({ success: false, error: 'approvedBy is required' });
      return;
    }
    const claim = await selfService.approveExpenseClaim(req.params.claimId, approvedBy);
    if (!claim) {
      res.status(404).json({ success: false, error: 'Expense claim not found' });
      return;
    }
    res.json({ success: true, data: claim });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Reject expense claim
router.post('/:claimId/reject', async (req: Request, res: Response) => {
  try {
    const params = rejectExpenseSchema.parse(req.body);
    const claim = await selfService.rejectExpenseClaim({
      claimId: req.params.claimId,
      ...params,
    });
    if (!claim) {
      res.status(404).json({ success: false, error: 'Expense claim not found' });
      return;
    }
    res.json({ success: true, data: claim });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    throw error;
  }
});

// Mark as reimbursed
router.post('/:claimId/reimburse', async (req: Request, res: Response) => {
  try {
    const params = reimburseSchema.parse(req.body);
    const claim = await selfService.markExpenseReimbursed(req.params.claimId, params.paymentReference);
    if (!claim) {
      res.status(404).json({ success: false, error: 'Expense claim not found' });
      return;
    }
    res.json({ success: true, data: claim });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    throw error;
  }
});

// Get employee expense claims
router.get('/employee/:employeeId', async (req: Request, res: Response) => {
  const { status } = req.query;
  const claims = await selfService.getEmployeeExpenseClaims(
    req.params.employeeId,
    status as 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed' | undefined
  );
  res.json({ success: true, data: claims });
});

// Get pending expense approvals for manager
router.get('/pending/:managerId', async (req: Request, res: Response) => {
  const claims = await selfService.getPendingExpenseApprovals(req.params.managerId);
  res.json({ success: true, data: claims });
});

export default router;
