/**
 * ReZ Rewards - Server
 */

import express from 'express';
import mongoose from 'mongoose';
import { LoyaltyService } from '../services/loyaltyService';

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_rewards')
  .then(() => console.log('Connected to MongoDB'));

// Routes
app.post('/loyalty/register', async (req, res) => {
  const { customerId, shop, tenantId, brandId, email, phone } = req.body;
  const customer = await LoyaltyService.getOrCreateCustomer({
    customerId, shop, tenantId, brandId, email, phone,
  });
  res.json({ success: true, customer });
});

app.post('/loyalty/points/add', async (req, res) => {
  const { customerId, shop, tenantId, brandId, email, phone, orderValue, orderId } = req.body;
  const customer = await LoyaltyService.addPointsForOrder({
    customerId, shop, tenantId, brandId, email, phone, orderValue, orderId,
  });
  res.json({ success: true, customer });
});

app.post('/loyalty/redeem', async (req, res) => {
  const { customerId, shop, rewardId } = req.body;
  const result = await LoyaltyService.redeemReward({ customerId, shop, rewardId });
  res.json(result);
});

app.get('/loyalty/customer/:shop/:customerId', async (req, res) => {
  const { shop, customerId } = req.params;
  const customer = await LoyaltyService.getCustomerInfo({ customerId, shop });
  res.json({ success: true, customer });
});

app.get('/loyalty/rewards/:shop', async (req, res) => {
  const { shop } = req.params;
  const rewards = await LoyaltyService.getAvailableRewards(shop);
  res.json({ success: true, rewards });
});

app.get('/loyalty/stats/:shop', async (req, res) => {
  const { shop } = req.params;
  const stats = await LoyaltyService.getStats(shop);
  res.json({ success: true, stats });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rez-rewards' });
});

const PORT = parseInt(process.env.PORT || '3002', 10);
app.listen(PORT, () => console.log(`ReZ Rewards running on port ${PORT}`));
