import { Router } from 'express';
import { guestTwinController } from '../controllers';

const router = Router();

/**
 * @route POST /api/twins/guest
 * @desc Create guest twin
 * @access Public
 */
router.post('/', guestTwinController.create.bind(guestTwinController));

/**
 * @route GET /api/twins/guest
 * @desc Query guest twins
 * @access Public
 */
router.get('/', guestTwinController.query.bind(guestTwinController));

/**
 * @route GET /api/twins/guest/stats
 * @desc Get guest statistics
 * @access Public
 */
router.get('/stats', guestTwinController.getStatistics.bind(guestTwinController));

/**
 * @route GET /api/twins/guest/:id
 * @desc Get guest twin by ID
 * @access Public
 */
router.get('/:id', guestTwinController.getById.bind(guestTwinController));

/**
 * @route PUT /api/twins/guest/:id/preferences
 * @desc Update guest preferences
 * @access Public
 */
router.put('/:id/preferences', guestTwinController.updatePreferences.bind(guestTwinController));

/**
 * @route POST /api/twins/guest/:id/stay-history
 * @desc Add stay history
 * @access Public
 */
router.post('/:id/stay-history', guestTwinController.addStayHistory.bind(guestTwinController));

/**
 * @route PUT /api/twins/guest/:id/sentiment
 * @desc Update sentiment
 * @access Public
 */
router.put('/:id/sentiment', guestTwinController.updateSentiment.bind(guestTwinController));

/**
 * @route PUT /api/twins/guest/:id/loyalty
 * @desc Update loyalty
 * @access Public
 */
router.put('/:id/loyalty', guestTwinController.updateLoyalty.bind(guestTwinController));

/**
 * @route POST /api/twins/guest/:id/tags
 * @desc Add tags
 * @access Public
 */
router.post('/:id/tags', guestTwinController.addTags.bind(guestTwinController));

/**
 * @route DELETE /api/twins/guest/:id
 * @desc Archive guest twin
 * @access Public
 */
router.delete('/:id', guestTwinController.archive.bind(guestTwinController));

export default router;
