const express = require('express');
const router = express.Router();

let contractors = [
  { id: '1', name: 'BuildRight Construction', specialty: 'commercial', rating: 4.8 },
  { id: '2', name: 'Foundation Masters', specialty: 'foundation', rating: 4.6 },
  { id: '3', name: 'SteelWorks Inc', specialty: 'structural', rating: 4.9 },
  { id: '4', name: 'Interior Pro', specialty: 'interior', rating: 4.5 }
];

// GET all contractors
router.get('/', (req, res) => {
  res.json(contractors);
});

// GET single contractor
router.get('/:id', (req, res) => {
  const contractor = contractors.find(c => c.id === req.params.id);
  if (!contractor) return res.status(404).json({ error: 'Contractor not found' });
  res.json(contractor);
});

// POST new contractor
router.post('/', (req, res) => {
  const newContractor = {
    id: String(contractors.length + 1),
    name: req.body.name,
    specialty: req.body.specialty,
    rating: req.body.rating || 0
  };
  contractors.push(newContractor);
  res.status(201).json(newContractor);
});

// PUT update contractor
router.put('/:id', (req, res) => {
  const index = contractors.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Contractor not found' });
  contractors[index] = { ...contractors[index], ...req.body };
  res.json(contractors[index]);
});

// DELETE contractor
router.delete('/:id', (req, res) => {
  const index = contractors.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Contractor not found' });
  contractors.splice(index, 1);
  res.json({ message: 'Contractor deleted successfully' });
});

module.exports = router;