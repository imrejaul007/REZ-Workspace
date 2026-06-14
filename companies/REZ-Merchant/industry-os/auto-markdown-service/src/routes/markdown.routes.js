/**
 * Auto Markdown Routes
 * FreshMart 3PM Story: Spoilage Prevention
 */

const express = require('express');
const router = express.Router();
const markdownService = require('../services/markdown.service');

/**
 * GET /api/markdown/dashboard/:storeId
 * Get spoilage dashboard for store
 */
router.get('/dashboard/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const dashboard = await markdownService.getDashboardSummary(storeId);
    res.json({ success: true, storeId, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/markdown/scan/:storeId
 * Scan inventory for expiring items
 */
router.post('/scan/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { hoursThreshold = 72, categories } = req.body;

    const items = await markdownService.scanForExpiringItems(storeId, { hoursThreshold, categories });

    res.json({
      success: true,
      storeId,
      scanned: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/markdown/expiring
 * Add expiring item for tracking
 * Body: { storeId, sku, name, category, quantity, price, expiryDate }
 */
router.post('/expiring', async (req, res) => {
  try {
    const { storeId, ...item } = req.body;
    const result = await markdownService.createExpiringItem(storeId, item);

    res.json({
      success: true,
      item: result.item,
      markdown: result.markdown,
      recommendation: result.recommendation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/markdown/approve/:itemId
 * Approve markdown for item
 */
router.post('/approve/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const result = await markdownService.approveMarkdown(itemId);

    res.json({
      success: true,
      message: 'Markdown approved',
      campaignId: result.campaign._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/markdown/campaign/:campaignId/launch
 * Launch AdBazaar campaign for markdown
 */
router.post('/campaign/:campaignId/launch', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await markdownService.launchAdBazaarCampaign(campaignId);

    res.json({
      success: true,
      message: 'Campaign launched',
      adbazaarCampaignId: result.adbazaarCampaignId,
      notifications: result.notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/markdown/campaign/:campaignId
 * Get campaign details
 */
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const { MarkdownCampaign } = require('../models/markdown.model');
    const campaign = await MarkdownCampaign.findById(req.params.campaignId);
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/markdown/expiring/:storeId
 * Get all expiring items for store
 */
router.get('/expiring/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { risk, category, status } = req.query;
    const { ExpiringItem } = require('../models/markdown.model');

    const filter = { store_id: storeId };
    if (risk) filter.expiry_risk = risk;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const items = await ExpiringItem.find(filter).sort({ expiry_date: 1 });

    res.json({
      success: true,
      storeId,
      items,
      summary: {
        total: items.length,
        critical: items.filter(i => i.expiry_risk === 'critical').length,
        valueAtRisk: items.reduce((sum, i) => sum + i.value_at_risk, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
