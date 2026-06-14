/**
 * Customer Preferences Routes
 */

const express = require('express');
const router = express.Router();
const preferencesService = require('../services/preferences.service');

/**
 * GET /api/preferences/:customerId
 * Get all preferences
 */
router.get('/:customerId', async (req, res) => {
  try {
    const prefs = await preferencesService.getAllPreferences(req.params.customerId);
    res.json({ success: true, preferences: prefs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/preferences/:customerId/dietary
 * Update dietary preferences
 */
router.put('/:customerId/dietary', async (req, res) => {
  try {
    const prefs = await preferencesService.updateDietaryPreferences(req.params.customerId, req.body);
    res.json({ success: true, dietary: prefs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/preferences/:customerId/family
 * Update family profile
 */
router.put('/:customerId/family', async (req, res) => {
  try {
    const profile = await preferencesService.updateFamilyProfile(req.params.customerId, req.body);
    res.json({ success: true, family: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/preferences/:customerId/baby/purchase
 * Record baby product purchase
 */
router.post('/:customerId/baby/purchase', async (req, res) => {
  try {
    const history = await preferencesService.recordBabyPurchase(req.params.customerId, req.body);
    res.json({ success: true, baby: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/preferences/:customerId/baby/recommendations
 * Get baby product recommendations
 */
router.get('/:customerId/baby/recommendations', async (req, res) => {
  try {
    const recommendations = await preferencesService.getBabyRecommendations(req.params.customerId);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/preferences/:customerId/dietary/restrictions
 * Check dietary restrictions
 */
router.get('/:customerId/dietary/restrictions', async (req, res) => {
  try {
    const restrictions = await preferencesService.hasDietaryRestrictions(req.params.customerId);
    res.json({ success: true, ...restrictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/preferences/:customerId/segment
 * Get customer segment
 */
router.get('/:customerId/segment', async (req, res) => {
  try {
    const segments = await preferencesService.getCustomerSegment(req.params.customerId);
    res.json({ success: true, segments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
