const express = require('express');
const router = express.Router();

let citizens = [
  { id: '1', name: 'Rajesh Kumar', aadhar: '1234-5678-9012', address: '123 Main St, Delhi', servicesAvailed: ['passport', 'driving license'] },
  { id: '2', name: 'Priya Sharma', aadhar: '2345-6789-0123', address: '456 Park Ave, Mumbai', servicesAvailed: ['birth certificate', 'tax filing'] },
  { id: '3', name: 'Amit Singh', aadhar: '3456-7890-1234', address: '789 Lake Rd, Bangalore', servicesAvailed: ['passport'] }
];

// GET all citizens
router.get('/', (req, res) => {
  res.json(citizens);
});

// GET single citizen
router.get('/:id', (req, res) => {
  const citizen = citizens.find(c => c.id === req.params.id);
  if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
  res.json(citizen);
});

// POST new citizen
router.post('/', (req, res) => {
  const newCitizen = {
    id: String(citizens.length + 1),
    name: req.body.name,
    aadhar: req.body.aadhar,
    address: req.body.address,
    servicesAvailed: req.body.servicesAvailed || []
  };
  citizens.push(newCitizen);
  res.status(201).json(newCitizen);
});

// PUT update citizen
router.put('/:id', (req, res) => {
  const index = citizens.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Citizen not found' });
  citizens[index] = { ...citizens[index], ...req.body };
  res.json(citizens[index]);
});

// DELETE citizen
router.delete('/:id', (req, res) => {
  const index = citizens.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Citizen not found' });
  citizens.splice(index, 1);
  res.json({ message: 'Citizen deleted successfully' });
});

module.exports = router;