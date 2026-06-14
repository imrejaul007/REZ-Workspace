/**
 * Lab Integration Routes - Healthcare Lab Order Management
 * Route: /api/v1/merchant/lab
 */

import { Router } from 'express';
import { merchantAuth } from '../middleware/auth';
import { labService, TestInput, ResultInput } from '../services/labService';
import { errorResponse, errors } from '../utils/response';

const router = Router();

// All routes require merchant authentication
router.use(merchantAuth);

/**
 * POST /lab/orders - Create a new lab order
 */
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      storeId,
      doctorId,
      tests,
      labPartner,
    } = req.body;

    // Validate required fields
    if (!patientId || !storeId || !doctorId) {
      return errorResponse(res, errors.badRequest('Missing required fields: patientId, storeId, doctorId'));
    }

    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return errorResponse(res, errors.badRequest('At least one test is required'));
    }

    // Validate each test
    for (const test of tests) {
      if (!test.code || !test.name || typeof test.price !== 'number') {
        return errorResponse(res, errors.badRequest('Each test must have code, name, and price'));
      }
      if (test.price < 0) {
        return errorResponse(res, errors.badRequest('Test price cannot be negative'));
      }
    }

    const order = await labService.orderTests(
      patientId,
      tests,
      doctorId,
      storeId,
      req.merchantId!,
      labPartner
    );

    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lab order',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/orders/patient/:patientId - Get all lab orders for a patient
 */
router.get('/orders/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, limit, page } = req.query;

    const orders = await labService.getOrders(patientId, req.merchantId);

    // Filter by status if provided
    let filtered = orders;
    if (status) {
      filtered = orders.filter(o => o.status === status);
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching patient lab orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient lab orders',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/orders/:id - Get a specific lab order
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await labService.getOrder(id);

    if (!order) {
      return errorResponse(res, errors.notFound('Lab order'));
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching lab order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab order',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/orders/store/:storeId - Get lab orders for a store
 */
router.get('/orders/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status, limit, page } = req.query;

    const result = await labService.getStoreOrders(
      storeId,
      req.merchantId!,
      {
        status: status as unknown,
        limit: limit ? parseInt(limit as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
      }
    );

    res.json({
      success: true,
      data: result.orders,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (parseInt(limit as string) || 20)),
      },
    });
  } catch (error) {
    console.error('Error fetching store lab orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store lab orders',
      error: (error as Error).message,
    });
  }
});

/**
 * PUT /lab/orders/:id/status - Update lab order status
 */
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ordered', 'sample_collected', 'processing', 'ready', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, errors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`));
    }

    const order = await labService.updateStatus(id, status);

    if (!order) {
      return errorResponse(res, errors.notFound('Lab order'));
    }

    res.json({
      success: true,
      message: 'Lab order status updated',
      data: order,
    });
  } catch (error) {
    console.error('Error updating lab order status:', error);

    if ((error as Error).message.includes('Invalid status transition')) {
      return res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update lab order status',
      error: (error as Error).message,
    });
  }
});

/**
 * POST /lab/orders/:id/results - Add results to a lab order
 */
router.post('/orders/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return errorResponse(res, errors.badRequest('At least one result is required'));
    }

    // Validate each result
    for (const result of results) {
      if (!result.testCode || !result.value || !result.unit || !result.referenceRange || !result.status) {
        return errorResponse(res, errors.badRequest('Each result must have testCode, value, unit, referenceRange, and status'));
      }
      if (!['normal', 'high', 'low'].includes(result.status)) {
        return errorResponse(res, errors.badRequest('Result status must be normal, high, or low'));
      }
    }

    const order = await labService.addResults(id, results as ResultInput[]);

    if (!order) {
      return errorResponse(res, errors.notFound('Lab order'));
    }

    res.json({
      success: true,
      message: 'Lab results added successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error adding lab results:', error);

    if ((error as Error).message.includes('not found in order')) {
      return res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add lab results',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/orders/:id/report - Generate or get lab report URL
 */
router.get('/orders/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    // Check if format is HTML (print view)
    if (format === 'html') {
      const html = await labService.printReport(id);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="lab-report-${id}.html"`);
      res.send(html);
      return;
    }

    // Default: generate report URL
    const reportUrl = await labService.generateReport(id);

    res.json({
      success: true,
      data: {
        reportUrl,
        orderId: id,
      },
    });
  } catch (error) {
    console.error('Error generating lab report:', error);

    if ((error as Error).message === 'Lab order not found') {
      return errorResponse(res, errors.notFound('Lab order'));
    }

    if ((error as Error).message === 'No results available to generate report') {
      return res.status(400).json({
        success: false,
        message: 'No results available to generate report',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate lab report',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/partners - Get available lab partners
 */
router.get('/partners', async (req, res) => {
  try {
    const partners = await labService.getLabPartners();

    res.json({
      success: true,
      data: partners,
    });
  } catch (error) {
    console.error('Error fetching lab partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab partners',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/partners/:id - Get a specific lab partner
 */
router.get('/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await labService.getLabPartner(id);

    if (!partner) {
      return errorResponse(res, errors.notFound('Lab partner'));
    }

    res.json({
      success: true,
      data: partner,
    });
  } catch (error) {
    console.error('Error fetching lab partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab partner',
      error: (error as Error).message,
    });
  }
});

/**
 * GET /lab/orders/status/:status - Get orders by status for merchant
 */
router.get('/orders/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { limit } = req.query;

    const validStatuses = ['ordered', 'sample_collected', 'processing', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, errors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`));
    }

    const orders = await labService.getOrdersByStatus(
      req.merchantId!,
      status as unknown,
      limit ? parseInt(limit as string) : 50
    );

    res.json({
      success: true,
      data: orders,
      meta: {
        status,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders by status',
      error: (error as Error).message,
    });
  }
});

export default router;
