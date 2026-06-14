import { Router, Request, Response, NextFunction } from 'express';
import { Cart, Transaction } from '../models/POS';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const router = Router();

// POST /api/checkout - Complete checkout
router.post('/checkout', async (req, res, next) => {
  try {
    const { cartId, storeId, employeeId, customerId, paymentMethod, paidAmount, paymentDetails } = req.body;

    const cart = await Cart.findById(cartId);
    if (!cart) { res.status(404).json({ success: false, error: 'Cart not found' }); return; }

    const transaction = new Transaction({
      transactionId: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
      cartId: cart._id,
      sessionId: cart.sessionId,
      customerId: customerId || cart.customerId,
      storeId,
      employeeId,
      items: cart.items,
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      discountAmount: cart.discountAmount,
      total: cart.total,
      paidAmount,
      changeAmount: paidAmount - cart.total,
      paymentMethod,
      paymentDetails: paymentDetails || [],
      loyaltyPointsEarned: Math.floor(cart.total / 100),
      loyaltyPointsRedeemed: cart.loyaltyPointsRedeemed,
      status: 'completed'
    });

    await transaction.save();
    await Cart.deleteOne({ _id: cartId });

    logger.info('Transaction completed', { transactionId: transaction.transactionId, total: transaction.total });

    res.status(201).json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        total: transaction.total,
        paidAmount: transaction.paidAmount,
        changeAmount: transaction.changeAmount,
        loyaltyPointsEarned: transaction.loyaltyPointsEarned
      }
    });
  } catch (error) { next(error); }
});

// GET /api/transactions - List transactions
router.get('/transactions', async (req, res, next) => {
  try {
    const { storeId, customerId, date } = req.query;
    const query: any = {};
    if (storeId) query.storeId = storeId;
    if (customerId) query.customerId = customerId;
    if (date) {
      const start = new Date(date as string);
      const end = new Date(date as string);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const transactions = await Transaction.find(query)
      .populate('customerId', 'name phone')
      .populate('storeId', 'name code')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: transactions });
  } catch (error) { next(error); }
});

// GET /api/transactions/:id - Get transaction
router.get('/transactions/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('storeId', 'name code')
      .populate('employeeId', 'name employeeId');

    if (!transaction) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }
    res.json({ success: true, data: transaction });
  } catch (error) { next(error); }
});

// POST /api/transactions/:id/refund - Refund
router.post('/transactions/:id/refund', async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }

    transaction.status = 'refunded';
    await transaction.save();

    logger.info('Transaction refunded', { transactionId: transaction.transactionId, amount, reason });

    res.json({ success: true, message: 'Transaction refunded', data: transaction });
  } catch (error) { next(error); }
});

export default router;