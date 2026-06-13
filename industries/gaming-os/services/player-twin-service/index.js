const express = require('express');
const mongoose = require('mongoose');
const { PlayerTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const player = new PlayerTwin(req.body);
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const players = await PlayerTwin.find()
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ players, total: await PlayerTwin.countDocuments() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const player = await PlayerTwin.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
