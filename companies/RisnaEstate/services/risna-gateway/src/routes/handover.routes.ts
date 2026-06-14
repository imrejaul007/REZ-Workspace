/**
 * Handover Service Routes
 * Proxies requests to risna-handover-service (port 4129)
 */

import { Router } from 'express';
import axios, { AxiosInstance } from 'axios';

const router = Router();

// Service URL
const HANDOVER_SERVICE_URL = process.env.HANDOVER_SERVICE_URL || 'http://localhost:4129';

// Create HTTP client
const handoverServiceClient: AxiosInstance = axios.create({
  baseURL: HANDOVER_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// HANDOVER CRUD
// ============================================

/**
 * GET /api/v1/handovers
 * List all handovers
 */
router.get('/', async (req, res) => {
  try {
    const { status, dealId, propertyId, fromDate, toDate, limit, offset } = req.query;
    const params: Record<string, any> = {};

    if (status) params.status = status;
    if (dealId) params.dealId = dealId;
    if (propertyId) params.propertyId = propertyId;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    const response = await handoverServiceClient.get('/api/v1/handovers', { params });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers
 * Schedule a new handover
 */
router.post('/', async (req, res) => {
  try {
    const response = await handoverServiceClient.post('/api/v1/handovers', req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/handovers/:id
 * Get handover by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const response = await handoverServiceClient.get(`/api/v1/handovers/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * PUT /api/v1/handovers/:id
 * Update handover
 */
router.put('/:id', async (req, res) => {
  try {
    const response = await handoverServiceClient.put(`/api/v1/handovers/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * DELETE /api/v1/handovers/:id
 * Cancel handover
 */
router.delete('/:id', async (req, res) => {
  try {
    const response = await handoverServiceClient.delete(`/api/v1/handovers/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// SCHEDULING
// ============================================

/**
 * POST /api/v1/handovers/:id/schedule
 * Schedule handover
 */
router.post('/:id/schedule', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/schedule`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/handovers/available-slots
 * Get available time slots
 */
router.get('/slots/available', async (req, res) => {
  try {
    const { date, propertyId } = req.query;
    const params: Record<string, any> = {};
    if (date) params.date = date;
    if (propertyId) params.propertyId = propertyId;

    const response = await handoverServiceClient.get('/api/v1/handovers/available-slots', { params });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/reschedule
 * Reschedule handover
 */
router.post('/:id/reschedule', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/reschedule`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// CHECK-IN
// ============================================

/**
 * POST /api/v1/handovers/:id/checkin
 * Buyer check-in
 */
router.post('/:id/checkin', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/checkin`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/handovers/:id/checkin-status
 * Get check-in status
 */
router.get('/:id/checkin-status', async (req, res) => {
  try {
    const response = await handoverServiceClient.get(`/api/v1/handovers/${req.params.id}/checkin-status`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// KEYS & DOCUMENTS
// ============================================

/**
 * POST /api/v1/handovers/:id/keys
 * Update keys status
 */
router.post('/:id/keys', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/keys`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/keys/confirm
 * Confirm keys handed over
 */
router.post('/:id/keys/confirm', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/keys/confirm`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/documents
 * Update documents status
 */
router.post('/:id/documents', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/documents`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/documents/confirm
 * Confirm documents handed over
 */
router.post('/:id/documents/confirm', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/documents/confirm`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// CONDITION REPORT
// ============================================

/**
 * POST /api/v1/handovers/:id/condition
 * Submit condition report
 */
router.post('/:id/condition', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/condition`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * PUT /api/v1/handovers/:id/condition
 * Update condition report
 */
router.put('/:id/condition', async (req, res) => {
  try {
    const response = await handoverServiceClient.put(`/api/v1/handovers/${req.params.id}/condition`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// METER READINGS
// ============================================

/**
 * POST /api/v1/handovers/:id/meters
 * Submit meter readings
 */
router.post('/:id/meters', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/meters`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// CHECKLIST
// ============================================

/**
 * GET /api/v1/handovers/:id/checklist
 * Get checklist
 */
router.get('/:id/checklist', async (req, res) => {
  try {
    const response = await handoverServiceClient.get(`/api/v1/handovers/${req.params.id}/checklist`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/checklist/:itemId
 * Update checklist item
 */
router.post('/:id/checklist/:itemId', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(
      `/api/v1/handovers/${req.params.id}/checklist/${req.params.itemId}`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/checklist/complete
 * Mark checklist complete
 */
router.post('/:id/checklist/complete', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/checklist/complete`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// DISPUTES
// ============================================

/**
 * POST /api/v1/handovers/:id/disputes
 * Raise dispute
 */
router.post('/:id/disputes', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/disputes`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/handovers/:id/disputes
 * List disputes
 */
router.get('/:id/disputes', async (req, res) => {
  try {
    const response = await handoverServiceClient.get(`/api/v1/handovers/${req.params.id}/disputes`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * PUT /api/v1/handovers/:id/disputes/:disputeId
 * Update dispute
 */
router.put('/:id/disputes/:disputeId', async (req, res) => {
  try {
    const response = await handoverServiceClient.put(
      `/api/v1/handovers/${req.params.id}/disputes/${req.params.disputeId}`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/disputes/:disputeId/resolve
 * Resolve dispute
 */
router.post('/:id/disputes/:disputeId/resolve', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(
      `/api/v1/handovers/${req.params.id}/disputes/${req.params.disputeId}/resolve`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// ACCEPTANCE & COMPLETION
// ============================================

/**
 * POST /api/v1/handovers/:id/accept
 * Buyer accepts handover
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/accept`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/reject
 * Buyer rejects handover
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/reject`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/complete
 * Complete handover
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/complete`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/cancel
 * Cancel handover
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/cancel`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// REPORT & FEEDBACK
// ============================================

/**
 * GET /api/v1/handovers/:id/report
 * Download handover report
 */
router.get('/:id/report', async (req, res) => {
  try {
    const response = await handoverServiceClient.get(`/api/v1/handovers/${req.params.id}/report`, {
      responseType: 'arraybuffer'
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=handover-${req.params.id}.pdf`);
    res.send(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/handovers/:id/feedback
 * Submit feedback
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const response = await handoverServiceClient.post(`/api/v1/handovers/${req.params.id}/feedback`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// TIMELINE
// ============================================

/**
 * GET /api/v1/handovers/:id/timeline
 * Get handover timeline
 */
router.get('/:id/timeline', async (req, res) => {
  try {
    const response = await handoverServiceClient.get(`/api/v1/handovers/${req.params.id}/timeline`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

export default router;