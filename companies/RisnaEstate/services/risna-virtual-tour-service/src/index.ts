import { logger } from './logger';
/**
 * RisnaEstate - Virtual Tour Service
 *
 * 360° virtual tours and 3D walkthroughs.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4125;

app.use(express.json());
app.use(cors());

const TourSchema = new Schema({
  tourId: { type: String, unique: true, index: true },
  propertyId: String,
  type: { type: String, enum: ['360', '3d', 'video', 'drone'], default: '360' },
  url: String,
  thumbnail: String,
  hotspots: [{
    position: { x: Number, y: Number },
    targetRoom: String,
    label: String
  }],
  rooms: [{
    name: String,
    order: Number,
    url: String
  }],
  metadata: {
    duration: Number,
    hasAudio: Boolean,
    quality: String
  },
  createdAt: Date
});

const Tour = mongoose.model('Tour', TourSchema);

app.get('/health', (req, res) => res.json({ service: 'virtual-tour', status: 'ok' }));

/**
 * Create virtual tour
 * POST /api/tours
 */
app.post('/api/tours', async (req: Request, res: Response) => {
  try {
    const { propertyId, type, url, thumbnail, rooms } = req.body;

    const tour = new Tour({
      tourId: `tour_${Date.now()}`,
      propertyId,
      type,
      url,
      thumbnail,
      rooms,
      metadata: { duration: 0, hasAudio: false, quality: 'hd' }
    });

    await tour.save();
    res.json({ success: true, tour });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get property tour
 * GET /api/tours/property/:propertyId
 */
app.get('/api/tours/property/:propertyId', async (req, res) => {
  try {
    const tour = await Tour.findOne({ propertyId: req.params.propertyId });
    res.json({ tour });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get tour
 * GET /api/tours/:id
 */
app.get('/api/tours/:id', async (req, res) => {
  try {
    const tour = await Tour.findOne({ tourId: req.params.id });
    res.json({ tour });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-tours');
  await Tour.createIndexes();
  app.listen(PORT, () => logger.info(`🚀 Virtual Tour Service running on port ${PORT}`));
}

start();

export default app;
