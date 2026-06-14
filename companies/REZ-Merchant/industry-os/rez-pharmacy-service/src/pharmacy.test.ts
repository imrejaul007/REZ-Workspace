import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock mongoose before importing services
jest.mock('mongoose', () => {
  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      connection: { readyState: 1 },
      model: jest.fn().mockReturnValue(mockModel),
      startSession: jest.fn().mockResolvedValue(mockSession),
    },
    model: jest.fn().mockReturnValue(mockModel),
    Schema: jest.fn().mockImplementation(() => ({
      pre: jest.fn(),
      virtual: jest.fn().mockReturnValue({ get: jest.fn() }),
      index: jest.fn(),
    })),
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

describe('ReZ Pharmacy Service - Prescription Model', () => {
  const { Prescription, PrescriptionStatus, VerificationStatus } = require('./models/Prescription');

  describe('PrescriptionStatus enum', () => {
    it('should have all required status values', () => {
      expect(PrescriptionStatus.PENDING).toBe('PENDING');
      expect(PrescriptionStatus.VERIFIED).toBe('VERIFIED');
      expect(PrescriptionStatus.PARTIALLY_FILLED).toBe('PARTIALLY_FILLED');
      expect(PrescriptionStatus.FILLED).toBe('FILLED');
      expect(PrescriptionStatus.EXPIRED).toBe('EXPIRED');
      expect(PrescriptionStatus.CANCELLED).toBe('CANCELLED');
      expect(PrescriptionStatus.REJECTED).toBe('REJECTED');
    });
  });

  describe('VerificationStatus enum', () => {
    it('should have all required verification values', () => {
      expect(VerificationStatus.PENDING).toBe('PENDING');
      expect(VerificationStatus.APPROVED).toBe('APPROVED');
      expect(VerificationStatus.FLAGGED).toBe('FLAGGED');
      expect(VerificationStatus.REJECTED).toBe('REJECTED');
    });
  });
});

describe('ReZ Pharmacy Service - InventoryService', () => {
  let inventoryService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { InventoryService } = require('./services/InventoryService');
    inventoryService = new InventoryService();
  });

  describe('Stock Updates', () => {
    it('should increase stock on PURCHASE', async () => {
      const mockMedicine = {
        medicineId: 'MED-001',
        name: 'Paracetamol 500mg',
        stock: 100,
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      const result = await inventoryService.updateStock({
        medicineId: 'MED-001',
        quantity: 50,
        reason: 'PURCHASE',
      });

      expect(result.stock).toBe(150);
      expect(mockMedicine.save).toHaveBeenCalled();
    });

    it('should decrease stock on SALE', async () => {
      const mockMedicine = {
        medicineId: 'MED-002',
        name: 'Ibuprofen 400mg',
        stock: 100,
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      const result = await inventoryService.updateStock({
        medicineId: 'MED-002',
        quantity: 30,
        reason: 'SALE',
      });

      expect(result.stock).toBe(70);
    });

    it('should throw error on insufficient stock', async () => {
      const mockMedicine = {
        medicineId: 'MED-003',
        name: 'Amoxicillin 250mg',
        stock: 10,
        status: 'ACTIVE',
        save: jest.fn(),
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      await expect(
        inventoryService.updateStock({
          medicineId: 'MED-003',
          quantity: 50,
          reason: 'SALE',
        })
      ).rejects.toThrow('Insufficient stock');
    });

    it('should decrease stock on RETURN', async () => {
      const mockMedicine = {
        medicineId: 'MED-004',
        name: 'Vitamin D3',
        stock: 80,
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      const result = await inventoryService.updateStock({
        medicineId: 'MED-004',
        quantity: 20,
        reason: 'RETURN',
      });

      expect(result.stock).toBe(100);
    });

    it('should update status to OUT_OF_STOCK when stock reaches zero', async () => {
      const mockMedicine = {
        medicineId: 'MED-005',
        name: 'Metformin 500mg',
        stock: 5,
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      const result = await inventoryService.updateStock({
        medicineId: 'MED-005',
        quantity: 10,
        reason: 'SALE',
      });

      expect(result.stock).toBe(0);
      expect(result.status).toBe('OUT_OF_STOCK');
    });
  });

  describe('Drug Interactions', () => {
    it('should detect drug interactions between medicines', async () => {
      const mockMedicines = [
        {
          medicineId: 'MED-WARFARIN',
          name: 'Warfarin',
          drugInteractions: [
            {
              drugId: 'MED-ASPIRIN',
              drugName: 'Aspirin',
              severity: 'SEVERE',
              description: 'Increased bleeding risk',
            },
          ],
        },
        {
          medicineId: 'MED-ASPIRIN',
          name: 'Aspirin',
          drugInteractions: [],
        },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockResolvedValue(mockMedicines);

      const result = await inventoryService.checkDrugInteractions(['MED-WARFARIN', 'MED-ASPIRIN']);

      expect(result.hasInteraction).toBe(true);
      expect(result.interactions.length).toBeGreaterThan(0);
      expect(result.interactions[0].severity).toBe('SEVERE');
    });

    it('should return no interactions for single medicine', async () => {
      const result = await inventoryService.checkDrugInteractions(['MED-001']);

      expect(result.hasInteraction).toBe(false);
      expect(result.interactions).toEqual([]);
    });

    it('should return severe interaction recommendation', async () => {
      const mockMedicines = [
        {
          medicineId: 'MED-A',
          name: 'Medicine A',
          drugInteractions: [
            { drugId: 'MED-B', drugName: 'Medicine B', severity: 'SEVERE', description: 'Test' },
          ],
        },
        { medicineId: 'MED-B', name: 'Medicine B', drugInteractions: [] },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockResolvedValue(mockMedicines);

      const result = await inventoryService.checkDrugInteractions(['MED-A', 'MED-B']);

      expect(result.interactions[0].recommendation).toContain('AVOID');
    });
  });

  describe('Inventory Alerts', () => {
    it('should generate LOW_STOCK alert', async () => {
      const mockMedicines = [
        {
          medicineId: 'MED-LOW',
          name: 'Low Stock Medicine',
          stock: 5,
          reorderLevel: 10,
          minStockLevel: 8,
          status: 'ACTIVE',
        },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockResolvedValue(mockMedicines);

      const alerts = await inventoryService.getInventoryAlerts();

      expect(alerts.some((a: any) => a.type === 'LOW_STOCK')).toBe(true);
    });

    it('should generate EXPIRING alert for medicines expiring soon', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockMedicines = [
        {
          medicineId: 'MED-EXP',
          name: 'Expiring Medicine',
          stock: 20,
          expiryDate: futureDate,
          status: 'ACTIVE',
        },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockResolvedValue(mockMedicines);

      const alerts = await inventoryService.getInventoryAlerts();

      expect(alerts.some((a: any) => a.type === 'EXPIRING')).toBe(true);
    });

    it('should generate EXPIRED alert for expired medicines', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const mockMedicines = [
        {
          medicineId: 'MED-EXPIRED',
          name: 'Expired Medicine',
          stock: 20,
          expiryDate: pastDate,
          status: 'ACTIVE',
        },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockResolvedValue(mockMedicines);

      const alerts = await inventoryService.getInventoryAlerts();

      expect(alerts.some((a: any) => a.type === 'EXPIRED')).toBe(true);
    });

    it('should generate RECALL alert for recalled medicines', async () => {
      const mockMedicines = [
        {
          medicineId: 'MED-RECALL',
          name: 'Recalled Medicine',
          stock: 100,
          status: 'RECALL',
        },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockResolvedValue(mockMedicines);

      const alerts = await inventoryService.getInventoryAlerts();

      expect(alerts.some((a: any) => a.type === 'RECALL')).toBe(true);
    });
  });

  describe('Medicine Search', () => {
    it('should search medicines with query', async () => {
      const mockMedicines = [
        { medicineId: 'MED-001', name: 'Paracetamol 500mg', status: 'ACTIVE' },
        { medicineId: 'MED-002', name: 'Paracetamol 650mg', status: 'ACTIVE' },
      ];

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMedicines),
      });
      Medicine.countDocuments.mockResolvedValue(2);

      const result = await inventoryService.searchMedicines({ query: 'Paracetamol' });

      expect(result.medicines.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter by category', async () => {
      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      Medicine.countDocuments.mockResolvedValue(0);

      const result = await inventoryService.searchMedicines({ category: 'ANALGESIC' });

      expect(Medicine.find).toHaveBeenCalled();
    });

    it('should filter by prescription requirement', async () => {
      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      Medicine.countDocuments.mockResolvedValue(0);

      await inventoryService.searchMedicines({ requiresPrescription: true });

      expect(Medicine.find).toHaveBeenCalled();
    });

    it('should paginate results', async () => {
      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      Medicine.countDocuments.mockResolvedValue(50);

      const result = await inventoryService.searchMedicines({ page: 2, limit: 10 });

      expect(result.total).toBe(50);
    });
  });
});

describe('ReZ Pharmacy Service - OrderService', () => {
  let orderService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { OrderService } = require('./services/OrderService');
    orderService = new OrderService();
  });

  describe('Order Creation', () => {
    it('should create an order with valid data', async () => {
      const mockMedicine = {
        medicineId: 'MED-001',
        name: 'Paracetamol',
        sellingPrice: 50,
        batchNumber: 'BATCH-001',
        expiryDate: new Date('2025-12-31'),
        stock: 100,
        status: 'ACTIVE',
        requiresPrescription: true,
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      const mockOrder = {
        orderId: 'ORD-001',
        orderNumber: 'RX-001',
        save: jest.fn().mockResolvedValue(true),
      };
      Order.mockImplementation(() => mockOrder);

      // @ts-expect-error - mocking
      const Prescription = require('./models/Prescription');
      Prescription.findOne = jest.fn().mockResolvedValue(null);

      const input = {
        orderType: 'PICKUP',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        items: [{ medicineId: 'MED-001', quantity: 2 }],
        paymentMethod: 'CASH',
      };

      const order = await orderService.createOrder(input);

      expect(order).toBeDefined();
    });

    it('should throw error for non-existent medicine', async () => {
      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(null);

      const input = {
        orderType: 'PICKUP',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        items: [{ medicineId: 'INVALID-MED', quantity: 2 }],
      };

      await expect(orderService.createOrder(input)).rejects.toThrow('Medicine INVALID-MED not found');
    });

    it('should throw error for unavailable medicine', async () => {
      const mockMedicine = {
        medicineId: 'MED-002',
        name: 'Discontinued Medicine',
        status: 'DISCONTINUED',
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      const input = {
        orderType: 'PICKUP',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        items: [{ medicineId: 'MED-002', quantity: 1 }],
      };

      await expect(orderService.createOrder(input)).rejects.toThrow('is not available');
    });

    it('should throw error for insufficient stock', async () => {
      const mockMedicine = {
        medicineId: 'MED-003',
        name: 'Low Stock Medicine',
        sellingPrice: 100,
        stock: 5,
        status: 'ACTIVE',
      };

      // @ts-expect-error - mocking
      const Medicine = require('./models/Medicine');
      Medicine.findOne.mockResolvedValue(mockMedicine);

      const input = {
        orderType: 'PICKUP',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        customerPhone: '9876543210',
        items: [{ medicineId: 'MED-003', quantity: 10 }],
      };

      await expect(orderService.createOrder(input)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('Order Status Updates', () => {
    it('should update order status with valid transition', async () => {
      const mockOrder = {
        orderId: 'ORD-001',
        orderStatus: 'PENDING',
        items: [],
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus({
        orderId: 'ORD-001',
        status: 'CONFIRMED',
      });

      expect(result.orderStatus).toBe('CONFIRMED');
    });

    it('should throw error for invalid status transition', async () => {
      const mockOrder = {
        orderId: 'ORD-002',
        orderStatus: 'DELIVERED',
        items: [],
      };

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      await expect(
        orderService.updateOrderStatus({
          orderId: 'ORD-002',
          status: 'PENDING',
        })
      ).rejects.toThrow('Invalid status transition');
    });

    it('should set deliveredAt when order is delivered', async () => {
      const mockOrder = {
        orderId: 'ORD-003',
        orderStatus: 'DISPATCHED',
        items: [],
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus({
        orderId: 'ORD-003',
        status: 'DELIVERED',
      });

      expect(result.deliveredAt).toBeDefined();
    });
  });

  describe('Payment Processing', () => {
    it('should process payment for pending order', async () => {
      const mockOrder = {
        orderId: 'ORD-004',
        paymentStatus: 'PENDING',
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      const result = await orderService.processPayment('ORD-004', {
        method: 'UPI',
        transactionId: 'TXN-001',
      });

      expect(result.paymentStatus).toBe('PAID');
      expect(result.paymentMethod).toBe('UPI');
    });

    it('should throw error for already paid order', async () => {
      const mockOrder = {
        orderId: 'ORD-005',
        paymentStatus: 'PAID',
      };

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.findOne.mockResolvedValue(mockOrder);

      await expect(
        orderService.processPayment('ORD-005', { method: 'CARD' })
      ).rejects.toThrow('already paid');
    });
  });

  describe('Order Statistics', () => {
    it('should calculate order statistics', async () => {
      const mockOrders = [
        { orderStatus: 'DELIVERED', orderType: 'PICKUP', totalAmount: 500 },
        { orderStatus: 'PENDING', orderType: 'DELIVERY', totalAmount: 300 },
        { orderStatus: 'DELIVERED', orderType: 'PICKUP', totalAmount: 200 },
      ];

      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.find.mockResolvedValue(mockOrders);

      const stats = await orderService.getOrderStats(30);

      expect(stats.totalOrders).toBe(3);
      expect(stats.totalRevenue).toBe(1000);
      expect(stats.averageOrderValue).toBeCloseTo(333.33, 1);
    });

    it('should return zero values for empty statistics', async () => {
      // @ts-expect-error - mocking
      const Order = require('./models/Order');
      Order.find.mockResolvedValue([]);

      const stats = await orderService.getOrderStats(30);

      expect(stats.totalOrders).toBe(0);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });
  });
});

describe('ReZ Pharmacy Service - Validation Schemas', () => {
  const zod = require('zod');

  describe('Prescription Validation', () => {
    it('should validate valid prescription data', () => {
      const prescriptionSchema = zod.object({
        prescriptionNumber: zod.string().min(1),
        patientId: zod.string().min(1),
        patientName: zod.string().min(1),
        patientAge: zod.number().int().positive(),
        patientGender: zod.enum(['MALE', 'FEMALE', 'OTHER']),
        doctorId: zod.string().min(1),
        items: zod.array(zod.object({
          medicineId: zod.string().min(1),
          quantity: zod.number().int().positive(),
        })).min(1),
      });

      const validData = {
        prescriptionNumber: 'RX-001',
        patientId: 'PAT-001',
        patientName: 'John Doe',
        patientAge: 35,
        patientGender: 'MALE',
        doctorId: 'DOC-001',
        items: [{ medicineId: 'MED-001', quantity: 30 }],
      };

      const result = prescriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject prescription with missing required fields', () => {
      const prescriptionSchema = zod.object({
        prescriptionNumber: zod.string().min(1),
        patientId: zod.string().min(1),
        items: zod.array(zod.object({
          medicineId: zod.string().min(1),
          quantity: zod.number().int().positive(),
        })).min(1),
      });

      const invalidData = {
        prescriptionNumber: 'RX-001',
      };

      const result = prescriptionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject prescription with invalid age', () => {
      const prescriptionSchema = zod.object({
        patientAge: zod.number().int().positive(),
      });

      const result = prescriptionSchema.safeParse({ patientAge: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject prescription with empty items array', () => {
      const prescriptionSchema = zod.object({
        items: zod.array(zod.object({
          medicineId: zod.string().min(1),
        })).min(1),
      });

      const result = prescriptionSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('Order Validation', () => {
    it('should validate valid order data', () => {
      const orderSchema = zod.object({
        orderType: zod.enum(['PICKUP', 'DELIVERY', 'CORPORATE']),
        customerId: zod.string().min(1),
        customerName: zod.string().min(1),
        customerPhone: zod.string().min(10),
        items: zod.array(zod.object({
          medicineId: zod.string().min(1),
          quantity: zod.number().int().positive(),
        })).min(1),
      });

      const validData = {
        orderType: 'PICKUP',
        customerId: 'CUST-001',
        customerName: 'Jane Smith',
        customerPhone: '9876543210',
        items: [
          { medicineId: 'MED-001', quantity: 2 },
          { medicineId: 'MED-002', quantity: 1 },
        ],
      };

      const result = orderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid order type', () => {
      const orderSchema = zod.object({
        orderType: zod.enum(['PICKUP', 'DELIVERY']),
      });

      const result = orderSchema.safeParse({ orderType: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});
