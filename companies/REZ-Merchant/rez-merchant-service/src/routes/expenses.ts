
import { Router, Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const EXPENSE_ALLOWED_FIELDS = [
  'title', 'description', 'amount', 'category', 'storeId',
  'date', 'paymentMethod', 'receipt', 'vendor', 'notes',
  'tags', 'isRecurring', 'recurringFrequency', 'metadata',
];

function pickExpenseFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of EXPENSE_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) filter.storeId = req.query.storeId;
    if (req.query.category) filter.category = req.query.category;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Expense.countDocuments(filter),
    ]);
    res.json({ success: true, data: { expenses, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const expenseFields = pickExpenseFields(req.body);
    const expense = await Expense.create({ ...expenseFields, merchantId: req.merchantId, date: req.body.date ? new Date(req.body.date) : new Date() });
    res.status(201).json({ success: true, data: expense });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const r = await Expense.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!r) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
