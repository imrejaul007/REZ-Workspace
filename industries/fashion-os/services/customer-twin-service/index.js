const express = require('express');
const mongoose = require('mongoose');
const { CustomerTwin } = require('./models');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const customer = new CustomerTwin(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const customers = await CustomerTwin.find()
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ customers, total: await CustomerTwin.countDocuments() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await CustomerTwin.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
