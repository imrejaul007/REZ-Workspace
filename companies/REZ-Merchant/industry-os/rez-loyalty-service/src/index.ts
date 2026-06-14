/**
 * REZ Loyalty Service
 * Cross-industry loyalty and rewards management
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const loyaltySchema = new mongoose.Schema({
  merchantId: String, customerId: String, customerName: String, phone: String, email: String,
  points: { type: Number, default: 0 }, lifetimePoints: { type: Number, default: 0 },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'], default: 'Bronze' },
  tierProgress: { current: Number, target: Number },
  referralCode: String, referredBy: String,
  transactions: [{ type: String, points: Number, description: String, date: Date, orderId: String }],
  rewards: [{ rewardId: String, name: String, redeemedAt: Date, pointsUsed: Number }],
  createdAt: Date, updatedAt: Date
});
const Loyalty = mongoose.models.Loyalty || mongoose.model('Loyalty', loyaltySchema);

const rewardSchema = new mongoose.Schema({
  merchantId: String, name: String, description: String, pointsCost: Number, 
  type: { type: String, enum: ['discount', 'free_item', 'cashback', 'voucher'] },
  minTier: String, stock: Number, validFrom: Date, validTo: Date, status: String
});
const Reward = mongoose.models.Reward || mongoose.model('Reward', rewardSchema);

const tierConfig = {
  Bronze: { minPoints: 0, discount: 0, earningRate: 1 },
  Silver: { minPoints: 1000, discount: 1, earningRate: 1.25 },
  Gold: { minPoints: 5000, discount: 2, earningRate: 1.5 },
  Platinum: { minPoints: 15000, discount: 3, earningRate: 2 },
  Diamond: { minPoints: 50000, discount: 5, earningRate: 3 }
};

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-loyalty-service' }));

// Customer loyalty
app.post('/api/points/earn', async (req: Request, res: Response) => {
  const { merchantId, customerId, points, description, orderId } = req.body;
  let loyalty = await Loyalty.findOne({ merchantId, customerId });
  if (!loyalty) {
    loyalty = new Loyalty({ merchantId, customerId, points: 0, lifetimePoints: 0, createdAt: new Date() });
  }
  const earnedPoints = Math.floor(points * (tierConfig[loyalty.tier]?.earningRate || 1));
  loyalty.points += earnedPoints;
  loyalty.lifetimePoints += earnedPoints;
  loyalty.transactions.push({ type: 'earn', points: earnedPoints, description, date: new Date(), orderId });
  loyalty.tier = calculateTier(loyalty.lifetimePoints);
  await loyalty.save();
  res.json({ success: true, data: loyalty, earnedPoints });
});

app.post('/api/points/redeem', async (req: Request, res: Response) => {
  const { merchantId, customerId, points, description } = req.body;
  const loyalty = await Loyalty.findOne({ merchantId, customerId });
  if (!loyalty || loyalty.points < points) return res.status(400).json({ success: false, error: 'Insufficient points' });
  loyalty.points -= points;
  loyalty.transactions.push({ type: 'redeem', points: -points, description, date: new Date() });
  await loyalty.save();
  res.json({ success: true, data: loyalty });
});

app.get('/api/balance/:customerId', async (req: Request, res: Response) => {
  const { merchantId } = req.query;
  const loyalty = await Loyalty.findOne({ customerId: req.params.customerId, merchantId });
  res.json({ success: true, data: loyalty || { points: 0, tier: 'Bronze' } });
});

app.get('/api/profile/:customerId', async (req: Request, res: Response) => {
  const loyalty = await Loyalty.findOne({ customerId: req.params.customerId });
  res.json({ success: true, data: loyalty });
});

app.get('/api/transactions/:customerId', async (req: Request, res: Response) => {
  const loyalty = await Loyalty.findOne({ customerId: req.params.customerId });
  res.json({ success: true, data: loyalty?.transactions || [] });
});

// Rewards
app.post('/api/rewards', async (req: Request, res: Response) => {
  const reward = new Reward(req.body);
  await reward.save();
  res.json({ success: true, data: reward });
});

app.get('/api/rewards/:merchantId', async (req: Request, res: Response) => {
  const { tier } = req.query;
  const query: any = { merchantId: req.params.merchantId, status: 'active' };
  if (tier) query.minTier = { $lte: tier };
  const rewards = await Reward.find(query);
  res.json({ success: true, data: rewards });
});

app.post('/api/rewards/:id/redeem', async (req: Request, res: Response) => {
  const { customerId, merchantId } = req.body;
  const reward = await Reward.findById(req.params.id);
  if (!reward) return res.status(404).json({ success: false, error: 'Reward not found' });
  const loyalty = await Loyalty.findOne({ customerId, merchantId });
  if (!loyalty || loyalty.points < reward.pointsCost) return res.status(400).json({ success: false, error: 'Insufficient points' });
  loyalty.points -= reward.pointsCost;
  loyalty.rewards.push({ rewardId: reward._id, name: reward.name, pointsUsed: reward.pointsCost, redeemedAt: new Date() });
  await loyalty.save();
  res.json({ success: true, data: loyalty });
});

function calculateTier(lifetimePoints: number): string {
  if (lifetimePoints >= 50000) return 'Diamond';
  if (lifetimePoints >= 15000) return 'Platinum';
  if (lifetimePoints >= 5000) return 'Gold';
  if (lifetimePoints >= 1000) return 'Silver';
  return 'Bronze';
}

const PORT = process.env.PORT || 4037;
app.listen(PORT, () => logger.info(`rez-loyalty-service on port ${PORT}`));
export default app;
