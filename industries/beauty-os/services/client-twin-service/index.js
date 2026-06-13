const express = require('express');
const mongoose = require('mongoose');
const { ClientBeautyTwin, AppointmentTwin, TreatmentTwin } = require('./models');
const logger = require('../../../utils/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const client = new ClientBeautyTwin(req.body);
    await client.save();
    logger.info(`Beauty client created: ${client._id}`);
    res.status(201).json(client);
  } catch (error) {
    logger.error('Error creating beauty client:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const clients = await ClientBeautyTwin.find()
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ clients, total: await ClientBeautyTwin.countDocuments() });
  } catch (error) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await ClientBeautyTwin.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    logger.error('Error fetching client:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const client = await ClientBeautyTwin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    logger.info(`Beauty client updated: ${client._id}`);
    res.json(client);
  } catch (error) {
    logger.error('Error updating client:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
