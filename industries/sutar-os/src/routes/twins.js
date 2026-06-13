/**
 * SUTAR OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'sutar-transaction-twin', name: 'Transaction Twin', type: 'transaction', health: 99 },
      { id: 'sutar-ledger-twin', name: 'Ledger Twin', type: 'ledger', health: 98 },
      { id: 'sutar-compliance-twin', name: 'Compliance Twin', type: 'compliance', health: 97 },
      { id: 'sutar-audit-twin', name: 'Audit Twin', type: 'audit', health: 96 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'sutar-transaction-twin': { name: 'Transaction Twin', type: 'transaction', state: { total: 5000, today: 150 } },
    'sutar-ledger-twin': { name: 'Ledger Twin', type: 'ledger', state: { entries: 15000, balanced: true } },
    'sutar-compliance-twin': { name: 'Compliance Twin', type: 'compliance', state: { compliant: true, score: 98 } },
    'sutar-audit-twin': { name: 'Audit Twin', type: 'audit', state: { lastAudit: '2024-01-01', findings: 0 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;