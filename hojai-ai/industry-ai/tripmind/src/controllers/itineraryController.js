const { Itinerary, Booking } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { buildPaginationResponse } = require('../utils/helpers');

exports.createItinerary = async (req, res) => {
  try {
    const itineraryData = {
      ...req.validatedBody,
      customerId: req.userId.toString(),
      metadata: {
        generatedBy: req.body.metadata?.generatedBy || 'user',
        version: 1
      }
    };

    const itinerary = new Itinerary(itineraryData);
    await itinerary.save();

    logger.info(`Itinerary created: ${itinerary._id} for booking ${itinerary.bookingId}`);

    res.status(201).json({
      success: true,
      data: { itinerary }
    });
  } catch (error) {
    throw error;
  }
};

exports.getItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      bookingId: req.params.bookingId,
      customerId: req.userId.toString()
    });

    if (!itinerary) {
      throw new NotFoundError('Itinerary');
    }

    res.json({
      success: true,
      data: { itinerary }
    });
  } catch (error) {
    throw error;
  }
};

exports.getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      throw new NotFoundError('Itinerary');
    }

    if (itinerary.customerId !== req.userId.toString() && req.user.role === 'user') {
      throw new ValidationError('Access denied');
    }

    res.json({
      success: true,
      data: { itinerary }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Itinerary');
    }
    throw error;
  }
};

exports.getAllItineraries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = { customerId: req.userId.toString() };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const itineraries = await Itinerary.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Itinerary.countDocuments(filter);

    res.json({
      success: true,
      ...buildPaginationResponse(itineraries, total, parseInt(page), parseInt(limit))
    });
  } catch (error) {
    throw error;
  }
};

exports.updateItinerary = async (req, res) => {
  try {
    const allowedUpdates = [
      'title', 'description', 'days', 'totalCost', 'currency',
      'status', 'preferences'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    const itinerary = await Itinerary.findOneAndUpdate(
      {
        _id: req.params.id,
        customerId: req.userId.toString()
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!itinerary) {
      throw new NotFoundError('Itinerary');
    }

    logger.info(`Itinerary updated: ${itinerary._id}`);

    res.json({
      success: true,
      data: { itinerary }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Itinerary');
    }
    throw error;
  }
};

exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOneAndDelete({
      _id: req.params.id,
      customerId: req.userId.toString()
    });

    if (!itinerary) {
      throw new NotFoundError('Itinerary');
    }

    logger.info(`Itinerary deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Itinerary');
    }
    throw error;
  }
};

exports.activateItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      customerId: req.userId.toString()
    });

    if (!itinerary) {
      throw new NotFoundError('Itinerary');
    }

    itinerary.status = 'active';
    itinerary.metadata = itinerary.metadata || {};
    itinerary.metadata.version = (itinerary.metadata.version || 1) + 1;
    itinerary.metadata.lastModified = new Date();
    await itinerary.save();

    res.json({
      success: true,
      data: { itinerary }
    });
  } catch (error) {
    throw error;
  }
};