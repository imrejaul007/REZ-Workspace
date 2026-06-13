const express = require('express');
const mongoose = require('mongoose');
const { FarmTwin, CropTwin, EquipmentTwin } = require('./models');
const logger = require('../../../utils/logger');

const router = express.Router();

// Create farm
router.post('/', async (req, res) => {
  try {
    const farm = new FarmTwin(req.body);
    await farm.save();
    logger.info(`Farm created: ${farm._id}`);
    res.status(201).json(farm);
  } catch (error) {
    logger.error('Error creating farm:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all farms
router.get('/', async (req, res) => {
  try {
    const { status, region, limit = 50, offset = 0 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (region) query.region = region;

    const farms = await FarmTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    res.json({ farms, total: await FarmTwin.countDocuments(query) });
  } catch (error) {
    logger.error('Error fetching farms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get farm by ID
router.get('/:id', async (req, res) => {
  try {
    const farm = await FarmTwin.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    res.json(farm);
  } catch (error) {
    logger.error('Error fetching farm:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update farm
router.put('/:id', async (req, res) => {
  try {
    const farm = await FarmTwin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    logger.info(`Farm updated: ${farm._id}`);
    res.json(farm);
  } catch (error) {
    logger.error('Error updating farm:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get farm crops
router.get('/:id/crops', async (req, res) => {
  try {
    const farm = await FarmTwin.findById(req.params.id).populate('crops');
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    res.json(farm.crops);
  } catch (error) {
    logger.error('Error fetching farm crops:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get farm equipment
router.get('/:id/equipment', async (req, res) => {
  try {
    const farm = await FarmTwin.findById(req.params.id).populate('equipment');
    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    res.json(farm.equipment);
  } catch (error) {
    logger.error('Error fetching farm equipment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
