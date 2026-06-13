const express = require('express');
const mongoose = require('mongoose');
const { MemberTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const m = new MemberTwin(req.body);
    await m.save();
    res.status(201).json(m);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const ms = await MemberTwin.find().limit(50).sort({ createdAt: -1 });
    res.json(ms);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const m = await MemberTwin.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
