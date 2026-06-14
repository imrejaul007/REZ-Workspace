/**
 * AdBazaar Community Media Network
 * Hyperlocal ad inventory from apartments, societies, stores
 *
 * Port: 4974
 * Purpose: Unique REZ ecosystem inventory (nobody else has this)
 *
 * Features:
 * - Apartment screens
 * - Society displays
 * - Retail shelf
 * - Restaurant menus
 * - Hotel rooms
 * - Clinic displays
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4974;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(helmet()); app.use(cors()); app.use(express.json());

// MongoDB
const locationSchema = new mongoose.Schema({
  locationId: String, type: String, // apartment, society, store, restaurant, hotel, clinic
  name: String, address: String, pincode: String, city: String,
  screens: Number, avgFootfall: Number, demographics: mongoose.Schema.Types.Mixed,
  status: String, createdAt: Date
});

const adSlotSchema = new mongoose.Schema({
  slotId: String, locationId: String, type: String, // lobby, gate, room, shelf, menu
  size: String, format: String, price: Number, available: Boolean, bookedDates: [Date]
});

const Location = mongoose.model('Location', locationSchema);
const AdSlot = mongoose.model('AdSlot', adSlotSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'community-media', port: PORT }));

// Add location
app.post('/api/locations', async (req, res) => {
  try {
    const { type, name, address, pincode, city, screens, demographics } = req.body;
    const locationId = `loc_${Date.now()}`;

    const location = new Location({
      locationId, type, name, address, pincode, city, screens,
      avgFootfall: 0, demographics: demographics || {}, status: 'active', createdAt: new Date()
    });
    await location.save();

    res.json({ success: true, id: locationId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get inventory by type
app.get('/api/inventory/:type', async (req, res) => {
  try {
    const { pincode, city } = req.query;

    const query: any = { type: req.params.type, status: 'active' };
    if (pincode) query.pincode = pincode;
    if (city) query.city = city;

    const locations = await Location.find(query);

    res.json({
      success: true,
      count: locations.length,
      locations: locations.map(l => ({
        id: l.locationId, name: l.name, address: l.address,
        screens: l.screens, avgFootfall: l.avgFootfall, demographics: l.demographics
      }))
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Create ad slot
app.post('/api/slots', async (req, res) => {
  try {
    const { locationId, type, size, format, price } = req.body;
    const slotId = `slot_${Date.now()}`;

    const slot = new AdSlot({
      slotId, locationId, type, size, format, price,
      available: true, bookedDates: []
    });
    await slot.save();

    res.json({ success: true, id: slotId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Book slot
app.post('/api/slots/:slotId/book', async (req, res) => {
  try {
    const { dates, campaignId } = req.body;

    await AdSlot.findOneAndUpdate(
      { slotId: req.params.slotId },
      { $push: { bookedDates: { $each: dates } } }
    );

    res.json({ success: true, message: 'Slot booked' });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get availability
app.get('/api/availability/:locationId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const slots = await AdSlot.find({ locationId: req.params.locationId });

    const availability = slots.map(s => ({
      id: s.slotId, type: s.type, size: s.size, format: s.format, price: s.price,
      available: s.bookedDates?.length === 0
    }));

    res.json({ success: true, availability });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Hyperlocal targeting
app.post('/api/target', async (req, res) => {
  try {
    const { pincode, city, type, demographics } = req.body;

    const query: any = { status: 'active' };
    if (pincode) query.pincode = pincode;
    if (city) query.city = city;
    if (type) query.type = type;

    const locations = await Location.find(query);

    // Filter by demographics
    const matched = locations.filter(l => {
      if (!demographics) return true;
      if (demographics.ageGroup && l.demographics?.ageGroup !== demographics.ageGroup) return false;
      if (demographics.income && l.demographics?.income !== demographics.income) return false;
      return true;
    });

    res.json({
      success: true,
      matched: matched.length,
      locations: matched.map(l => ({ id: l.locationId, name: l.name, screens: l.screens }))
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Analytics
app.get('/api/analytics/:campaignId', async (req, res) => {
  try {
    res.json({
      success: true,
      analytics: {
        impressions: 0, reach: 0, ctr: '0%', cpm: '₹50',
        byLocation: [], byTimeSlot: []
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info(`🚀 Community Media Network started on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/community_media');
});

export default app;