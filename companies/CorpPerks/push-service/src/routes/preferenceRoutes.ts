import { Router } from 'express';
import { preferenceController } from '../controllers';

const router = Router();

/**
 * GET /api/notifications/preferences
 * Get user preferences
 */
router.get('/', preferenceController.getPreferences);

/**
 * POST /api/notifications/preferences
 * Get or create user preferences
 */
router.post('/', preferenceController.getOrCreatePreferences);

/**
 * PATCH /api/notifications/preferences
 * Update user preferences
 */
router.patch('/', preferenceController.updatePreferences);

/**
 * PATCH /api/notifications/preferences/channel
 * Toggle notification channel
 */
router.patch('/channel', preferenceController.toggleChannel);

/**
 * PATCH /api/notifications/preferences/type
 * Toggle notification type
 */
router.patch('/type', preferenceController.toggleType);

/**
 * PATCH /api/notifications/preferences/quiet-hours
 * Set quiet hours
 */
router.patch('/quiet-hours', preferenceController.setQuietHours);

/**
 * POST /api/notifications/preferences/device
 * Register device token
 */
router.post('/device', preferenceController.registerDevice);

/**
 * DELETE /api/notifications/preferences/device
 * Unregister device token
 */
router.delete('/device', preferenceController.unregisterDevice);

/**
 * POST /api/notifications/preferences/dnd
 * Set do not disturb
 */
router.post('/dnd', preferenceController.setDoNotDisturb);

/**
 * POST /api/notifications/preferences/reset
 * Reset preferences to defaults
 */
router.post('/reset', preferenceController.resetPreferences);

export default router;
