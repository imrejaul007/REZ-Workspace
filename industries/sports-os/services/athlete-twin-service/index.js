const express = require('express');
const mongoose = require('mongoose');
const { AthleteTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const athlete = new AthleteTwin(req.body);
    await athlete.save();
    res.status(201).json(athlete);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { sport, limit = 50, offset = 0 } = req.query;
    const query = sport ? { sport } : {};
    const athletes = await AthleteTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ athletes, total: await AthleteTwin.countDocuments(query) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const athlete = await AthleteTwin.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
    res.json(athlete);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
