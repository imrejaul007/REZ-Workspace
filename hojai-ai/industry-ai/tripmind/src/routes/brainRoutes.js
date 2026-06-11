/**
 * TRIPMIND AI Brain Routes
 *
 * Routes for AI Brain functionality:
 * - Trip planning with AI
 * - Route optimization
 * - Travel advisory
 * - Budget planning
 * - Packing suggestions
 */

const express = require('express');
const router = express.Router();
const { tripMindAIBrain } = require('../services');
const { optionalAuth, aiAgentLimiter } = require('../middleware');
const { validateBody } = require('../middleware');

// Validation schemas
const tripPlanSchema = {
  type: 'object',
  required: ['destination', 'startDate', 'endDate', 'travelers'],
  properties: {
    destination: { type: 'string', minLength: 2 },
    startDate: { type: 'string', format: 'date' },
    endDate: { type: 'string', format: 'date' },
    travelers: { type: 'integer', minimum: 1, maximum: 20 },
    budget: { type: 'number', minimum: 0 },
    travelStyle: { type: 'string', enum: ['budget', 'moderate', 'luxury', 'ultra-luxury'] },
    interests: { type: 'array', items: { type: 'string' } },
    dietaryRestrictions: { type: 'array', items: { type: 'string' } },
    pace: { type: 'string', enum: ['relaxed', 'moderate', 'packed'] },
    specialRequirements: { type: 'array', items: { type: 'string' } },
  },
};

const routeOptimizeSchema = {
  type: 'object',
  required: ['locations'],
  properties: {
    locations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          coordinates: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
          },
        },
      },
      minItems: 2,
      maxItems: 20,
    },
    optimizeFor: { type: 'string', enum: ['time', 'cost', 'distance', 'experience'] },
  },
};

const advisorySchema = {
  type: 'object',
  required: ['destination'],
  properties: {
    destination: { type: 'string', minLength: 2 },
    travelDates: {
      type: 'object',
      properties: {
        start: { type: 'string', format: 'date' },
        end: { type: 'string', format: 'date' },
      },
    },
  },
};

const budgetPlanSchema = {
  type: 'object',
  required: ['destination', 'startDate', 'endDate', 'travelers'],
  properties: {
    destination: { type: 'string' },
    startDate: { type: 'string', format: 'date' },
    endDate: { type: 'string', format: 'date' },
    travelers: { type: 'integer', minimum: 1, maximum: 20 },
    budget: { type: 'number', minimum: 0 },
    travelStyle: { type: 'string', enum: ['budget', 'moderate', 'luxury', 'ultra-luxury'] },
  },
};

const packingListSchema = {
  type: 'object',
  required: ['destination', 'startDate', 'endDate', 'travelers'],
  properties: {
    destination: { type: 'string' },
    startDate: { type: 'string', format: 'date' },
    endDate: { type: 'string', format: 'date' },
    travelers: { type: 'integer', minimum: 1, maximum: 20 },
    travelStyle: { type: 'string', enum: ['budget', 'moderate', 'luxury', 'ultra-luxury'] },
    interests: { type: 'array', items: { type: 'string' } },
    season: { type: 'string', enum: ['spring', 'summer', 'fall', 'winter'] },
  },
};

const querySchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 3, maxLength: 1000 },
    context: { type: 'object' },
  },
};

/**
 * GET /brain/status
 * Get AI Brain status
 */
router.get('/status', optionalAuth, async (req, res) => {
  try {
    const status = await tripMindAIBrain.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting AI Brain status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI Brain status',
    });
  }
});

/**
 * POST /brain/trip/plan
 * Generate AI-powered trip plan
 */
router.post('/trip/plan', aiAgentLimiter, async (req, res) => {
  try {
    const customerId = req.userId?.toString() || req.body.customerId || 'anonymous';
    const preferences = req.body;

    const result = await tripMindAIBrain.planTrip(customerId, preferences);

    res.json(result);
  } catch (error) {
    console.error('Error planning trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to plan trip',
    });
  }
});

/**
 * POST /brain/route/optimize
 * Optimize travel routes
 */
router.post('/route/optimize', aiAgentLimiter, async (req, res) => {
  try {
    const { locations, preferences } = req.body;

    if (!locations || locations.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 locations required for route optimization',
      });
    }

    const result = await tripMindAIBrain.optimizeRoute(locations, preferences);

    res.json(result);
  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize route',
    });
  }
});

/**
 * POST /brain/advisory
 * Get travel advisory
 */
router.post('/advisory', aiAgentLimiter, async (req, res) => {
  try {
    const { destination, travelDates } = req.body;

    const result = await tripMindAIBrain.getTravelAdvisory(destination, travelDates);

    res.json(result);
  } catch (error) {
    console.error('Error getting travel advisory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get travel advisory',
    });
  }
});

/**
 * POST /brain/budget/plan
 * Generate budget plan
 */
router.post('/budget/plan', aiAgentLimiter, async (req, res) => {
  try {
    const preferences = req.body;

    const result = await tripMindAIBrain.planBudget(preferences);

    res.json(result);
  } catch (error) {
    console.error('Error planning budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to plan budget',
    });
  }
});

/**
 * POST /brain/packing/list
 * Generate packing list
 */
router.post('/packing/list', aiAgentLimiter, async (req, res) => {
  try {
    const preferences = req.body;

    const result = await tripMindAIBrain.generatePackingList(preferences);

    res.json(result);
  } catch (error) {
    console.error('Error generating packing list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate packing list',
    });
  }
});

/**
 * POST /brain/query
 * Natural language query
 */
router.post('/query', aiAgentLimiter, async (req, res) => {
  try {
    const { query, context } = req.body;

    const result = await tripMindAIBrain.query(query, context);

    res.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
    });
  }
});

module.exports = router;
