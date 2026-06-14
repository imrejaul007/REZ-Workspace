import { Router, Request, Response } from 'express';
import { syncService } from '../services/syncService';
import { serviceAuth, posOnly, inventoryOnly, AuthenticatedRequest } from '../middleware/auth';
import { Sale, Return, PurchaseOrder, LowStockAlert } from '../types';

const router = Router();

// Apply service authentication to all webhook routes
router.use(serviceAuth);

/**
 * POST /webhooks/pos/sale
 * Called when a sale is completed in the POS
 */
router.post('/pos/sale', posOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sale: Sale = req.body;

    // Validate required fields
    if (!sale._id || !sale.storeId || !Array.isArray(sale.items) || sale.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid sale payload: missing required fields (_id, storeId, items)',
      });
      return;
    }

    // Validate each item
    for (const item of sale.items) {
      if (!item.sku || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({
          success: false,
          error: `Invalid sale item: SKU and positive quantity required`,
        });
        return;
      }
    }

    console.log(`[Webhook] Received sale completed event: ${sale._id}`);

    // Process the sale sync
    await syncService.onSaleCompleted(sale);

    res.status(200).json({
      success: true,
      message: 'Sale synced to inventory',
      saleId: sale._id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Sale sync failed: ${errorMsg}`);

    // Return 200 to acknowledge receipt even on processing failure
    // The sync service records errors internally
    res.status(200).json({
      success: false,
      error: errorMsg,
      retry: true,
    });
  }
});

/**
 * POST /webhooks/pos/return
 * Called when a return is completed in the POS
 */
router.post('/pos/return', posOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const returnData: Return = req.body;

    // Validate required fields
    if (!returnData._id || !returnData.storeId || !returnData.sku || !returnData.quantity) {
      res.status(400).json({
        success: false,
        error: 'Invalid return payload: missing required fields (_id, storeId, sku, quantity)',
      });
      return;
    }

    if (returnData.quantity <= 0) {
      res.status(400).json({
        success: false,
        error: 'Return quantity must be positive',
      });
      return;
    }

    console.log(`[Webhook] Received return completed event: ${returnData._id}`);

    // Process the return sync
    await syncService.onReturnCompleted(returnData);

    res.status(200).json({
      success: true,
      message: 'Return synced to inventory',
      returnId: returnData._id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Return sync failed: ${errorMsg}`);

    res.status(200).json({
      success: false,
      error: errorMsg,
      retry: true,
    });
  }
});

/**
 * POST /webhooks/inventory/received
 * Called when new inventory is received (purchase order fulfilled)
 */
router.post('/inventory/received', inventoryOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const order: PurchaseOrder = req.body;

    // Validate required fields
    if (!order._id || !order.storeId || !Array.isArray(order.items) || order.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid purchase order payload: missing required fields',
      });
      return;
    }

    // Validate each item
    for (const item of order.items) {
      if (!item.sku || typeof item.quantity !== 'number' || item.quantity <= 0) {
        res.status(400).json({
          success: false,
          error: `Invalid order item: SKU and positive quantity required`,
        });
        return;
      }
    }

    console.log(`[Webhook] Received inventory received event: ${order._id}`);

    // Process the inventory received sync
    await syncService.onInventoryReceived(order);

    res.status(200).json({
      success: true,
      message: 'Inventory synced to POS',
      orderId: order._id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Inventory received sync failed: ${errorMsg}`);

    res.status(200).json({
      success: false,
      error: errorMsg,
      retry: true,
    });
  }
});

/**
 * POST /webhooks/inventory/alert
 * Called when inventory falls below reorder point
 */
router.post('/inventory/alert', inventoryOnly, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const alert: LowStockAlert = req.body;

    // Validate required fields
    if (!alert._id || !alert.storeId || !alert.sku || alert.currentStock === undefined) {
      res.status(400).json({
        success: false,
        error: 'Invalid alert payload: missing required fields',
      });
      return;
    }

    console.log(`[Webhook] Received low stock alert: ${alert.sku} in store ${alert.storeId}`);

    // Process the low stock alert
    await syncService.onLowStockAlert(alert);

    res.status(200).json({
      success: true,
      message: 'Low stock alert sent to POS',
      alertId: alert._id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Low stock alert failed: ${errorMsg}`);

    // Low stock alerts are non-critical, always return success
    res.status(200).json({
      success: true,
      message: 'Alert processed (may have had notification issues)',
    });
  }
});

/**
 * Health check for webhooks endpoint
 */
router.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    service: 'webhooks',
    timestamp: new Date().toISOString(),
  });
});

export default router;
