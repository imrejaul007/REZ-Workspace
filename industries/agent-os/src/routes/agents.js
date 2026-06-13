/**
 * Agent OS - Agents Routes
 */

const express = require('express');
const router = express.Router();

let agents = [
  { id: 'AGT-001', name: 'Universal Agent', type: 'general', status: 'active', capabilities: ['reasoning', 'planning', 'execution'], tasks: 0 },
  { id: 'AGT-002', name: 'Industry Agent', type: 'industry', status: 'active', capabilities: ['industry-analysis', 'reporting'], tasks: 0 }
];

router.get('/', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...agents];
  if (type) filtered = filtered.filter(a => a.type === type);
  if (status) filtered = filtered.filter(a => a.status === status);
  res.json({ agents: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

router.post('/', (req, res) => {
  const { name, type, capabilities } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newAgent = { id: `AGT-${Date.now()}`, name, type: type || 'general', status: 'active', capabilities: capabilities || [], tasks: 0 };
  agents.push(newAgent);
  res.status(201).json(newAgent);
});

module.exports = router;