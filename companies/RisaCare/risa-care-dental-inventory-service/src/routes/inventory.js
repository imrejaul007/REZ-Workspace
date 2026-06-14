/**
 * Inventory Routes
 */

const express = require('express');
const router = express.Router();
const { InventoryItem, Order, DENTAL_SUPPLIES } = require('../models/inventory');
const nexhaIntegration = require('../services/nexha-integration');

/**
 * Initialize dental supplies catalog
 * POST /api/inventory/init
 */
router.post('/init', async (req, res) => {
  try {
    const { clinicId } = req.body;

    for (const supply of DENTAL_SUPPLIES) {
      await InventoryItem.findOneAndUpdate(
        { clinicId, sku: supply.sku },
        {
          clinicId,
          ...supply,
          currentStock: Math.floor(Math.random() * 100) + 20,
          reorderPoint: Math.floor(Math.random() * 20) + 5
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, message: `Initialized ${DENTAL_SUPPLIES.length} dental supplies` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all inventory for clinic
 * GET /api/inventory/:clinicId
 */
router.get('/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { category, lowStock } = req.query;

    let query = { clinicId };
    if (category) query.category = category;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$reorderPoint'] };
    }

    const items = await InventoryItem.find(query);
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update stock level
 * PUT /api/inventory/:clinicId/:sku
 */
router.put('/:clinicId/:sku', async (req, res) => {
  try {
    const { clinicId, sku } = req.params;
    const { currentStock, operation } = req.body;

    const item = await InventoryItem.findOne({ clinicId, sku });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (operation === 'add') {
      item.currentStock += currentStock;
    } else if (operation === 'remove') {
      item.currentStock = Math.max(0, item.currentStock - currentStock);
    } else {
      item.currentStock = currentStock;
    }

    // Check if reorder needed
    if (item.currentStock <= item.reorderPoint && item.autoReorder.enabled) {
      await triggerAutoReorder(item);
    }

    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get low stock items
 * GET /api/inventory/:clinicId/low-stock
 */
router.get('/:clinicId/low-stock', async (req, res) => {
  try {
    const { clinicId } = req.params;

    const items = await InventoryItem.find({
      clinicId,
      $expr: { $lte: ['$currentStock', '$reorderPoint'] }
    });

    res.json({ success: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get catalog
 * GET /api/inventory/catalog
 */
router.get('/catalog', (req, res) => {
  res.json({ success: true, catalog: DENTAL_SUPPLIES });
});

module.exports = router;
