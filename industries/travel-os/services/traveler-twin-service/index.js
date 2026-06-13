const express = require('express');
const mongoose = require('mongoose');
const { TravelerTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const traveler = new TravelerTwin(req.body);
    await traveler.save();
    res.status(201).json(traveler);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { loyaltyTier, limit = 50, offset = 0 } = req.query;
    const query = loyaltyTier ? { loyaltyTier } : {};
    const travelers = await TravelerTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ travelers, total: await TravelerTwin.countDocuments(query) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const traveler = await TravelerTwin.findById(req.params.id);
    if (!traveler) return res.status(404).json({ error: 'Traveler not found' });
    res.json(traveler);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
