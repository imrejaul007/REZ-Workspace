import { Router, Request, Response } from 'express';
import { Sale, ISale } from '../models/SaleItem';
import { calculateBill } from '../services/billingService';
import { generateInvoiceNumber, generateReceiptNumber } from '../services/invoiceService';

const router = Router();

interface CreateSaleRequest {
  merchantId: string;
  storeId: string;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    hsnCode: string;
    taxRate: number;
  }>;
  paymentMethod: 'cash' | 'upi' | 'card' | 'wallet' | 'mixed';
  customerId?: string;
  gstin?: string;
  useIGST?: boolean;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      merchantId,
      storeId,
      items,
      paymentMethod,
      customerId,
      gstin,
      useIGST = false
    }: CreateSaleRequest = req.body;

    if (!merchantId || !storeId || !items || items.length === 0 || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: merchantId, storeId, items, paymentMethod'
      });
    }

    for (const item of items) {
      if (!item.productId || !item.sku || !item.name || !item.quantity ||
          !item.unitPrice || !item.hsnCode || item.taxRate === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have: productId, sku, name, quantity, unitPrice, hsnCode, taxRate'
        });
      }
    }

    const saleItems = items.map(item => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      hsnCode: item.hsnCode,
      taxRate: item.taxRate,
      taxAmount: 0,
      total: 0
    }));

    const billCalculation = calculateBill(saleItems, 0, useIGST);

    const receiptNumber = generateReceiptNumber(merchantId, storeId);
    const invoiceNumber = generateInvoiceNumber(merchantId, storeId);

    const sale = new Sale({
      merchantId,
      storeId,
      items: billCalculation.items,
      subtotal: billCalculation.subtotal,
      tax: billCalculation.tax,
      discount: billCalculation.totalDiscount,
      total: billCalculation.total,
      paymentMethod,
      paymentStatus: 'pending',
      customerId,
      receiptNumber,
      invoiceNumber,
      gstin
    });

    await sale.save();

    return res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create sale',
      details: error.message
    });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      merchantId,
      storeId,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '20'
    } = req.query;

    const query: unknown = {};

    if (merchantId) query.merchantId = merchantId;
    if (storeId) query.storeId = storeId;
    if (status) query.paymentStatus = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Sale.countDocuments(query)
    ]);

    return res.json({
      success: true,
      data: sales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error listing sales:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list sales',
      details: error.message
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id).lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    return res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error getting sale:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get sale',
      details: error.message
    });
  }
});

interface PayRequest {
  amount?: number;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'wallet' | 'mixed';
}

router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod }: PayRequest = req.body;

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    if (sale.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Sale already paid'
      });
    }

    if (sale.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        error: 'Cannot pay for refunded sale'
      });
    }

    if (sale.voidedAt) {
      return res.status(400).json({
        success: false,
        error: 'Cannot pay for voided sale'
      });
    }

    const paymentAmount = amount || sale.total;

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount must be greater than 0'
      });
    }

    if (paymentAmount < sale.total) {
      sale.paymentStatus = 'partial';
    } else {
      sale.paymentStatus = 'paid';
    }

    if (paymentMethod) {
      sale.paymentMethod = paymentMethod;
    }

    await sale.save();

    return res.json({
      success: true,
      data: sale,
      payment: {
        amount: paymentAmount,
        status: sale.paymentStatus,
        method: sale.paymentMethod
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      details: error.message
    });
  }
});

interface VoidRequest {
  reason: string;
}

router.post('/:id/void', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason }: VoidRequest = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Void reason is required'
      });
    }

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    if (sale.voidedAt) {
      return res.status(400).json({
        success: false,
        error: 'Sale already voided'
      });
    }

    if (sale.paymentStatus === 'refunded') {
      return res.status(400).json({
        success: false,
        error: 'Cannot void refunded sale'
      });
    }

    sale.voidedAt = new Date();
    sale.voidReason = reason;
    sale.paymentStatus = sale.paymentStatus === 'paid' ? 'refunded' : sale.paymentStatus;

    await sale.save();

    return res.json({
      success: true,
      data: sale,
      message: 'Sale voided successfully'
    });
  } catch (error) {
    console.error('Error voiding sale:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to void sale',
      details: error.message
    });
  }
});

interface ReturnRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  reason?: string;
}

router.post('/:id/return', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items: returnItems, reason }: ReturnRequest = req.body;

    if (!returnItems || returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Return items are required'
      });
    }

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    if (sale.paymentStatus === 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot return unpaid sale'
      });
    }

    if (sale.voidedAt) {
      return res.status(400).json({
        success: false,
        error: 'Cannot return voided sale'
      });
    }

    let totalReturnAmount = 0;
    const updatedItems = [...sale.items];

    for (const returnItem of returnItems) {
      const itemIndex = updatedItems.findIndex(
        item => item.productId === returnItem.productId
      );

      if (itemIndex === -1) {
        return res.status(400).json({
          success: false,
          error: `Product ${returnItem.productId} not found in sale`
        });
      }

      const item = updatedItems[itemIndex];
      const alreadyReturned = item.returnedQuantity || 0;
      const maxReturnable = item.quantity - alreadyReturned;

      if (returnItem.quantity > maxReturnable) {
        return res.status(400).json({
          success: false,
          error: `Cannot return ${returnItem.quantity} of ${item.name}, max ${maxReturnable} available`
        });
      }

      item.returnedQuantity = (item.returnedQuantity || 0) + returnItem.quantity;
      totalReturnAmount += item.unitPrice * returnItem.quantity;
    }

    sale.items = updatedItems;
    sale.paymentStatus = 'refunded';

    await sale.save();

    return res.json({
      success: true,
      data: sale,
      return: {
        items: returnItems,
        reason,
        totalAmount: totalReturnAmount,
        newStatus: sale.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error processing return:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process return',
      details: error.message
    });
  }
});

export default router;
