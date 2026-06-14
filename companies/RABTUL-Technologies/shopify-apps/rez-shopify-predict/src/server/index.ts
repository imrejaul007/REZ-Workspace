/**
 * ReZ Predict - Shopify App
 * AI Customer Predictions
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CustomerPrediction } from '../models/Predictions';

const { MONGODB_URI } = process.env;
const PORT = parseInt(process.env.PORT || '3007', 10);
const app = express();
app.use(express.json());

async function connectDB() {
  await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/rez_predict');
}

// Predict customer LTV and churn
app.post('/api/predict', async (req: Request, res: Response) => {
  const { customerId, shop, totalOrders, totalSpent, avgOrderValue, daysSinceLastOrder } = req.body;

  // Rule-based prediction (replace with ML service in production)
  const churnScore = Math.min(100, 30 + daysSinceLastOrder * 0.5 + (totalOrders < 2 ? 20 : 0));
  const churnRisk = churnScore > 70 ? 'high' : churnScore > 40 ? 'medium' : 'low';
  const ltv = avgOrderValue * (totalOrders || 1) * 3;

  const prediction = await CustomerPrediction.findOneAndUpdate(
    { customerId, shop: shop.toLowerCase() },
    {
      customerId, shop: shop.toLowerCase(),
      predictions: { ltv, churnRisk, churnScore, revisitProbability: 100 - churnScore },
      predictedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  res.json({ success: true, prediction });
});

app.get('/api/predict/:shop/:customerId', async (req: Request, res: Response) => {
  const { shop, customerId } = req.params;
  const prediction = await CustomerPrediction.findOne({ shop: shop.toLowerCase(), customerId });
  res.json({ success: true, prediction });
});

app.get('/api/predict/at-risk/:shop', async (req: Request, res: Response) => {
  const { shop } = req.params;
  const customers = await CustomerPrediction.find({
    shop: shop.toLowerCase(),
    'predictions.churnRisk': { $in: ['medium', 'high'] },
  }).sort({ 'predictions.churnScore': -1 }).limit(50);
  res.json({ success: true, customers });
});

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-predict' }));

async function main() {
  await connectDB();
  app.listen(PORT, () => console.log(`ReZ Predict running on port ${PORT}`));
}
main().catch(console.error);
