const express = require('express');
const router = express.Router();
const { bookingController } = require('../controllers');
const { validateBody } = require('../middleware');
const { createBookingSchema, updateBookingSchema } = require('../utils/validators');
const { authenticate, bookingLimiter, isAgent, isAdmin } = require('../middleware');

router.post('/', authenticate, bookingLimiter, validateBody(createBookingSchema), bookingController.createBooking);

router.get('/', authenticate, bookingController.getBookings);

router.get('/all', authenticate, isAgent, bookingController.getAllBookings);

router.get('/:id', authenticate, bookingController.getBooking);

router.patch('/:id', authenticate, validateBody(updateBookingSchema), bookingController.updateBooking);

router.delete('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router;