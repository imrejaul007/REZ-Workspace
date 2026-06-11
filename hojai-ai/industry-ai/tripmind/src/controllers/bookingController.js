const { Booking } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { buildPaginationResponse } = require('../utils/helpers');
const axios = require('axios');

// SDK & Webhook configuration
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

async function triggerWebhook(event, payload) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'tripmind' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType, action, data) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'tripmind', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

async function sendNotification(phone, message, channel = 'sms') {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error(`Notification error:`, error.message);
  }
}

exports.createBooking = async (req, res) => {
  try {
    const bookingData = {
      ...req.validatedBody,
      customerId: req.userId.toString(),
      metadata: {
        source: 'api',
        agent: req.user?.role === 'agent' ? 'BookingAgent' : 'user',
        createdBy: req.userId.toString()
      }
    };

    const booking = new Booking(bookingData);
    await booking.save();

    logger.info(`Booking created: ${booking._id} by user ${req.userId}`);

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('tripmind.booking.created', { bookingId: booking._id.toString(), type: booking.type, destination: booking.destination, customerId: booking.customerId });
    await syncToHOJAI('booking', 'created', { bookingId: booking._id.toString(), type: booking.type, destination: booking.destination, customerId: booking.customerId });

    res.status(201).json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, destination, startDate, endDate } = req.query;

    const filter = { customerId: req.userId.toString() };

    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }
    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      ...buildPaginationResponse(bookings, total, parseInt(page), parseInt(limit))
    });
  } catch (error) {
    throw error;
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customerId: req.userId.toString()
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Booking');
    }
    throw error;
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const allowedUpdates = ['status', 'date', 'returnDate', 'total', 'passengers', 'details'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        customerId: req.userId.toString()
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    logger.info(`Booking updated: ${booking._id}`);

    res.json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Booking');
    }
    throw error;
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customerId: req.userId.toString()
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new ValidationError('Cannot cancel a completed booking');
    }

    booking.status = 'cancelled';
    booking.metadata = booking.metadata || {};
    booking.metadata.cancelledAt = new Date();
    booking.metadata.cancelledBy = req.userId.toString();
    await booking.save();

    logger.info(`Booking cancelled: ${booking._id} by user ${req.userId}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking }
    });
  } catch (error) {
    throw error;
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    if (req.user.role === 'user') {
      throw new ValidationError('Access denied');
    }

    const { page = 1, limit = 20, status, type, customerId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (customerId) filter.customerId = customerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      ...buildPaginationResponse(bookings, total, parseInt(page), parseInt(limit))
    });
  } catch (error) {
    throw error;
  }
};