const express = require('express');
const router = express.Router();
const { analyticsController } = require('../controllers');
const { authenticate, isAgent } = require('../middleware');

router.get('/dashboard', authenticate, isAgent, analyticsController.getDashboard);

router.get('/bookings', authenticate, isAgent, analyticsController.getBookingStats);

router.get('/destinations', authenticate, isAgent, analyticsController.getDestinationStats);

module.exports = router;