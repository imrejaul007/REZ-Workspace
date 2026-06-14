// Pharmacy Routes - Express route handlers
import { Router, Request, Response } from 'express';
import { pharmacyService } from '../services/pharmacyService.js';
import { medicineService } from '../services/medicineService.js';
import { prescriptionService } from '../services/prescriptionService.js';
import { inventoryService } from '../services/inventoryService.js';
import { saleService } from '../services/saleService.js';
import { supplierService } from '../services/supplierService.js';
import { MedicineForm, PrescriptionStatus, PaymentMethod } from '../types/pharmacy.js';

const router = Router();

// Helper function to send JSON responses
function sendResponse(res: Response, data: any, message?: string, statusCode = 200) {
  res.status(statusCode).json({
    success: statusCode < 400,
    data,
    message,
  });
}

function sendError(res: Response, error: any, statusCode = 400) {
  const message = error instanceof Error ? error.message : String(error);
  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

// ============ PHARMACY ROUTES ============

// GET /pharmacy - Get pharmacy info
router.get('/pharmacy', (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.query;
    if (pharmacyId && typeof pharmacyId === 'string') {
      const pharmacy = pharmacyService.getPharmacy(pharmacyId);
      if (!pharmacy) {
        return sendError(res, 'Pharmacy not found', 404);
      }
      return sendResponse(res, pharmacy);
    }
    const pharmacies = pharmacyService.getAllPharmacies();
    sendResponse(res, pharmacies);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /pharmacy - Setup new pharmacy
router.post('/pharmacy', (req: Request, res: Response) => {
  try {
    const pharmacy = pharmacyService.setupPharmacy(req.body);
    sendResponse(res, pharmacy, 'Pharmacy setup successfully', 201);
  } catch (error) {
    sendError(res, error, 400);
  }
});

// PUT /pharmacy - Update pharmacy
router.put('/pharmacy', (req: Request, res: Response) => {
  try {
    const { pharmacyId, ...updates } = req.body;
    if (!pharmacyId) {
      return sendError(res, 'Pharmacy ID is required', 400);
    }
    const pharmacy = pharmacyService.updatePharmacy(pharmacyId, updates);
    if (!pharmacy) {
      return sendError(res, 'Pharmacy not found', 404);
    }
    sendResponse(res, pharmacy, 'Pharmacy updated successfully');
  } catch (error) {
    sendError(res, error);
  }
});

// POST /pharmacy/:pharmacyId/pharmacists - Add pharmacist
router.post('/pharmacy/:pharmacyId/pharmacists', (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;
    const pharmacy = pharmacyService.addPharmacist(pharmacyId, req.body);
    if (!pharmacy) {
      return sendError(res, 'Pharmacy not found', 404);
    }
    sendResponse(res, pharmacy, 'Pharmacist added successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// DELETE /pharmacy/:pharmacyId/pharmacists/:pharmacistId - Remove pharmacist
router.delete('/pharmacy/:pharmacyId/pharmacists/:pharmacistId', (req: Request, res: Response) => {
  try {
    const { pharmacyId, pharmacistId } = req.params;
    const pharmacy = pharmacyService.removePharmacist(pharmacyId, pharmacistId);
    if (!pharmacy) {
      return sendError(res, 'Pharmacy or pharmacist not found', 404);
    }
    sendResponse(res, pharmacy, 'Pharmacist removed successfully');
  } catch (error) {
    sendError(res, error);
  }
});

// GET /pharmacy/:pharmacyId/status - Check if pharmacy is open
router.get('/pharmacy/:pharmacyId/status', (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.params;
    const status = pharmacyService.isPharmacyOpen(pharmacyId);
    sendResponse(res, status);
  } catch (error) {
    sendError(res, error);
  }
});

// ============ MEDICINE ROUTES ============

// GET /medicines - List medicines
router.get('/medicines', (req: Request, res: Response) => {
  try {
    const { category, requiresPrescription, form, inStockOnly } = req.query;
    const filters: any = {};
    if (category) filters.category = category as string;
    if (requiresPrescription) filters.requiresPrescription = requiresPrescription === 'true';
    if (form) filters.form = form as MedicineForm;
    if (inStockOnly) filters.inStockOnly = inStockOnly === 'true';

    const medicines = medicineService.getMedicines(filters);
    sendResponse(res, medicines);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /medicines/search - Search medicines
router.get('/medicines/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return sendError(res, 'Search query is required', 400);
    }
    const medicines = medicineService.searchMedicines(q);
    sendResponse(res, medicines);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /medicines/:medicineId - Medicine details
router.get('/medicines/:medicineId', (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;
    const details = medicineService.getMedicineDetails(medicineId);
    if (!details) {
      return sendError(res, 'Medicine not found', 404);
    }
    sendResponse(res, details);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /medicines - Add medicine
router.post('/medicines', (req: Request, res: Response) => {
  try {
    const medicine = medicineService.addMedicine(req.body);
    sendResponse(res, medicine, 'Medicine added successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// PUT /medicines/:medicineId - Update medicine
router.put('/medicines/:medicineId', (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;
    const medicine = medicineService.updateMedicine(medicineId, req.body);
    if (!medicine) {
      return sendError(res, 'Medicine not found', 404);
    }
    sendResponse(res, medicine, 'Medicine updated successfully');
  } catch (error) {
    sendError(res, error);
  }
});

// GET /medicines/:medicineId/batches - Get medicine batches
router.get('/medicines/:medicineId/batches', (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;
    const batches = medicineService.getMedicineBatches(medicineId);
    sendResponse(res, batches);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /medicines/stock/summary - Stock summary
router.get('/medicines/stock/summary', (req: Request, res: Response) => {
  try {
    const summary = medicineService.getStockSummary();
    sendResponse(res, summary);
  } catch (error) {
    sendError(res, error);
  }
});

// ============ INVENTORY ROUTES ============

// POST /inventory/stock - Add stock
router.post('/inventory/stock', (req: Request, res: Response) => {
  try {
    const inventory = inventoryService.addStock({
      ...req.body,
      expiryDate: new Date(req.body.expiryDate),
    });
    if (!inventory) {
      return sendError(res, 'Failed to add stock', 500);
    }
    sendResponse(res, inventory, 'Stock added successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /inventory/low-stock - Low stock alerts
router.get('/inventory/low-stock', (req: Request, res: Response) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
    const alerts = inventoryService.getLowStock(threshold);
    sendResponse(res, alerts);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /inventory/expiring - Expiring medicines
router.get('/inventory/expiring', (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 90;
    const alerts = inventoryService.getExpiringStock(days);
    sendResponse(res, alerts);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /inventory/reorder - Reorder suggestions
router.get('/inventory/reorder', (req: Request, res: Response) => {
  try {
    const suggestions = inventoryService.reorderMedicines();
    sendResponse(res, suggestions);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /inventory/reorder - Process reorder
router.post('/inventory/reorder', (req: Request, res: Response) => {
  try {
    const result = inventoryService.processReorder(req.body);
    sendResponse(res, result, result.message);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /inventory/valuation - Inventory valuation
router.get('/inventory/valuation', (req: Request, res: Response) => {
  try {
    const valuation = inventoryService.getInventoryValuation();
    sendResponse(res, valuation);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /inventory/turnover - Inventory turnover analysis
router.get('/inventory/turnover', (req: Request, res: Response) => {
  try {
    const turnover = inventoryService.getInventoryTurnover();
    sendResponse(res, turnover);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /inventory/expiry-report - Expiry report
router.get('/inventory/expiry-report', (req: Request, res: Response) => {
  try {
    const report = inventoryService.processExpiryAlerts();
    sendResponse(res, report);
  } catch (error) {
    sendError(res, error);
  }
});

// ============ PRESCRIPTION ROUTES ============

// POST /prescriptions - Create prescription
router.post('/prescriptions', (req: Request, res: Response) => {
  try {
    const prescription = prescriptionService.createPrescription(req.body);
    sendResponse(res, prescription, 'Prescription created successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /prescriptions - List prescriptions
router.get('/prescriptions', (req: Request, res: Response) => {
  try {
    const { status, patientId, pharmacyId } = req.query;
    const filters: any = {};
    if (status) filters.status = status as PrescriptionStatus;
    if (patientId) filters.patientId = patientId as string;
    if (pharmacyId) filters.pharmacyId = pharmacyId as string;

    const prescriptions = prescriptionService.getPrescriptions(filters);
    sendResponse(res, prescriptions);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /prescriptions/pending - Get pending prescriptions
router.get('/prescriptions/pending', (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.query;
    const prescriptions = prescriptionService.getPendingPrescriptions(
      pharmacyId as string | undefined
    );
    sendResponse(res, prescriptions);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /prescriptions/validate - Validate prescription
router.post('/prescriptions/validate', (req: Request, res: Response) => {
  try {
    const { prescriptionId, pharmacyId } = req.body;
    if (!prescriptionId) {
      return sendError(res, 'Prescription ID is required', 400);
    }
    const result = prescriptionService.validatePrescription(prescriptionId, pharmacyId);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /prescriptions/:prescriptionId - Get prescription details
router.get('/prescriptions/:prescriptionId', (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = prescriptionService.getPrescription(prescriptionId);
    if (!prescription) {
      return sendError(res, 'Prescription not found', 404);
    }
    sendResponse(res, prescription);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /prescriptions/:prescriptionId/dispense - Dispense prescription
router.post('/prescriptions/:prescriptionId/dispense', (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const dispense = prescriptionService.dispensePrescription({
      ...req.body,
      prescriptionId,
    });
    sendResponse(res, dispense, 'Prescription dispensed successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /prescriptions/:prescriptionId/history - Get dispense history
router.get('/prescriptions/:prescriptionId/history', (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const history = prescriptionService.getDispenseHistory(prescriptionId);
    sendResponse(res, history);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /prescriptions/stats - Prescription statistics
router.get('/prescriptions/stats', (req: Request, res: Response) => {
  try {
    const { pharmacyId } = req.query;
    const stats = prescriptionService.getPrescriptionStats(pharmacyId as string | undefined);
    sendResponse(res, stats);
  } catch (error) {
    sendError(res, error);
  }
});

// ============ SALE ROUTES ============

// GET /sales - List sales
router.get('/sales', (req: Request, res: Response) => {
  try {
    const { patientId, startDate, endDate, paymentMethod, limit, offset } = req.query;
    const filters: any = {};
    if (patientId) filters.patientId = patientId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (paymentMethod) filters.paymentMethod = paymentMethod as PaymentMethod;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = saleService.getSales(filters);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /sales - Create sale
router.post('/sales', (req: Request, res: Response) => {
  try {
    const sale = saleService.createSale(req.body);
    sendResponse(res, sale, 'Sale created successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /sales/daily - Daily sales
router.get('/sales/daily', (req: Request, res: Response) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    const result = saleService.getDailySales(date);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /sales/period - Sales by period
router.get('/sales/period', (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    if (!startDate || !endDate) {
      return sendError(res, 'Start date and end date are required', 400);
    }
    const result = saleService.getSalesByPeriod(
      new Date(startDate as string),
      new Date(endDate as string),
      (groupBy as 'day' | 'week' | 'month') || 'day'
    );
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /sales/summary - Sales summary
router.get('/sales/summary', (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = saleService.getSalesSummary(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    sendResponse(res, summary);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /sales/:saleId - Get sale details
router.get('/sales/:saleId', (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;
    const sale = saleService.getSale(saleId);
    if (!sale) {
      return sendError(res, 'Sale not found', 404);
    }
    sendResponse(res, sale);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /sales/:saleId/invoice - Get invoice
router.get('/sales/:saleId/invoice', (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;
    const invoice = saleService.generateInvoice(saleId);
    if (!invoice) {
      return sendError(res, 'Sale not found', 404);
    }
    sendResponse(res, invoice);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /sales/:saleId/return - Process return
router.post('/sales/:saleId/return', (req: Request, res: Response) => {
  try {
    const { saleId } = req.params;
    const returnRecord = saleService.processReturn({
      ...req.body,
      saleId,
    });
    sendResponse(res, returnRecord, 'Return processed successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /sales/patient/:patientId - Patient sales history
router.get('/sales/patient/:patientId', (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const sales = saleService.getPatientSalesHistory(patientId);
    sendResponse(res, sales);
  } catch (error) {
    sendError(res, error);
  }
});

// ============ SUPPLIER ROUTES ============

// GET /suppliers - List suppliers
router.get('/suppliers', (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    const suppliers = supplierService.getSuppliers(
      activeOnly === 'true'
    );
    sendResponse(res, suppliers);
  } catch (error) {
    sendError(res, error);
  }
});

// POST /suppliers - Add supplier
router.post('/suppliers', (req: Request, res: Response) => {
  try {
    const supplier = supplierService.addSupplier(req.body);
    sendResponse(res, supplier, 'Supplier added successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /suppliers/:supplierId - Get supplier details
router.get('/suppliers/:supplierId', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const supplier = supplierService.getSupplier(supplierId);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }
    sendResponse(res, supplier);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /suppliers/:supplierId/orders - Supplier orders
router.get('/suppliers/:supplierId/orders', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { status } = req.query;
    const orders = supplierService.getSupplierOrders(
      supplierId,
      status as any
    );
    sendResponse(res, orders);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /suppliers/:supplierId/medicines - Supplier medicines
router.get('/suppliers/:supplierId/medicines', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const medicines = supplierService.getSupplierMedicines(supplierId);
    sendResponse(res, medicines);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /suppliers/:supplierId/performance - Supplier performance
router.get('/suppliers/:supplierId/performance', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const performance = supplierService.getSupplierPerformance(supplierId);
    sendResponse(res, performance);
  } catch (error) {
    sendError(res, error);
  }
});

// PUT /suppliers/:supplierId - Update supplier
router.put('/suppliers/:supplierId', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const supplier = supplierService.updateSupplier(supplierId, req.body);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }
    sendResponse(res, supplier, 'Supplier updated successfully');
  } catch (error) {
    sendError(res, error);
  }
});

// POST /suppliers/:supplierId/medicines - Add medicines to supplier
router.post('/suppliers/:supplierId/medicines', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { medicineIds } = req.body;
    if (!medicineIds || !Array.isArray(medicineIds)) {
      return sendError(res, 'Medicine IDs array is required', 400);
    }
    const supplier = supplierService.addMedicinesToSupplier(supplierId, medicineIds);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }
    sendResponse(res, supplier, 'Medicines added to supplier');
  } catch (error) {
    sendError(res, error);
  }
});

// POST /orders - Create purchase order
router.post('/orders', (req: Request, res: Response) => {
  try {
    const { supplierId, items, notes } = req.body;
    const order = supplierService.createPurchaseOrder(supplierId, items, notes);
    sendResponse(res, order, 'Purchase order created successfully', 201);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /orders/:orderId - Get order details
router.get('/orders/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = supplierService.getPurchaseOrder(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    sendResponse(res, order);
  } catch (error) {
    sendError(res, error);
  }
});

// PUT /orders/:orderId/status - Update order status
router.put('/orders/:orderId/status', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryDate } = req.body;
    const order = supplierService.updateOrderStatus(
      orderId,
      status,
      deliveryDate ? new Date(deliveryDate) : undefined
    );
    sendResponse(res, order, 'Order status updated successfully');
  } catch (error) {
    sendError(res, error);
  }
});

// GET /suppliers/rankings - Supplier rankings
router.get('/suppliers/rankings', (req: Request, res: Response) => {
  try {
    const rankings = supplierService.getSupplierRankings();
    sendResponse(res, rankings);
  } catch (error) {
    sendError(res, error);
  }
});

// GET /suppliers/search - Search suppliers
router.get('/suppliers/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return sendError(res, 'Search query is required', 400);
    }
    const suppliers = supplierService.searchSuppliers(q);
    sendResponse(res, suppliers);
  } catch (error) {
    sendError(res, error);
  }
});

// ============ STATS ROUTES ============

// GET /stats - Overall pharmacy stats
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { PharmacyService } = require('../models/pharmacy.js');
    const stats = PharmacyService.getPharmacyStats?.() || {
      totalMedicines: medicineService.getMedicines().length,
      totalSuppliers: supplierService.getSuppliers().length,
      lowStockCount: inventoryService.getLowStock().length,
      expiringCount: inventoryService.getExpiringStock(30).length,
    };
    sendResponse(res, stats);
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
