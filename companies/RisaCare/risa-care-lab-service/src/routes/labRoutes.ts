import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TestCategory } from '../models/lab.js';
import { labService } from '../services/labService.js';
import { testService } from '../services/testService.js';
import { sampleService } from '../services/sampleService.js';
import { reportService } from '../services/reportService.js';
import { orderService } from '../services/orderService.js';

const router = Router();

// Validation schemas
const setupLabSchema = z.object({
  name: z.string().min(1),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
    country: z.string().default('India'),
  }),
  certifications: z.array(z.string()).default([]),
  accreditations: z.array(z.string()).default([]),
  tests: z.array(z.string()).default([]),
  collectionCenters: z.array(z.string()).default([]),
  contact: z.object({
    phone: z.string(),
    email: z.string().email(),
    emergency: z.string().optional(),
  }),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
    days: z.array(z.string()).default(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  }),
});

const addTestSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['hematology', 'biochemistry', 'microbiology', 'pathology', 'imaging']),
  description: z.string().optional(),
  parameters: z.array(z.object({
    name: z.string().min(1),
    unit: z.string().min(1),
    referenceRange: z.object({ min: z.number(), max: z.number() }),
    method: z.string().optional(),
  })).default([]),
  sampleType: z.string().min(1),
  containerType: z.string().optional(),
  volume: z.string().optional(),
  turnaroundTime: z.number().min(1),
  price: z.number().min(0),
  equipment: z.array(z.string()).default([]),
  preparation: z.string().optional(),
  fastingRequired: z.boolean().default(false),
});

const collectSampleSchema = z.object({
  patientId: z.string().min(1),
  testIds: z.array(z.string().min(1)).min(1),
  collectedBy: z.string().min(1),
  containerType: z.string().min(1),
  volume: z.string().optional(),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  notes: z.string().optional(),
});

const createReportSchema = z.object({
  sampleId: z.string().min(1),
  patientId: z.string().min(1),
  orderedBy: z.string().min(1),
  tests: z.array(z.object({
    testId: z.string().min(1),
    testName: z.string().min(1),
  })).min(1),
  pathologistId: z.string().optional(),
  pathologistName: z.string().optional(),
});

const updateResultsSchema = z.object({
  results: z.array(z.object({
    testId: z.string().min(1),
    parameterName: z.string().min(1),
    value: z.union([z.string(), z.number()]),
    unit: z.string().min(1),
    referenceRange: z.object({ min: z.number(), max: z.number() }),
    method: z.string().optional(),
    instrument: z.string().optional(),
    notes: z.string().optional(),
  })).min(1),
});

const createOrderSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  testIds: z.array(z.string().min(1)).min(1),
  priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

// ============ LAB ROUTES ============

// GET /lab - Get lab info
router.get('/lab', (req: Request, res: Response) => {
  const lab = labService.getLab();
  if (!lab) {
    return res.status(404).json({ error: 'Lab not initialized' });
  }
  res.json(lab);
});

// POST /lab - Setup lab
router.post('/lab', (req: Request, res: Response) => {
  try {
    const data = setupLabSchema.parse(req.body);
    const lab = labService.setupLab(data);
    res.status(201).json(lab);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to setup lab' });
  }
});

// PUT /lab - Update lab
router.put('/lab', (req: Request, res: Response) => {
  try {
    const lab = labService.updateLab(req.body);
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    res.json(lab);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lab' });
  }
});

// POST /lab/collection-centers - Add collection center
router.post('/lab/collection-centers', (req: Request, res: Response) => {
  try {
    const center = labService.addCollectionCenter(req.body);
    res.status(201).json(center);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add collection center' });
  }
});

// GET /lab/collection-centers - Get all collection centers
router.get('/lab/collection-centers', (req: Request, res: Response) => {
  const centers = labService.getAllCollectionCenters();
  res.json(centers);
});

// GET /lab/collection-centers/:centerId - Get collection center
router.get('/lab/collection-centers/:centerId', (req: Request, res: Response) => {
  const center = labService.getCollectionCenter(req.params.centerId);
  if (!center) {
    return res.status(404).json({ error: 'Collection center not found' });
  }
  res.json(center);
});

// ============ TEST ROUTES ============

// GET /tests - List tests
router.get('/tests', (req: Request, res: Response) => {
  const { category, isActive } = req.query;
  const filters: { category?: TestCategory; isActive?: boolean } = {};

  if (category && typeof category === 'string') {
    filters.category = category as TestCategory;
  }
  if (isActive !== undefined) {
    filters.isActive = isActive === 'true';
  }

  const tests = testService.getTests(filters);
  res.json(tests);
});

