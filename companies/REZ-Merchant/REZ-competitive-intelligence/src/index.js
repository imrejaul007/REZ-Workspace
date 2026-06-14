import logger from './utils/logger';

// REZ Competitive Intelligence for Merchants
const express = require('express');
const app = express();

app.use(express.json());

// Competitor data by industry
const COMPETITORS = {
  restaurant: [
    { name: 'Zomato', strengths: ['Delivery', 'Brand'], weaknesses: ['High commission', 'No POS'] },
    { name: 'Swiggy', strengths: ['Delivery', 'Analytics'], weaknesses: ['High fees', 'Limited tools'] },
    { name: 'Dineout', strengths: ['Reservations'], weaknesses: ['Limited reach'] }
  ],
  retail: [
    { name: 'Shopify', strengths: ['E-commerce', 'Themes'], weaknesses: ['Expensive', 'Setup'] },
    { name: 'Woocommerce', strengths: ['Free', 'Flexible'], weaknesses: ['Complex', 'Hosting'] }
  ],
  salon: [
    { name: 'Mindbody', strengths: ['Scheduling'], weaknesses: ['Expensive', 'Complex'] },
    { name: 'Square', strengths: ['Simple'], weaknesses: ['Limited features'] }
  ]
};

// Get competitor comparison
app.get('/api/compare/:industry', (req, res) => {
  const { industry } = req.params;
  const competitors = COMPETITORS[industry] || [];
  res.json({
    industry,
    competitors,
    rezbAdvantages: [
      'Unified platform',
      'Lower fees',
      'AI-powered insights',
      'Multi-industry'
    ]
  });
});

// Get market insights
app.get('/api/market/:industry', (req, res) => {
  const { industry } = req.params;
  res.json({
    industry,
    marketSize: '500B',
    growthRate: '25%',
    trends: ['AI', 'Omnichannel', 'Subscriptions']
  });
});

// Get benchmarking
app.get('/api/benchmark/:merchantId', (req, res) => {
  res.json({
    merchantId: req.params.merchantId,
    metrics: { revenue: 100000, orders: 500 },
    recommendations: ['Add loyalty', 'Boost ratings']
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4600;
app.listen(PORT, () => logger.info(`Competitive Intelligence on ${PORT}`));

module.exports = app;
