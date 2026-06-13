/**
 * Genie OS - Templates Routes
 */

const express = require('express');
const router = express.Router();

let templates = [
  { id: 'TPL-001', name: 'Sales Report', pattern: 'show me * sales report', action: 'generate_sales_report', category: 'reporting' },
  { id: 'TPL-002', name: 'Customer Lookup', pattern: 'find customer *', action: 'lookup_customer', category: 'crm' }
];

router.get('/', (req, res) => {
  const { category } = req.query;
  let filtered = [...templates];
  if (category) filtered = filtered.filter(t => t.category === category);
  res.json({ templates: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { name, pattern, action, category } = req.body;
  if (!name || !pattern || !action) return res.status(400).json({ error: 'name, pattern, action required' });
  const newTemplate = { id: `TPL-${Date.now()}`, name, pattern, action, category: category || 'general' };
  templates.push(newTemplate);
  res.status(201).json(newTemplate);
});

module.exports = router;