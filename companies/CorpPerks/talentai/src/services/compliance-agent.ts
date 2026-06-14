/**
 * Compliance Agent - Port 4020
 * Labor law compliance, document verification
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Compliance checklist
const checklist = [
  { id: 'c1', category: 'documentation', item: 'Offer Letters', status: 'compliant', deadline: null },
  { id: 'c2', category: 'documentation', item: 'Appointment Letters', status: 'compliant', deadline: null },
  { id: 'c3', category: 'documentation', item: 'NDA Agreements', status: 'compliant', deadline: null },
  { id: 'c4', category: 'documentation', item: 'Background Verification', status: 'pending', deadline: '2026-02-15' },
  { id: 'c5', category: 'pf', item: 'PF Registration', status: 'compliant', deadline: null },
  { id: 'c6', category: 'pf', item: 'PF Contributions', status: 'compliant', deadline: null },
  { id: 'c7', category: 'esi', item: 'ESI Registration', status: 'compliant', deadline: null },
  { id: 'c8', category: 'esi', item: 'ESI Contributions', status: 'compliant', deadline: null },
  { id: 'c9', category: 'pt', item: 'Professional Tax', status: 'compliant', deadline: null },
  { id: 'c10', category: 'tds', item: 'TDS Filing', status: 'pending', deadline: '2026-01-31' },
  { id: 'c11', category: 'shops', item: 'Shops & Establishments License', status: 'compliant', deadline: null },
  { id: 'c12', category: 'safety', item: 'Fire Safety Certificate', status: 'pending', deadline: '2026-03-01' },
];

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'compliance', port: 4020 }));

// Get compliance status
app.get('/status', (_, res) => {
  const compliant = checklist.filter(c => c.status === 'compliant').length;
  const pending = checklist.filter(c => c.status === 'pending').length;
  const overdue = checklist.filter(c => c.status === 'overdue').length;

  res.json({
    summary: {
      total: checklist.length,
      compliant,
      pending,
      overdue,
      score: Math.round((compliant / checklist.length) * 100),
    },
    checklist,
  });
});

// Get items by category
app.get('/category/:category', (req, res) => {
  const items = checklist.filter(c => c.category === req.params.category);
  res.json({ category: req.params.category, items });
});

// Update item status
app.put('/item/:id', (req, res) => {
  const item = checklist.find(c => c.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { status, deadline } = req.body;
  if (status) item.status = status;
  if (deadline) item.deadline = deadline;

  res.json({ item });
});

// Get upcoming deadlines
app.get('/deadlines', (_, res) => {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcoming = checklist
    .filter(c => c.deadline && new Date(c.deadline) <= thirtyDaysLater)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  res.json({ deadlines: upcoming });
});

// Audit report
app.get('/audit', (req, res) => {
  const report = {
    id: `audit_${Date.now()}`,
    generatedAt: new Date(),
    period: '2025-2026',
    complianceScore: Math.round((checklist.filter(c => c.status === 'compliant').length / checklist.length) * 100),
    findings: checklist.filter(c => c.status !== 'compliant').map(c => ({
      item: c.item,
      status: c.status,
      action: c.status === 'pending' ? 'Complete documentation' : 'Take immediate action',
    })),
    recommendations: [
      'Complete TDS filing before deadline',
      'Renew fire safety certificate',
      'Complete pending background verifications',
    ],
  };

  res.json({ report });
});

const PORT = 4020;
app.listen(PORT, () => logger.info(`Compliance Agent running on port ${PORT}`));
