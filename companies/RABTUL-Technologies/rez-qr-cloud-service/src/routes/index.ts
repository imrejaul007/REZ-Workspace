import { Router, Request, Response } from 'express';
import { qrCloudService } from '../services/qrCloudService';
import { authMiddleware, rateLimitMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Health check (no auth)
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'qr-cloud',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Resolve QR from scan (public)
router.get('/resolve/:code', async (req: Request, res: Response) => {
  try {
    const result = await qrCloudService.resolveQR(req.params.code);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Get public menu (public)
router.get('/public/menu/:merchantId', async (req: Request, res: Response) => {
  try {
    const menu = await qrCloudService.getMenu(req.params.merchantId);
    res.json({ success: true, data: menu });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// ============================================
// MERCHANT ROUTES (Auth required)
// ============================================

router.use(rateLimitMiddleware());

// Create merchant (public - for signup)
router.post('/merchants', async (req: Request, res: Response) => {
  try {
    const { name, slug, type, phone, email, address } = req.body;

    if (!name || !slug || !type || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, slug, type, phone'
      });
    }

    const merchant = await qrCloudService.createMerchant({ name, slug, type, phone, email, address });
    res.status(201).json({
      success: true,
      data: {
        id: merchant._id,
        name: merchant.name,
        slug: merchant.slug,
        apiKey: merchant.apiKey, // Only returned on creation
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get merchant profile (auth required)
router.get('/merchants/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchant = await qrCloudService.getMerchant(req.merchant._id.toString());
    res.json({ success: true, data: merchant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update merchant (auth required)
router.patch('/merchants/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchant = await qrCloudService.updateMerchant(req.merchant._id.toString(), req.body);
    res.json({ success: true, data: merchant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// QR CODE ROUTES
// ============================================

// Create QR code
router.post('/qr', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, name, targetId, metadata } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, name'
      });
    }

    const qr = await qrCloudService.createQR(req.merchant._id.toString(), {
      type,
      name,
      targetId,
      metadata
    });

    res.status(201).json({ success: true, data: qr });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get QR codes
router.get('/qr', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const qrCodes = await qrCloudService.listQRCodes(req.merchant._id.toString());
    res.json({ success: true, data: qrCodes, count: qrCodes.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get QR by ID
router.get('/qr/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const qr = await qrCloudService.getQR(req.params.id);
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR not found' });
    }
    res.json({ success: true, data: qr });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download QR as PNG
router.get('/qr/:id/download', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const qr = await qrCloudService.getQR(req.params.id);
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR not found' });
    }

    if (qr.qrCodeDataUrl) {
      const base64Data = qr.qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${qr.name.replace(/\s+/g, '-')}-qr.png"`);
      res.send(buffer);
    } else {
      res.status(404).json({ success: false, error: 'QR image not found' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Print QR (returns HTML for printing)
router.get('/qr/:id/print', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const qr = await qrCloudService.getQR(req.params.id);
    if (!qr) {
      return res.status(404).json({ success: false, error: 'QR not found' });
    }

    const merchant = await qrCloudService.getMerchant(qr.merchantId.toString());

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Print QR - ${qr.name}</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
    .qr-container { border: 2px dashed #ccc; padding: 40px; display: inline-block; }
    .qr-code { margin-bottom: 20px; }
    .merchant-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .qr-name { font-size: 18px; color: #666; margin-bottom: 10px; }
    .instructions { font-size: 14px; color: #999; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="qr-container">
    <div class="merchant-name">${merchant?.name || 'Restaurant'}</div>
    <div class="qr-name">${qr.name}</div>
    <div class="qr-code">
      <img src="${qr.qrCodeDataUrl || ''}" width="300" height="300" alt="QR Code">
    </div>
    <div class="instructions">Scan to view menu and place order</div>
  </div>
  <br><br>
  <button class="no-print" onclick="window.print()">Print</button>
</body>
</html>
    `);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle QR active status
router.patch('/qr/:id/toggle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isActive } = req.body;
    const qr = await qrCloudService.toggleQR(req.params.id, isActive);
    res.json({ success: true, data: qr });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete QR code
router.delete('/qr/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await qrCloudService.deleteQR(req.params.id);
    res.json({ success: true, message: 'QR code deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================
// MENU ROUTES
// ============================================

// Get menu
router.get('/menu', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const menu = await qrCloudService.getMenu(req.merchant._id.toString());
    res.json({ success: true, data: menu });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create category
router.post('/categories', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, image } = req.body;
    const category = await qrCloudService.createCategory(req.merchant._id.toString(), {
      name,
      description,
      image
    });
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create menu item
router.post('/items', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { categoryId, name, price, description, image, isVeg, isBestseller, preparationTime, allergens } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: categoryId, name, price'
      });
    }

    const item = await qrCloudService.createMenuItem(req.merchant._id.toString(), {
      categoryId,
      name,
      price,
      description,
      image,
      isVeg,
      isBestseller,
      preparationTime,
      allergens,
      isAvailable: true,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update menu item
router.patch('/items/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await qrCloudService.updateMenuItem(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete menu item
router.delete('/items/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await qrCloudService.deleteMenuItem(req.params.id);
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================
// ORDER ROUTES
// ============================================

// Create order (public - customer facing)
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { merchantId, customerPhone, customerName, type, tableNumber, qrId, items, deliveryAddress } = req.body;

    if (!merchantId || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: merchantId, customerPhone, items'
      });
    }

    const order = await qrCloudService.createOrder(merchantId, {
      customerPhone,
      customerName,
      type,
      tableNumber,
      qrId,
      items,
      deliveryAddress
    });

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get orders (auth required)
router.get('/orders', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const orders = await qrCloudService.listOrders(req.merchant._id.toString(), status as any);
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get order by ID (auth required)
router.get('/orders/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await qrCloudService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status (auth required)
router.patch('/orders/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const order = await qrCloudService.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Initiate payment
router.post('/orders/:id/payment', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = await qrCloudService.initiatePayment(req.params.id);
    res.json({ success: true, data: payment });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get UPI QR code for payment
router.get('/orders/:id/upi-qr', async (req: Request, res: Response) => {
  try {
    const order = await qrCloudService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const upiQrCode = await qrCloudService.getUPIQrCode(order);
    res.json({ success: true, data: { upiQrCode, amount: order.total } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify payment
router.post('/orders/:id/verify', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, signature } = req.body;
    const verified = await qrCloudService.verifyPayment(req.params.id, paymentId, signature);
    res.json({ success: verified });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================
// OFFERS ROUTES
// ============================================

// Create offer
router.post('/offers', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offerService } = await import('../services/offerService');
    const offer = await offerService.createOffer(req.merchant._id.toString(), req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get offers
router.get('/offers', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { offerService } = await import('../services/offerService');
    const offers = await offerService.getOffers(req.merchant._id.toString());
    res.json({ success: true, data: offers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active offers (public)
router.get('/public/offers/:merchantId', async (req: Request, res: Response) => {
  try {
    const { offerService } = await import('../services/offerService');
    const offers = await offerService.getActiveOffers(req.params.merchantId);
    res.json({ success: true, data: offers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply offer
router.post('/orders/:orderId/apply-offer', async (req: Request, res: Response) => {
  try {
    const { offerId } = req.body;
    const { offerService } = await import('../services/offerService');
    const order = await qrCloudService.getOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const result = await offerService.applyOffer(offerId, order.subtotal);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get merchant analytics (auth required)
router.get('/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await qrCloudService.getAnalytics(req.merchant._id.toString());
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get QR analytics (auth required)
router.get('/qr/:id/analytics', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await qrCloudService.getQRAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scan events (auth required)
router.get('/scans', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;

    const events = await qrCloudService.getScanEvents(req.merchant._id.toString(), fromDate, toDate);
    res.json({ success: true, data: events, count: events.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
