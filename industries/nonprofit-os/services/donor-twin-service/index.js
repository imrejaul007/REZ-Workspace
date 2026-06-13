const express = require('express');
const mongoose = require('mongoose');
const { DonorTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const donor = new DonorTwin(req.body);
    await donor.save();
    res.status(201).json(donor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { loyaltyTier, limit = 50, offset = 0 } = req.query;
    const query = loyaltyTier ? { loyaltyTier } : {};
    const donors = await DonorTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ donors, total: await DonorTwin.countDocuments(query) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const donor = await DonorTwin.findById(req.params.id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });
    res.json(donor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
