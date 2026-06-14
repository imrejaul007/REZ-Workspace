const express = require('express');
const router = express.Router();

let beneficiaries = [
  { id: '1', name: 'Green Valley School', program: 'education', status: 'active', needs: ['books', 'computers', 'scholarships'] },
  { id: '2', name: 'City Hospital', program: 'healthcare', status: 'active', needs: ['medical equipment', 'medicines'] },
  { id: '3', name: 'Senior Care Home', program: 'elderly care', status: 'active', needs: ['food supplies', 'medical aid'] },
  { id: '4', name: 'Village Water Project', program: 'sanitation', status: 'completed', needs: [] }
];

// GET all beneficiaries
router.get('/', (req, res) => {
  res.json(beneficiaries);
});

// GET single beneficiary
router.get('/:id', (req, res) => {
  const beneficiary = beneficiaries.find(b => b.id === req.params.id);
  if (!beneficiary) return res.status(404).json({ error: 'Beneficiary not found' });
  res.json(beneficiary);
});

// POST new beneficiary
router.post('/', (req, res) => {
  const newBeneficiary = {
    id: String(beneficiaries.length + 1),
    name: req.body.name,
    program: req.body.program,
    status: req.body.status || 'active',
    needs: req.body.needs || []
  };
  beneficiaries.push(newBeneficiary);
  res.status(201).json(newBeneficiary);
});

// PUT update beneficiary
router.put('/:id', (req, res) => {
  const index = beneficiaries.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Beneficiary not found' });
  beneficiaries[index] = { ...beneficiaries[index], ...req.body };
  res.json(beneficiaries[index]);
});

// DELETE beneficiary
router.delete('/:id', (req, res) => {
  const index = beneficiaries.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Beneficiary not found' });
  beneficiaries.splice(index, 1);
  res.json({ message: 'Beneficiary deleted successfully' });
});

module.exports = router;