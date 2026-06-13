const express = require('express');
const mongoose = require('mongoose');
const { ClientTwin, ProjectTwin } = require('./models');
const logger = require('../../../utils/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const client = new ClientTwin(req.body);
    await client.save();
    logger.info(`Professional client created: ${client._id}`);
    res.status(201).json(client);
  } catch (error) {
    logger.error('Error creating client:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const query = {};
    if (status) query.status = status;
    const clients = await ClientTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });
    res.json({ clients, total: await ClientTwin.countDocuments(query) });
  } catch (error) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await ClientTwin.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) {
    logger.error('Error fetching client:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const client = await ClientTwin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    logger.info(`Professional client updated: ${client._id}`);
    res.json(client);
  } catch (error) {
    logger.error('Error updating client:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
