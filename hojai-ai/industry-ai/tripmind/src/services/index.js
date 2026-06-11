const tripPlannerAgent = require('./tripPlannerAgent');
const bookingAgent = require('./bookingAgent');
const visaAgent = require('./visaAgent');
const airportAgent = require('./airportAgent');
const { tripMindAIBrain } = require('./aiBrain.js');

module.exports = {
  tripPlannerAgent,
  bookingAgent,
  visaAgent,
  airportAgent,
  tripMindAIBrain
};