const express = require('express');
const mongoose = require('mongoose');
const { CitizenTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const citizen = new CitizenTwin(req.body);
    await citizen.save();
    res.status(201).json(citizen);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { verificationStatus, limit = 50, offset = 0 } = req.query;
    const query = verificationStatus ? { verificationStatus } : {};
    const citizens = await CitizenTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ citizens, total: await CitizenTwin.countDocuments(query) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const citizen = await CitizenTwin.findById(req.params.id);
    if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
    res.json(citizen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
