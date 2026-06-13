const express = require('express');
const router = express.Router();

let donations = [
  { id: '1', donorId: '1', campaignId: '1', amount: 50000, date: '2024-06-01' },
  { id: '2', donorId: '2', campaignId: '2', amount: 5000, date: '2024-06-05' },
  { id: '3', donorId: '3', campaignId: '1', amount: 25000, date: '2024-06-10' },
  { id: '4', donorId: '4', campaignId: '3', amount: 2000, date: '2024-06-12' }
];

// GET all donations
router.get('/', (req, res) => {
  res.json(donations);
});

// GET single donation
router.get('/:id', (req, res) => {
  const donation = donations.find(d => d.id === req.params.id);
  if (!donation) return res.status(404).json({ error: 'Donation not found' });
  res.json(donation);
});

// POST new donation
router.post('/', (req, res) => {
  const newDonation = {
    id: String(donations.length + 1),
    donorId: req.body.donorId,
    campaignId: req.body.campaignId,
    amount: req.body.amount,
    date: new Date().toISOString().split('T')[0]
  };
  donations.push(newDonation);
  res.status(201).json(newDonation);
});

// PUT update donation
router.put('/:id', (req, res) => {
  const index = donations.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Donation not found' });
  donations[index] = { ...donations[index], ...req.body };
  res.json(donations[index]);
});

// DELETE donation
router.delete('/:id', (req, res) => {
  const index = donations.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Donation not found' });
  donations.splice(index, 1);
  res.json({ message: 'Donation deleted successfully' });
});

module.exports = router;