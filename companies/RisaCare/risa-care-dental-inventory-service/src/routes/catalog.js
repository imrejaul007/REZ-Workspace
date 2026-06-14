/**
 * Catalog Routes
 */

const express = require('express');
const router = express.Router();
const { DENTAL_SUPPLIES, SUPPLY_CATEGORIES } = require('../models/inventory');

/**
 * Get full catalog
 * GET /api/catalog
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    categories: SUPPLY_CATEGORIES,
    items: DENTAL_SUPPLIES
  });
});

/**
 * Get catalog by category
 * GET /api/catalog/:category
 */
router.get('/:category', (req, res) => {
  const { category } = req.params;
  const items = DENTAL_SUPPLIES.filter(s => s.category === category);
  res.json({ success: true, category, count: items.length, items });
});

module.exports = router;
