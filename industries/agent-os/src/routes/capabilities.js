/**
 * Agent OS - Capabilities Routes
 */

const express = require('express');
const router = express.Router();

let capabilities = [
  { id: 'CAP-001', name: 'Reasoning', type: 'cognitive', description: 'Logical reasoning and analysis', status: 'active' },
  { id: 'CAP-002', name: 'Planning', type: 'cognitive', description: 'Strategic planning and goal setting', status: 'active' },
  { id: 'CAP-003', name: 'Execution', type: 'action', description: 'Task execution and completion', status: 'active' }
];

router.get('/', (req, res) => {
  const { type } = req.query;
  let filtered = [...capabilities];
  if (type) filtered = filtered.filter(c => c.type === type);
  res.json({ capabilities: filtered, count: filtered.length });
});

module.exports = router;