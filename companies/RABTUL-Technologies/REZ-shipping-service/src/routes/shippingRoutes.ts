import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { shippingCore } from '../services/shippingCore.js';
import { RateRequestSchema, ShipmentSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/rates', (req, res) => {
  try {
    const request = RateRequestSchema.parse(req.body);
    const rates = shippingCore.calculateRates(request);
    res.json({ success: true, data: rates });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Rate calculation failed' });
    }
  }
});

router.post('/shipments', (req, res) => {
  try {
    const shipment = ShipmentSchema.parse(req.body);
    const result = shippingCore.createShipment(shipment);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Shipment creation failed' });
    }
  }
});

router.get('/shipments/:trackingId', (req, res) => {
  const shipment = shippingCore.getShipment(req.params.trackingId);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }
  res.json({ success: true, data: shipment });
});

router.patch('/shipments/:trackingId/status', (req, res) => {
  const { status } = req.body;
  const shipment = shippingCore.updateStatus(req.params.trackingId, status);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }
  res.json({ success: true, data: shipment });
});

router.get('/shipments/:trackingId/label', (req, res) => {
  try {
    const label = shippingCore.generateLabel(req.params.trackingId);
    res.json({ success: true, data: { labelUrl: label } });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Shipment not found' });
  }
});

router.get('/track/:trackingId', (req, res) => {
  const tracking = shippingCore.trackShipment(req.params.trackingId);
  if (!tracking) {
    return res.status(404).json({ success: false, error: 'Tracking not found' });
  }
  res.json({ success: true, data: tracking });
});

export default router;
