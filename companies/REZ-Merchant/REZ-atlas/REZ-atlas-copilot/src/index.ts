/**
 * REZ Atlas Copilot - AI Sales Assistant
 */
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5172;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'REZ-atlas-copilot', version: '1.0.0' });
});

// Merchant summary
app.post('/api/summarize', (req, res) => {
  const { merchantId } = req.body;
  res.json({
    merchantId,
    summary: {
      name: 'Restaurant ABC',
      category: 'Restaurant',
      health: 'Good',
      score: 78,
      keyInsights: [
        'Has website but no online ordering',
        'Rating 4.2 with 120 reviews',
        'Competitor uses REZ Pay',
        'No loyalty program'
      ],
      recommendations: [
        'Suggest REZ Menu QR for digital ordering',
        'Offer REZ Loyalty to improve retention',
        'Propose REZ Pay to match competitor'
      ]
    }
  });
});

// AI Pitch generator
app.post('/api/pitch', (req, res) => {
  const { merchantId, product, channel = 'email' } = req.body;

  const pitches = {
    email: {
      subject: `Boost your ${product} with REZ`,
      body: `Dear [Owner],\n\nI noticed your restaurant could benefit from REZ ${product}. It helps increase revenue by 20%.\n\nWould you like a free demo?\n\nBest regards,\n[Your Name]`
    },
    whatsapp: {
      message: `Hi! I noticed ${merchantId} doesn't have ${product} yet. REZ can help increase your sales by 20%. Interested in a quick demo?`
    },
    call: {
      script: `Hello, I'm calling from REZ. I noticed your restaurant could benefit from our ${product}. It helps increase revenue by 20% and takes only 15 minutes to set up. Would you like to hear more?`
    }
  };

  res.json({
    merchantId,
    product,
    channel,
    pitch: pitches[channel as keyof typeof pitches] || pitches.email
  });
});

// Compare with competitors
app.post('/api/compare', (req, res) => {
  const { merchantId, competitors } = req.body;
  res.json({
    merchantId,
    comparison: {
      merchant: 'Restaurant ABC',
      score: 78,
      competitors: (competitors || ['Competitor X', 'Competitor Y']).map(name => ({
        name,
        score: Math.floor(Math.random() * 30) + 60,
        advantages: ['Has loyalty program', 'Better online presence'],
        disadvantages: ['Higher pricing']
      })),
      ourAdvantages: ['Lower cost', 'Better support', 'Faster setup']
    }
  });
});

app.listen(PORT, () => console.log(`🤖 REZ Atlas Copilot running on port ${PORT}`));
export default app;