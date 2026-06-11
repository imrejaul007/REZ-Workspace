const express = require('express');
const router = express.Router();
const { destinationController } = require('../controllers');
const { validateBody } = require('../middleware');
const { createDestinationSchema } = require('../utils/validators');
const { authenticate, isAgent, isAdmin } = require('../middleware');

router.post('/', authenticate, isAgent, validateBody(createDestinationSchema), destinationController.createDestination);

router.get('/', destinationController.getDestinations);

router.get('/search', destinationController.searchDestinations);

router.get('/top', destinationController.getTopDestinations);

router.get('/:id', destinationController.getDestination);

router.put('/:id', authenticate, isAgent, destinationController.updateDestination);

router.delete('/:id', authenticate, isAdmin, destinationController.deleteDestination);

module.exports = router;