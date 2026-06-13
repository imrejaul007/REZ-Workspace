/**
 * Legal OS - Clients Management Routes
 */

const express = require('express');
const router = express.Router();

// In-memory client storage
let clients = [
  {
    id: 'client-001',
    name: 'John Smith',
    type: 'individual',
    email: 'john.smith@email.com',
    phone: '555-0101',
    address: '123 Main St, City, ST 12345',
    cases: ['case-001'],
    billingRate: 350,
    paymentStatus: 'current',
    notes: 'Corporate client',
    createdAt: new Date().toISOString()
  }
];

// GET /api/clients - List all clients
router.get('/', (req, res) => {
  const { type, paymentStatus } = req.query;
  let filtered = [...clients];

  if (type) filtered = filtered.filter(c => c.type === type);
  if (paymentStatus) filtered = filtered.filter(c => c.paymentStatus === paymentStatus);

  res.json({ clients: filtered, count: filtered.length });
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

// POST /api/clients - Create new client
router.post('/', (req, res) => {
  const { name, type, email, phone, address, billingRate } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'name and type are required' });
  }

  const newClient = {
    id: `client-${Date.now()}`,
    name,
    type,
    email: email || null,
    phone: phone || null,
    address: address || null,
    cases: [],
    billingRate: billingRate || 250,
    paymentStatus: 'current',
    notes: '',
    createdAt: new Date().toISOString()
  };

  clients.push(newClient);
  res.status(201).json(newClient);
});

// PUT /api/clients/:id - Update client
router.put('/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });

  clients[index] = { ...clients[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(clients[index]);
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });

  clients.splice(index, 1);
  res.json({ message: 'Client deleted successfully' });
});

// GET /api/clients/:id/cases - Get client's cases
router.get('/:id/cases', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  res.json({ clientId: client.id, clientName: client.name, cases: client.cases });
});

// POST /api/clients/:id/notes - Add notes
router.post('/:id/notes', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  client.notes = req.body.notes || '';
  res.json(client);
});

module.exports = router;