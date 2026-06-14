/**
 * Waste Management Service
 * Track waste, spoilage, COGS calculation
 */

import express, { Express, Request, Response } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';

const app: Express = express();
app.use(express.json());

const PORT = process.env.PORT || 4036;

// Models
interface IWasteEntry extends mongoose.Document {
  merchantId: string;
  restaurantId: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  cost: number;
  reason: string;
  loggedBy: string;
  createdAt: Date;
}

const WasteSchema = new mongoose.Schema({
  merchantId: String,
  restaurantId: String,
  itemId: String,
  itemName: String,
  category: String,
  quantity: Number,
  unit: String,
  cost: Number,
  reason: String,
  loggedBy: String,
}, { timestamps: true });

const WasteEntry = mongoose.model<IWasteEntry>('Waste', WasteSchema);

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rez-waste-management' });
});

// Log waste
app.post('/api/waste', async (req, res) => {
  try {
    const entry = new WasteEntry(req.body);
    await entry.save();
    res.status(201).json({ success: true, data: entry });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to log waste' });
  }
});

// Get waste entries
app.get('/api/waste', async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const query: unknown = { restaurantId };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    const entries = await WasteEntry.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch waste' });
  }
});

// Waste summary
app.get('/api/waste/summary', async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const match: unknown = { restaurantId };
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const summary = await WasteEntry.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        totalWasteCost: { $sum: '$cost' },
        totalEntries: { $sum: 1 },
        byCategory: { $push: '$category' },
      }},
    ]);

    const categoryBreakdown = await WasteEntry.aggregate([
      { $match: match },
      { $group: { _id: '$category', cost: { $sum: '$cost' }, count: { $sum: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalCost: summary[0]?.totalWasteCost || 0,
        totalEntries: summary[0]?.totalEntries || 0,
        byCategory: categoryBreakdown,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

// COGS calculation
app.get('/api/cogs', async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const match: unknown = { restaurantId };
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }

    const totalWaste = await WasteEntry.aggregate([
      { $match: match },
      { $group: { _id: null, wasteCost: { $sum: '$cost' } },
    ]);

    res.json({
      success: true,
      data: {
        wasteCost: totalWaste[0]?.wasteCost || 0,
        wastePercentage: 0, // Calculate with revenue
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to calculate COGS' });
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waste').then(() => {
  app.listen(PORT, () => logger.info(`Waste service on ${PORT}`));
}).catch(console.error);
