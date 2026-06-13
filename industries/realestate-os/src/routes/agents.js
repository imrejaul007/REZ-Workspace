/**
 * Real Estate OS - Agents Routes
 */

const express = require('express');
const router = express.Router();

let agents = [
  { id: 'AGT-001', name: 'Lisa Anderson', email: 'lisa@realestate.com', phone: '9876543213', properties: ['PROP-001'], sales: 15, rating: 4.8, status: 'active' },
  { id: 'AGT-002', name: 'Mike Wilson', email: 'mike@realestate.com', phone: '9876543214', properties: ['PROP-002'], sales: 12, rating: 4.6, status: 'active' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...agents];
  if (status) filtered = filtered.filter(a => a.status === status);
  res.json({ agents: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

router.post('/', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newAgent = { id: `AGT-${Date.now()}`, name, email: email || null, phone: phone || null, properties: [], sales: 0, rating: 0, status: 'active' };
  agents.push(newAgent);
  res.status(201).json(newAgent);
});

module.exports = router;