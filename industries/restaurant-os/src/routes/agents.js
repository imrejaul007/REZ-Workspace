/**
 * AI Agents Routes - Restaurant AI Agents
 */

import { Router } from 'express';

export const agentRoutes = Router();

agentRoutes.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'order-agent', name: 'Order Agent', type: 'order', status: 'active', tasks: 245 },
      { id: 'kitchen-agent', name: 'Kitchen Agent', type: 'kitchen', status: 'active', tasks: 189 },
      { id: 'inventory-agent', name: 'Inventory Agent', type: 'inventory', status: 'active', tasks: 156 },
      { id: 'scheduling-agent', name: 'Scheduling Agent', type: 'scheduling', status: 'active', tasks: 98 },
      { id: 'customer-agent', name: 'Customer Agent', type: 'customer', status: 'active', tasks: 312 }
    ],
    total: 5
  });
});

agentRoutes.post('/:agentId/task', (req, res) => {
  const { task, params } = req.body;
  res.json({
    taskId: `task_${Date.now()}`,
    agentId: req.params.agentId,
    task,
    status: 'completed',
    result: { success: true }
  });
});
