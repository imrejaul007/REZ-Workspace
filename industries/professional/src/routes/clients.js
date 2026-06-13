const express = require('express');
const router = express.Router();

let clients = [
  { id: '1', name: 'TechCorp Inc', industry: 'technology', contactPerson: 'John Smith' },
  { id: '2', name: 'Finance Solutions Ltd', industry: 'finance', contactPerson: 'Mary Johnson' },
  { id: '3', name: 'HealthFirst Hospital', industry: 'healthcare', contactPerson: 'Dr. Lisa Wang' },
  { id: '4', name: 'Retail Masters', industry: 'retail', contactPerson: 'Bob Davis' }
];

// GET all clients
router.get('/', (req, res) => {
  res.json(clients);
});

// GET single client
router.get('/:id', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

// POST new client
router.post('/', (req, res) => {
  const newClient = {
    id: String(clients.length + 1),
    name: req.body.name,
    industry: req.body.industry,
    contactPerson: req.body.contactPerson
  };
  clients.push(newClient);
  res.status(201).json(newClient);
});

// PUT update client
router.put('/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });
  clients[index] = { ...clients[index], ...req.body };
  res.json(clients[index]);
});

// DELETE client
router.delete('/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });
  clients.splice(index, 1);
  res.json({ message: 'Client deleted successfully' });
});

module.exports = router;