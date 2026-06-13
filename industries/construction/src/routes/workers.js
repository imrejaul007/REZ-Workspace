const express = require('express');
const router = express.Router();

let workers = [
  { id: '1', name: 'Raj Kumar', projectId: '1', role: 'site engineer', wage: 800 },
  { id: '2', name: 'Amit Singh', projectId: '1', role: 'supervisor', wage: 1000 },
  { id: '3', name: 'Suresh Patel', projectId: '1', role: 'mason', wage: 600 },
  { id: '4', name: 'Vikash Sharma', projectId: '1', role: 'electrician', wage: 700 }
];

// GET all workers
router.get('/', (req, res) => {
  res.json(workers);
});

// GET single worker
router.get('/:id', (req, res) => {
  const worker = workers.find(w => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  res.json(worker);
});

// POST new worker
router.post('/', (req, res) => {
  const newWorker = {
    id: String(workers.length + 1),
    name: req.body.name,
    projectId: req.body.projectId,
    role: req.body.role,
    wage: req.body.wage || 0
  };
  workers.push(newWorker);
  res.status(201).json(newWorker);
});

// PUT update worker
router.put('/:id', (req, res) => {
  const index = workers.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Worker not found' });
  workers[index] = { ...workers[index], ...req.body };
  res.json(workers[index]);
});

// DELETE worker
router.delete('/:id', (req, res) => {
  const index = workers.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Worker not found' });
  workers.splice(index, 1);
  res.json({ message: 'Worker deleted successfully' });
});

module.exports = router;