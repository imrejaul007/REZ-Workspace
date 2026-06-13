/**
 * Legal OS - Contracts Management Routes
 */

const express = require('express');
const router = express.Router();

// In-memory contracts storage
let contracts = [
  {
    id: 'contract-001',
    title: 'Service Agreement',
    type: 'service',
    parties: ['client-001', 'vendor-001'],
    value: 50000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    terms: 'Standard service agreement terms...',
    createdAt: new Date().toISOString()
  }
];

// GET /api/contracts - List all contracts
router.get('/', (req, res) => {
  const { type, status, party } = req.query;
  let filtered = [...contracts];

  if (type) filtered = filtered.filter(c => c.type === type);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (party) filtered = filtered.filter(c => c.parties.includes(party));

  res.json({ contracts: filtered, count: filtered.length });
});

// GET /api/contracts/:id - Get contract by ID
router.get('/:id', (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  res.json(contract);
});

// POST /api/contracts - Create new contract
router.post('/', (req, res) => {
  const { title, type, parties, value, startDate, endDate, terms } = req.body;

  if (!title || !type || !parties) {
    return res.status(400).json({ error: 'title, type, and parties are required' });
  }

  const newContract = {
    id: `contract-${Date.now()}`,
    title,
    type,
    parties,
    value: value || 0,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || null,
    status: 'draft',
    terms: terms || '',
    createdAt: new Date().toISOString()
  };

  contracts.push(newContract);
  res.status(201).json(newContract);
});

// PUT /api/contracts/:id - Update contract
router.put('/:id', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Contract not found' });

  contracts[index] = { ...contracts[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(contracts[index]);
});

// DELETE /api/contracts/:id - Delete contract
router.delete('/:id', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Contract not found' });

  contracts.splice(index, 1);
  res.json({ message: 'Contract deleted successfully' });
});

// POST /api/contracts/:id/sign - Sign contract
router.post('/:id/sign', (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  contract.status = 'active';
  contract.signedDate = new Date().toISOString();
  res.json(contract);
});

// GET /api/contracts/expiring - Get expiring contracts
router.get('/expiring/list', (req, res) => {
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const expiring = contracts.filter(c => c.endDate && c.endDate <= thirtyDaysFromNow && c.status === 'active');

  res.json({ contracts: expiring, count: expiring.length });
});

module.exports = router;