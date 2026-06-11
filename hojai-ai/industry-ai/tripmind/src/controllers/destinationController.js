const { Destination, Review } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const { buildPaginationResponse } = require('../utils/helpers');

exports.createDestination = async (req, res) => {
  try {
    const destinationData = req.validatedBody;

    const existingDestination = await Destination.findOne({
      name: { $regex: new RegExp(`^${destinationData.name}$`, 'i') }
    });

    if (existingDestination) {
      throw new ValidationError('Destination already exists');
    }

    const destination = new Destination(destinationData);
    await destination.save();

    logger.info(`Destination created: ${destination.name} by ${req.user?.email || 'system'}`);

    res.status(201).json({
      success: true,
      data: { destination }
    });
  } catch (error) {
    throw error;
  }
};

exports.getDestinations = async (req, res) => {
  try {
    const { page = 1, limit = 20, country, priceRange, minRating, tags, search } = req.query;

    const filter = { isActive: true };

    if (country) {
      filter.country = { $regex: country, $options: 'i' };
    }
    if (priceRange) {
      filter.priceRange = priceRange;
    }
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    if (tags) {
      filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const destinations = await Destination.find(filter)
      .sort({ rating: -1, 'metadata.popularity': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Destination.countDocuments(filter);

    res.json({
      success: true,
      ...buildPaginationResponse(destinations, total, parseInt(page), parseInt(limit))
    });
  } catch (error) {
    throw error;
  }
};

exports.getDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination || !destination.isActive) {
      throw new NotFoundError('Destination');
    }

    destination.metadata = destination.metadata || {};
    destination.metadata.searchCount = (destination.metadata.searchCount || 0) + 1;
    await destination.save();

    const reviews = await Review.find({
      destinationId: destination._id,
      status: 'approved'
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        destination,
        reviews,
        stats: {
          averageRating: destination.rating,
          reviewCount: destination.reviewCount
        }
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Destination');
    }
    throw error;
  }
};

exports.updateDestination = async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'country', 'description', 'attractions', 'rating', 'priceRange',
      'estimatedDailyCost', 'bestTimeToVisit', 'image', 'images', 'tags',
      'visaRequired', 'timezone', 'language', 'currency', 'isActive'
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

    const destination = await Destination.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!destination) {
      throw new NotFoundError('Destination');
    }

    logger.info(`Destination updated: ${destination.name}`);

    res.json({
      success: true,
      data: { destination }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Destination');
    }
    throw error;
  }
};

exports.deleteDestination = async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);

    if (!destination) {
      throw new NotFoundError('Destination');
    }

    destination.isActive = false;
    await destination.save();

    logger.info(`Destination soft-deleted: ${destination.name}`);

    res.json({
      success: true,
      message: 'Destination deactivated successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new NotFoundError('Destination');
    }
    throw error;
  }
};

exports.searchDestinations = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    const destinations = await Destination.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    })
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { destinations }
    });
  } catch (error) {
    throw error;
  }
};

exports.getTopDestinations = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    const filter = { isActive: true };
    if (category) {
      filter.priceRange = category;
    }

    const destinations = await Destination.find(filter)
      .sort({ rating: -1, 'metadata.popularity': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { destinations }
    });
  } catch (error) {
    throw error;
  }
};