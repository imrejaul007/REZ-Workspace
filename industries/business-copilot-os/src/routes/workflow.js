/**
 * Business Copilot OS - Workflow Routes
 */

const express = require('express');
const router = express.Router();

let workflows = [
  { id: 'WF-001', name: 'Onboarding Workflow', steps: ['welcome', 'setup', 'training'], status: 'active' },
  { id: 'WF-002', name: 'Sales Pipeline', steps: ['lead', 'qualify', 'proposal', 'close'], status: 'active' }
];

router.get('/', (req, res) => res.json({ workflows, count: workflows.length }));

router.get('/:id', (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json(workflow);
});

router.post('/', (req, res) => {
  const { name, steps } = req.body;
  if (!name || !steps) return res.status(400).json({ error: 'name and steps required' });
  const newWorkflow = { id: `WF-${Date.now()}`, name, steps, status: 'active' };
  workflows.push(newWorkflow);
  res.status(201).json(newWorkflow);
});

router.post('/:id/execute', (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ workflowId: workflow.id, status: 'executing', step: workflow.steps[0] });
});

module.exports = router;