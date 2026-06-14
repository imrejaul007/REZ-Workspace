/**
 * ReZ Upsell - Complete Shopify App
 *
 * Production-ready Shopify app with OAuth, embedded frontend, and webhook support.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UpsellStore } from './models/UpsellStore';
import { UpsellEvent } from './models/UpsellEvent';

// Environment variables
const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  HOST,
  MONGODB_URI,
  SCOPES = 'read_orders,write_orders,read_products,write_products,read_customers',
  APP_URL = `https://${HOST}`,
} = process.env;

const PORT = parseInt(process.env.PORT || '3005', 10);

// ─── Initialize Express ─────────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1);

// Webhook needs raw body
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB Connection ────────────────────────────────────────────────────

async function connectDB() {
  const uri = MONGODB_URI || 'mongodb://localhost:27017/rez_upsell';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

// ─── Simple Session Store (for demo) ──────────────────────────────────────
// In production, use Redis or database session storage

const sessions = new Map<string, { shop: string; accessToken: string }>();

// ─── Shopify OAuth Helpers ─────────────────────────────────────────────────

function getShopifyAuthUrl(shop: string, state: string): string {
  const scopes = SCOPES;
  const redirectUri = `${APP_URL}/auth/callback`;

  return `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
}

function verifyShopifyHmac(params: Record<string, string>, hmac: string): boolean {
  const message = Object.keys(params)
    .filter(k => k !== 'hmac')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const generated = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET!)
    .update(message)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(hmac));
}

// ─── Auth Routes ─────────────────────────────────────────────────────────

// Start OAuth flow
app.get('/auth', async (req: Request, res: Response) => {
  const { shop } = req.query as { shop?: string };

  if (!shop) {
    res.status(400).json({ error: 'Shop parameter required' });
    return;
  }

  const state = uuidv4();
  const authUrl = getShopifyAuthUrl(shop, state);

  res.cookie('oauth_state', state, { httpOnly: true, secure: true });
  res.redirect(authUrl);
});

// OAuth callback
app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, hmac, shop, state } = req.query as Record<string, string>;

  // Verify state
  const savedState = req.cookies?.oauth_state;
  if (state !== savedState) {
    res.status(400).json({ error: 'Invalid state parameter' });
    return;
  }

  // Verify HMAC
  if (!verifyShopifyHmac({ code, shop, state }, hmac)) {
    res.status(400).json({ error: 'Invalid HMAC' });
    return;
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json() as { access_token?: string };
    const accessToken = tokenData.access_token || '';

    // Store session
    sessions.set(shop, { shop, accessToken });

    // Initialize store in database
    await initializeStore(shop, accessToken);

    // Clear state cookie
    res.clearCookie('oauth_state');

    // Redirect to app dashboard
    res.redirect(`/app/${shop}/dashboard`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/auth?error=oauth_failed');
  }
});

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const shop = req.headers['x-shopify-shop-domain'] as string ||
                (req.query as { shop?: string }).shop;

  if (!shop || !sessions.has(shop)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  (req as any).session = sessions.get(shop);
  next();
}

// ─── Embedded App Routes ───────────────────────────────────────────────────

app.get('/app/:shop/dashboard', (req: Request, res: Response) => {
  const { shop } = req.params;
  const apiKey = SHOPIFY_API_KEY;

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ReZ Upsell</title>
  <script src="https://unpkg.com/@shopify/shopify-admin-ui@latest/dist/shopify-admin-ui.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
  <div id="app">
    <div class="flex items-center justify-center h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    </div>
  </div>
  <script>
    window.SHOPIFY_API_KEY = '${apiKey}';
    window.SHOP = '${shop}';
    window.APP_URL = '${APP_URL}';
  </script>
  <script type="module" src="${APP_URL}/assets/app.js"></script>
</body>
</html>
  `);
});

// ─── API Routes ───────────────────────────────────────────────────────────

// Configure upsell
app.post('/api/upsell/configure', requireAuth, async (req: Request, res: Response) => {
  const { shop, accessToken } = (req as any).session;
  const { products, discountPercentage, discountCode, position, settings } = req.body;

  try {
    let upsellConfig = await UpsellStore.findOne({ shop });

    if (upsellConfig) {
      upsellConfig.products = products;
      upsellConfig.discountPercentage = discountPercentage || 10;
      upsellConfig.discountCode = discountCode;
      upsellConfig.position = position || 'checkout';
      upsellConfig.settings = { ...upsellConfig.settings, ...settings };
      upsellConfig.enabled = true;
      await upsellConfig.save();
    } else {
      upsellConfig = await UpsellStore.create({
        shop,
        products: products || [],
        discountPercentage: discountPercentage || 10,
        discountCode,
        position: position || 'checkout',
        enabled: true,
        settings: {
          showOnMobile: true,
          autoTrigger: true,
          delaySeconds: 5,
          maxUpsellsPerSession: 3,
          primaryColor: '#0ea5e9',
          backgroundColor: '#ffffff',
          ...settings,
        },
        stats: {
          totalOffers: 0,
          totalClicks: 0,
          totalAccepted: 0,
          totalDeclined: 0,
          totalRevenue: 0,
        },
      });
    }

    // Register webhooks
    await registerWebhooks(shop, accessToken);

    res.json({ success: true, config: upsellConfig });
  } catch (error) {
    console.error('Configure error:', error);
    res.status(500).json({ error: 'Failed to configure' });
  }
});

// Get upsell config
app.get('/api/upsell/config', requireAuth, async (req: Request, res: Response) => {
  const { shop } = (req as any).session;

  try {
    const config = await UpsellStore.findOne({ shop });
    if (!config) {
      res.json({ enabled: false, products: [], settings: {} });
      return;
    }
    res.json({
      enabled: config.enabled,
      position: config.position,
      discountPercentage: config.discountPercentage,
      discountCode: config.discountCode,
      products: config.products,
      settings: config.settings,
      stats: config.stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Get upsell offer (public - used in storefront)
app.post('/api/upsell/offer', async (req: Request, res: Response) => {
  const { shop, cartItems, sessionId } = req.body;

  try {
    const config = await UpsellStore.findOne({ shop: shop.toLowerCase() });

    if (!config || !config.enabled) {
      res.json({ offer: null });
      return;
    }

    const cartProductIds = cartItems.map((item: any) => item.productId);
    const availableProducts = config.products.filter(
      (p: any) => !cartProductIds.includes(p.productId)
    );

    if (availableProducts.length === 0) {
      res.json({ offer: null });
      return;
    }

    // FIX: Use crypto for secure random selection
    const product = availableProducts[crypto.randomInt(0, availableProducts.length)];
    const offerPrice = product.price * (1 - (config.discountPercentage / 100));

    const offer = {
      id: uuidv4(),
      product,
      originalPrice: product.price,
      offerPrice: Math.round(offerPrice * 100) / 100,
      discountPercentage: config.discountPercentage,
      discountCode: config.discountCode,
      message: `Add ${product.title} for ₹${Math.round(offerPrice)}!`,
    };

    res.json({ offer });
  } catch (error) {
    console.error('Offer error:', error);
    res.status(500).json({ error: 'Failed to get offer' });
  }
});

// Track upsell event
app.post('/api/upsell/track', async (req: Request, res: Response) => {
  const { shop, sessionId, offerId, productId, variantId, event, revenue } = req.body;

  try {
    const config = await UpsellStore.findOne({ shop: shop.toLowerCase() });

    if (config) {
      await UpsellEvent.create({
        eventId: uuidv4(),
        shop: shop.toLowerCase(),
        sessionId,
        offerId,
        productId,
        variantId,
        event,
        revenue: revenue || 0,
        timestamp: new Date(),
      });

      if (event === 'offer_shown') {
        await config.incrementStat('totalOffers');
      } else if (event === 'offer_clicked') {
        await config.incrementStat('totalClicks');
      } else if (event === 'offer_accepted') {
        await config.incrementStat('totalAccepted');
        await config.addRevenue(revenue || 0);
      } else if (event === 'offer_declined') {
        await config.incrementStat('totalDeclined');
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Failed to track' });
  }
});

// Get stats
app.get('/api/upsell/stats', requireAuth, async (req: Request, res: Response) => {
  const { shop } = (req as any).session;

  try {
    const config = await UpsellStore.findOne({ shop });
    if (!config) {
      res.json({ totalOffers: 0, totalClicks: 0, totalAccepted: 0 });
      return;
    }

    const { stats } = config;
    res.json({
      totalOffers: stats.totalOffers,
      totalClicks: stats.totalClicks,
      totalAccepted: stats.totalAccepted,
      totalDeclined: stats.totalDeclined,
      clickRate: stats.totalOffers > 0 ? (stats.totalClicks / stats.totalOffers * 100).toFixed(1) : 0,
      conversionRate: stats.totalClicks > 0 ? (stats.totalAccepted / stats.totalClicks * 100).toFixed(1) : 0,
      totalRevenue: stats.totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get products from Shopify
app.get('/api/products', requireAuth, async (req: Request, res: Response) => {
  const { shop, accessToken } = (req as any).session;

  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/products.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as { products?: unknown[] };
    res.json({ products: data.products || [] });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// ─── Webhook Handlers ───────────────────────────────────────────────────

app.post('/webhooks/products', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const topic = req.headers['x-shopify-topic'] as string;

  console.log(`Webhook ${topic} from ${shop}`);
  res.status(200).send('OK');
});

app.post('/webhooks/orders', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;
  const topic = req.headers['x-shopify-topic'] as string;

  console.log(`Webhook ${topic} from ${shop}`);
  res.status(200).send('OK');
});

app.post('/webhooks/app-uninstalled', async (req: Request, res: Response) => {
  const shop = req.headers['x-shopify-shop-domain'] as string;

  await UpsellStore.deleteOne({ shop });
  sessions.delete(shop);

  res.status(200).send('OK');
});

// ─── Helper Functions ─────────────────────────────────────────────────────

async function initializeStore(shop: string, accessToken: string) {
  let store = await UpsellStore.findOne({ shop });

  if (!store) {
    // Get shop info
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    const data = await response.json() as { shop?: { name?: string } };

    store = await UpsellStore.create({
      shop,
      tenantId: `tenant_${shop}`,
      brandId: `brand_${shop}`,
      enabled: false,
      products: [],
      discountPercentage: 10,
      position: 'checkout',
      settings: {
        showOnMobile: true,
        autoTrigger: true,
        delaySeconds: 5,
        maxUpsellsPerSession: 3,
        trackAllClicks: true,
        primaryColor: '#0ea5e9',
        backgroundColor: '#ffffff',
      },
      stats: {
        totalOffers: 0,
        totalClicks: 0,
        totalAccepted: 0,
        totalDeclined: 0,
        totalRevenue: 0,
      },
    });
  }

  return store;
}

async function registerWebhooks(shop: string, accessToken: string) {
  const webhooks = [
    'orders/create',
    'orders/updated',
    'products/create',
    'app/uninstalled',
  ];

  const webhookUrl = `${APP_URL}/webhooks`;

  for (const topic of webhooks) {
    try {
      await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: webhookUrl,
            format: 'json',
          },
        }),
      });
      console.log(`Registered webhook: ${topic}`);
    } catch (error) {
      console.error(`Failed to register webhook ${topic}:`, error);
    }
  }
}

// ─── Health Check ───────────────────────────────────────────────────────

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-upsell', timestamp: new Date().toISOString() });
});

// ─── Start Server ────────────────────────────────────────────────────────

async function main() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`ReZ Upsell running on port ${PORT}`);
    console.log(`App URL: ${APP_URL}`);
  });
}

main().catch(console.error);
