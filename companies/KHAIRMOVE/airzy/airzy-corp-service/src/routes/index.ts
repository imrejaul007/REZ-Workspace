import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { corpService } from '../services/corpService';
import { asyncHandler } from '../utils/errors';

const router = Router();

const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });
  next();
};

router.get('/policies', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user?.tenantId || 'default';
  const policy = await corpService.getPolicy(companyId);
  res.json({ success: true, data: policy, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/approvals', [body('type').isIn(['flight', 'hotel', 'transfer', 'expense']), body('amount').isFloat({ min: 0.01 }), body('description').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'guest';
  const companyId = req.user?.tenantId || 'default';
  const { type, amount, description } = req.body;
  const approval = await corpService.createApproval(userId, companyId, type, amount, description);
  res.status(201).json({ success: true, data: approval, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/approvals', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user?.tenantId || 'default';
  const approvals = await corpService.getApprovals(companyId, req.query.status as string);
  res.json({ success: true, data: approvals, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/approvals/:id/approve', [param('id').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const approverId = req.user?.sub || 'admin';
  const approval = await corpService.updateApprovalStatus(req.params.id, 'approved', approverId);
  if (!approval) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: approval, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/approvals/:id/reject', [param('id').notEmpty(), body('reason').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const approverId = req.user?.sub || 'admin';
  const { reason } = req.body;
  const approval = await corpService.updateApprovalStatus(req.params.id, 'rejected', approverId, reason);
  if (!approval) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: approval, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/expenses', [body('category').notEmpty(), body('amount').isFloat({ min: 0.01 }), body('description').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'guest';
  const companyId = req.user?.tenantId || 'default';
  const { category, amount, description } = req.body;
  const expense = await corpService.createExpense(userId, companyId, category, amount, description);
  res.status(201).json({ success: true, data: expense, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.get('/expenses', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user?.tenantId || 'default';
  const userId = req.query.my === 'true' ? req.user?.sub : undefined;
  const expenses = await corpService.getExpenses(companyId, userId);
  res.json({ success: true, data: expenses, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/expenses/:id/submit', [param('id').notEmpty()], validate, asyncHandler(async (req: Request, res: Response) => {
  const expense = await corpService.submitExpense(req.params.id);
  if (!expense) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: expense, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

router.post('/check-compliance', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user?.tenantId || 'default';
  const { type, amount } = req.body;
  const result = await corpService.checkPolicyCompliance(companyId, type, amount);
  res.json({ success: true, data: result, meta: { requestId: req.requestId, timestamp: Date.now() } });
}));

export default router;