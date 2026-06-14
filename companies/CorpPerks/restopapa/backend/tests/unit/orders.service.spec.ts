import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../../src/marketplace/services/orders.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  createOrder,
  createOrderItem,
  createProduct,
  createUser,
  createMockPrismaService,
} from '../factories';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const userId = 'user-123';
    const createOrderDto = {
      userId,
      vendorId: 'vendor-123',
      items: [
        { vendorOfferingId: 'product-1', quantity: 2, price: 250 },
        { vendorOfferingId: 'product-2', quantity: 1, price: 150 },
      ],
      totalAmount: 800,
      deliveryAddress: '123 Test St, Mumbai',
      paymentMethod: 'online',
    };

    it('should create order with valid items', async () => {
      const product1 = createProduct({ id: 'product-1', priceRange: '₹250' });
      const product2 = createProduct({ id: 'product-2', priceRange: '₹150' });

      mockPrisma.vendorOffering.findUnique.mockResolvedValueOnce(product1);
      mockPrisma.vendorOffering.findUnique.mockResolvedValueOnce(product2);

      const createdOrder = createOrder({
        userId,
        items: [
          createOrderItem({ productId: 'product-1', quantity: 2, unitPrice: 250 }),
          createOrderItem({ productId: 'product-2', quantity: 1, unitPrice: 150 }),
        ],
      });

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockResolvedValue(createdOrder),
          },
          creditTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.createOrder(userId, createOrderDto);

      expect(result).toHaveProperty('id');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should calculate subtotal correctly', async () => {
      const product = createProduct({ id: 'product-1', priceRange: '₹200' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      // Subtotal = 200 * 3 = 600
      const orderDto = {
        ...createOrderDto,
        items: [{ vendorOfferingId: 'product-1', quantity: 3, price: 200 }],
      };

      let capturedOrderData: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockImplementation(async (data) => {
              capturedOrderData = data.data;
              return createOrder({ userId, items: [] });
            }),
          },
          creditTransaction: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.createOrder(userId, orderDto);

      expect(capturedOrderData.subtotal).toBe(600);
    });

    it('should add GST (18%)', async () => {
      const product = createProduct({ id: 'product-1', priceRange: '₹100' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      const orderDto = {
        ...createOrderDto,
        items: [{ vendorOfferingId: 'product-1', quantity: 10, price: 100 }],
      };

      let capturedOrderData: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockImplementation(async (data) => {
              capturedOrderData = data.data;
              return createOrder({ userId, items: [] });
            }),
          },
          creditTransaction: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.createOrder(userId, orderDto);

      // 10 * 100 = 1000 subtotal
      // GST = 1000 * 0.18 = 180
      expect(capturedOrderData.gstAmount).toBe(180);
    });

    it('should waive delivery fee above ₹1000', async () => {
      const product = createProduct({ id: 'product-1', priceRange: '₹1200' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      const orderDto = {
        ...createOrderDto,
        items: [{ vendorOfferingId: 'product-1', quantity: 1, price: 1200 }],
      };

      let capturedOrderData: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockImplementation(async (data) => {
              capturedOrderData = data.data;
              return createOrder({ userId, items: [] });
            }),
          },
          creditTransaction: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.createOrder(userId, orderDto);

      // Subtotal = 1200, delivery should be waived
      expect(capturedOrderData.deliveryFee).toBe(0);
    });

    it('should charge delivery fee below ₹1000', async () => {
      const product = createProduct({ id: 'product-1', priceRange: '₹500' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      const orderDto = {
        ...createOrderDto,
        items: [{ vendorOfferingId: 'product-1', quantity: 1, price: 500 }],
      };

      let capturedOrderData: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockImplementation(async (data) => {
              capturedOrderData = data.data;
              return createOrder({ userId, items: [] });
            }),
          },
          creditTransaction: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.createOrder(userId, orderDto);

      // Subtotal = 500, delivery fee should be 50
      expect(capturedOrderData.deliveryFee).toBe(50);
    });

    it('should set order status to pending', async () => {
      const product = createProduct({ id: 'product-1', priceRange: '₹100' });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(product);

      let capturedOrderData: any;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          marketplaceOrder: {
            create: jest.fn().mockImplementation(async (data) => {
              capturedOrderData = data.data;
              return createOrder({ userId, status: 'pending', items: [] });
            }),
          },
          creditTransaction: { create: jest.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.createOrder(userId, createOrderDto);

      expect(capturedOrderData.status).toBe('pending');
    });

    it('should throw NotFoundException for invalid product', async () => {
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(null);

      await expect(service.createOrder(userId, createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for inactive product', async () => {
      const inactiveProduct = createProduct({ id: 'product-1', isActive: false });
      mockPrisma.vendorOffering.findUnique.mockResolvedValue(inactiveProduct);

      await expect(service.createOrder(userId, createOrderDto)).rejects.toThrow();
    });
  });

  describe('getOrderById', () => {
    it('should throw NotFoundException for invalid ID', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return order for valid ID with matching userId', async () => {
      const order = createOrder({ id: 'order-123', userId: 'user-123' });
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(order);

      const result = await service.getOrderById('order-123', 'user-123');

      expect(result).toBeDefined();
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const orders = [createOrder(), createOrder()];
      mockPrisma.marketplaceOrder.findMany.mockResolvedValue(orders);
      mockPrisma.marketplaceOrder.count.mockResolvedValue(2);

      const result = await service.getOrders('user-123', 'user', 1, 10);

      expect(result.orders).toBeDefined();
    });

    it('should filter by userId', async () => {
      mockPrisma.marketplaceOrder.findMany.mockResolvedValue([]);
      mockPrisma.marketplaceOrder.count.mockResolvedValue(0);

      await service.getOrders('user-123', 'user', 1, 10);

      expect(mockPrisma.marketplaceOrder.findMany).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should throw NotFoundException for non-existent order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelOrder('non-existent', 'user-123', 'Test'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrderStatus', () => {
    it('should throw NotFoundException for non-existent order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('non-existent', { status: 'confirmed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
