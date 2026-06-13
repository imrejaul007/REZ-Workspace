/**
 * BOA OS - Executives Routes
 */

const express = require('express');
const router = express.Router();

const executives = {
  CEO: { id: 'CEO', name: 'Chief Executive Officer', focus: 'Strategy & Vision', kpis: ['revenue', 'growth', 'market-share'], status: 'active' },
  CFO: { id: 'CFO', name: 'Chief Financial Officer', focus: 'Finance & Treasury', kpis: ['profit', 'cash-flow', 'roi'], status: 'active' },
  COO: { id: 'COO', name: 'Chief Operating Officer', focus: 'Operations & Efficiency', kpis: ['efficiency', 'quality', 'throughput'], status: 'active' },
  CMO: { id: 'CMO', name: 'Chief Marketing Officer', focus: 'Marketing & Brand', kpis: ['leads', 'conversion', 'brand-awareness'], status: 'active' },
  CHRO: { id: 'CHRO', name: 'Chief Human Resources Officer', focus: 'People & Culture', kpis: ['retention', 'engagement', 'productivity'], status: 'active' },
  CRO: { id: 'CRO', name: 'Chief Revenue Officer', focus: 'Revenue & Sales', kpis: ['revenue', 'sales', 'pipeline'], status: 'active' }
};

router.get('/', (req, res) => {
  res.json({ executives: Object.values(executives), count: Object.keys(executives).length });
});

router.get('/:id', (req, res) => {
  const executive = executives[req.params.id.toUpperCase()];
  if (!executive) return res.status(404).json({ error: 'Executive not found' });
  res.json(executive);
});

router.post('/:id/analyze', (req, res) => {
  const executive = executives[req.params.id.toUpperCase()];
  if (!executive) return res.status(404).json({ error: 'Executive not found' });
  res.json({
    executive: executive.id,
    analysis: `Analysis from ${executive.name} perspective`,
    recommendations: ['Recommendation 1', 'Recommendation 2'],
    confidence: 0.92
  });
});

module.exports = router;