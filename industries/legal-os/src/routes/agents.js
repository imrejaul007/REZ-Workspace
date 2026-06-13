/**
 * Legal OS - AI Agents Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/agents - List all legal AI agents
router.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'case-analysis-agent', name: 'Case Analysis Agent', type: 'analysis', status: 'active', tasks: 156 },
      { id: 'research-agent', name: 'Legal Research Agent', type: 'research', status: 'active', tasks: 234 },
      { id: 'document-agent', name: 'Document Generation Agent', type: 'document', status: 'active', tasks: 189 },
      { id: 'billing-agent', name: 'Billing Agent', type: 'billing', status: 'active', tasks: 98 },
      { id: 'calendar-agent', name: 'Calendar Agent', type: 'calendar', status: 'active', tasks: 145 }
    ],
    total: 5
  });
});

// GET /api/agents/:id - Get agent by ID
router.get('/:id', (req, res) => {
  const agentMap = {
    'case-analysis-agent': { name: 'Case Analysis Agent', type: 'analysis', capabilities: ['case assessment', 'risk analysis', 'outcome prediction'] },
    'research-agent': { name: 'Legal Research Agent', type: 'research', capabilities: ['case law search', 'precedent analysis', 'citation checking'] },
    'document-agent': { name: 'Document Generation Agent', type: 'document', capabilities: ['contract drafting', 'pleading preparation', 'discovery'] },
    'billing-agent': { name: 'Billing Agent', type: 'billing', capabilities: ['time tracking', 'invoice generation', 'payment tracking'] },
    'calendar-agent': { name: 'Calendar Agent', type: 'calendar', capabilities: ['deadline tracking', 'court date scheduling', 'reminders'] }
  };

  const agent = agentMap[req.params.id];
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  res.json({ id: req.params.id, ...agent, status: 'active', lastActive: new Date().toISOString() });
});

// POST /api/agents/:id/task - Create task for agent
router.post('/:id/task', (req, res) => {
  const { action, params } = req.body;
  if (!action) return res.status(400).json({ error: 'action is required' });

  res.json({
    agentId: req.params.id,
    taskId: `task-${Date.now()}`,
    action,
    params: params || {},
    status: 'queued',
    createdAt: new Date().toISOString()
  });
});

module.exports = router;