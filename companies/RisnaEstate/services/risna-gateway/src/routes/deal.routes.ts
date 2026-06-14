/**
 * Deal Service Routes
 * Proxies requests to risna-deal-service (port 4119)
 */

import { Router } from 'express';
import axios, { AxiosInstance } from 'axios';

const router = Router();

// Service URL
const DEAL_SERVICE_URL = process.env.DEAL_SERVICE_URL || 'http://localhost:4119';

// Create HTTP client
const dealServiceClient: AxiosInstance = axios.create({
  baseURL: DEAL_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// DEAL CRUD
// ============================================

/**
 * GET /api/v1/deals
 * List all deals with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { stage, status, brokerId, propertyId, leadId, limit, offset, sortBy, sortOrder } = req.query;
    const params: Record<string, any> = {};

    if (stage) params.stage = stage;
    if (status) params.status = status;
    if (brokerId) params.brokerId = brokerId;
    if (propertyId) params.propertyId = propertyId;
    if (leadId) params.leadId = leadId;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await dealServiceClient.get('/api/v1/deals', { params });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals
 * Create a new deal
 */
router.post('/', async (req, res) => {
  try {
    const response = await dealServiceClient.post('/api/v1/deals', req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/deals/:id
 * Get deal by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const response = await dealServiceClient.get(`/api/v1/deals/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * PUT /api/v1/deals/:id
 * Update deal
 */
router.put('/:id', async (req, res) => {
  try {
    const response = await dealServiceClient.put(`/api/v1/deals/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * DELETE /api/v1/deals/:id
 * Delete deal (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const response = await dealServiceClient.delete(`/api/v1/deals/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// PIPELINE & STATS
// ============================================

/**
 * GET /api/v1/deals/pipeline
 * Get Kanban pipeline view
 */
router.get('/pipeline/summary', async (req, res) => {
  try {
    const response = await dealServiceClient.get('/api/v1/deals/pipeline/summary');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/deals/stats
 * Get deal statistics
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const response = await dealServiceClient.get('/api/v1/deals/stats/overview');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/deals/summary
 * Get deal summary metrics
 */
router.get('/summary', async (req, res) => {
  try {
    const response = await dealServiceClient.get('/api/v1/deals/summary');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// STAGE MANAGEMENT
// ============================================

/**
 * POST /api/v1/deals/:id/stage
 * Move deal to next stage
 */
router.post('/:id/stage', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/stage`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals/:id/win
 * Mark deal as won
 */
router.post('/:id/win', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/win`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals/:id/lose
 * Mark deal as lost
 */
router.post('/:id/lose', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/lose`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// OFFERS
// ============================================

/**
 * POST /api/v1/deals/:id/offers
 * Add offer to deal
 */
router.post('/:id/offers', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/offers`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/deals/:id/offers
 * Get all offers for deal
 */
router.get('/:id/offers', async (req, res) => {
  try {
    const response = await dealServiceClient.get(`/api/v1/deals/${req.params.id}/offers`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * PUT /api/v1/deals/:id/offers/:offerId
 * Update offer status
 */
router.put('/:id/offers/:offerId', async (req, res) => {
  try {
    const response = await dealServiceClient.put(`/api/v1/deals/${req.params.id}/offers/${req.params.offerId}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// PAYMENTS
// ============================================

/**
 * POST /api/v1/deals/:id/payments
 * Add payment milestone
 */
router.post('/:id/payments', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/payments`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/deals/:id/payments
 * Get payment schedule
 */
router.get('/:id/payments', async (req, res) => {
  try {
    const response = await dealServiceClient.get(`/api/v1/deals/${req.params.id}/payments`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals/:id/payments/:paymentId/pay
 * Confirm payment milestone
 */
router.post('/:id/payments/:paymentId/pay', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/payments/${req.params.paymentId}/pay`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// HANDOVER
// ============================================

/**
 * POST /api/v1/deals/:id/handover
 * Initiate handover process
 */
router.post('/:id/handover', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/handover`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals/:id/handover/complete
 * Complete handover
 */
router.post('/:id/handover/complete', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/handover/complete`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// AI SCORING
// ============================================

/**
 * POST /api/v1/deals/:id/score
 * AI score deal
 */
router.post('/:id/score', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/score`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals/:id/analyze
 * AI analyze deal
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/${req.params.id}/analyze`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// TIMELINE
// ============================================

/**
 * GET /api/v1/deals/:id/timeline
 * Get deal timeline
 */
router.get('/:id/timeline', async (req, res) => {
  try {
    const response = await dealServiceClient.get(`/api/v1/deals/${req.params.id}/timeline`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/deals/from-lead/:leadId
 * Create deal from lead
 */
router.post('/from-lead/:leadId', async (req, res) => {
  try {
    const response = await dealServiceClient.post(`/api/v1/deals/from-lead/${req.params.leadId}`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

export default router;