/**
 * REZ Merchant API
 * Port: 4100
 */

import express, { Request, Response } from 'express';
import { rezMerchantHub } from './hub-client';

const app = express();
app.use(express.json());
const PORT = parseInt(process.env.PORT || '4100', 10);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'REZ-Merchant', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    await rezMerchantHub.getWalletBalance('health-check');
    res.json({ status: 'ready', unifiedHub: true });
  } catch {
    res.json({ status: 'ready', unifiedHub: false });
  }
});

// Merchant Auth
app.post('/api/merchants/auth', async (req: Request, res: Response) => {
  try {
    const { phone, business_name } = req.body;
    const result = await rezMerchantHub.authenticateMerchant(phone, business_name);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Merchant Profile
app.get('/api/merchants/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const twin = await rezMerchantHub.getMerchantTwin(merchantId);
    const insights = await rezMerchantHub.getSalesInsights(merchantId);
    res.json({ success: true, data: { twin, insights } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POS Orders
app.post('/api/pos/orders', async (req: Request, res: Response) => {
  try {
    const order = await rezMerchantHub.createPOSOrder(req.body);
    await rezMerchantHub.trackEvent(req.body.merchant_id, 'pos.order', order);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// KDS Display
app.get('/api/kds/:kitchenId', async (req: Request, res: Response) => {
  try {
    const display = await rezMerchantHub.getKitchenDisplay(req.params.kitchenId);
    res.json({ success: true, data: display });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.patch('/api/kds/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await rezMerchantHub.updateKDSOrder(req.params.orderId, req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// QR Cloud
app.get('/api/qr/menus/:restaurantId', async (req: Request, res: Response) => {
  try {
    const menu = await rezMerchantHub.getQRMenu(req.params.restaurantId);
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/qr/menus', async (req: Request, res: Response) => {
  try {
    const menu = await rezMerchantHub.createQRMenu(req.body);
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Inventory Recommendations
app.get('/api/merchants/:merchantId/inventory/recommendations', async (req: Request, res: Response) => {
  try {
    const recommendations = await rezMerchantHub.getInventoryRecommendations(req.params.merchantId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// AI Assistant
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { merchant_id, message } = req.body;
    const response = await rezMerchantHub.chatWithAssistant(merchant_id, message);
    await rezMerchantHub.storeMerchantMemory(merchant_id, `Chat: ${message}`);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Wallet
app.get('/api/merchants/:merchantId/wallet', async (req: Request, res: Response) => {
  try {
    const balance = await rezMerchantHub.getWalletBalance(req.params.merchantId);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🏪 REZ MERCHANT (${PORT}) - Running ✅`);
  console.log(`Unified Hub: ${process.env.UNIFIED_HUB_URL || 'http://localhost:4600'}`);
});

export { app };
export default app;