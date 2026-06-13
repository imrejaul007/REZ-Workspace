const express = require('express');
const mongoose = require('mongoose');
const { CustomerTwin } = require('./models');
const logger = require('../../../utils/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const customer = new CustomerTwin(req.body);
    await customer.save();
    logger.info(`Customer created: ${customer._id}`);
    res.status(201).json(customer);
  } catch (error) {
    logger.error('Error creating customer:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { loyaltyTier, limit = 50, offset = 0 } = req.query;
    const query = {};
    if (loyaltyTier) query.loyaltyTier = loyaltyTier;

    const customers = await CustomerTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    res.json({ customers, total: await CustomerTwin.countDocuments(query) });
  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await CustomerTwin.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    logger.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const customer = await CustomerTwin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    logger.info(`Customer updated: ${customer._id}`);
    res.json(customer);
  } catch (error) {
    logger.error('Error updating customer:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
