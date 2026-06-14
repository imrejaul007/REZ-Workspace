import { Router, Request, Response } from 'express';
import { Sale } from '../models/SaleItem';
import { generateReceiptData, printReceipt, ReceiptData } from '../services/billingService';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    let sale;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      sale = await Sale.findById(id).lean();
    } else {
      sale = await Sale.findOne({ receiptNumber: id }).lean();
    }

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    if (sale.voidedAt) {
      return res.status(400).json({
        success: false,
        error: 'This receipt has been voided',
        voidedAt: sale.voidedAt,
        voidReason: sale.voidReason
      });
    }

    const receiptData = generateReceiptData(sale);

    if (format === 'text') {
      const receiptText = printReceipt(receiptData);
      res.type('text/plain');
      return res.send(receiptText);
    }

    return res.json({
      success: true,
      data: receiptData
    });
  } catch (error) {
    console.error('Error getting receipt:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get receipt',
      details: error.message
    });
  }
});

router.get('/:id/invoice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    let sale;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      sale = await Sale.findById(id);
    } else {
      sale = await Sale.findOne({ invoiceNumber: id });
    }

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const { createGSTInvoice, formatInvoiceForPrint } = await import('../services/invoiceService');

    const invoiceData = createGSTInvoice(sale);

    if (format === 'text') {
      const invoiceText = formatInvoiceForPrint(invoiceData);
      res.type('text/plain');
      return res.send(invoiceText);
    }

    return res.json({
      success: true,
      data: invoiceData
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get invoice',
      details: error.message
    });
  }
});

router.get('/sale/:saleId', async (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;
    const { type = 'receipt' } = req.query;

    const sale = await Sale.findById(saleId).lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    if (type === 'invoice') {
      const { createGSTInvoice } = await import('../services/invoiceService');
      const invoiceData = createGSTInvoice(sale);

      return res.json({
        success: true,
        data: invoiceData
      });
    }

    const receiptData = generateReceiptData(sale);

    return res.json({
      success: true,
      data: receiptData
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get document',
      details: error.message
    });
  }
});

export default router;
