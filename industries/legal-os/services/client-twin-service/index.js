const express = require('express');
const mongoose = require('mongoose');
const { ClientTwin } = require('../../models/client-twin');
const { MatterTwin } = require('../../models/matter-twin');
const { authenticate, authorize } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

// Create new client
router.post('/', authenticate, async (req, res) => {
  try {
    const client = new ClientTwin(req.body);
    await client.save();
    logger.info(`Client created: ${client._id}`);
    res.status(201).json(client);
  } catch (error) {
    logger.error('Error creating client:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all clients
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await ClientTwin.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await ClientTwin.countDocuments(query);

    res.json({ clients, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get client by ID with matters
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await ClientTwin.findById(req.params.id)
      .populate('matters');

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    logger.error('Error fetching client:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.put('/:id', authenticate, async (req, res) => {
  try {
    const client = await ClientTwin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    logger.info(`Client updated: ${client._id}`);
    res.json(client);
  } catch (error) {
    logger.error('Error updating client:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get client matters
router.get('/:id/matters', authenticate, async (req, res) => {
  try {
    const matters = await MatterTwin.find({ client: req.params.id })
      .sort({ createdAt: -1 });

    res.json(matters);
  } catch (error) {
    logger.error('Error fetching client matters:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create matter for client
router.post('/:id/matters', authenticate, async (req, res) => {
  try {
    const matter = new MatterTwin({
      ...req.body,
      client: req.params.id
    });
    await matter.save();

    await ClientTwin.findByIdAndUpdate(req.params.id, {
      $push: { matters: matter._id }
    });

    logger.info(`Matter created: ${matter._id} for client ${req.params.id}`);
    res.status(201).json(matter);
  } catch (error) {
    logger.error('Error creating matter:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete client
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const client = await ClientTwin.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Delete associated matters
    await MatterTwin.deleteMany({ client: req.params.id });

    logger.info(`Client deleted: ${req.params.id}`);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    logger.error('Error deleting client:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
