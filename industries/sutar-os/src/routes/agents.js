/**
 * SUTAR OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'accounting-agent', name: 'Accounting Agent', type: 'accounting', status: 'active', tasks: 456 },
      { id: 'compliance-agent', name: 'Compliance Agent', type: 'compliance', status: 'active', tasks: 234 },
      { id: 'audit-agent', name: 'Audit Agent', type: 'audit', status: 'active', tasks: 189 },
      { id: 'reporting-agent', name: 'Reporting Agent', type: 'reporting', status: 'active', tasks: 312 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const agentMap = {
    'accounting-agent': { name: 'Accounting Agent', type: 'accounting', capabilities: ['ledger management', 'reconciliation'] },
    'compliance-agent': { name: 'Compliance Agent', type: 'compliance', capabilities: ['KYC', 'AML', 'regulatory checks'] },
    'audit-agent': { name: 'Audit Agent', type: 'audit', capabilities: ['audit trail', 'fraud detection'] },
    'reporting-agent': { name: 'Reporting Agent', type: 'reporting', capabilities: ['financial reports', 'dashboards'] }
  };
  const agent = agentMap[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ id: req.params.id, ...agent, status: 'active' });
});

router.post('/:id/task', (req, res) => {
  const { action, params } = req.body;
  if (!action) return res.status(400).json({ error: 'action required' });
  res.json({ agentId: req.params.id, taskId: `task-${Date.now()}`, action, params: params || {}, status: 'queued' });
});

module.exports = router;