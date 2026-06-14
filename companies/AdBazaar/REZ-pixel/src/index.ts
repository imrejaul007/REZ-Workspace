/**
 * REZ Pixel - Universal Tracking Pixel
 * Track user behavior across web, mobile, and server
 * Port: 4962
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4962;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const pixelSchema = new mongoose.Schema({
  pixelId: String,
  merchantId: String,
  name: String,
  type: String,
  domain: String,
  apiKey: String,
  events: [{ event: String, count: Number }],
  createdAt: Date
});

const eventSchema = new mongoose.Schema({
  eventId: String,
  pixelId: String,
  merchantId: String,
  eventName: String,
  userId: String,
  anonymousId: String,
  sessionId: String,
  ip: String,
  userAgent: String,
  url: String,
  properties: mongoose.Schema.Types.Mixed,
  timestamp: Date
});

const Pixel = mongoose.model('Pixel', pixelSchema);
const Event = mongoose.model('Event', eventSchema);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-pixel', port: PORT });
});

app.post('/api/pixels', async (req, res) => {
  try {
    const { merchantId, name, type, domain } = req.body;
    const pixelId = 'pix_' + uuidv4().substring(0, 12);
    const apiKey = uuidv4();

    const pixel = new Pixel({
      pixelId, merchantId, name,
      type: type || 'web',
      domain: domain || '*',
      apiKey, events: [], createdAt: new Date()
    });
    await pixel.save();

    res.json({ success: true, pixelId, apiKey });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/pixels/:pixelId', async (req, res) => {
  try {
    const pixel = await Pixel.findOne({ pixelId: req.params.pixelId });
    if (!pixel) return res.status(404).json({ error: 'Pixel not found' });
    res.json({ success: true, pixel });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/pixel.js', (req, res) => {
  const pixelId = req.query.pixelId;
  const server = process.env.PIXEL_SERVER || 'http://localhost:4962';

  const script = `
(function(w,d){
var p=w.REZ_PIXEL=w.REZ_PIXEL||{};
p.pixelId='${pixelId}';
p.server='${server}';
p.track=function(e,pr){
fetch(p.server+'/track',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({pixelId:p.pixelId,event:e,properties:pr||{}})});
};
d.addEventListener('DOMContentLoaded',function(){p.track('PageView')});
})(window,document);`;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(script);
});

app.post('/track', async (req, res) => {
  try {
    const { pixelId, event, properties, userId, anonymousId } = req.body;
    const pixel = await Pixel.findOne({ pixelId });
    if (!pixel) return res.status(404).json({ error: 'Pixel not found' });

    const eventId = 'evt_' + uuidv4().substring(0, 12);
    const newEvent = new Event({
      eventId, pixelId, merchantId: pixel.merchantId, eventName: event,
      userId, anonymousId,
      sessionId: req.body.sessionId || uuidv4(),
      ip: req.ip, userAgent: req.get('user-agent') || '',
      url: req.body.context?.url,
      properties: properties || {}, timestamp: new Date()
    });
    await newEvent.save();

    const idx = pixel.events.findIndex((e: any) => e.event === event);
    if (idx >= 0) { pixel.events[idx].count++; }
    else { pixel.events.push({ event, count: 1 }); }
    await pixel.save();

    await redis.lpush('events:' + pixelId, JSON.stringify({ event, timestamp: Date.now() }));
    await redis.ltrim('events:' + pixelId, 0, 99);

    res.json({ success: true, eventId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.post('/server/track', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) return res.status(401).json({ error: 'API key required' });

    const pixel = await Pixel.findOne({ apiKey });
    if (!pixel) return res.status(401).json({ error: 'Invalid API key' });

    const eventId = 'evt_' + uuidv4().substring(0, 12);
    const { event, properties, userId } = req.body;

    const newEvent = new Event({
      eventId, pixelId: pixel.pixelId, merchantId: pixel.merchantId,
      eventName: event, userId, properties: properties || {},
      timestamp: new Date()
    });
    await newEvent.save();

    res.json({ success: true, eventId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/pixels/:pixelId/stats', async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await Event.find({
      pixelId: req.params.pixelId,
      timestamp: { $gte: since }
    });

    const stats: any = { totalEvents: events.length, byEvent: {} };
    events.forEach((e: any) => {
      stats.byEvent[e.eventName] = (stats.byEvent[e.eventName] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info('REZ Pixel started on port ' + PORT);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_pixel')
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => logger.error('MongoDB error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;