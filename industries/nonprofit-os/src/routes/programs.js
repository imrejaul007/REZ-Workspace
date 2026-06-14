const express = require('express');
const router = express.Router();

let programs = [
  { id: '1', name: 'Education Support', description: 'Providing education resources to underprivileged children', budget: 100000, beneficiaries: 500, status: 'active' },
  { id: '2', name: 'Healthcare Access', description: 'Free medical camps and healthcare support', budget: 150000, beneficiaries: 1000, status: 'active' },
  { id: '3', name: 'Clean Water', description: 'Installing water purifiers in rural areas', budget: 200000, beneficiaries: 5000, status: 'active' },
  { id: '4', name: 'Elderly Care', description: 'Support for senior citizens', budget: 50000, beneficiaries: 200, status: 'active' }
];

// GET all programs
router.get('/', (req, res) => {
  res.json(programs);
});

// GET single program
router.get('/:id', (req, res) => {
  const program = programs.find(p => p.id === req.params.id);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  res.json(program);
});

// POST new program
router.post('/', (req, res) => {
  const newProgram = {
    id: String(programs.length + 1),
    name: req.body.name,
    description: req.body.description,
    budget: req.body.budget || 0,
    beneficiaries: req.body.beneficiaries || 0,
    status: req.body.status || 'active'
  };
  programs.push(newProgram);
  res.status(201).json(newProgram);
});

// PUT update program
router.put('/:id', (req, res) => {
  const index = programs.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Program not found' });
  programs[index] = { ...programs[index], ...req.body };
  res.json(programs[index]);
});

// DELETE program
router.delete('/:id', (req, res) => {
  const index = programs.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Program not found' });
  programs.splice(index, 1);
  res.json({ message: 'Program deleted successfully' });
});

module.exports = router;