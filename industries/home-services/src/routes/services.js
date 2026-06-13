const express = require('express');
const router = express.Router();

let services = [
  { id: '1', name: 'Plumbing', category: 'repair', description: 'Pipe repair, leak fixing, installation', basePrice: 50 },
  { id: '2', name: 'Electrical', category: 'repair', description: 'Wiring, switch repair, fixture installation', basePrice: 60 },
  { id: '3', name: 'House Cleaning', category: 'cleaning', description: 'Deep cleaning, regular maintenance', basePrice: 40 },
  { id: '4', name: 'AC Repair', category: 'repair', description: 'AC servicing, gas refilling, repair', basePrice: 80 },
  { id: '5', name: 'Pest Control', category: 'treatment', description: 'Termite, cockroach, bedbug treatment', basePrice: 70 }
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
    category: req.body.category,
    description: req.body.description,
    basePrice: req.body.basePrice || 50
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