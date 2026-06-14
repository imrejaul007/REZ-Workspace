/**
 * GlamAI Bridge Service
 *
 * Connects REZ Salon ecosystem to GlamAI:
 * - Salon Booking → GlamAI (appointments sync)
 * - Salon CRM → GlamAI (customer data sync)
 * - Salon POS → GlamAI (transaction sync)
 * - REZ QR → GlamAI (check-in events)
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import { logger } from './utils/logger.js';

const app = express();
const PORT = parseInt(process.env.BRIDGE_PORT || '4905', 10);

// Configuration
const GLAMAI_URL = process.env.GLAMAI_URL || 'http://localhost:3000';
const BOOKING_URL = process.env.BOOKING_URL || 'http://localhost:4201';
const CRM_URL = process.env.CRM_URL || 'http://localhost:4903';
const POS_URL = process.env.POS_URL || 'http://localhost:4902';
const QR_URL = process.env.QR_URL || 'http://localhost:3009';

// HTTP clients
const glamai = axios.create({ baseURL: GLAMAI_URL, timeout: 10000 });
const booking = axios.create({ baseURL: BOOKING_URL, timeout: 10000 });
const crm = axios.create({ baseURL: CRM_URL, timeout: 10000 });
const pos = axios.create({ baseURL: POS_URL, timeout: 10000 });
const qr = axios.create({ baseURL: QR_URL, timeout: 10000 });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'glamai-bridge', timestamp: new Date().toISOString() });
});

// ============ APPOINTMENT SYNC ============

/**
 * POST /api/sync/appointment
 * Called when appointment is created/updated → sync to GlamAI
 */
app.post('/api/sync/appointment', async (req: Request, res: Response) => {
  try {
    const { appointmentId, customerId, stylistId, serviceName, date, startTime, endTime, status } = req.body;

    // Get customer context from CRM
    const customerRes = await crm.get(`/api/customers/${customerId}`).catch(() => null);
    const customer = customerRes?.data?.data;

    // Send to GlamAI
    await glamai.post('/api/session/checkin', {
      customerId,
      salonId: req.body.salonId,
      appointmentId,
      serviceName,
      stylistId
    });

    logger.info(`Synced appointment ${appointmentId} to GlamAI`);
    res.json({ success: true, appointmentId });
  } catch (error: any) {
    logger.error('Appointment sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to sync appointment' });
  }
});

/**
 * POST /api/sync/appointment-complete
 * Called when service is completed → record in GlamAI
 */
app.post('/api/sync/appointment-complete', async (req: Request, res: Response) => {
  try {
    const { appointmentId, customerId, stylistId, stylistName, serviceId, serviceName, products, notes, satisfaction } = req.body;

    // Record service completion in GlamAI
    await glamai.post('/api/stylists/service-complete', {
      customerId,
      stylistId,
      stylistName,
      serviceId,
      serviceName,
      products: products || [],
      notes,
      satisfaction
    });

    logger.info(`Synced service completion for appointment ${appointmentId}`);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Service completion sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to sync completion' });
  }
});

// ============ QR CHECK-IN SYNC ============

/**
 * POST /api/sync/checkin
 * Called when customer scans QR → trigger GlamAI check-in
 */
app.post('/api/sync/checkin', async (req: Request, res: Response) => {
  try {
    const { customerId, salonId, qrData } = req.body;

    // Process check-in in GlamAI
    const checkinRes = await glamai.post('/api/session/checkin', {
      customerId,
      salonId,
      qrData
    });

    logger.info(`Processed QR check-in for customer ${customerId}`);
    res.json({ success: true, data: checkinRes.data });
  } catch (error: any) {
    logger.error('Check-in sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process check-in' });
  }
});

// ============ CUSTOMER SYNC ============

/**
 * POST /api/sync/customer-profile
 * Sync customer beauty profile from GlamAI to CRM
 */
