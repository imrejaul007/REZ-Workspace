/**
 * ReZ Recover - Complete Shopify App
 * Cart Recovery Service
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { CartRecovery } from '../models/CartRecovery';

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  HOST,
  MONGODB_URI,
  APP_URL = `https://${HOST}`,
} = process.env;

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Session store
const sessions = new Map<string, { shop: string; accessToken: string }>();

// ─── MongoDB ───────────────────────────────────────────────────────────────

async function connectDB() {
  await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/rez_recover');
  console.log('Connected to MongoDB');
}

// ─── Shopify Auth ─────────────────────────────────────────────────────────

function getShopifyAuthUrl(shop: string, state: string): string {
  const scopes = 'read_orders,write_orders,read_checkouts,write_checkouts,read_customers';
  const redirectUri = `${APP_URL}/auth/callback`;
  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
}

function verifyHmac(params: Record<string, string>, hmac: string): boolean {
  const message = Object.keys(params)
    .filter(k => k !== 'hmac')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const generated = crypto.createHmac('sha256', SHOPIFY_API_SECRET!).update(message).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(hmac));
}

// ─── Auth Routes ─────────────────────────────────────────────────────────

app.get('/auth', (req: Request, res: Response) => {
  const { shop } = req.query as { shop?: string };
  if (!shop) {
    res.status(400).json({ error: 'Shop required' });
    return;
  }
  const state = uuidv4();
  res.cookie('oauth_state', state, { httpOnly: true, secure: true });
  res.redirect(getShopifyAuthUrl(shop, state));
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, hmac, shop, state } = req.query as Record<string, string>;

  if (state !== req.cookies?.oauth_state) {
    res.status(400).json({ error: 'Invalid state' });
    return;
  }

  if (!verifyHmac({ code, shop, state }, hmac)) {
    res.status(400).json({ error: 'Invalid HMAC' });
    return;
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token: string };
    sessions.set(shop, { shop, accessToken: tokenData.access_token });
    res.clearCookie('oauth_state');
    res.redirect(`/app/${shop}/dashboard`);
  } catch (error) {
    res.redirect('/auth?error=failed');
  }
});

// ─── Embedded App ─────────────────────────────────────────────────────────

app.get('/app/:shop/dashboard', (req: Request, res: Response) => {
  const { shop } = req.params;
  res.send(`<!DOCTYPE html><html><head><title>ReZ Recover</title></head><body>
    <h1>ReZ Recover Dashboard</h1>
    <p>Shop: ${shop}</p>
    <p>Coming soon...</p>
  </body></html>`);
});

// ─── API Routes ───────────────────────────────────────────────────────────

// Track abandoned cart
app.post('/api/recover/track', async (req: Request, res: Response) => {
  const { cartId, shop, customerId, customerEmail, customerPhone, cartValue, cartItems } = req.body;

  try {
    let recovery = await CartRecovery.findOne({ cartId });

    if (recovery) {
      recovery.cartValue = cartValue || recovery.cartValue;
      recovery.cartItems = cartItems || recovery.cartItems;
      recovery.customerEmail = customerEmail;
      recovery.customerPhone = customerPhone;
      await recovery.save();
    } else {
      recovery = await CartRecovery.create({
        cartId,
        shop: shop.toLowerCase(),
        customerId,
        customerEmail,
        customerPhone,
        cartValue: cartValue || 0,
        cartItems: cartItems || [],
        status: 'abandoned',
      });
    }

    // Schedule recovery sequence
    scheduleRecovery(recovery);

    res.json({ success: true, recoveryId: recovery._id });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Failed to track' });
  }
});

// Get recovery stats
app.get('/api/recover/stats', async (req: Request, res: Response) => {
  const { shop } = req.query as { shop?: string };
  if (!shop) {
    res.status(400).json({ error: 'Shop required' });
    return;
  }

  try {
    const [total, recovered, converted] = await Promise.all([
      CartRecovery.countDocuments({ shop: shop.toLowerCase(), status: 'abandoned' }),
      CartRecovery.countDocuments({ shop: shop.toLowerCase(), status: 'recovered' }),
      CartRecovery.countDocuments({ shop: shop.toLowerCase(), status: 'converted' }),
    ]);

    const revenue = await CartRecovery.aggregate([
      { $match: { shop: shop.toLowerCase(), status: { $in: ['recovered', 'converted'] } } },
      { $group: { _id: null, total: { $sum: '$cartValue' } } },
    ]);

    res.json({
      totalAbandoned: total,
      recovered,
      converted,
      recoveryRate: total > 0 ? ((recovered + converted) / total * 100).toFixed(1) : 0,
      revenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get abandoned carts
app.get('/api/recover/carts', async (req: Request, res: Response) => {
  const { shop } = req.query as { shop?: string };
  if (!shop) {
    res.status(400).json({ error: 'Shop required' });
    return;
  }

  try {
    const carts = await CartRecovery.find({ shop: shop.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ carts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get carts' });
  }
});

// ─── Webhooks ────────────────────────────────────────────────────────────

app.post('/webhooks/checkouts', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  if (payload.email || payload.phone) {
    await CartRecovery.create({
      cartId: `checkout_${payload.id}`,
      shop: shop.toLowerCase(),
      customerId: payload.customer?.id?.toString(),
      customerEmail: payload.email,
      customerPhone: payload.phone,
      cartValue: parseFloat(payload.total_price || 0),
      cartItems: payload.line_items?.map((item: any) => ({
        productId: item.product_id?.toString(),
        variantId: item.variant_id?.toString(),
        title: item.title,
        price: parseFloat(item.price),
        quantity: item.quantity,
      })) || [],
      status: 'abandoned',
    });
  }

  res.status(200).send('OK');
});

app.post('/webhooks/orders', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  // Mark cart as converted
  if (payload.checkout_id) {
    await CartRecovery.findOneAndUpdate(
      { cartId: `checkout_${payload.checkout_id}` },
      { status: 'converted', recoveredAt: new Date() }
    );
  }

  res.status(200).send('OK');
});

app.post('/webhooks/app-uninstalled', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  await CartRecovery.deleteMany({ shop });
  sessions.delete(shop);
  res.status(200).send('OK');
});

// ─── Recovery Sequence ────────────────────────────────────────────────────

function scheduleRecovery(cart: any) {
  const sequences = [
    { delay: 0, channel: 'email' },
    { delay: 2 * 60 * 60 * 1000, channel: 'sms' },
    { delay: 24 * 60 * 60 * 1000, channel: 'whatsapp' },
  ];

  for (const seq of sequences) {
    setTimeout(async () => {
      try {
        // Send recovery message
        console.log(`[ReZ Recover] Sending ${seq.channel} to ${cart.customerEmail}`);
        await cart.addAttempt({
          channel: seq.channel,
          sentAt: new Date(),
          status: 'sent',
        });
      } catch (error) {
        console.error('Recovery send error:', error);
      }
    }, seq.delay);
  }
}

// ─── Health ───────────────────────────────────────────────────────────────

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-recover' });
});

// ─── Start ────────────────────────────────────────────────────────────────

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`ReZ Recover running on port ${PORT}`);
  });
}

main().catch(console.error);
