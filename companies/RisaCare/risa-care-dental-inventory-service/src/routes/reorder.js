/**
 * Reorder Routes
 */

const express = require('express');
const router = express.Router();
const { InventoryItem, Order } = require('../models/inventory');
const { triggerAutoReorder } = require('../services/nexha-integration');

/**
 * Get reorder history
 * GET /api/reorder/:clinicId
 */
router.get('/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const orders = await Order.find({ clinicId }).sort({ orderDate: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger manual reorder
 * POST /api/reorder/:clinicId/:sku
 */
router.post('/:clinicId/:sku', async (req, res) => {
  try {
    const { clinicId, sku } = req.params;
    const item = await InventoryItem.findOne({ clinicId, sku });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = await triggerAutoReorder(item);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel order
 * DELETE /api/reorder/:orderId
 */
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'cancelled' },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
