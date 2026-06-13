const express = require('express');
const mongoose = require('mongoose');
const { CalendarTwin } = require('../../models/calendar-twin');
const { authenticate, authorize } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

// Create calendar event
router.post('/', authenticate, async (req, res) => {
  try {
    const event = new CalendarTwin({
      ...req.body,
      createdBy: req.user.id
    });
    await event.save();

    logger.info(`Calendar event created: ${event._id}`);
    res.status(201).json(event);
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all events
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, attorneyId, limit = 100, offset = 0 } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.start = {};
      if (startDate) query.start.$gte = new Date(startDate);
      if (endDate) query.start.$lte = new Date(endDate);
    }

    if (type) query.type = type;
    if (attorneyId) query.attendees = attorneyId;

    const events = await CalendarTwin.find(query)
      .populate('case', 'title caseNumber')
      .populate('attendees', 'name email')
      .populate('createdBy', 'name email')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ start: 1 });

    const total = await CalendarTwin.countDocuments(query);

    res.json({ events, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get event by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await CalendarTwin.findById(req.params.id)
      .populate('case')
      .populate('attendees')
      .populate('createdBy');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    logger.error('Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', authenticate, async (req, res) => {
  try {
    const event = await CalendarTwin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    logger.info(`Calendar event updated: ${event._id}`);
    res.json(event);
  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add reminder
router.post('/:id/reminders', authenticate, async (req, res) => {
  try {
    const event = await CalendarTwin.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.reminders.push({
      time: req.body.time,
      type: req.body.type || 'notification',
      sent: false
    });

    await event.save();
    logger.info(`Reminder added to event: ${event._id}`);
    res.json(event);
  } catch (error) {
    logger.error('Error adding reminder:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const event = await CalendarTwin.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    logger.info(`Calendar event deleted: ${req.params.id}`);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
