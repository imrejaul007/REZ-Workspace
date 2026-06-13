/**
 * AI Agents Routes - Healthcare AI Agents
 */

import { Router } from 'express';

export const agentRoutes = Router();

agentRoutes.get('/', (req, res) => {
  res.json({
    agents: [
      { id: 'scheduling-agent', name: 'Scheduling Agent', type: 'scheduling', status: 'active', tasks: 312 },
      { id: 'claims-agent', name: 'Claims Agent', type: 'claims', status: 'active', tasks: 245 },
      { id: 'diagnosis-agent', name: 'Diagnosis Agent', type: 'diagnosis', status: 'active', tasks: 189 },
      { id: 'inventory-agent', name: 'Inventory Agent', type: 'inventory', status: 'active', tasks: 156 },
      { id: 'patient-agent', name: 'Patient Agent', type: 'patient', status: 'active', tasks: 98 }
    ],
    total: 5
  });
});
