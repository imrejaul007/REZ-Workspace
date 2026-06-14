/**
 * Procurement Payment Routes
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentSchedule.service');

/**
 * POST /api/payments/schedule
 * Create scheduled payment for procurement
 */
router.post('/schedule', async (req, res) => {
  try {
    const payment = await paymentService.createScheduledPayment(req.body);
    res.json({ success: true, payment_id: payment.payment_id, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/due
 * Get payments due for execution
 */
router.get('/due', async (req, res) => {
  try {
    const payments = await paymentService.getPaymentsDue();
    res.json({ success: true, payments, count: payments.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments/:paymentId/execute
 * Execute payment
 */
router.post('/:paymentId/execute', async (req, res) => {
  try {
    const payment = await paymentService.executePayment(req.params.paymentId);
    res.json({ success: true, message: 'Payment executed', payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payments/:paymentId/delivery
 * Confirm delivery and trigger payment
 */
router.post('/:paymentId/delivery', async (req, res) => {
  try {
    const payment = await paymentService.confirmDelivery(req.params.paymentId, req.body.deliveryDate);
    res.json({ success: true, message: 'Delivery confirmed', payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/store/:storeId
 * Get store payments
 */
router.get('/store/:storeId', async (req, res) => {
  try {
    const payments = await paymentService.getStorePayments(req.params.storeId, req.query);
    res.json({ success: true, storeId: req.params.storeId, payments, count: payments.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/supplier/:supplierId
 * Get supplier payments
 */
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const payments = await paymentService.getSupplierPayments(req.params.supplierId, req.query);
    res.json({ success: true, supplierId: req.params.supplierId, payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const { ScheduledPayment } = require('../models/procurementPayment.model');
    const payment = await ScheduledPayment.findOne({ payment_id: req.params.paymentId });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/payments/:paymentId
 * Cancel payment
 */
router.delete('/:paymentId', async (req, res) => {
  try {
    const payment = await paymentService.cancelPayment(req.params.paymentId, req.body.reason);
    res.json({ success: true, message: 'Payment cancelled', payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payments/analytics/:storeId
 * Get payment analytics
 */
router.get('/analytics/:storeId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await paymentService.getAnalytics(
      req.params.storeId,
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );
    res.json({ success: true, storeId: req.params.storeId, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
