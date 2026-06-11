const express = require('express');
const router = express.Router();
const { aiController } = require('../controllers');
const { validateBody } = require('../middleware');
const { tripPlanSchema, bookingSearchSchema, visaCheckSchema, airportAssistSchema } = require('../utils/validators');
const { optionalAuth, aiAgentLimiter } = require('../middleware');

router.get('/status', optionalAuth, aiController.getAIStatus);

router.post('/trip/plan', aiAgentLimiter, validateBody(tripPlanSchema), aiController.planTrip);

router.post('/booking/search', aiAgentLimiter, validateBody(bookingSearchSchema), aiController.searchBookings);

router.post('/visa/check', aiAgentLimiter, validateBody(visaCheckSchema), aiController.checkVisa);

router.post('/airport/assist', aiAgentLimiter, validateBody(airportAssistSchema), aiController.assistAirport);

module.exports = router;