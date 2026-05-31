// Procurement Agent AI - Port 4786
const express = require('express');
const app = express();
app.use(express.json());
const PORT = 4786;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'procurement-agent', port: PORT });
});

app.post('/api/rfq', (req, res) => {
  const { item, quantity } = req.body;
  res.json({
    rfqId: `rfq_${Date.now()}`,
    item,
    quantity,
    vendors: ['Vendor A', 'Vendor B', 'Vendor C'],
    deadline: '2026-06-10'
  });
});

app.post('/api/negotiate', (req, res) => {
  const { vendor, currentPrice } = req.body;
  res.json({
    vendor,
    currentPrice,
    targetPrice: currentPrice * 0.85,
    savings: currentPrice * 0.15,
    strategy: 'Volume discount + early payment'
  });
});

app.listen(PORT, () => {
  console.log(`Procurement Agent running on port ${PORT}`);
});
