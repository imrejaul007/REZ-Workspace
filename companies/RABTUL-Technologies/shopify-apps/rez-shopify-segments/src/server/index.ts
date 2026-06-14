/**
 * ReZ Segments - Shopify App
 * Customer Segmentation
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Segment } from '../models/Segment';
import { CustomerSegment } from '../models/CustomerSegment';

const { MONGODB_URI } = process.env;
const PORT = parseInt(process.env.PORT || '3006', 10);
const app = express();
app.use(express.json());

async function connectDB() {
  await mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/rez_segments');
}

// Create segment
app.post('/api/segments', async (req: Request, res: Response) => {
  const { shop, name, rules } = req.body;
  const segment = await Segment.create({ shop: shop.toLowerCase(), name, rules });
  res.json({ success: true, segment });
});

// Get segments
app.get('/api/segments/:shop', async (req: Request, res: Response) => {
  const { shop } = req.params;
  const segments = await Segment.find({ shop: shop.toLowerCase(), active: true });
  res.json({ success: true, segments });
});

// Calculate segment
app.post('/api/segments/:id/calculate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { customers } = req.body; // Array of customer data

  const segment = await Segment.findById(id);
  if (!segment) { res.status(404).json({ error: 'Segment not found' }); return; }

  let matches = 0;
  for (const customer of customers) {
    let match = true;
    for (const rule of segment.rules) {
      const val = customer[rule.field];
      if (rule.operator === 'gt' && !(val > rule.value)) match = false;
      if (rule.operator === 'gte' && !(val >= rule.value)) match = false;
      if (rule.operator === 'lt' && !(val < rule.value)) match = false;
      if (rule.operator === 'lte' && !(val <= rule.value)) match = false;
      if (rule.operator === 'eq' && val !== rule.value) match = false;
    }
    if (match) {
      matches++;
      await CustomerSegment.findOneAndUpdate(
        { customerId: customer.customerId, segmentId: id },
        { customerId: customer.customerId, segmentId: id },
        { upsert: true }
      );
    }
  }

  segment.customerCount = matches;
  segment.lastCalculated = new Date();
  await segment.save();

  res.json({ success: true, customerCount: matches });
});

// Template segments
app.post('/api/segments/templates', async (req: Request, res: Response) => {
  const { shop } = req.body;
  const templates = [
    { name: 'New Customers', rules: [{ field: 'totalOrders', operator: 'eq', value: 1 }] },
    { name: 'VIP Customers', rules: [{ field: 'totalSpent', operator: 'gte', value: 10000 }] },
    { name: 'At Risk', rules: [{ field: 'daysSinceLastOrder', operator: 'gt', value: 60 }] },
  ];
  const created = await Promise.all(templates.map(t => Segment.create({ shop: shop.toLowerCase(), ...t })));
  res.json({ success: true, segments: created });
});

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-segments' }));

async function main() {
  await connectDB();
  app.listen(PORT, () => console.log(`ReZ Segments running on port ${PORT}`));
}
main().catch(console.error);
