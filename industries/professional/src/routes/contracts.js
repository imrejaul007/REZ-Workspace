const express = require('express');
const router = express.Router();

let contracts = [
  { id: '1', clientId: '1', consultantId: '1', projectId: '1', value: 50000, startDate: '2024-01-01', endDate: '2024-06-30', status: 'active' },
  { id: '2', clientId: '2', consultantId: '2', projectId: '2', value: 30000, startDate: '2024-02-01', endDate: '2024-05-31', status: 'completed' },
  { id: '3', clientId: '3', consultantId: '3', projectId: '3', value: 45000, startDate: '2024-04-01', endDate: '2024-09-30', status: 'active' },
  { id: '4', clientId: '4', consultantId: '4', projectId: '4', value: 25000, startDate: '2024-06-01', endDate: '2024-08-31', status: 'pending' }
];

// GET all contracts
router.get('/', (req, res) => {
  res.json(contracts);
});

// GET single contract
router.get('/:id', (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  res.json(contract);
});

// POST new contract
router.post('/', (req, res) => {
  const newContract = {
    id: String(contracts.length + 1),
    clientId: req.body.clientId,
    consultantId: req.body.consultantId,
    projectId: req.body.projectId,
    value: req.body.value || 0,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: req.body.status || 'pending'
  };
  contracts.push(newContract);
  res.status(201).json(newContract);
});

// PUT update contract
router.put('/:id', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Contract not found' });
  contracts[index] = { ...contracts[index], ...req.body };
  res.json(contracts[index]);
});

// DELETE contract
router.delete('/:id', (req, res) => {
  const index = contracts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Contract not found' });
  contracts.splice(index, 1);
  res.json({ message: 'Contract deleted successfully' });
});

module.exports = router;