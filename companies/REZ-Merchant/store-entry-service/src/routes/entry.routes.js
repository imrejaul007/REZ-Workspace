/**
 * Store Entry Routes
 */

const express = require('express');
const router = express.Router();
const entryService = require('../services/entry.service');

/**
 * POST /api/entry/scan
 * Record QR scan entry
 */
router.post('/scan', async (req, res) => {
  try {
    const result = await entryService.recordEntry(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/entry/:sessionId/exit
 * Record store exit
 */
router.post('/:sessionId/exit', async (req, res) => {
  try {
    const session = await entryService.recordExit(req.params.sessionId, req.body);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/entry/session/:customerId
 * Get active session
 */
router.get('/session/:customerId', async (req, res) => {
  try {
    const session = await entryService.getActiveSession(req.params.customerId);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/entry/:sessionId/product
 * Track product view
 */
router.post('/:sessionId/product', async (req, res) => {
  try {
    const session = await entryService.trackProductView(req.params.sessionId, req.body);
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/entry/analytics/:storeId
 * Get store analytics
 */
router.get('/analytics/:storeId', async (req, res) => {
  try {
    const { date } = req.query;
    const analytics = await entryService.getStoreAnalytics(
      req.params.storeId,
      date ? new Date(date) : new Date()
    );
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
