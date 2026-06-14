import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { OTASyncService } from './services/ota-sync.service';
import { InventorySyncService } from './services/inventory-sync.service';
import { RatePlanService } from './services/rate-plan.service';

const app = express();
const PORT = 4021;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rez-channel-manager';

app.use(cors());
app.use(express.json());

const otaSyncService = new OTASyncService();
const inventorySyncService = new InventorySyncService();
const ratePlanService = new RatePlanService();

// ============ CHANNEL MANAGEMENT ============
app.get('/api/channels', (req, res) => {
  const channels = otaSyncService.getAllChannels();
  res.json({ success: true, channels });
});

app.get('/api/channels/connected', (req, res) => {
  const channels = otaSyncService.getConnectedChannels();
  res.json({ success: true, channels });
});

app.get('/api/channels/stats', (req, res) => {
  const stats = otaSyncService.getChannelStats();
  res.json({ success: true, stats });
});

app.post('/api/channels/:channelId/connect', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { hotelId, ...credentials } = req.body;

    const channel = await otaSyncService.connectChannel(hotelId, channelId, credentials);
    res.json({ success: true, channel });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/channels/:channelId/disconnect', async (req, res) => {
  try {
    const { channelId } = req.params;
    await otaSyncService.disconnectChannel(channelId);
    res.json({ success: true, message: `Disconnected from ${channelId}` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ INVENTORY SYNC ============
app.post('/api/inventory/push', async (req, res) => {
  try {
    const { hotelId, updates } = req.body;

    const results = await otaSyncService.pushInventory(hotelId, updates);
    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory/pull', async (req, res) => {
  try {
    const { hotelId, channelId } = req.body;

    const reservations = await otaSyncService.pullReservations(hotelId, channelId);
    res.json({ success: true, reservations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync/all', async (req, res) => {
  try {
    const { hotelId, inventory } = req.body;

    const results = await otaSyncService.syncAllChannels(hotelId, inventory);
    res.json({ success: true, ...results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ RATE PLANS ============
app.get('/api/rate-plans', (req, res) => {
  const plans = ratePlanService.getAllRatePlans();
  res.json({ success: true, ratePlans: plans });
});

app.get('/api/rate-plans/:hotelId', (req, res) => {
  const { hotelId } = req.params;
  const plans = ratePlanService.getHotelRatePlans(hotelId);
  res.json({ success: true, ratePlans: plans });
});

app.post('/api/rate-plans', async (req, res) => {
  try {
    const plan = await ratePlanService.createRatePlan(req.body);
    res.json({ success: true, ratePlan: plan });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/rate-plans/:planId/update-pricing', async (req, res) => {
  try {
    const { planId } = req.params;
    const { baseRate, channelRates, restrictions } = req.body;

    const plan = await ratePlanService.updateChannelRates(planId, channelRates, restrictions);
    res.json({ success: true, ratePlan: plan });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ AVAILABILITY MANAGEMENT ============
app.post('/api/availability/update', async (req, res) => {
  try {
    const { hotelId, roomTypeId, updates } = req.body;

    const result = await inventorySyncService.updateAvailability(hotelId, roomTypeId, updates);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/availability/bulk', async (req, res) => {
  try {
    const { hotelId, roomTypeId, startDate, endDate, availability, price } = req.body;

    const result = await inventorySyncService.bulkUpdateAvailability(hotelId, roomTypeId, startDate, endDate, availability, price);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/availability/min-stay', async (req, res) => {
  try {
    const { hotelId, roomTypeId, dates, minStay } = req.body;

    const result = await inventorySyncService.setMinStayRestriction(hotelId, roomTypeId, dates, minStay);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/availability/close-dates', async (req, res) => {
  try {
    const { hotelId, roomTypeId, closeFrom, closeTo, reason } = req.body;

    const result = await inventorySyncService.closeDates(hotelId, roomTypeId, closeFrom, closeTo, reason);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/availability/:hotelId/:roomTypeId', async (req, res) => {
  try {
    const { hotelId, roomTypeId } = req.params;
    const { startDate, endDate } = req.query;

    const availability = await inventorySyncService.getAvailability(
      hotelId,
      roomTypeId,
      startDate as string,
      endDate as string
    );
    res.json({ success: true, availability });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BOOKING RULES ============
app.post('/api/rules/restrictions', async (req, res) => {
  try {
    const { hotelId, restrictions } = req.body;

    const result = await inventorySyncService.setGlobalRestrictions(hotelId, restrictions);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rules/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;

    const rules = await inventorySyncService.getGlobalRestrictions(hotelId);
    res.json({ success: true, rules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-channel-manager',
    port: PORT,
    connectedChannels: otaSyncService.getConnectedChannels().length,
    totalChannels: otaSyncService.getAllChannels().length,
  });
});

app.listen(PORT, () => {
  console.log(`🔗 Channel Manager service running on port ${PORT}`);
});

export default app;
