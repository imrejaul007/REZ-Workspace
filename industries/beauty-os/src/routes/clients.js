/**
 * Beauty OS - Clients Routes
 */

const express = require('express');
const router = express.Router();

let clients = [
  { id: 'CLI-001', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '9876543210', preferences: { serviceType: 'hair' }, loyaltyPoints: 500, lastVisit: '2024-01-10' },
  { id: 'CLI-002', name: 'Emily Brown', email: 'emily@email.com', phone: '9876543211', preferences: { serviceType: 'spa' }, loyaltyPoints: 750, lastVisit: '2024-01-08' }
];

router.get('/', (req, res) => res.json({ clients, count: clients.length }));
router.get('/:id', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

router.post('/', (req, res) => {
  const { name, email, phone, preferences } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newClient = { id: `CLI-${Date.now()}`, name, email: email || null, phone: phone || null, preferences: preferences || {}, loyaltyPoints: 0, lastVisit: null };
  clients.push(newClient);
  res.status(201).json(newClient);
});

module.exports = router;