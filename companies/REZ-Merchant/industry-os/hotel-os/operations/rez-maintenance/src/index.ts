/**
 * REZ Hotel Maintenance Service
 * Port: 4019
 *
 * Express server with endpoints for:
 * - Maintenance request creation and tracking
 * - Priority levels (emergency, high, medium, low)
 * - Status tracking (pending, assigned, in_progress, completed, cancelled)
 * - Vendor management
 * - Cost tracking
 * - History
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  RequestPriority,
  RequestStatus,
  RequestCategory,
  createRequest,
  getRequest,
  getRequestsByHotel,
  getRequestsByStatus,
  updateRequest,
  assignRequest,
  startProgress,
  completeRequest,
  cancelRequest,
  addNote,
  assignVendor,
  createVendor,
  getVendor,
  getVendorsByHotel,
  getVendorsByCategory,
  updateVendor,
  deactivateVendor,
  getMaintenanceStats,
} from './services/maintenance.service.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4831', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-hotel-maintenance-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ========================
// REQUEST ENDPOINTS
// ========================

// GET /api/requests/:hotelId - Get maintenance requests
app.get('/api/requests/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { status, priority, category, roomId } = req.query;

  let requestList = getRequestsByHotel(hotelId);

  if (status && Object.values(RequestStatus).includes(status as RequestStatus)) {
    requestList = requestList.filter(r => r.status === status);
  }
  if (priority && Object.values(RequestPriority).includes(priority as RequestPriority)) {
    requestList = requestList.filter(r => r.priority === priority);
  }
  if (category && Object.values(RequestCategory).includes(category as RequestCategory)) {
    requestList = requestList.filter(r => r.category === category);
  }
  if (roomId) {
    requestList = requestList.filter(r => r.roomId === roomId);
  }

  res.json({
    success: true,
    data: {
      requests: requestList,
      count: requestList.length,
    },
  });
});

// GET /api/requests/:hotelId/:requestId - Get specific request
app.get('/api/requests/:hotelId/:requestId', (req: Request, res: Response) => {
  const { requestId } = req.params;
  const request = getRequest(requestId);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests - Create maintenance request
app.post('/api/requests', (req: Request, res: Response) => {
  const { hotelId, category, priority, title, description, reportedBy, roomId } = req.body;

  if (!hotelId || 4831!category || 4831!priority || 4831!title || 4831!description || 4831!reportedBy) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'hotelId, category, priority, title, description, and reportedBy are required',
      },
    });
  }

  if (!Object.values(RequestCategory).includes(category)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid category. Must be one of: ${Object.values(RequestCategory).join(', ')}`,
      },
    });
  }

  if (!Object.values(RequestPriority).includes(priority)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid priority. Must be one of: ${Object.values(RequestPriority).join(', ')}`,
      },
    });
  }

  const request = createRequest(hotelId, category, priority, title, description, reportedBy, roomId);

  res.status(201).json({
    success: true,
    data: { request },
  });
});

// PUT /api/requests/:id - Update request
app.put('/api/requests/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, cost, notes } = req.body;

  const existing = getRequest(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  const updates: Record<string, unknown> = {};
  if (status && Object.values(RequestStatus).includes(status)) {
    updates.status = status;
  }
  if (cost !== undefined) {
    updates.cost = cost;
  }
  if (notes) {
    updates.notes = [...existing.notes, notes];
  }

  const request = updateRequest(id, updates as Parameters<typeof updateRequest>[1]);

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests/:id/assign - Assign technician
app.post('/api/requests/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!assignedTo) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'assignedTo is required' },
    });
  }

  const existing = getRequest(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  const request = assignRequest(id, assignedTo);

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests/:id/start - Start work
app.post('/api/requests/:id/start', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = getRequest(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  const request = startProgress(id);

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests/:id/complete - Mark complete
app.post('/api/requests/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const { cost, notes } = req.body;

  const existing = getRequest(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  const request = completeRequest(id, cost, notes);

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests/:id/cancel - Cancel request
app.post('/api/requests/:id/cancel', (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = getRequest(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  const request = cancelRequest(id);

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests/:id/notes - Add note
app.post('/api/requests/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'note is required' },
    });
  }

  const request = addNote(id, note);
  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  res.json({
    success: true,
    data: { request },
  });
});

// POST /api/requests/:id/vendor - Assign vendor
app.post('/api/requests/:id/vendor', (req: Request, res: Response) => {
  const { id } = req.params;
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'vendorId is required' },
    });
  }

  const vendor = getVendor(vendorId);
  if (!vendor) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Vendor not found' },
    });
  }

  const request = assignVendor(id, vendorId);
  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Maintenance request not found' },
    });
  }

  res.json({
    success: true,
    data: { request },
  });
});

// ========================
// VENDOR ENDPOINTS
// ========================

// GET /api/vendors/:hotelId - Get vendors
app.get('/api/vendors/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { category } = req.query;

  let vendorList: ReturnType<typeof getVendorsByHotel>;
  if (category && Object.values(RequestCategory).includes(category as RequestCategory)) {
    vendorList = getVendorsByCategory(hotelId, category as RequestCategory);
  } else {
    vendorList = getVendorsByHotel(hotelId);
  }

  res.json({
    success: true,
    data: {
      vendors: vendorList,
      count: vendorList.length,
    },
  });
});

// GET /api/vendors/:hotelId/:vendorId - Get specific vendor
app.get('/api/vendors/:hotelId/:vendorId', (req: Request, res: Response) => {
  const { vendorId } = req.params;
  const vendor = getVendor(vendorId);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Vendor not found' },
    });
  }

  res.json({
    success: true,
    data: { vendor },
  });
});

// POST /api/vendors - Add vendor
app.post('/api/vendors', (req: Request, res: Response) => {
  const { hotelId, name, category, contactName, phone, email, address } = req.body;

  if (!hotelId || 4831!name || 4831!category || 4831!contactName || 4831!phone || 4831!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'hotelId, name, category, contactName, phone, and email are required',
      },
    });
  }

  if (!Object.values(RequestCategory).includes(category)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid category. Must be one of: ${Object.values(RequestCategory).join(', ')}`,
      },
    });
  }

  const vendor = createVendor(hotelId, name, category, contactName, phone, email, address);

  res.status(201).json({
    success: true,
    data: { vendor },
  });
});

// PUT /api/vendors/:id - Update vendor
app.put('/api/vendors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, contactName, phone, email, address, rating, active } = req.body;

  const existing = getVendor(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Vendor not found' },
    });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (contactName !== undefined) updates.contactName = contactName;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (address !== undefined) updates.address = address;
  if (rating !== undefined) updates.rating = rating;
  if (active !== undefined) updates.active = active;

  const vendor = updateVendor(id, updates as Parameters<typeof updateVendor>[1]);

  res.json({
    success: true,
    data: { vendor },
  });
});

// DELETE /api/vendors/:id - Deactivate vendor
app.delete('/api/vendors/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const success = deactivateVendor(id);
  if (!success) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Vendor not found' },
    });
  }

  res.json({
    success: true,
    message: 'Vendor deactivated',
  });
});

// ========================
// STATS ENDPOINT
// ========================

// GET /api/stats/:hotelId - Get maintenance stats
app.get('/api/stats/:hotelId', (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const stats = getMaintenanceStats(hotelId);

  res.json({
    success: true,
    data: { stats },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[MaintenanceService Error]', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'ERROR',
      message: 'Internal server error',
    },
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\nREZ Hotel Maintenance Service - Port ${PORT}`);
  console.log('Priorities:', Object.values(RequestPriority).join(', '));
  console.log('Statuses:', Object.values(RequestStatus).join(', '));
  console.log('Categories:', Object.values(RequestCategory).join(', '));
  console.log('\nEndpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/requests/:hotelId');
  console.log('  POST /api/requests');
  console.log('  PUT  /api/requests/:id');
  console.log('  POST /api/requests/:id/assign');
  console.log('  POST /api/requests/:id/complete');
  console.log('  GET  /api/vendors/:hotelId');
  console.log('  POST /api/vendors');
  console.log('  GET  /api/stats/:hotelId');
});

export { app, server };
