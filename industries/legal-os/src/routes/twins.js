/**
 * Legal OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/twins - List all legal digital twins
router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'legal-case-twin', name: 'Case Twin', type: 'case', status: 'active', health: 98 },
      { id: 'legal-client-twin', name: 'Client Twin', type: 'client', status: 'active', health: 99 },
      { id: 'legal-document-twin', name: 'Document Twin', type: 'document', status: 'active', health: 97 },
      { id: 'legal-contract-twin', name: 'Contract Twin', type: 'contract', status: 'active', health: 96 },
      { id: 'legal-court-twin', name: 'Court Twin', type: 'court', status: 'active', health: 95 },
      { id: 'legal-billing-twin', name: 'Billing Twin', type: 'billing', status: 'active', health: 94 },
      { id: 'legal-calendar-twin', name: 'Calendar Twin', type: 'calendar', status: 'active', health: 93 }
    ],
    total: 7
  });
});

// GET /api/twins/:id - Get twin by ID
router.get('/:id', (req, res) => {
  const twinMap = {
    'legal-case-twin': { name: 'Case Twin', type: 'case', state: { activeCases: 12, pendingCases: 3 } },
    'legal-client-twin': { name: 'Client Twin', type: 'client', state: { totalClients: 45, activeClients: 38 } },
    'legal-document-twin': { name: 'Document Twin', type: 'document', state: { totalDocs: 234, pending: 12 } },
    'legal-contract-twin': { name: 'Contract Twin', type: 'contract', state: { activeContracts: 28, expiring: 5 } },
    'legal-court-twin': { name: 'Court Twin', type: 'court', state: { hearings: 15, scheduled: 8 } },
    'legal-billing-twin': { name: 'Billing Twin', type: 'billing', state: { outstanding: 45000, collected: 120000 } },
    'legal-calendar-twin': { name: 'Calendar Twin', type: 'calendar', state: { events: 67, today: 3 } }
  };

  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });

  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

// POST /api/twins/:id/sync - Sync twin data
router.post('/:id/sync', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'synced',
    lastSync: new Date().toISOString(),
    message: 'Twin data synchronized successfully'
  });
});

module.exports = router;