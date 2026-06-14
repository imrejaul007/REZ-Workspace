/**
 * Agreement Service Routes
 * Proxies requests to risna-agreement-service (port 4128)
 */

import { Router } from 'express';
import axios, { AxiosInstance } from 'axios';

const router = Router();

// Service URL
const AGREEMENT_SERVICE_URL = process.env.AGREEMENT_SERVICE_URL || 'http://localhost:4128';

// Create HTTP client
const agreementServiceClient: AxiosInstance = axios.create({
  baseURL: AGREEMENT_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// AGREEMENT CRUD
// ============================================

/**
 * GET /api/v1/agreements
 * List all agreements
 */
router.get('/', async (req, res) => {
  try {
    const { status, type, dealId, propertyId, limit, offset } = req.query;
    const params: Record<string, any> = {};

    if (status) params.status = status;
    if (type) params.type = type;
    if (dealId) params.dealId = dealId;
    if (propertyId) params.propertyId = propertyId;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;

    const response = await agreementServiceClient.get('/api/v1/agreements', { params });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/agreements
 * Create a new agreement
 */
router.post('/', async (req, res) => {
  try {
    const response = await agreementServiceClient.post('/api/v1/agreements', req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/agreements/:id
 * Get agreement by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const response = await agreementServiceClient.get(`/api/v1/agreements/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * PUT /api/v1/agreements/:id
 * Update agreement
 */
router.put('/:id', async (req, res) => {
  try {
    const response = await agreementServiceClient.put(`/api/v1/agreements/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * DELETE /api/v1/agreements/:id
 * Delete agreement (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const response = await agreementServiceClient.delete(`/api/v1/agreements/${req.params.id}`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// PDF GENERATION
// ============================================

/**
 * POST /api/v1/agreements/:id/generate
 * Generate PDF agreement
 */
router.post('/:id/generate', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/generate`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/agreements/:id/pdf
 * Download PDF
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const response = await agreementServiceClient.get(`/api/v1/agreements/${req.params.id}/pdf`, {
      responseType: 'arraybuffer'
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=agreement-${req.params.id}.pdf`);
    res.send(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/agreements/:id/preview
 * Preview agreement (HTML)
 */
router.post('/:id/preview', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/preview`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/agreements/templates
 * List available templates
 */
router.get('/templates/list', async (req, res) => {
  try {
    const response = await agreementServiceClient.get('/api/v1/agreements/templates');
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// E-SIGNING
// ============================================

/**
 * POST /api/v1/agreements/:id/sign/buyer
 * Buyer e-sign
 */
router.post('/:id/sign/buyer', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/sign/buyer`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/agreements/:id/sign/seller
 * Seller e-sign
 */
router.post('/:id/sign/seller', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/sign/seller`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/agreements/:id/sign/witness
 * Witness e-sign
 */
router.post('/:id/sign/witness', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/sign/witness`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/agreements/:id/signatures
 * Get signature status
 */
router.get('/:id/signatures', async (req, res) => {
  try {
    const response = await agreementServiceClient.get(`/api/v1/agreements/${req.params.id}/signatures`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// REGISTRATION
// ============================================

/**
 * POST /api/v1/agreements/:id/register
 * Submit for registration
 */
router.post('/:id/register', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/register`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/agreements/:id/registered
 * Mark as registered
 */
router.post('/:id/registered', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/registered`, req.body);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/agreements/:id/registration-status
 * Get registration status
 */
router.get('/:id/registration-status', async (req, res) => {
  try {
    const response = await agreementServiceClient.get(`/api/v1/agreements/${req.params.id}/registration-status`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

// ============================================
// PAYMENTS
// ============================================

/**
 * POST /api/v1/agreements/:id/payments
 * Add payment
 */
router.post('/:id/payments', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(`/api/v1/agreements/${req.params.id}/payments`, req.body);
    res.status(201).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * GET /api/v1/agreements/:id/payments
 * Get payment schedule
 */
router.get('/:id/payments', async (req, res) => {
  try {
    const response = await agreementServiceClient.get(`/api/v1/agreements/${req.params.id}/payments`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

/**
 * POST /api/v1/agreements/:id/payments/:paymentId/confirm
 * Confirm payment
 */
router.post('/:id/payments/:paymentId/confirm', async (req, res) => {
  try {
    const response = await agreementServiceClient.post(
      `/api/v1/agreements/${req.params.id}/payments/${req.params.paymentId}/confirm`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Service unavailable' });
  }
});

export default router;