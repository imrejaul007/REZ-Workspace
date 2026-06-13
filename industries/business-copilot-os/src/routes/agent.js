/**
 * Business Copilot OS - Agent Routes
 */

const express = require('express');
const router = express.Router();

let agents = [
  { id: 'AGT-001', name: 'Insight Agent', type: 'insight', status: 'active', tasks: 234 },
  { id: 'AGT-002', name: 'Automation Agent', type: 'automation', status: 'active', tasks: 156 },
  { id: 'AGT-003', name: 'Planning Agent', type: 'planning', status: 'active', tasks: 89 }
];

router.get('/', (req, res) => res.json({ agents, count: agents.length }));

router.post('/:id/query', (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });
  res.json({ agentId: req.params.id, response: `Response to: ${query}`, confidence: 0.92 });
});

module.exports = router;