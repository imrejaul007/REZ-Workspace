import { logger } from '../../shared/logger';
/**
 * Hotel OTA API Service
 *
 * Connects StayOwn Hotel services to:
 * - RABTUL Platform (Auth, Payment, Booking, Notifications)
 * - REZ Intelligence (Hospitality Expert, Churn Prediction, Personalization)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { hotelOTAIntegrations } from './integrations/stayOwnIntegrations';
import { rezIntelligence } from './integrations/rezIntelligence';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hotel-ota-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Readiness check
app.get('/health/ready', async (req, res) => {
  try {
    // Check external dependencies
    const checks = {
      rezIntelligence: rezIntelligence.isHealthy()
    };

    const allHealthy = Object.values(checks).every(v => v);

    res.json({
      status: allHealthy ? 'ok' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Process booking endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = req.body;
    const result = await hotelOTAIntegrations.processBooking(booking);
    res.json(result);
  } catch (error) {
    logger.error('Booking processing failed:', error);
    res.status(500).json({ error: 'Booking processing failed' });
  }
});

// Get expert insights
app.get('/api/expert-insights', async (req, res) => {
  try {
    const { hotelId, checkIn } = req.query;
    const insights = await hotelOTAIntegrations.getExpertInsights(
      new Date(checkIn as string),
      hotelId as string
    );
    res.json(insights);
  } catch (error) {
    logger.error('Expert insights failed:', error);
    res.status(500).json({ error: 'Failed to get expert insights' });
  }
});

// Pre-arrival notification
app.post('/api/pre-arrival', async (req, res) => {
  try {
    const { guestId, booking } = req.body;
    await hotelOTAIntegrations.sendPreArrival(guestId, booking);
    res.json({ success: true });
  } catch (error) {
    logger.error('Pre-arrival failed:', error);
    res.status(500).json({ error: 'Pre-arrival notification failed' });
  }
});

// Checkout with feedback
app.post('/api/checkout', async (req, res) => {
  try {
    const { guestId, bookingId, rating, feedback } = req.body;
    await hotelOTAIntegrations.processCheckout(guestId, bookingId, rating, feedback);
    res.json({ success: true });
  } catch (error) {
    logger.error('Checkout failed:', error);
    res.status(500).json({ error: 'Checkout processing failed' });
  }
});

// REZ Intelligence routes
app.use('/api/rez-intelligence', rezIntelligence.getRouter());

const PORT = process.env.PORT || 4200;

app.listen(PORT, () => {
  logger.info(`Hotel OTA API running on port ${PORT}`);
});

export default app;
