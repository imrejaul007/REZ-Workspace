const express = require('express');
const mongoose = require('mongoose');
const { CaseTwin } = require('../../models/case-twin');
const { DocumentTwin } = require('../../models/document-twin');
const { authenticate, authorize } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

// Create new case
router.post('/', authenticate, async (req, res) => {
  try {
    const matter = new CaseTwin(req.body);
    await matter.save();
    logger.info(`Case created: ${matter._id}`);
    res.status(201).json(matter);
  } catch (error) {
    logger.error('Error creating case:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all cases
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, priority, assignedTo, limit = 50, offset = 0 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const cases = await CaseTwin.find(query)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ updatedAt: -1 });

    const total = await CaseTwin.countDocuments(query);

    res.json({ cases, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching cases:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get case by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const matter = await CaseTwin.findById(req.params.id)
      .populate('client')
      .populate('assignedTo')
      .populate('documents');

    if (!matter) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(matter);
  } catch (error) {
    logger.error('Error fetching case:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update case
router.put('/:id', authenticate, async (req, res) => {
  try {
    const matter = await CaseTwin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!matter) {
      return res.status(404).json({ error: 'Case not found' });
    }

    logger.info(`Case updated: ${matter._id}`);
    res.json(matter);
  } catch (error) {
    logger.error('Error updating case:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add milestone to case
router.post('/:id/milestones', authenticate, async (req, res) => {
  try {
    const matter = await CaseTwin.findById(req.params.id);
    if (!matter) {
      return res.status(404).json({ error: 'Case not found' });
    }

    matter.milestones.push({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      status: 'pending'
    });

    await matter.save();
    logger.info(`Milestone added to case: ${matter._id}`);
    res.json(matter);
  } catch (error) {
    logger.error('Error adding milestone:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add time entry
router.post('/:id/time-entries', authenticate, async (req, res) => {
  try {
    const matter = await CaseTwin.findById(req.params.id);
    if (!matter) {
      return res.status(404).json({ error: 'Case not found' });
    }

    matter.timeEntries.push({
      attorney: req.user.id,
      date: req.body.date || new Date(),
      hours: req.body.hours,
      description: req.body.description,
      billingRate: req.body.billingRate
    });

    await matter.save();
    logger.info(`Time entry added to case: ${matter._id}`);
    res.json(matter);
  } catch (error) {
    logger.error('Error adding time entry:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get case documents
router.get('/:id/documents', authenticate, async (req, res) => {
  try {
    const documents = await DocumentTwin.find({ case: req.params.id })
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    logger.error('Error fetching case documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete case
router.delete('/:id', authenticate, authorize(['admin', 'partner']), async (req, res) => {
  try {
    const matter = await CaseTwin.findByIdAndDelete(req.params.id);

    if (!matter) {
      return res.status(404).json({ error: 'Case not found' });
    }

    logger.info(`Case deleted: ${req.params.id}`);
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    logger.error('Error deleting case:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
