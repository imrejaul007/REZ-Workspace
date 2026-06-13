/**
 * SUTAR OS - Compliance Routes
 */

const express = require('express');
const router = express.Router();

let checks = [
  { id: 'CHK-001', type: 'KYC', status: 'compliant', lastCheck: '2024-01-15', nextCheck: '2025-01-15' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...checks];
  if (status) filtered = filtered.filter(c => c.status === status);
  res.json({ checks: filtered, count: filtered.length });
});

router.post('/check', (req, res) => {
  const { type } = req.body;
  res.json({ type, status: 'compliant', checkedAt: new Date().toISOString() });
});

module.exports = router;