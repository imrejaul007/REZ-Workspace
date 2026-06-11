const express = require('express');
const router = express.Router();
const { itineraryController } = require('../controllers');
const { validateBody } = require('../middleware');
const { createItinerarySchema } = require('../utils/validators');
const { authenticate } = require('../middleware');

router.post('/', authenticate, validateBody(createItinerarySchema), itineraryController.createItinerary);

router.get('/', authenticate, itineraryController.getAllItineraries);

router.get('/:bookingId', authenticate, itineraryController.getItinerary);

router.get('/by-id/:id', authenticate, itineraryController.getItineraryById);

router.patch('/:id', authenticate, itineraryController.updateItinerary);

router.delete('/:id', authenticate, itineraryController.deleteItinerary);

router.post('/:id/activate', authenticate, itineraryController.activateItinerary);

module.exports = router;