app.post('/api/sync/customer-profile', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    // Get beauty profile from GlamAI
    const profileRes = await glamai.get(`/api/customers/${customerId}/profile`);
    const beautyProfile = profileRes.data?.data;

    if (beautyProfile) {
      // Update CRM with beauty profile
      await crm.put(`/api/customers/${customerId}`, {
        hairType: beautyProfile.hairType,
        hairTexture: beautyProfile.hairTexture,
        scalpCondition: beautyProfile.scalpCondition,
        skinType: beautyProfile.skinType,
        allergies: beautyProfile.allergies
      });

      logger.info(`Synced beauty profile for customer ${customerId}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Customer profile sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to sync profile' });
  }
});

// ============ INVENTORY SYNC ============

/**
 * POST /api/sync/inventory-alert
 * Forward inventory alerts to GlamAI
 */
app.post('/api/sync/inventory-alert', async (req: Request, res: Response) => {
  try {
    const { salonId, alert } = req.body;

    // Get reorder recommendations from GlamAI
    const reorderRes = await glamai.get('/api/inventory/reorder', {
      params: { salonId }
    });

    res.json({ success: true, recommendations: reorderRes.data?.data });
  } catch (error: any) {
    logger.error('Inventory alert sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

// ============ HAIR COLOR SYNC ============

/**
 * POST /api/sync/hair-color
 * Record hair color in GlamAI when done at POS
 */
app.post('/api/sync/hair-color', async (req: Request, res: Response) => {
  try {
    const { customerId, stylistId, stylistName, colorFormula, serviceId } = req.body;

    await glamai.post('/api/memory/hair-color', {
      customerId,
      stylistId,
      stylistName,
      colorFormula,
      serviceId,
      date: new Date()
    });

    logger.info(`Recorded hair color for customer ${customerId}`);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Hair color sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to record hair color' });
  }
});

// ============ STYLIST NOTE SYNC ============

/**
 * POST /api/sync/stylist-note
 * Record stylist note in GlamAI
 */
app.post('/api/sync/stylist-note', async (req: Request, res: Response) => {
  try {
    const { customerId, stylistId, stylistName, note, category } = req.body;

    await glamai.post('/api/memory/stylist-note', {
      customerId,
      stylistId,
      stylistName,
      note,
      category: category || 'general'
    });

    logger.info(`Recorded stylist note for customer ${customerId}`);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Stylist note sync error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to record note' });
  }
});

// ============ REMINDER/ FOLLOW-UP ============

/**
 * POST /api/reminder/beauty-followup
 * Trigger beauty follow-up via WhatsApp/Notification
 */
app.post('/api/reminder/beauty-followup', async (req: Request, res: Response) => {
  try {
    const { customerId, type, message, offer } = req.body;

    // Get customer contact from CRM
    const customerRes = await crm.get(`/api/customers/${customerId}`);
    const customer = customerRes.data?.data;

    if (customer?.phone) {
      // TODO: Send via RABTUL Notification/WhatsApp
      logger.info(`Sending beauty follow-up to ${customer.phone}: ${message}`);
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Beauty follow-up error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to send follow-up' });
  }
});

// ============ DASHBOARD SYNC ============

/**
 * GET /api/salon/:salonId/dashboard
 * Get unified salon dashboard from all services
 */
app.get('/api/salon/:salonId/dashboard', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    // Get data from GlamAI
    const dashboardRes = await glamai.get(`/api/salon/${salonId}/dashboard`);
    const inventoryRes = await glamai.get('/api/inventory/alerts', { params: { salonId } });

    res.json({
      success: true,
      data: {
        ...dashboardRes.data?.data,
        inventoryAlerts: inventoryRes.data?.data
      }
    });
  } catch (error: any) {
    logger.error('Dashboard error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get dashboard' });
  }
});

// ============ TODAY'S APPOINTMENTS FOR STYLIST ============

/**
 * GET /api/stylists/:stylistId/today-with-context
 * Get stylist's appointments with full customer context from GlamAI
 */
app.get('/api/stylists/:stylistId/today-with-context', async (req: Request, res: Response) => {
  try {
    const { stylistId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Get appointments from Booking
    const bookingRes = await booking.get('/api/bookings', {
      params: { stylistId, date: today }
    });
    const appointments = bookingRes.data?.data || [];

    // Enrich with customer context from GlamAI
    const enrichedAppointments = await Promise.all(
      appointments.map(async (apt: any) => {
        try {
          const contextRes = await glamai.get(`/api/stylists/STYLIST_001/customer/${apt.customerId}`);
          return {
            ...apt,
            customerContext: contextRes.data?.data
          };
        } catch {
          return apt;
        }
      })
    );

    res.json({ success: true, data: enrichedAppointments });
  } catch (error: any) {
    logger.error('Stylist appointments error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get appointments' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`GlamAI Bridge running on port ${PORT}`);
  logger.info(`Connecting to GlamAI at ${GLAMAI_URL}`);
  logger.info(`Connecting to Booking at ${BOOKING_URL}`);
  logger.info(`Connecting to CRM at ${CRM_URL}`);
});

export { app };
