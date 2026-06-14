/**
 * REZ Nearby - Hyperlocal Classifieds Service
 */

import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const app = express();
app.use(express.json());

// Connections
const INTELLIGENCE_API = process.env.INTELLIGENCE_API || 'https://rez-intelligence.onrender.com';
const MERCHANT_API = process.env.MERCHANT_API || 'https://rez-merchant.onrender.com';

// Models
const Request = mongoose.model('Request', new mongoose.Schema({
  request_id: String,
  user_id: String,
  type: String, // buy, sell, service
  category: String,
  title: String,
  description: String,
  budget: Number,
  location: { city: String, area: String, lat: Number, lng: Number },
  status: String, // active, fulfilled, expired
  created_at: { type: Date, default: Date.now },
  responses_count: Number
}));

// POST /api/request
app.post('/api/request', async (req, res) => {
  const { user_id, type, category, title, description, budget, location } = req.body;

  const request = new Request({
    request_id: `REQ-${Date.now()}`,
    user_id,
    type,
    category,
    title,
    description,
    budget,
    location,
    status: 'active',
    responses_count: 0
  });
  await request.save();

  // Track to Intelligence
  try {
    await axios.post(`${INTELLIGENCE_API}/api/demand/track`, {
      user_id,
      category,
      location: location.city,
      type: 'request'
    });
  } catch (e) {
    console.error('REZ Nearby error tracking demand:', e instanceof Error ? e.message : String(e));
  }

  res.json({ success: true, request });
});

// GET /api/requests
app.get('/api/requests', async (req, res) => {
  const { city, category, type, lat, lng } = req.query;
  const query: unknown = { status: 'active' };
  if (category) query.category = category;
  if (type) query.type = type;
  if (city) query['location.city'] = city;

  const requests = await Request.find(query).sort({ created_at: -1 }).limit(50);
  res.json({ requests });
});

// GET /api/request/:id
app.get('/api/request/:id', async (req, res) => {
  const request = await Request.findOne({ request_id: req.params.id });
  res.json(request);
});

// PUT /api/request/:id/fulfill
app.put('/api/request/:id/fulfill', async (req, res) => {
  await Request.findOneAndUpdate({ request_id: req.params.id }, { status: 'fulfilled' });
  res.json({ success: true });
});

export default app;
