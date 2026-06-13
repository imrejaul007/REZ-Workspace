const express = require('express');
const router = express.Router();

let campaigns = [
  { id: '1', name: 'Education for All', goal: 100000, raised: 75000, startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: '2', name: 'Clean Water Initiative', goal: 200000, raised: 180000, startDate: '2024-03-01', endDate: '2024-09-30' },
  { id: '3', name: 'Healthcare Support', goal: 150000, raised: 50000, startDate: '2024-05-01', endDate: '2024-10-31' },
  { id: '4', name: 'Disaster Relief', goal: 500000, raised: 500000, startDate: '2024-02-01', endDate: '2024-04-30' }
];

// GET all campaigns
router.get('/', (req, res) => {
  res.json(campaigns);
});

// GET single campaign
router.get('/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

// POST new campaign
router.post('/', (req, res) => {
  const newCampaign = {
    id: String(campaigns.length + 1),
    name: req.body.name,
    goal: req.body.goal,
    raised: req.body.raised || 0,
    startDate: req.body.startDate,
    endDate: req.body.endDate
  };
  campaigns.push(newCampaign);
  res.status(201).json(newCampaign);
});

// PUT update campaign
router.put('/:id', (req, res) => {
  const index = campaigns.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Campaign not found' });
  campaigns[index] = { ...campaigns[index], ...req.body };
  res.json(campaigns[index]);
});

// DELETE campaign
router.delete('/:id', (req, res) => {
  const index = campaigns.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Campaign not found' });
  campaigns.splice(index, 1);
  res.json({ message: 'Campaign deleted successfully' });
});

module.exports = router;