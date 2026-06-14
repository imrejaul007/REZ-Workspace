import { logger } from '../../shared/logger';
/**
 * MyTalent Finance AI Agent
 * Invoices, Expenses, Payroll
 * Port: 4009
 */

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4009;

app.post('/api/invoices/create', (req, res) => {
  const { client, items } = req.body;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  res.json({ invoiceId: `INV-${Date.now()}`, total, status: 'draft' });
});

app.post('/api/expenses/log', (req, res) => {
  res.json({ expenseId: `EXP-${Date.now()}`, status: 'logged' });
});

app.get('/api/reports/financial', (req, res) => {
  res.json({ revenue: 5000000, costs: 3500000, profit: 1500000, margin: '30%' });
});

app.listen(PORT, () => {
  logger.info(`Finance AI on ${PORT}`);
});

export default app;
