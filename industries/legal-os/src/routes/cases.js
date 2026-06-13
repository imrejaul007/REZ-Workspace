/**
 * Legal OS - Cases Management Routes
 */

const express = require('express');
const router = express.Router();

// In-memory case storage
let cases = [
  {
    id: 'case-001',
    caseNumber: 'CV-2024-001',
    title: 'Smith vs. Corporation',
    type: 'corporate',
    status: 'active',
    clientId: 'client-001',
    assignedAttorney: 'attorney-001',
    court: 'Superior Court',
    filedDate: '2024-01-15',
    description: 'Corporate litigation case',
    documents: ['complaint.pdf', 'discovery.pdf'],
    timeline: [
      { date: '2024-01-15', event: 'Case filed' },
      { date: '2024-02-01', event: 'Response due' }
    ],
    createdAt: new Date().toISOString()
  }
];

// GET /api/cases - List all cases
router.get('/', (req, res) => {
  const { status, type, attorney } = req.query;
  let filtered = [...cases];

  if (status) filtered = filtered.filter(c => c.status === status);
  if (type) filtered = filtered.filter(c => c.type === type);
  if (attorney) filtered = filtered.filter(c => c.assignedAttorney === attorney);

  res.json({ cases: filtered, count: filtered.length });
});

// GET /api/cases/:id - Get case by ID
router.get('/:id', (req, res) => {
  const caseItem = cases.find(c => c.id === req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });
  res.json(caseItem);
});

// POST /api/cases - Create new case
router.post('/', (req, res) => {
  const { title, type, clientId, court, description } = req.body;

  if (!title || !type || !clientId) {
    return res.status(400).json({ error: 'title, type, and clientId are required' });
  }

  const newCase = {
    id: `case-${Date.now()}`,
    caseNumber: `CV-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, '0')}`,
    title,
    type,
    status: 'pending',
    clientId,
    assignedAttorney: req.body.assignedAttorney || null,
    court: court || 'TBD',
    filedDate: new Date().toISOString().split('T')[0],
    description: description || '',
    documents: [],
    timeline: [{ date: new Date().toISOString().split('T')[0], event: 'Case created' }],
    createdAt: new Date().toISOString()
  };

  cases.push(newCase);
  res.status(201).json(newCase);
});

// PUT /api/cases/:id - Update case
router.put('/:id', (req, res) => {
  const index = cases.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Case not found' });

  cases[index] = { ...cases[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(cases[index]);
});

// DELETE /api/cases/:id - Delete case
router.delete('/:id', (req, res) => {
  const index = cases.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Case not found' });

  cases.splice(index, 1);
  res.json({ message: 'Case deleted successfully' });
});

// POST /api/cases/:id/timeline - Add timeline event
router.post('/:id/timeline', (req, res) => {
  const caseItem = cases.find(c => c.id === req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const { date, event } = req.body;
  if (!date || !event) return res.status(400).json({ error: 'date and event are required' });

  caseItem.timeline.push({ date, event });
  res.json(caseItem);
});

// GET /api/cases/:id/analytics - Case analytics
router.get('/:id/analytics', (req, res) => {
  const caseItem = cases.find(c => c.id === req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  res.json({
    caseId: caseItem.id,
    caseNumber: caseItem.caseNumber,
    status: caseItem.status,
    documentCount: caseItem.documents.length,
    timelineEvents: caseItem.timeline.length,
    daysActive: Math.floor((Date.now() - new Date(caseItem.filedDate)) / (1000 * 60 * 60 * 24)),
    type: caseItem.type
  });
});

module.exports = router;
