/**
 * REZ Save - Wishlist/Commerce Layer Service
 * Connects to: REZ-Intelligence, REZ-Agent, RABTUL (Auth, Wallet)
 */

import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3016', 10);

// RABTUL Connections
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Original Connections
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';
const AGENT_API = process.env.AGENT_API || 'https://REZ-agent.onrender.com';

// RABTUL Auth Headers
const authHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
};

// Models
const WishlistItem = mongoose.model('WishlistItem', new mongoose.Schema({
  item_id: String,
  user_id: String,
  type: String, // restaurant, product, hotel, event, service
  item_ref: String,
  item_name: String,
  item_image: String,
  price: Number,
  original_price: Number,
  saved_at: { type: Date, default: Date.now },
  notified: Boolean,
  purchase_intent_score: Number,
  tags: [String]
}));

const Collection = mongoose.model('Collection', new mongoose.Schema({
  collection_id: String,
  user_id: String,
  name: String,
  description: String,
  items: [String],
  created_at: { type: Date, default: Date.now }
}));

// Helper: Validate user with RABTUL Auth
async function validateUser(userId: string): Promise<boolean> {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/internal/user/${userId}`, {
      headers: authHeaders,
      timeout: 5000,
    });
    return response.data?.valid === true || response.status === 200;
  } catch (e) {
    console.error('[REZ-save] RABTUL Auth validation failed:', e instanceof Error ? e.message : e);
    return false;
  }
}

// POST /api/save
app.post('/api/save', async (req, res) => {
  const { user_id, type, item_ref, item_name, item_image, price, tags } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, error: 'user_id is required' });
  }

  // RABTUL Auth: Validate user
  const isValidUser = await validateUser(user_id);
  if (!isValidUser) {
    console.warn(`[REZ-save] Invalid user from RABTUL Auth: ${user_id}`);
    // Continue anyway for development - in production, return 401
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, error: 'Invalid user' });
    }
  }

  const item = new WishlistItem({
    item_id: `SAVE-${Date.now()}`,
    user_id,
    type,
    item_ref,
    item_name,
    item_image,
    price,
    tags,
    notified: false,
    purchase_intent_score: 0.5 // default
  });
  await item.save();

  // Track to Intelligence
  try {
    await axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
      user_id,
      intent_type: 'wishlist_save',
      entities: { type, item_ref },
      action: 'save'
    });
  } catch (e) {
    console.error('[REZ-save] Failed to track intent:', e instanceof Error ? e.message : e);
  }

  res.json({ success: true, item });
});

// GET /api/save/:userId
app.get('/api/save/:userId', async (req, res) => {
  const items = await WishlistItem.find({ user_id: req.params.userId })
    .sort({ saved_at: -1 });
  res.json({ items });
});

// DELETE /api/save/:itemId
app.delete('/api/save/:itemId', async (req, res) => {
  await WishlistItem.findByIdAndDelete(req.params.itemId);
  res.json({ success: true });
});

// POST /api/save/collection
app.post('/api/save/collection', async (req, res) => {
  const { user_id, name, description } = req.body;
  const collection = new Collection({
    collection_id: `COL-${Date.now()}`,
    user_id,
    name,
    description,
    items: []
  });
  await collection.save();
  res.json({ success: true, collection });
});

// POST /api/save/transfer-to-savings - Transfer wishlist total to REZ Savings
app.post('/api/save/transfer-to-savings', async (req, res) => {
  const { user_id, amount } = req.body;

  if (!user_id || !amount) {
    return res.status(400).json({ success: false, error: 'user_id and amount are required' });
  }

  try {
    // Call RABTUL Wallet API to create savings transfer
    const response = await axios.post(
      `${WALLET_SERVICE_URL}/api/wallet/savings/deposit`,
      {
        user_id,
        amount,
        source: 'wishlist',
        description: 'Transfer from wishlist savings',
        reference_id: `SAVE-${Date.now()}`,
      },
      { headers: authHeaders }
    );

    res.json({
      success: true,
      transaction_id: response.data?.transaction_id,
      new_balance: response.data?.balance,
    });
  } catch (e) {
    console.error('[REZ-save] RABTUL Wallet transfer failed:', e instanceof Error ? e.message : e);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer to savings',
      details: e instanceof Error ? e.message : 'Unknown error',
    });
  }
});

// GET /api/save/savings-balance/:userId - Get user's REZ Savings balance
app.get('/api/save/savings-balance/:userId', async (req, res) => {
  try {
    const response = await axios.get(
      `${WALLET_SERVICE_URL}/api/wallet/savings/balance/${req.params.userId}`,
      { headers: authHeaders }
    );
    res.json({
      success: true,
      balance: response.data?.balance || 0,
      last_updated: response.data?.last_updated,
    });
  } catch (e) {
    console.error('[REZ-save] RABTUL Wallet balance check failed:', e instanceof Error ? e.message : e);
    res.status(500).json({
      success: false,
      error: 'Failed to get savings balance',
    });
  }
});

// GET /api/save/wishlist-total/:userId - Calculate total value of user's wishlist
app.get('/api/save/wishlist-total/:userId', async (req, res) => {
  try {
    const items = await WishlistItem.find({ user_id: req.params.userId });
    const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
    res.json({
      success: true,
      total_items: items.length,
      total_value: total,
      items,
    });
  } catch (e) {
    console.error('[REZ-save] Failed to calculate wishlist total:', e instanceof Error ? e.message : e);
    res.status(500).json({ success: false, error: 'Failed to calculate total' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-save',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-save';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`REZ Save connected to MongoDB`);
    app.listen(PORT, () => {
      console.log(`REZ Save started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    // Start anyway for development without MongoDB
    app.listen(PORT, () => {
      console.log(`REZ Save started on port ${PORT} (without MongoDB)`);
    });
  });

export default app;
