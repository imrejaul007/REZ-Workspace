const express = require('express');
const router = express.Router();

let services = [
  { id: '1', name: 'Birth Certificate', department: 'Vital Records', description: 'Issue birth certificates', requirements: ['application form', 'parent ID'], status: 'active' },
  { id: '2', name: 'Passport Application', department: 'External Affairs', description: 'New passport issuance', requirements: ['ID proof', 'address proof', 'photos'], status: 'active' },
  { id: '3', name: 'Tax Filing', department: 'Revenue', description: 'Income tax submission', requirements: ['PAN', 'income documents'], status: 'active' },
  { id: '4', name: 'Driving License', department: 'Transport', description: 'License issuance', requirements: ['age proof', 'test results'], status: 'active' }
];

// GET all services
router.get('/', (req, res) => {
  res.json(services);
});

// GET single service
router.get('/:id', (req, res) => {
  const service = services.find(s => s.id === req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

// POST new service
router.post('/', (req, res) => {
  const newService = {
    id: String(services.length + 1),
    name: req.body.name,
    department: req.body.department,
    description: req.body.description,
    requirements: req.body.requirements || [],
    status: req.body.status || 'active'
  };
  services.push(newService);
  res.status(201).json(newService);
});

// PUT update service
router.put('/:id', (req, res) => {
  const index = services.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Service not found' });
  services[index] = { ...services[index], ...req.body };
  res.json(services[index]);
});

// DELETE service
router.delete('/:id', (req, res) => {
  const index = services.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Service not found' });
  services.splice(index, 1);
  res.json({ message: 'Service deleted successfully' });
});

module.exports = router;