/**
 * SUTAR OS - Audit Routes
 */

const express = require('express');
const router = express.Router();

let audits = [
  { id: 'AUD-001', type: 'financial', period: 'Q4-2023', status: 'completed', findings: 0, date: '2024-01-01' }
];

router.get('/', (req, res) => res.json({ audits, count: audits.length }));

router.post('/', (req, res) => {
  const { type, period } = req.body;
  if (!type || !period) return res.status(400).json({ error: 'type and period required' });
  const newAudit = { id: `AUD-${Date.now()}`, type, period, status: 'in-progress', findings: 0, date: new Date().toISOString() };
  audits.push(newAudit);
  res.status(201).json(newAudit);
});

module.exports = router;