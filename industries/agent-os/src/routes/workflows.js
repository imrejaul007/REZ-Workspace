/**
 * Agent OS - Workflows Routes
 */

const express = require('express');
const router = express.Router();

let workflows = [
  { id: 'WF-001', name: 'Multi-Agent Analysis', agents: ['AGT-001', 'AGT-002'], steps: ['collect', 'analyze', 'report'], status: 'active' }
];

router.get('/', (req, res) => res.json({ workflows, count: workflows.length }));

router.post('/', (req, res) => {
  const { name, agents, steps } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newWorkflow = { id: `WF-${Date.now()}`, name, agents: agents || [], steps: steps || [], status: 'active' };
  workflows.push(newWorkflow);
  res.status(201).json(newWorkflow);
});

module.exports = router;