// GET /tests/categories - Get all categories
router.get('/tests/categories', (req: Request, res: Response) => {
  const categories = testService.getCategories();
  res.json(categories);
});

// GET /tests/category/:category - Tests by category
router.get('/tests/category/:category', (req: Request, res: Response) => {
  const category = req.params.category as TestCategory;
  const tests = testService.getTestsByCategory(category);
  res.json(tests);
});

// GET /tests/search - Search tests
router.get('/tests/search', (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Search query required' });
  }
  const tests = testService.searchTests(q);
  res.json(tests);
});

// GET /tests/:testId - Test details
router.get('/tests/:testId', (req: Request, res: Response) => {
  const test = testService.getTest(req.params.testId);
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }
  res.json(test);
});

// POST /tests - Add test
router.post('/tests', (req: Request, res: Response) => {
  try {
    const data = addTestSchema.parse(req.body);
    const test = testService.addTest(data);
    res.status(201).json(test);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to add test' });
  }
});

// PUT /tests/:testId - Update test
router.put('/tests/:testId', (req: Request, res: Response) => {
  try {
    const test = testService.updateTest(req.params.testId, req.body);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// ============ SAMPLE ROUTES ============

// POST /samples - Collect sample
router.post('/samples', (req: Request, res: Response) => {
  try {
    const data = collectSampleSchema.parse(req.body);
    const sample = sampleService.collectSample(data);
    res.status(201).json(sample);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to collect sample' });
  }
});

// GET /samples/:sampleId - Get sample status
router.get('/samples/:sampleId', (req: Request, res: Response) => {
  const sample = sampleService.getSample(req.params.sampleId);
  if (!sample) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  res.json(sample);
});

// GET /samples/:sampleId/track - Track sample
router.get('/samples/:sampleId/track', (req: Request, res: Response) => {
  const tracking = sampleService.trackSample(req.params.sampleId);
  if (!tracking) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  res.json(tracking);
});

// PUT /samples/:sampleId/receive - Receive sample
router.put('/samples/:sampleId/receive', (req: Request, res: Response) => {
  try {
    const { receivedBy } = req.body;
    if (!receivedBy) {
      return res.status(400).json({ error: 'receivedBy is required' });
    }
    const sample = sampleService.receiveSample(req.params.sampleId, receivedBy);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    res.json(sample);
  } catch (error) {
    res.status(500).json({ error: 'Failed to receive sample' });
  }
});

// PUT /samples/:sampleId/status - Update sample status
router.put('/samples/:sampleId/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const sample = sampleService.updateSampleStatus(req.params.sampleId, status);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    res.json(sample);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sample status' });
  }
});

// GET /samples/barcode/:barcode - Get sample by barcode
router.get('/samples/barcode/:barcode', (req: Request, res: Response) => {
  const sample = sampleService.getSampleByBarcode(req.params.barcode);
  if (!sample) {
    return res.status(404).json({ error: 'Sample not found' });
  }
  res.json(sample);
});

// GET /samples/patient/:patientId - Get patient samples
router.get('/samples/patient/:patientId', (req: Request, res: Response) => {
  const samples = sampleService.getSamplesByPatient(req.params.patientId);
  res.json(samples);
});

// GET /samples/stats - Get sample statistics
router.get('/samples/stats', (req: Request, res: Response) => {
  const stats = sampleService.getSampleCount();
  res.json(stats);
});

// ============ REPORT ROUTES ============

