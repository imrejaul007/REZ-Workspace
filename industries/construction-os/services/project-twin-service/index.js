const express = require('express');
const mongoose = require('mongoose');
const { ProjectTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const p = new ProjectTwin(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const ps = await ProjectTwin.find().limit(50).sort({ createdAt: -1 });
    res.json(ps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await ProjectTwin.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
