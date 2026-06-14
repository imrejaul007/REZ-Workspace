import { logger } from '../../shared/logger';
import express from 'express';
import { khaimoveHub } from './hub-client';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4600', 10);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'KHAIRMOVE', timestamp: new Date().toISOString() });
});

// Ride routes
app.post('/api/rides', async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType } = req.body;
    const ride = await khaimoveHub.createRide({ pickup, dropoff, vehicleType });
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/rides/:rideId', async (req, res) => {
  try {
    const ride = await khaimoveHub.getRide(req.params.rideId);
    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/rides/:rideId/cancel', async (req, res) => {
  try {
    const result = await khaimoveHub.cancelRide(req.params.rideId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Driver routes
app.post('/api/drivers', async (req, res) => {
  try {
    const { name, phone, vehicle } = req.body;
    const driver = await khaimoveHub.registerDriver({ name, phone, vehicle });
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/drivers/:driverId', async (req, res) => {
  try {
    const driver = await khaimoveHub.getDriver(req.params.driverId);
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/drivers/status', async (req, res) => {
  try {
    const { driverId, status } = req.body;
    const result = await khaimoveHub.updateDriverStatus({ driverId, status });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Fleet routes
app.post('/api/fleet/vehicles', async (req, res) => {
  try {
    const { type, plate, capacity } = req.body;
    const vehicle = await khaimoveHub.addVehicle({ type, plate, capacity });
    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/fleet/:fleetId/stats', async (req, res) => {
  try {
    const stats = await khaimoveHub.getFleetStats(req.params.fleetId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Logistics routes
app.post('/api/logistics/deliveries', async (req, res) => {
  try {
    const { items, pickup, dropoff } = req.body;
    const delivery = await khaimoveHub.createDelivery({ items, pickup, dropoff });
    res.json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/logistics/deliveries/:deliveryId/track', async (req, res) => {
  try {
    const tracking = await khaimoveHub.trackDelivery(req.params.deliveryId);
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// AI Intelligence routes
app.post('/api/ai/demand-prediction', async (req, res) => {
  try {
    const { location, time } = req.body;
    const prediction = await khaimoveHub.predictDemand({ location, time });
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/ai/fraud-check', async (req, res) => {
  try {
    const { transactionId, amount } = req.body;
    const result = await khaimoveHub.detectFraud({ transactionId, amount });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/api/ai/intent', async (req, res) => {
  try {
    const { query } = req.body;
    const intent = await khaimoveHub.getIntent({ query });
    res.json({ success: true, intent });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Payment routes
app.post('/api/payments', async (req, res) => {
  try {
    const { amount, currency, method } = req.body;
    const payment = await khaimoveHub.processPayment({ amount, currency, method });
    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Notification routes
app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, message, channel } = req.body;
    const notification = await khaimoveHub.sendNotification({ userId, message, channel });
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`KHAIRMOVE (Mobility OS) - Port ${PORT} - Running`);
  logger.info(`  → Rides: POST /api/rides`);
  logger.info(`  → Drivers: POST /api/drivers`);
  logger.info(`  → Fleet: POST /api/fleet/vehicles`);
  logger.info(`  → Logistics: POST /api/logistics/deliveries`);
  logger.info(`  → AI Demand Prediction: POST /api/ai/demand-prediction`);
  logger.info(`  → Fraud Detection: POST /api/ai/fraud-check`);
});

export default app;
