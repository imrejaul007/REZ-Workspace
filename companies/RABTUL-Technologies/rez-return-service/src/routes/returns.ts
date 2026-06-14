import { Router } from 'express';
import { Return, IReturn } from '../models/Return';

const router = Router();

// Payment service configuration
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';
const PAYMENT_SERVICE_API_KEY = process.env.PAYMENT_SERVICE_API_KEY || '';

// Create return request
router.post('/', async (req, res) => {
  try {
    const {
      merchantId,
      storeId,
      originalSaleId,
      receiptNumber,
      customerId,
      customerName,
      customerPhone,
      items,
      reason,
      reasonCategory
    } = req.body;

    // Calculate refund amount
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
    const taxRate = 0.18; // 18% GST
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const refundAmount = subtotal + taxAmount;

    const returnDoc = new Return({
      merchantId,
      storeId,
      originalSaleId,
      receiptNumber,
      customerId,
      customerName,
      customerPhone,
      items,
      reason,
      reasonCategory,
      subtotal,
      taxAmount,
      refundAmount,
      status: 'pending',
      refundStatus: 'pending'
    });

    await returnDoc.save();

    res.status(201).json({
      success: true,
      return: returnDoc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get returns for merchant
router.get('/merchant/:merchantId', async (req, res) => {
  try {
    const { status, from, to, limit = 50 } = req.query;

    const query: any = { merchantId: req.params.merchantId };

    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }

    const returns = await Return.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, returns });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single return
router.get('/:id', async (req, res) => {
  try {
    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }
    res.json({ success: true, return: returnDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get returns by receipt
router.get('/receipt/:receiptNumber', async (req, res) => {
  try {
    const returns = await Return.find({ receiptNumber: req.params.receiptNumber })
      .sort({ createdAt: -1 });
    res.json({ success: true, returns });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve return
router.put('/:id/approve', async (req, res) => {
  try {
    const { processedBy, refundMethod = 'original' } = req.body;

    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }

    // Validate refund data
    if (!returnDoc.originalSaleId) {
      return res.status(400).json({ success: false, error: 'Original sale ID is missing' });
    }

    if (returnDoc.refundAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid refund amount' });
    }

    // Initiate refund with payment service
    let refundResult: { success: boolean; refundId?: string; error?: string } | null = null;

    try {
      const refundPayload = {
        originalTransactionId: returnDoc.originalSaleId,
        amount: returnDoc.refundAmount,
        method: refundMethod,
        returnId: returnDoc._id.toString(),
        customerId: returnDoc.customerId,
        customerPhone: returnDoc.customerPhone,
        items: returnDoc.items,
        reason: returnDoc.reason,
        reasonCategory: returnDoc.reasonCategory,
        initiatedBy: processedBy,
        initiatedAt: new Date().toISOString(),
        metadata: {
          merchantId: returnDoc.merchantId,
          storeId: returnDoc.storeId,
          receiptNumber: returnDoc.receiptNumber,
        },
      };

      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'return-service',
          'X-Request-Id': `return-refund-${returnDoc._id}-${Date.now()}`,
          ...(PAYMENT_SERVICE_API_KEY && { 'Authorization': `Bearer ${PAYMENT_SERVICE_API_KEY}` }),
        },
        body: JSON.stringify(refundPayload),
      });

      refundResult = await response.json() as typeof refundResult;

      if (!response.ok) {
        throw new Error(`Payment service returned ${response.status}: ${refundResult?.error || 'Unknown error'}`);
      }

      if (!refundResult?.success) {
        throw new Error(refundResult?.error || 'Payment service indicated failure');
      }

      // Log successful refund initiation
      console.log('[Returns] Refund initiated successfully', {
        returnId: returnDoc._id,
        originalSaleId: returnDoc.originalSaleId,
        refundAmount: returnDoc.refundAmount,
        refundId: refundResult.refundId,
      });
    } catch (refundError) {
      // Log the error but don't fail the request - merchant can retry
      console.error('[Returns] Failed to initiate refund with payment service', {
        returnId: returnDoc._id,
        originalSaleId: returnDoc.originalSaleId,
        error: refundError instanceof Error ? refundError.message : String(refundError),
      });

      return res.status(502).json({
        success: false,
        error: 'Failed to initiate refund with payment service',
        details: refundError instanceof Error ? refundError.message : 'Unknown error',
        canRetry: true,
      });
    }

    // Update return status to completed
    returnDoc.status = 'completed';
    returnDoc.refundStatus = 'completed';
    returnDoc.refundMethod = refundMethod;
    returnDoc.processedBy = processedBy;
    returnDoc.processedAt = new Date();

    await returnDoc.save();

    res.json({
      success: true,
      return: returnDoc,
      refundId: refundResult?.refundId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject return
router.put('/:id/reject', async (req, res) => {
  try {
    const { rejectedBy, rejectedReason } = req.body;

    const returnDoc = await Return.findById(req.params.id);
    if (!returnDoc) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }

    returnDoc.status = 'rejected';
    returnDoc.refundStatus = 'rejected';
    returnDoc.rejectedBy = rejectedBy;
    returnDoc.rejectedReason = rejectedReason;
    returnDoc.processedAt = new Date();

    await returnDoc.save();

    res.json({ success: true, return: returnDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get return stats
router.get('/stats/:merchantId', async (req, res) => {
  try {
    const merchantId = req.params.merchantId;

    const [total, pending, approved, rejected, completed] = await Promise.all([
      Return.countDocuments({ merchantId }),
      Return.countDocuments({ merchantId, status: 'pending' }),
      Return.countDocuments({ merchantId, status: 'approved' }),
      Return.countDocuments({ merchantId, status: 'rejected' }),
      Return.countDocuments({ merchantId, status: 'completed' })
    ]);

    const totalRefund = await Return.aggregate([
      { $match: { merchantId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        completed,
        totalRefund: totalRefund[0]?.total || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
