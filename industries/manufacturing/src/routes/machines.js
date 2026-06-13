const express = require('express');
const router = express.Router();

let machines = [
  { id: '1', name: 'CNC Lathe 1', type: 'cnc', status: 'operational', utilization: 0.85 },
  { id: '2', name: 'CNC Mill 1', type: 'cnc', status: 'operational', utilization: 0.78 },
  { id: '3', name: 'Hydraulic Press', type: 'press', status: 'maintenance', utilization: 0 },
  { id: '4', name: 'Welding Station 1', type: 'welding', status: 'operational', utilization: 0.65 },
  { id: '5', name: 'Assembly Line A', type: 'assembly', status: 'operational', utilization: 0.92 }
];

// GET all machines
router.get('/', (req, res) => {
  res.json(machines);
});

// GET single machine
router.get('/:id', (req, res) => {
  const machine = machines.find(m => m.id === req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  res.json(machine);
});

// POST new machine
router.post('/', (req, res) => {
  const newMachine = {
    id: String(machines.length + 1),
    name: req.body.name,
    type: req.body.type,
    status: req.body.status || 'operational',
    utilization: req.body.utilization || 0
  };
  machines.push(newMachine);
  res.status(201).json(newMachine);
});

// PUT update machine
router.put('/:id', (req, res) => {
  const index = machines.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Machine not found' });
  machines[index] = { ...machines[index], ...req.body };
  res.json(machines[index]);
});

// DELETE machine
router.delete('/:id', (req, res) => {
  const index = machines.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Machine not found' });
  machines.splice(index, 1);
  res.json({ message: 'Machine deleted successfully' });
});

module.exports = router;