// POST /reports - Create report
router.post('/reports', (req: Request, res: Response) => {
  try {
    const data = createReportSchema.parse(req.body);
    const report = reportService.createReport(data);
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// GET /reports/:reportId - Get report
router.get('/reports/:reportId', (req: Request, res: Response) => {
  const report = reportService.getReport(req.params.reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// PUT /reports/:reportId/results - Update results
router.put('/reports/:reportId/results', (req: Request, res: Response) => {
  try {
    const data = updateResultsSchema.parse(req.body);
    const report = reportService.updateResults(req.params.reportId, data.results);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update results' });
  }
});

// POST /reports/:reportId/results - Add single result
router.post('/reports/:reportId/results', (req: Request, res: Response) => {
  try {
    const result = reportService.addResult(req.params.reportId, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add result' });
  }
});

// PUT /reports/:reportId/interpretation - Set interpretation
router.put('/reports/:reportId/interpretation', (req: Request, res: Response) => {
  try {
    const { interpretation } = req.body;
    if (!interpretation) {
      return res.status(400).json({ error: 'Interpretation is required' });
    }
    const report = reportService.setInterpretation(req.params.reportId, interpretation);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set interpretation' });
  }
});

// PUT /reports/:reportId/verify - Verify report
router.put('/reports/:reportId/verify', (req: Request, res: Response) => {
  try {
    const { pathologistId, pathologistName } = req.body;
    if (!pathologistId || !pathologistName) {
      return res.status(400).json({ error: 'pathologistId and pathologistName are required' });
    }
    const report = reportService.verifyReport(req.params.reportId, pathologistId, pathologistName);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify report' });
  }
});

// PUT /reports/:reportId/release - Release report
router.put('/reports/:reportId/release', (req: Request, res: Response) => {
  const report = reportService.releaseReport(req.params.reportId);
  if (!report) {
    return res.status(400).json({ error: 'Cannot release report - missing results or critical results not verified' });
  }
  res.json(report);
});

// GET /reports/patient/:patientId - Patient reports
router.get('/reports/patient/:patientId', (req: Request, res: Response) => {
  const reports = reportService.getReportsByPatient(req.params.patientId);
  res.json(reports);
});

// GET /reports/doctor/:doctorId - Doctor reports
router.get('/reports/doctor/:doctorId', (req: Request, res: Response) => {
  const reports = reportService.getReportsByDoctor(req.params.doctorId);
  res.json(reports);
});

// GET /reports/status/:status - Reports by status
router.get('/reports/status/:status', (req: Request, res: Response) => {
  const status = req.params.status as 'draft' | 'verified' | 'released' | 'cancelled';
  const reports = reportService.getReportsByStatus(status);
  res.json(reports);
});

// GET /reports/stats - Report statistics
router.get('/reports/stats', (req: Request, res: Response) => {
  const stats = reportService.getReportCount();
  res.json(stats);
});

// ============ ORDER ROUTES ============

// POST /orders - Create order
router.post('/orders', (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const result = orderService.createOrder(data);
    if (result.error) {
      return res.status(400).json({ error: result.error, invalidTests: result.invalidTests });
    }
    res.status(201).json(result.order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /orders/:orderId - Get order
router.get('/orders/:orderId', (req: Request, res: Response) => {
  const order = orderService.getOrder(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// GET /orders/patient/:patientId - Patient orders
router.get('/orders/patient/:patientId', (req: Request, res: Response) => {
  const orders = orderService.getOrdersByPatient(req.params.patientId);
  res.json(orders);
});

// GET /orders/doctor/:doctorId - Doctor orders
router.get('/orders/doctor/:doctorId', (req: Request, res: Response) => {
  const orders = orderService.getOrdersByDoctor(req.params.doctorId);
  res.json(orders);
});

// PUT /orders/:orderId/tests - Add tests to order
router.put('/orders/:orderId/tests', (req: Request, res: Response) => {
  try {
    const { testIds } = req.body;
    if (!Array.isArray(testIds)) {
      return res.status(400).json({ error: 'testIds must be an array' });
    }
    const result = orderService.addTests(req.params.orderId, testIds);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add tests' });
  }
});

// PUT /orders/:orderId/cancel - Cancel order
router.put('/orders/:orderId/cancel', (req: Request, res: Response) => {
  const order = orderService.cancelOrder(req.params.orderId);
  if (!order) {
    return res.status(400).json({ error: 'Cannot cancel order - not found or already completed' });
  }
  res.json(order);
});

// POST /orders/:orderId/samples - Link sample to order
router.post('/orders/:orderId/samples', (req: Request, res: Response) => {
  try {
    const { sampleId } = req.body;
    if (!sampleId) {
      return res.status(400).json({ error: 'sampleId is required' });
    }
    const order = orderService.linkSample(req.params.orderId, sampleId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to link sample' });
  }
});

// POST /orders/:orderId/reports - Link report to order
router.post('/orders/:orderId/reports', (req: Request, res: Response) => {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      return res.status(400).json({ error: 'reportId is required' });
    }
    const order = orderService.linkReport(req.params.orderId, reportId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to link report' });
  }
});

// PUT /orders/:orderId/payment - Update payment
router.put('/orders/:orderId/payment', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'amount is required' });
    }
    const order = orderService.recordPayment(req.params.orderId, amount);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// GET /orders/stats - Order statistics
router.get('/orders/stats', (req: Request, res: Response) => {
  const stats = orderService.getOrderStats();
  res.json(stats);
});

// ============ HEALTH CHECK ============

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'risa-care-lab', timestamp: new Date().toISOString() });
});

export default router;
