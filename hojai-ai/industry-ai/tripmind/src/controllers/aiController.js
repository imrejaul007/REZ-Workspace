const { tripPlannerAgent, bookingAgent, visaAgent, airportAgent } = require('../services');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

exports.getAIStatus = async (req, res) => {
  try {
    const [tripPlanner, booking, visa, airport] = await Promise.all([
      tripPlannerAgent.getStatus(),
      bookingAgent.getStatus(),
      visaAgent.getStatus(),
      airportAgent.getStatus()
    ]);

    const overallStatus = [tripPlanner, booking, visa, airport].every(
      agent => agent.status === 'active'
    ) ? 'operational' : 'degraded';

    res.json({
      success: true,
      data: {
        overall: {
          status: overallStatus,
          timestamp: new Date().toISOString()
        },
        agents: {
          tripPlanner,
          booking,
          visa,
          airport
        }
      }
    });
  } catch (error) {
    logger.error('Error getting AI status:', error);
    throw error;
  }
};

exports.planTrip = async (req, res) => {
  try {
    const customerId = req.userId?.toString() || req.body.customerId || 'anonymous';
    const preferences = req.validatedBody;

    if (!tripPlannerAgent.enabled) {
      throw new NotFoundError('Trip Planner Agent is not available');
    }

    const result = await tripPlannerAgent.planTrip(customerId, preferences);

    logger.info(`Trip planned for customer ${customerId}: ${preferences.destination}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error planning trip:', error);
    throw error;
  }
};

exports.searchBookings = async (req, res) => {
  try {
    const customerId = req.userId?.toString() || req.body.customerId || 'anonymous';
    const searchCriteria = req.validatedBody;

    if (!bookingAgent.enabled) {
      throw new NotFoundError('Booking Agent is not available');
    }

    const result = await bookingAgent.searchAvailability(customerId, searchCriteria);

    logger.info(`Booking search for customer ${customerId}: ${searchCriteria.destination}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error searching bookings:', error);
    throw error;
  }
};

exports.checkVisa = async (req, res) => {
  try {
    const customerId = req.userId?.toString() || req.body.customerId || 'anonymous';
    const checkData = req.validatedBody;

    if (!visaAgent.enabled) {
      throw new NotFoundError('Visa Agent is not available');
    }

    const result = await visaAgent.checkVisa(customerId, checkData);

    logger.info(`Visa check for customer ${customerId}: ${checkData.destination}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error checking visa:', error);
    throw error;
  }
};

exports.assistAirport = async (req, res) => {
  try {
    const customerId = req.userId?.toString() || req.body.customerId || 'anonymous';
    const assistanceData = req.validatedBody;

    if (!airportAgent.enabled) {
      throw new NotFoundError('Airport Agent is not available');
    }

    const result = await airportAgent.assist(customerId, assistanceData);

    logger.info(`Airport assistance for customer ${customerId}: ${assistanceData.flightNumber || assistanceData.airportCode}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error providing airport assistance:', error);
    throw error;
  }
};